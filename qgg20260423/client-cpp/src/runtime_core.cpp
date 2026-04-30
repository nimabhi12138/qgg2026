#include "runtime_core.h"

#include <iostream>

#include "config_agent.h"
#include "module_manager.h"
#include "rule_engine.h"
#include "rule_executor.h"

namespace qgg {

bool RuntimeCore::Init() {
  // TODO: 初始化驱动适配层，校验系统环境（无盘/计费软件兼容）
  driver_ready_ = true;
  return true;
}

bool RuntimeCore::Start() {
  if (!driver_ready_) {
    return false;
  }

  ClientRuntimeSettings st = ClientRuntimeSettings::LoadFromEnvironmentAndFile();
  ConfigAgent config_agent(st);
  ClientConfig cfg;
  if (!config_agent.FetchConfig(&cfg)) {
    std::cerr << "[QGG] config HTTP failed — degraded offline snapshot\n";
    cfg.publish_version = "offline";
    cfg.rule_hash.clear();
    cfg.module_version.clear();
  }
  current_publish_version_ = cfg.publish_version;
  std::cout << "[QGG] publish_version=" << cfg.publish_version << " rule_hash=" << cfg.rule_hash
            << " module_index=" << cfg.module_version << "\n";

  std::string pkg_body;
  std::string publish_version_hint = cfg.publish_version;
  if (publish_version_hint.empty() || publish_version_hint == "offline") {
    publish_version_hint = "v1";
  }
  if (!config_agent.FetchRulesPackage(publish_version_hint, &pkg_body)) {
    std::cerr << "[QGG] rules/package HTTP failed — skip rule payload\n";
    pkg_body.clear();
  } else {
    std::cout << "[QGG] rules/package bytes=" << pkg_body.size() << "\n";
  }

  RuleEngine rule_engine;
  if (!pkg_body.empty()) {
    if (!rule_engine.LoadFromPackageBody(pkg_body)) {
      std::cerr << "[QGG] rule package parse degraded\n";
    }
  } else if (!rule_engine.LoadFromJson("{}")) {
    return false;
  }
  ExecutorOptions exec_opt;
  exec_opt.dry_run = st.dry_run;
  exec_opt.allow_system_paths = st.allow_system_paths;
  exec_opt.allow_system_processes = st.allow_system_processes;
  exec_opt.delete_roots_allowlist = st.delete_roots_allowlist;
  exec_opt.max_actions = st.max_actions;

  if (!rule_engine.ApplyAll(exec_opt)) {
    return false;
  }

  ModuleManager module_manager;
  if (!module_manager.SyncModuleIndex("{}")) {
    return false;
  }
  if (!module_manager.LoadModules()) {
    std::cerr << "[QGG] module load degraded\n";
  }

  return true;
}

void RuntimeCore::Stop() {
  std::cout << "[QGG] stop runtime, publish=" << current_publish_version_ << "\n";
}

}  // namespace qgg

