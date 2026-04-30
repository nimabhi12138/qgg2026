#include "rule_engine.h"

#include <cstdint>
#include <limits>
#include <string>

#include "qgg_json.h"
#include "qgg_log.h"
#include "qgg_util.h"
#include "rule_executor.h"
#include "rules_package.h"

namespace qgg {

namespace {

int64_t ToInt64Loose(const JsonValue& v, int64_t def = 0) {
  if (v.IsNumber()) {
    const double d = v.number_value;
    if (d >= static_cast<double>(std::numeric_limits<int64_t>::min()) &&
        d <= static_cast<double>(std::numeric_limits<int64_t>::max())) {
      return static_cast<int64_t>(d);
    }
  }
  if (v.IsString()) {
    try {
      return std::stoll(TrimAscii(v.string_value));
    } catch (...) {
      return def;
    }
  }
  if (v.IsBool()) {
    return v.bool_value ? 1 : 0;
  }
  return def;
}

bool ToBoolLoose(const JsonValue& v, bool def = false) {
  if (v.IsBool()) return v.bool_value;
  if (v.IsNumber()) return v.number_value != 0.0;
  if (v.IsString()) {
    const std::string s = ToLowerAscii(TrimAscii(v.string_value));
    if (s == "true" || s == "1" || s == "yes" || s == "on") return true;
    if (s == "false" || s == "0" || s == "no" || s == "off") return false;
  }
  return def;
}

RuleField ParseRuleFieldFromRuleObject(const JsonValue& rule_obj, const std::string& key, RuleApplyStats* stats) {
  RuleField f;
  const JsonValue* v = rule_obj.Get(key);
  if (!v || v->IsNull()) {
    f.raw_json_string.clear();
    f.parsed = JsonValue::Null();
    return f;
  }
  if (v->IsString()) {
    f.raw_json_string = v->string_value;
  } else {
    // Be tolerant: if server starts returning an object directly, keep it (stringify).
    f.raw_json_string = json::Dump(*v);
  }

  const std::string trimmed = TrimAscii(f.raw_json_string);
  if (trimmed.empty()) {
    f.parsed = JsonValue::Null();
    return f;
  }

  JsonValue parsed;
  std::string err;
  if (!json::Parse(trimmed, &parsed, &err)) {
    f.parse_ok = false;
    f.parse_error = err;
    f.parsed = JsonValue::Null();
    if (stats) stats->rule_field_parse_fail++;
    LogWarn("RuleEngine", "field parse failed key=" + key + " err=" + err);
    return f;
  }
  f.parsed = std::move(parsed);
  return f;
}

}  // namespace

RuleEngine::RuleEngine() : pkg_(new RulesPackage()), last_stats_(new RuleApplyStats()) {}

RuleEngine::~RuleEngine() {
  delete pkg_;
  delete last_stats_;
  pkg_ = nullptr;
  last_stats_ = nullptr;
}

const RulesPackage& RuleEngine::package() const { return *pkg_; }
const RuleApplyStats& RuleEngine::last_stats() const { return *last_stats_; }

bool RuleEngine::LoadFromJson(const std::string& rule_json) {
  if (!pkg_ || !last_stats_) return false;
  pkg_->rules.clear();
  *last_stats_ = RuleApplyStats();

  const std::string body = TrimAscii(rule_json);
  if (body.empty()) {
    return true;
  }

  JsonValue root;
  std::string err;
  if (!json::Parse(body, &root, &err)) {
    last_stats_->package_parse_fail++;
    LogError("RuleEngine", "LoadFromJson parse failed err=" + err);
    return false;
  }
  if (!root.IsObject()) {
    last_stats_->package_parse_fail++;
    LogError("RuleEngine", "LoadFromJson expects object");
    return false;
  }

  BackendRule r;
  r.id = 0;
  r.name = root.GetString("name", "inline_rule");
  r.enable_ad = root.GetBool("enable_ad", true);
  r.run_possibility = static_cast<int>(root.GetNumber("run_possibility", 100));
  r.remark = root.GetString("remark", "");

  r.pe_json = ParseRuleFieldFromRuleObject(root, "pe_json", last_stats_);
  r.dir_json = ParseRuleFieldFromRuleObject(root, "dir_json", last_stats_);
  r.md5_json = ParseRuleFieldFromRuleObject(root, "md5_json", last_stats_);
  r.reg_json = ParseRuleFieldFromRuleObject(root, "reg_json", last_stats_);
  r.ip_json = ParseRuleFieldFromRuleObject(root, "ip_json", last_stats_);
  r.ctrl_wnd_json = ParseRuleFieldFromRuleObject(root, "ctrl_wnd_json", last_stats_);
  r.anti_thread_json = ParseRuleFieldFromRuleObject(root, "anti_thread_json", last_stats_);
  r.thread_control_json = ParseRuleFieldFromRuleObject(root, "thread_control_json", last_stats_);
  r.md5_reg_json = ParseRuleFieldFromRuleObject(root, "md5_reg_json", last_stats_);

  pkg_->rules.push_back(std::move(r));
  return true;
}

bool RuleEngine::LoadFromPackageBody(const std::string& envelope_json) {
  if (!pkg_ || !last_stats_) return false;
  pkg_->rules.clear();
  pkg_->publish_version.clear();
  pkg_->package_source.clear();
  pkg_->hash.clear();
  pkg_->signature.clear();
  *last_stats_ = RuleApplyStats();

  const std::string body = TrimAscii(envelope_json);
  if (body.empty()) {
    LogInfo("RuleEngine", "empty rules package body");
    return true;
  }

  JsonValue root;
  std::string err;
  if (!json::Parse(body, &root, &err)) {
    last_stats_->package_parse_fail++;
    LogError("RuleEngine", "package parse failed err=" + err);
    return false;
  }
  if (!root.IsObject()) {
    last_stats_->package_parse_fail++;
    LogError("RuleEngine", "package root not object");
    return false;
  }

  const JsonValue* codev = root.Get("code");
  const int64_t code = codev ? ToInt64Loose(*codev, -1) : -1;
  if (code != 0) {
    last_stats_->package_parse_fail++;
    LogError("RuleEngine", "package code != 0");
    return false;
  }

  const JsonValue* data = root.Get("data");
  if (!data || !data->IsObject()) {
    last_stats_->package_parse_fail++;
    LogError("RuleEngine", "package missing data");
    return false;
  }

  pkg_->publish_version = data->GetString("publish_version", "");
  pkg_->package_source = data->GetString("package_source", "");
  pkg_->hash = data->GetString("hash", "");
  pkg_->signature = data->GetString("signature", "");

  const JsonValue* rules = data->Get("rules");
  if (!rules || !rules->IsArray()) {
    LogWarn("RuleEngine", "package data.rules missing/empty");
    return true;
  }

  for (const auto& item : rules->array_value) {
    if (!item.IsObject()) continue;

    BackendRule r;
    if (const JsonValue* idv = item.Get("id")) r.id = ToInt64Loose(*idv, 0);
    r.name = item.GetString("name", "");

    if (const JsonValue* ev = item.Get("enable_ad")) {
      r.enable_ad = ToBoolLoose(*ev, true);
    } else {
      r.enable_ad = true;
    }
    if (const JsonValue* pv = item.Get("run_possibility")) {
      r.run_possibility = static_cast<int>(ToInt64Loose(*pv, 100));
    } else {
      r.run_possibility = 100;
    }
    r.remark = item.GetString("remark", "");

    r.pe_json = ParseRuleFieldFromRuleObject(item, "pe_json", last_stats_);
    r.dir_json = ParseRuleFieldFromRuleObject(item, "dir_json", last_stats_);
    r.md5_json = ParseRuleFieldFromRuleObject(item, "md5_json", last_stats_);
    r.reg_json = ParseRuleFieldFromRuleObject(item, "reg_json", last_stats_);
    r.ip_json = ParseRuleFieldFromRuleObject(item, "ip_json", last_stats_);
    r.ctrl_wnd_json = ParseRuleFieldFromRuleObject(item, "ctrl_wnd_json", last_stats_);
    r.anti_thread_json = ParseRuleFieldFromRuleObject(item, "anti_thread_json", last_stats_);
    r.thread_control_json = ParseRuleFieldFromRuleObject(item, "thread_control_json", last_stats_);
    r.md5_reg_json = ParseRuleFieldFromRuleObject(item, "md5_reg_json", last_stats_);

    pkg_->rules.push_back(std::move(r));
  }

  LogInfo("RuleEngine",
          "package loaded: publish_version=" + pkg_->publish_version + " hash=" + pkg_->hash +
              " rules=" + std::to_string(pkg_->rules.size()) +
              " field_parse_fail=" + std::to_string(last_stats_->rule_field_parse_fail));
  return true;
}

bool RuleEngine::ApplyAll(const ExecutorOptions& opt) {
  if (!pkg_ || !last_stats_) return false;
  const uint64_t parse_pkg_fail = last_stats_->package_parse_fail;
  const uint64_t parse_field_fail = last_stats_->rule_field_parse_fail;

  ExecutorReport rep = ExecuteRulesPackage(*pkg_, opt);

  RuleApplyStats merged = rep.stats;
  merged.package_parse_fail = parse_pkg_fail;
  merged.rule_field_parse_fail = parse_field_fail;
  *last_stats_ = merged;

  LogInfo("RuleEngine",
          std::string("apply done: dry_run=") + (opt.dry_run ? "true" : "false") +
              " planned_kill=" + std::to_string(last_stats_->planned_kill) +
              " planned_delete=" + std::to_string(last_stats_->planned_delete) +
              " ok_kill=" + std::to_string(last_stats_->exec_ok_kill) +
              " fail_kill=" + std::to_string(last_stats_->exec_fail_kill) +
              " ok_delete=" + std::to_string(last_stats_->exec_ok_delete) +
              " fail_delete=" + std::to_string(last_stats_->exec_fail_delete) +
              " skipped_safety=" + std::to_string(last_stats_->skipped_safety));
  return rep.overall_ok;
}

}  // namespace qgg

