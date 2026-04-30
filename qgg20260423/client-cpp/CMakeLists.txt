cmake_minimum_required(VERSION 3.20)
project(qgg_client LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(qgg_client
  src/main.cpp
  src/runtime_core.cpp
  src/config_agent.cpp
  src/rule_engine.cpp
  src/module_manager.cpp
  src/security_verifier.cpp
)

target_include_directories(qgg_client PRIVATE include)

if(WIN32)
  target_link_libraries(qgg_client PRIVATE winhttp)
endif()
