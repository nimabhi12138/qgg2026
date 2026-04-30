#pragma once

#include <string>

namespace qgg {

struct ExecutorOptions;
struct RuleApplyStats;
struct RulesPackage;

class RuleEngine {
 public:
  RuleEngine();
  ~RuleEngine();

  bool LoadFromJson(const std::string& rule_json);
  /** 解析服务端 `/client/rules/package` 完整响应 JSON（含 envelope）。 */
  bool LoadFromPackageBody(const std::string& envelope_json);
  bool ApplyAll(const ExecutorOptions& opt);

  const RulesPackage& package() const;
  const RuleApplyStats& last_stats() const;

  RuleEngine(const RuleEngine&) = delete;
  RuleEngine& operator=(const RuleEngine&) = delete;

 private:
  RulesPackage* pkg_{nullptr};
  RuleApplyStats* last_stats_{nullptr};
};

}  // namespace qgg
