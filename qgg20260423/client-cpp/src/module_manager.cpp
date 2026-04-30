#include "module_manager.h"

namespace qgg {

bool ModuleManager::SyncModuleIndex(const std::string& index_json) {
  // TODO: 拉取模块索引、哈希校验、版本对比。
  return !index_json.empty();
}

bool ModuleManager::LoadModules() {
  // TODO: 下载、验签、解压、LoadLibrary + 生命周期管理。
  return true;
}

}  // namespace qgg

