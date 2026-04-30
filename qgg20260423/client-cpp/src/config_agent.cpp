#include "config_agent.h"

#include <cstdint>
#include <cstdlib>
#include <fstream>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

#include "qgg_json.h"
#include "qgg_log.h"
#include "qgg_util.h"

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <winhttp.h>
#endif

namespace qgg {

namespace {

std::string GetEnvA(const char* key) {
  if (!key || !*key) return "";
#ifdef _WIN32
  DWORD n = GetEnvironmentVariableA(key, nullptr, 0);
  if (n == 0) return "";
  std::string out;
  out.resize(static_cast<size_t>(n));
  DWORD got = GetEnvironmentVariableA(key, out.data(), n);
  if (got == 0) return "";
  out.resize(static_cast<size_t>(got));
  return out;
#else
  const char* v = std::getenv(key);
  return v ? std::string(v) : std::string();
#endif
}

bool ParseBoolLoose(const std::string& s, bool* out) {
  if (!out) return false;
  const std::string v = ToLowerAscii(TrimAscii(s));
  if (v.empty()) return false;
  if (v == "1" || v == "true" || v == "yes" || v == "on") {
    *out = true;
    return true;
  }
  if (v == "0" || v == "false" || v == "no" || v == "off") {
    *out = false;
    return true;
  }
  return false;
}

bool ParseIntLoose(const std::string& s, int* out) {
  if (!out) return false;
  try {
    *out = std::stoi(TrimAscii(s));
    return true;
  } catch (...) {
    return false;
  }
}

bool ParseU32Loose(const std::string& s, uint32_t* out) {
  if (!out) return false;
  try {
    const unsigned long long v = std::stoull(TrimAscii(s));
    *out = static_cast<uint32_t>(v);
    return true;
  } catch (...) {
    return false;
  }
}

std::vector<std::string> SplitListLoose(const std::string& s) {
  std::vector<std::string> out;
  std::string cur;
  for (char c : s) {
    if (c == ';' || c == ',' || c == '\n' || c == '\r') {
      const std::string t = TrimAscii(cur);
      if (!t.empty()) out.push_back(t);
      cur.clear();
      continue;
    }
    cur.push_back(c);
  }
  const std::string t = TrimAscii(cur);
  if (!t.empty()) out.push_back(t);
  return out;
}

int64_t ToInt64Loose(const JsonValue& v, int64_t def = 0) {
  if (v.IsNumber()) return static_cast<int64_t>(v.number_value);
  if (v.IsBool()) return v.bool_value ? 1 : 0;
  if (v.IsString()) {
    try {
      return std::stoll(TrimAscii(v.string_value));
    } catch (...) {
      return def;
    }
  }
  return def;
}

bool ToBoolLoose(const JsonValue& v, bool def = false) {
  if (v.IsBool()) return v.bool_value;
  if (v.IsNumber()) return v.number_value != 0.0;
  if (v.IsString()) {
    bool b = def;
    if (ParseBoolLoose(v.string_value, &b)) return b;
  }
  return def;
}

std::string UrlEncode(const std::string& s) {
  static const char* kHex = "0123456789ABCDEF";
  std::string out;
  out.reserve(s.size() + 8);
  for (unsigned char uc : s) {
    const bool ok = (uc >= 'a' && uc <= 'z') || (uc >= 'A' && uc <= 'Z') || (uc >= '0' && uc <= '9') ||
                    uc == '-' || uc == '_' || uc == '.' || uc == '~';
    if (ok) {
      out.push_back(static_cast<char>(uc));
    } else {
      out.push_back('%');
      out.push_back(kHex[(uc >> 4) & 0xF]);
      out.push_back(kHex[(uc >> 0) & 0xF]);
    }
  }
  return out;
}

std::string JoinUrl(const std::string& base, const std::string& path_and_query) {
  std::string b = base;
  std::string p = path_and_query;
  if (b.empty()) return p;
  if (p.empty()) return b;
  while (!b.empty() && b.back() == '/') b.pop_back();
  if (p.front() != '/') p.insert(p.begin(), '/');
  return b + p;
}

void ApplyJsonSettings(const JsonValue& root, ClientRuntimeSettings* st) {
  if (!st) return;
  if (!root.IsObject()) return;

  // string
  if (const JsonValue* v = root.Get("api_base"); v && v->IsString()) st->api_base = TrimAscii(v->string_value);
  if (const JsonValue* v = root.Get("device_uuid"); v && v->IsString()) st->device_uuid = TrimAscii(v->string_value);
  if (const JsonValue* v = root.Get("log_level"); v && v->IsString()) st->log_level = TrimAscii(v->string_value);

  // int
  if (const JsonValue* v = root.Get("config_poll_interval_ms")) st->config_poll_interval_ms = static_cast<int>(ToInt64Loose(*v, st->config_poll_interval_ms));
  if (const JsonValue* v = root.Get("heartbeat_interval_ms")) st->heartbeat_interval_ms = static_cast<int>(ToInt64Loose(*v, st->heartbeat_interval_ms));

  // bool
  if (const JsonValue* v = root.Get("dry_run")) st->dry_run = ToBoolLoose(*v, st->dry_run);
  if (const JsonValue* v = root.Get("allow_system_paths")) st->allow_system_paths = ToBoolLoose(*v, st->allow_system_paths);
  if (const JsonValue* v = root.Get("allow_system_processes")) st->allow_system_processes = ToBoolLoose(*v, st->allow_system_processes);

  // list
  if (const JsonValue* v = root.Get("delete_roots_allowlist"); v && v->IsArray()) {
    st->delete_roots_allowlist.clear();
    for (const auto& it : v->array_value) {
      if (it.IsString()) {
        const std::string t = TrimAscii(it.string_value);
        if (!t.empty()) st->delete_roots_allowlist.push_back(t);
      }
    }
  }

  if (const JsonValue* v = root.Get("max_actions")) {
    const int64_t mv = ToInt64Loose(*v, st->max_actions);
    if (mv > 0) st->max_actions = static_cast<uint32_t>(mv);
  }
}

void ApplyEnvSettings(ClientRuntimeSettings* st) {
  if (!st) return;

  // Keep env names short and predictable.
  if (const std::string v = GetEnvA("QGG_API_BASE"); !v.empty()) st->api_base = TrimAscii(v);
  if (const std::string v = GetEnvA("QGG_DEVICE_UUID"); !v.empty()) st->device_uuid = TrimAscii(v);
  if (const std::string v = GetEnvA("QGG_LOG_LEVEL"); !v.empty()) st->log_level = TrimAscii(v);

  if (const std::string v = GetEnvA("QGG_CONFIG_POLL_INTERVAL_MS"); !v.empty()) {
    int x = st->config_poll_interval_ms;
    if (ParseIntLoose(v, &x) && x > 0) st->config_poll_interval_ms = x;
  }
  if (const std::string v = GetEnvA("QGG_HEARTBEAT_INTERVAL_MS"); !v.empty()) {
    int x = st->heartbeat_interval_ms;
    if (ParseIntLoose(v, &x) && x > 0) st->heartbeat_interval_ms = x;
  }
  if (const std::string v = GetEnvA("QGG_DRY_RUN"); !v.empty()) {
    bool b = st->dry_run;
    if (ParseBoolLoose(v, &b)) st->dry_run = b;
  }
  if (const std::string v = GetEnvA("QGG_ALLOW_SYSTEM_PATHS"); !v.empty()) {
    bool b = st->allow_system_paths;
    if (ParseBoolLoose(v, &b)) st->allow_system_paths = b;
  }
  if (const std::string v = GetEnvA("QGG_ALLOW_SYSTEM_PROCESSES"); !v.empty()) {
    bool b = st->allow_system_processes;
    if (ParseBoolLoose(v, &b)) st->allow_system_processes = b;
  }
  if (const std::string v = GetEnvA("QGG_DELETE_ROOTS_ALLOWLIST"); !v.empty()) {
    st->delete_roots_allowlist = SplitListLoose(v);
  }
  if (const std::string v = GetEnvA("QGG_MAX_ACTIONS"); !v.empty()) {
    uint32_t x = st->max_actions;
    if (ParseU32Loose(v, &x) && x > 0) st->max_actions = x;
  }
}

void ApplyLoggerLevelFromSettings(const ClientRuntimeSettings& st) {
  const std::string lv = ToLowerAscii(TrimAscii(st.log_level));
  if (lv == "debug") Logger::Instance().SetLevel(LogLevel::kDebug);
  else if (lv == "info") Logger::Instance().SetLevel(LogLevel::kInfo);
  else if (lv == "warn" || lv == "warning") Logger::Instance().SetLevel(LogLevel::kWarn);
  else if (lv == "error") Logger::Instance().SetLevel(LogLevel::kError);
}

}  // namespace

ClientRuntimeSettings ClientRuntimeSettings::LoadFromEnvironmentAndFile() {
  ClientRuntimeSettings st;

  // Config file resolution:
  // 1) env QGG_CLIENT_CONFIG
  // 2) ./config.json
  const std::string cfg_path = !GetEnvA("QGG_CLIENT_CONFIG").empty() ? GetEnvA("QGG_CLIENT_CONFIG") : "config.json";

  std::string file_body;
  if (ReadFileToStringUtf8BestEffort(cfg_path, &file_body)) {
    JsonValue root;
    std::string err;
    if (json::Parse(TrimAscii(file_body), &root, &err)) {
      ApplyJsonSettings(root, &st);
    } else {
      LogWarn("Settings", "config.json parse failed path=" + cfg_path + " err=" + err);
    }
  }

  ApplyEnvSettings(&st);
  ApplyLoggerLevelFromSettings(st);
  return st;
}

ConfigAgent::ConfigAgent(ClientRuntimeSettings settings) : settings_(std::move(settings)) {}

bool ConfigAgent::FetchConfig(ClientConfig* out) {
  if (!out) return false;
  out->publish_version.clear();
  out->rule_hash.clear();
  out->module_version.clear();

  const std::string q = "/client/config?device_uuid=" + UrlEncode(settings_.device_uuid);
  std::string body;
  if (!HttpGet(q, &body)) return false;

  JsonValue root;
  std::string err;
  if (!json::Parse(body, &root, &err) || !root.IsObject()) {
    LogWarn("ConfigAgent", "FetchConfig parse failed err=" + err);
    return false;
  }
  const JsonValue* codev = root.Get("code");
  const int64_t code = codev ? ToInt64Loose(*codev, -1) : -1;
  if (code != 0) {
    LogWarn("ConfigAgent", "FetchConfig backend code != 0");
    return false;
  }
  const JsonValue* data = root.Get("data");
  if (!data || !data->IsObject()) return false;
  out->publish_version = data->GetString("publish_version", "");
  out->rule_hash = data->GetString("rule_hash", "");
  out->module_version = data->GetString("module_version", "");
  return true;
}

bool ConfigAgent::FetchRulesPackage(const std::string& publish_version, std::string* raw_body) {
  if (!raw_body) return false;
  raw_body->clear();

  std::string q = "/client/rules/package?device_uuid=" + UrlEncode(settings_.device_uuid);
  const std::string pv = TrimAscii(publish_version);
  if (!pv.empty()) {
    // backend behavior: publish_version is also used as a compatibility placeholder; if it looks like pb-* treat as publish_code.
    if (pv.rfind("pb-", 0) == 0) {
      q += "&publish_code=" + UrlEncode(pv);
    } else {
      q += "&publish_version=" + UrlEncode(pv);
    }
  }
  return HttpGet(q, raw_body);
}

bool ConfigAgent::PostHeartbeat(const std::string& json_body, std::string* response_body) {
  if (!response_body) return false;
  response_body->clear();
  return HttpPostJson("/client/heartbeat", json_body, response_body);
}

bool ConfigAgent::HttpGet(const std::string& path_and_query, std::string* response_body) {
  if (!response_body) return false;

#ifdef _WIN32
  const std::string url = JoinUrl(settings_.api_base, path_and_query);
  const std::wstring urlw = Utf8ToWide(url);
  if (urlw.empty()) return false;

  URL_COMPONENTS uc{};
  uc.dwStructSize = sizeof(uc);
  uc.dwSchemeLength = (DWORD)-1;
  uc.dwHostNameLength = (DWORD)-1;
  uc.dwUrlPathLength = (DWORD)-1;
  uc.dwExtraInfoLength = (DWORD)-1;

  if (!WinHttpCrackUrl(urlw.c_str(), 0, 0, &uc)) {
    LogWarn("ConfigAgent", "WinHttpCrackUrl failed");
    return false;
  }

  const bool secure = (uc.nScheme == INTERNET_SCHEME_HTTPS);
  const std::wstring host(uc.lpszHostName, uc.dwHostNameLength);
  std::wstring path;
  if (uc.lpszUrlPath && uc.dwUrlPathLength > 0) path.append(uc.lpszUrlPath, uc.dwUrlPathLength);
  if (uc.lpszExtraInfo && uc.dwExtraInfoLength > 0) path.append(uc.lpszExtraInfo, uc.dwExtraInfoLength);
  if (path.empty()) path = L"/";

  struct H {
    HINTERNET h{nullptr};
    ~H() {
      if (h) WinHttpCloseHandle(h);
      h = nullptr;
    }
  };

  H session;
  session.h = WinHttpOpen(L"qgg_client/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME,
                          WINHTTP_NO_PROXY_BYPASS, 0);
  if (!session.h) return false;
  WinHttpSetTimeouts(session.h, 5000, 5000, 8000, 8000);

  H connect;
  connect.h = WinHttpConnect(session.h, host.c_str(), uc.nPort, 0);
  if (!connect.h) return false;

  H req;
  req.h = WinHttpOpenRequest(connect.h, L"GET", path.c_str(), nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES,
                             secure ? WINHTTP_FLAG_SECURE : 0);
  if (!req.h) return false;

  // Minimal tracing header for backend request correlation.
  const std::wstring hdr = L"Accept: application/json\r\nX-Request-Id: qgg-client\r\n";
  if (!WinHttpAddRequestHeaders(req.h, hdr.c_str(), (DWORD)-1, WINHTTP_ADDREQ_FLAG_ADD)) return false;

  if (!WinHttpSendRequest(req.h, WINHTTP_NO_ADDITIONAL_HEADERS, 0, WINHTTP_NO_REQUEST_DATA, 0, 0, 0)) return false;
  if (!WinHttpReceiveResponse(req.h, nullptr)) return false;

  DWORD status = 0;
  DWORD status_sz = sizeof(status);
  WinHttpQueryHeaders(req.h, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_HEADER_NAME_BY_INDEX, &status,
                      &status_sz, WINHTTP_NO_HEADER_INDEX);
  if (status < 200 || status >= 300) {
    LogWarn("ConfigAgent", "HTTP GET status=" + std::to_string(status));
    // still try to read body for diagnostics
  }

  std::string body;
  char buf[16 * 1024];
  while (true) {
    DWORD got = 0;
    if (!WinHttpReadData(req.h, buf, static_cast<DWORD>(sizeof(buf)), &got)) {
      LogWarn("ConfigAgent", "WinHttpReadData failed");
      return false;
    }
    if (got == 0) break;
    body.append(buf, buf + got);
  }

  *response_body = std::move(body);
  return status >= 200 && status < 300;
#else
  (void)path_and_query;
  (void)response_body;
  return false;
#endif
}

bool ConfigAgent::HttpPostJson(const std::string& path_and_query, const std::string& json_body, std::string* response_body) {
  if (!response_body) return false;

#ifdef _WIN32
  const std::string url = JoinUrl(settings_.api_base, path_and_query);
  const std::wstring urlw = Utf8ToWide(url);
  if (urlw.empty()) return false;

  URL_COMPONENTS uc{};
  uc.dwStructSize = sizeof(uc);
  uc.dwSchemeLength = (DWORD)-1;
  uc.dwHostNameLength = (DWORD)-1;
  uc.dwUrlPathLength = (DWORD)-1;
  uc.dwExtraInfoLength = (DWORD)-1;

  if (!WinHttpCrackUrl(urlw.c_str(), 0, 0, &uc)) return false;
  const bool secure = (uc.nScheme == INTERNET_SCHEME_HTTPS);
  const std::wstring host(uc.lpszHostName, uc.dwHostNameLength);
  std::wstring path;
  if (uc.lpszUrlPath && uc.dwUrlPathLength > 0) path.append(uc.lpszUrlPath, uc.dwUrlPathLength);
  if (uc.lpszExtraInfo && uc.dwExtraInfoLength > 0) path.append(uc.lpszExtraInfo, uc.dwExtraInfoLength);
  if (path.empty()) path = L"/";

  struct H {
    HINTERNET h{nullptr};
    ~H() {
      if (h) WinHttpCloseHandle(h);
      h = nullptr;
    }
  };

  H session;
  session.h = WinHttpOpen(L"qgg_client/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME,
                          WINHTTP_NO_PROXY_BYPASS, 0);
  if (!session.h) return false;
  WinHttpSetTimeouts(session.h, 5000, 5000, 8000, 8000);

  H connect;
  connect.h = WinHttpConnect(session.h, host.c_str(), uc.nPort, 0);
  if (!connect.h) return false;

  H req;
  req.h = WinHttpOpenRequest(connect.h, L"POST", path.c_str(), nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES,
                             secure ? WINHTTP_FLAG_SECURE : 0);
  if (!req.h) return false;

  const std::wstring hdr = L"Content-Type: application/json\r\nAccept: application/json\r\nX-Request-Id: qgg-client\r\n";
  if (!WinHttpAddRequestHeaders(req.h, hdr.c_str(), (DWORD)-1, WINHTTP_ADDREQ_FLAG_ADD)) return false;

  const std::string payload = json_body;
  if (!WinHttpSendRequest(req.h, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
                          payload.empty() ? WINHTTP_NO_REQUEST_DATA : (LPVOID)payload.data(),
                          payload.empty() ? 0 : static_cast<DWORD>(payload.size()),
                          payload.empty() ? 0 : static_cast<DWORD>(payload.size()), 0)) {
    return false;
  }
  if (!WinHttpReceiveResponse(req.h, nullptr)) return false;

  DWORD status = 0;
  DWORD status_sz = sizeof(status);
  WinHttpQueryHeaders(req.h, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_HEADER_NAME_BY_INDEX, &status,
                      &status_sz, WINHTTP_NO_HEADER_INDEX);

  std::string body;
  char buf[16 * 1024];
  while (true) {
    DWORD got = 0;
    if (!WinHttpReadData(req.h, buf, static_cast<DWORD>(sizeof(buf)), &got)) return false;
    if (got == 0) break;
    body.append(buf, buf + got);
  }

  *response_body = std::move(body);
  return status >= 200 && status < 300;
#else
  (void)path_and_query;
  (void)json_body;
  (void)response_body;
  return false;
#endif
}

}  // namespace qgg

