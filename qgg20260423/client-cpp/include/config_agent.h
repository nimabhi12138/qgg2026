#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace qgg {

struct ClientConfig {
  std::string publish_version;
  std::string rule_hash;
  std::string module_version;
};

struct ClientRuntimeSettings {
  std::string api_base{"http://127.0.0.1:8000/api/v1"};
  std::string device_uuid{"dev-001"};

  // Polling intervals
  int config_poll_interval_ms{10'000};
  int heartbeat_interval_ms{15'000};

  // Rule executor safety options (default: dry-run)
  bool dry_run{true};
  bool allow_system_paths{false};
  bool allow_system_processes{false};
  std::vector<std::string> delete_roots_allowlist;  // if non-empty, delete is allowed only under these roots
  uint32_t max_actions{200};

  // Logging
  std::string log_level{"info"};

  static ClientRuntimeSettings LoadFromEnvironmentAndFile();
};

class ConfigAgent {
 public:
  explicit ConfigAgent(ClientRuntimeSettings settings = ClientRuntimeSettings::LoadFromEnvironmentAndFile());
  bool FetchConfig(ClientConfig* out);
  bool FetchRulesPackage(const std::string& publish_version, std::string* raw_body);
  bool PostHeartbeat(const std::string& json_body, std::string* response_body);

 private:
  ClientRuntimeSettings settings_;
  bool HttpGet(const std::string& path_and_query, std::string* response_body);
  bool HttpPostJson(const std::string& path_and_query, const std::string& json_body, std::string* response_body);
};

}  // namespace qgg
