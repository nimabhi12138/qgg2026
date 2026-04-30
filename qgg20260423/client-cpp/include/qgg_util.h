#pragma once

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#endif

namespace qgg {

inline std::string ToLowerAscii(std::string s) {
  for (char& c : s) {
    c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
  }
  return s;
}

inline std::string TrimAscii(std::string s) {
  auto is_ws = [](unsigned char c) { return c == ' ' || c == '\n' || c == '\r' || c == '\t'; };
  while (!s.empty() && is_ws(static_cast<unsigned char>(s.front()))) s.erase(s.begin());
  while (!s.empty() && is_ws(static_cast<unsigned char>(s.back()))) s.pop_back();
  return s;
}

inline bool IEqualsAscii(const std::string& a, const std::string& b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); ++i) {
    if (std::tolower(static_cast<unsigned char>(a[i])) != std::tolower(static_cast<unsigned char>(b[i]))) return false;
  }
  return true;
}

// Simple glob match: supports '*' (any sequence) and '?' (one char). Case-insensitive ASCII.
inline bool GlobMatchIAscii(const std::string& pattern, const std::string& text) {
  const std::string p = ToLowerAscii(pattern);
  const std::string t = ToLowerAscii(text);
  size_t pi = 0, ti = 0;
  size_t star_pi = std::string::npos, star_ti = std::string::npos;
  while (ti < t.size()) {
    if (pi < p.size() && (p[pi] == '?' || p[pi] == t[ti])) {
      ++pi;
      ++ti;
      continue;
    }
    if (pi < p.size() && p[pi] == '*') {
      star_pi = pi++;
      star_ti = ti;
      continue;
    }
    if (star_pi != std::string::npos) {
      pi = star_pi + 1;
      ti = ++star_ti;
      continue;
    }
    return false;
  }
  while (pi < p.size() && p[pi] == '*') ++pi;
  return pi == p.size();
}

inline bool LooksLikeExeNameOrPath(const std::string& s) {
  const std::string ls = ToLowerAscii(s);
  if (ls.size() >= 4 && ls.rfind(".exe") == ls.size() - 4) return true;
  if (ls.find("\\") != std::string::npos || ls.find("/") != std::string::npos) return true;
  return false;
}

inline bool LooksLikePath(const std::string& s) {
  if (s.empty()) return false;
  if (s.find("\\") != std::string::npos || s.find("/") != std::string::npos) return true;
  if (s.size() >= 3 && std::isalpha(static_cast<unsigned char>(s[0])) && s[1] == ':' &&
      (s[2] == '\\' || s[2] == '/')) {
    return true;
  }
  if (s.rfind("\\\\", 0) == 0) return true;  // UNC
  return false;
}

#ifdef _WIN32
inline std::wstring Utf8ToWide(const std::string& s) {
  if (s.empty()) return L"";
  int n = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), static_cast<int>(s.size()), nullptr, 0);
  if (n <= 0) return L"";
  std::wstring out(static_cast<size_t>(n), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, s.c_str(), static_cast<int>(s.size()), out.data(), n);
  return out;
}

inline std::string WideToUtf8(const std::wstring& ws) {
  if (ws.empty()) return "";
  int n = WideCharToMultiByte(CP_UTF8, 0, ws.c_str(), static_cast<int>(ws.size()), nullptr, 0, nullptr, nullptr);
  if (n <= 0) return "";
  std::string out(static_cast<size_t>(n), '\0');
  WideCharToMultiByte(CP_UTF8, 0, ws.c_str(), static_cast<int>(ws.size()), out.data(), n, nullptr, nullptr);
  return out;
}
#endif

inline bool ReadFileToStringUtf8BestEffort(const std::string& path, std::string* out) {
  if (!out) return false;
  std::ifstream f(path, std::ios::binary);
  if (!f) return false;
  std::vector<unsigned char> buf((std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());
#ifdef _WIN32
  auto decode_utf16 = [&](bool big_endian, size_t offset) -> bool {
    if (buf.size() <= offset + 1) return false;
    const size_t wchar_count = (buf.size() - offset) / 2;
    std::wstring ws;
    ws.resize(wchar_count);
    for (size_t i = 0; i < wchar_count; ++i) {
      const unsigned char b0 = buf[offset + i * 2];
      const unsigned char b1 = buf[offset + i * 2 + 1];
      const uint16_t u = big_endian ? static_cast<uint16_t>((b0 << 8) | b1) : static_cast<uint16_t>((b0) | (b1 << 8));
      ws[i] = static_cast<wchar_t>(u);
    }
    *out = WideToUtf8(ws);
    return true;
  };

  auto looks_like_utf16 = [&](bool big_endian) -> bool {
    // Heuristic for BOM-less UTF-16 text: lots of NUL bytes on either even or odd positions.
    const size_t sample = std::min<size_t>(buf.size(), 200);
    if (sample < 32) return false;
    size_t even_null = 0;
    size_t odd_null = 0;
    for (size_t i = 0; i < sample; ++i) {
      if (buf[i] == 0) {
        if ((i & 1) == 0) even_null++;
        else odd_null++;
      }
    }
    const size_t total_null = even_null + odd_null;
    if (total_null < sample / 10) return false;  // at least ~10% NUL bytes
    if (!big_endian) {
      // UTF-16LE for ASCII-ish text: NULs mostly on odd bytes (like 7B 00 0A 00 ...).
      return odd_null > even_null * 2 + 2;
    }
    // UTF-16BE for ASCII-ish text: NULs mostly on even bytes (00 7B 00 0A ...).
    return even_null > odd_null * 2 + 2;
  };
#endif
  if (buf.size() >= 2 && buf[0] == 0xFF && buf[1] == 0xFE) {
#ifdef _WIN32
    // UTF-16LE with BOM
    return decode_utf16(false, 2);
#else
    // On non-Windows builds, just drop BOM and interpret as UTF-8 bytes.
    *out = std::string(reinterpret_cast<const char*>(buf.data() + 2), buf.size() - 2);
    return true;
#endif
  }
  if (buf.size() >= 2 && buf[0] == 0xFE && buf[1] == 0xFF) {
#ifdef _WIN32
    // UTF-16BE with BOM
    return decode_utf16(true, 2);
#else
    *out = std::string(reinterpret_cast<const char*>(buf.data() + 2), buf.size() - 2);
    return true;
#endif
  }
  if (buf.size() >= 3 && buf[0] == 0xEF && buf[1] == 0xBB && buf[2] == 0xBF) {
    *out = std::string(reinterpret_cast<const char*>(buf.data() + 3), buf.size() - 3);
    return true;
  }
#ifdef _WIN32
  if (looks_like_utf16(false)) {
    // UTF-16LE without BOM (common when users save config.json as Unicode in Windows tools).
    return decode_utf16(false, 0);
  }
  if (looks_like_utf16(true)) {
    return decode_utf16(true, 0);
  }
#endif
  *out = std::string(reinterpret_cast<const char*>(buf.data()), buf.size());
  return true;
}

}  // namespace qgg
