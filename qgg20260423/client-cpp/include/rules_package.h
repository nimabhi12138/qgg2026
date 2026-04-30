#pragma once

#include <cstdint>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include "qgg_json.h"

namespace qgg {

struct RuleField {
  std::string raw_json_string;  // backend stored JSON string (may be empty)
  JsonValue parsed;             // parsed JSON (kNull when empty or parse failed)
  bool parse_ok{true};
  std::string parse_error;
};

struct BackendRule {
  int64_t id{0};
  std::string name;
  bool enable_ad{true};
  int run_possibility{100};
  std::string remark;

  RuleField pe_json;
  RuleField dir_json;
  RuleField md5_json;
  RuleField reg_json;
  RuleField ip_json;
  RuleField ctrl_wnd_json;
  RuleField anti_thread_json;
  RuleField thread_control_json;
  RuleField md5_reg_json;
};

struct RulesPackage {
  std::string publish_version;
  std::string package_source;
  std::string hash;
  std::string signature;
  std::vector<BackendRule> rules;
};

struct RuleApplyStats {
  // parsing
  uint64_t package_parse_fail{0};
  uint64_t rule_field_parse_fail{0};

  // planned actions
  uint64_t planned_kill{0};
  uint64_t planned_delete{0};

  // execution results (dry-run still counts as "executed" but not "changed")
  uint64_t exec_attempt_kill{0};
  uint64_t exec_ok_kill{0};
  uint64_t exec_fail_kill{0};

  uint64_t exec_attempt_delete{0};
  uint64_t exec_ok_delete{0};
  uint64_t exec_fail_delete{0};

  uint64_t skipped_safety{0};
};

}  // namespace qgg

