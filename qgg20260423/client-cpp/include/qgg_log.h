#pragma once

#include <chrono>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>

namespace qgg {

enum class LogLevel { kDebug = 0, kInfo = 1, kWarn = 2, kError = 3 };

inline const char* LogLevelName(LogLevel lv) {
  switch (lv) {
    case LogLevel::kDebug:
      return "D";
    case LogLevel::kInfo:
      return "I";
    case LogLevel::kWarn:
      return "W";
    case LogLevel::kError:
      return "E";
  }
  return "?";
}

class Logger {
 public:
  static Logger& Instance() {
    static Logger inst;
    return inst;
  }

  void SetLevel(LogLevel lv) { level_ = lv; }
  LogLevel level() const { return level_; }

  void Log(LogLevel lv, const std::string& tag, const std::string& msg) {
    if (static_cast<int>(lv) < static_cast<int>(level_)) {
      return;
    }
    const auto now = std::chrono::system_clock::now();
    const std::time_t tt = std::chrono::system_clock::to_time_t(now);
    std::tm tm{};
#ifdef _WIN32
    localtime_s(&tm, &tt);
#else
    tm = *std::localtime(&tt);
#endif
    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%d %H:%M:%S");
    oss << " [" << LogLevelName(lv) << "]"
        << " [" << tag << "] " << msg;

    std::lock_guard<std::mutex> lk(mu_);
    if (lv == LogLevel::kError || lv == LogLevel::kWarn) {
      std::cerr << oss.str() << "\n";
    } else {
      std::cout << oss.str() << "\n";
    }
  }

 private:
  std::mutex mu_;
  LogLevel level_{LogLevel::kInfo};
};

inline void LogDebug(const std::string& tag, const std::string& msg) { Logger::Instance().Log(LogLevel::kDebug, tag, msg); }
inline void LogInfo(const std::string& tag, const std::string& msg) { Logger::Instance().Log(LogLevel::kInfo, tag, msg); }
inline void LogWarn(const std::string& tag, const std::string& msg) { Logger::Instance().Log(LogLevel::kWarn, tag, msg); }
inline void LogError(const std::string& tag, const std::string& msg) { Logger::Instance().Log(LogLevel::kError, tag, msg); }

}  // namespace qgg

