#pragma once

#include <string>

namespace qgg {

class ModuleManager {
 public:
  bool SyncModuleIndex(const std::string& index_json);
  bool LoadModules();
};

}  // namespace qgg

