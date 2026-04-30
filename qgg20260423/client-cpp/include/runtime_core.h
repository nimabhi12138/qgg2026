#pragma once

#include <string>

namespace qgg {

class RuntimeCore {
 public:
  bool Init();
  bool Start();
  void Stop();

 private:
  bool driver_ready_{false};
  std::string current_publish_version_{"unknown"};
};

}  // namespace qgg

