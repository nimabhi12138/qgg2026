#include <iostream>

#include "runtime_core.h"

int main() {
  qgg::RuntimeCore core;
  if (!core.Init()) {
    std::cerr << "[QGG] init failed\n";
    return 1;
  }
  if (!core.Start()) {
    std::cerr << "[QGG] start failed\n";
    return 2;
  }
  std::cout << "[QGG] client started\n";
  core.Stop();
  return 0;
}

