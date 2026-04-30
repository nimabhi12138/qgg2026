#pragma once

#include <cstdint>
#include <filesystem>
#include <set>
#include <string>
#include <vector>

#include "qgg_log.h"
#include "qgg_util.h"
#include "rules_package.h"

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <tlhelp32.h>
#include <windows.h>
#endif

namespace qgg {

struct ExecutorOptions {
  bool dry_run{true};  // default safe mode

  bool allow_kill_process{true};
  bool allow_delete_path{true};

  // Safety rails: disabled by default.
  bool allow_system_processes{false};
  bool allow_system_paths{false};

  // Delete allowlist: if non-empty, a normalized absolute path must be under one of these roots.
  // Roots should be absolute, like "D:\\Games\\" or "C:\\Users\\Public\\".
  std::vector<std::string> delete_roots_allowlist;

  uint32_t max_actions{200};
};

struct ExecutorReport {
  RuleApplyStats stats;
  bool overall_ok{true};
  std::string last_error;
};

namespace detail {

inline bool ContainsWildcard(const std::string& s) {
  return s.find('*') != std::string::npos || s.find('?') != std::string::npos;
}

#ifdef _WIN32
inline std::wstring GetProcessImagePathW(DWORD pid) {
  std::wstring out;
  HANDLE h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
  if (!h) return out;
  wchar_t buf[32768];
  DWORD sz = static_cast<DWORD>(sizeof(buf) / sizeof(buf[0]));
  if (QueryFullProcessImageNameW(h, 0, buf, &sz)) {
    out.assign(buf, buf + sz);
  }
  CloseHandle(h);
  return out;
}

inline bool TerminateProcessByPid(DWORD pid) {
  HANDLE h = OpenProcess(PROCESS_TERMINATE, FALSE, pid);
  if (!h) return false;
  const BOOL ok = ::TerminateProcess(h, 1);
  CloseHandle(h);
  return ok == TRUE;
}
#endif

inline bool IsSystemProcessName(const std::string& exe_name_lower) {
  static const char* k[] = {
      "system",         "system idle process", "idle",     "csrss.exe",  "wininit.exe", "winlogon.exe",
      "services.exe",   "lsass.exe",           "smss.exe", "svchost.exe","dwm.exe",     "explorer.exe",
  };
  for (const char* s : k) {
    if (exe_name_lower == s) return true;
  }
  return false;
}

inline bool IsDangerousPathLower(const std::string& abs_lower) {
  // Very conservative: block roots and core OS dirs by default.
  if (abs_lower.size() <= 3) {
    // "c:\" or similar
    return true;
  }
  if (abs_lower.rfind("\\\\?\\", 0) == 0) {
    // device path is usually a red flag for "safety".
    return true;
  }
  auto starts = [&](const std::string& pfx) { return abs_lower.rfind(pfx, 0) == 0; };
  if (starts("c:\\windows") || starts("c:\\program files") || starts("c:\\programdata")) return true;
  if (starts("c:\\users\\default") || starts("c:\\users\\public\\desktop")) return true;
  return false;
}

#ifdef _WIN32
inline std::wstring NormalizePathW(const std::wstring& in) {
  if (in.empty()) return L"";
  wchar_t buf[32768];
  DWORD n = GetFullPathNameW(in.c_str(), static_cast<DWORD>(sizeof(buf) / sizeof(buf[0])), buf, nullptr);
  if (n == 0 || n >= (sizeof(buf) / sizeof(buf[0]))) {
    return in;
  }
  return std::wstring(buf, buf + n);
}
#endif

inline std::string EnsureTrailingBackslashLower(std::string s) {
  s = ToLowerAscii(s);
  if (!s.empty() && s.back() != '\\' && s.back() != '/') {
    s.push_back('\\');
  }
  // normalize slashes to backslash for prefix match
  for (char& c : s) {
    if (c == '/') c = '\\';
  }
  return s;
}

inline bool IsUnderAnyRootLower(const std::string& target_lower, const std::vector<std::string>& roots_lower) {
  if (roots_lower.empty()) return true;
  std::string t = target_lower;
  for (char& c : t) {
    if (c == '/') c = '\\';
  }
  const std::string t_slash = EnsureTrailingBackslashLower(t);
  for (const auto& r : roots_lower) {
    if (r.empty()) continue;
    if (t.rfind(r, 0) == 0) return true;        // file/dir under root
    if (t_slash.rfind(r, 0) == 0) return true;  // dir itself equal to root
  }
  return false;
}

}  // namespace detail

// Extract only "explicit" delete paths from dir_json:
// Supports a few safe shapes:
// 1) {"delete": ["C:\\path1", "D:\\path2"] }
// 2) {"DeletePath": [{"Path":"C:\\x","Recursive":true}, ...] }
// 3) {"*": {"C:\\x": ["delete"], "C:\\y": ["delete_recursive"]}}
//
// NOTE: Existing sample rules like ["noCreate","noWrite"] will not trigger deletes.
inline void ExtractDeletePathsFromDirJson(
    const JsonValue& dir_json,
    std::vector<std::pair<std::string, bool>>* out_paths /* (path, recursive) */) {
  if (!out_paths) return;
  if (dir_json.IsNull()) return;

  auto add_path = [&](const std::string& p, bool rec) {
    const std::string tp = TrimAscii(p);
    if (tp.empty()) return;
    out_paths->push_back({tp, rec});
  };

  if (dir_json.IsObject()) {
    if (const JsonValue* del = dir_json.Get("delete")) {
      if (del->IsArray()) {
        for (const auto& it : del->array_value) {
          if (it.IsString()) add_path(it.string_value, true);
        }
      }
    }
    if (const JsonValue* del2 = dir_json.Get("DeletePath")) {
      if (del2->IsArray()) {
        for (const auto& it : del2->array_value) {
          if (!it.IsObject()) continue;
          const std::string p = it.GetString("Path");
          const bool rec = it.GetBool("Recursive", true);
          if (!p.empty()) add_path(p, rec);
        }
      }
    }

    // Process-scoped map: {"*": {"C:\\ads":["delete"]}}
    for (const auto& kv : dir_json.object_value) {
      const JsonValue& v = kv.second;
      if (!v.IsObject()) continue;
      for (const auto& path_actions : v.object_value) {
        const std::string& path = path_actions.first;
        const JsonValue& actions = path_actions.second;
        if (!actions.IsArray()) continue;
        bool del = false;
        bool rec = true;
        for (const auto& act : actions.array_value) {
          if (!act.IsString()) continue;
          const std::string a = ToLowerAscii(TrimAscii(act.string_value));
          if (a == "delete" || a == "remove" || a == "rm") {
            del = true;
            rec = true;
          } else if (a == "delete_file") {
            del = true;
            rec = false;
          } else if (a == "delete_recursive" || a == "delete_dir" || a == "remove_all") {
            del = true;
            rec = true;
          }
        }
        if (del) add_path(path, rec);
      }
    }
  } else if (dir_json.IsArray()) {
    for (const auto& it : dir_json.array_value) {
      if (it.IsString()) add_path(it.string_value, true);
      if (it.IsObject()) {
        const std::string p = it.GetString("Path");
        const bool rec = it.GetBool("Recursive", true);
        if (!p.empty()) add_path(p, rec);
      }
    }
  } else if (dir_json.IsString()) {
    // In case backend stores direct string path (legacy).
    add_path(dir_json.string_value, true);
  }
}

// Extract process matchers from pe_json:
// Shapes supported:
// 1) {"kill":[{"ProcessName":"a.exe"},{"ProcessPath":"C:\\a\\a.exe"}]}
// 2) ["a.exe","C:\\a\\a.exe"]
// 3) {"ProcessName":["a.exe","b.exe"],"ProcessPath":["C:\\x.exe"]}
inline void ExtractProcessKillMatchersFromPeJson(
    const JsonValue& pe_json,
    std::vector<std::pair<std::string, std::string>>* out_matchers /* (name_pat, path_pat) */) {
  if (!out_matchers) return;
  if (pe_json.IsNull()) return;

  auto add_name = [&](const std::string& n) {
    const std::string tn = TrimAscii(n);
    if (tn.empty()) return;
    out_matchers->push_back({tn, ""});
  };
  auto add_path = [&](const std::string& p) {
    const std::string tp = TrimAscii(p);
    if (tp.empty()) return;
    out_matchers->push_back({"", tp});
  };

  auto parse_obj_one = [&](const JsonValue& o) {
    if (!o.IsObject()) return;
    const std::string pn = o.GetString("ProcessName");
    const std::string pp = o.GetString("ProcessPath");
    if (!pn.empty()) add_name(pn);
    if (!pp.empty()) add_path(pp);
    // tolerate alternative keys
    const std::string n2 = o.GetString("name");
    const std::string p2 = o.GetString("path");
    if (!n2.empty() && pn.empty()) add_name(n2);
    if (!p2.empty() && pp.empty()) add_path(p2);
  };

  if (pe_json.IsArray()) {
    for (const auto& it : pe_json.array_value) {
      if (it.IsString()) {
        if (LooksLikeExeNameOrPath(it.string_value)) {
          if (LooksLikePath(it.string_value)) {
            add_path(it.string_value);
          } else {
            add_name(it.string_value);
          }
        }
      } else if (it.IsObject()) {
        parse_obj_one(it);
      }
    }
    return;
  }

  if (pe_json.IsObject()) {
    if (const JsonValue* kill = pe_json.Get("kill")) {
      if (kill->IsArray()) {
        for (const auto& it : kill->array_value) {
          if (it.IsObject()) parse_obj_one(it);
          if (it.IsString()) add_name(it.string_value);
        }
      }
    }

    if (const JsonValue* pn = pe_json.Get("ProcessName")) {
      if (pn->IsString()) add_name(pn->string_value);
      if (pn->IsArray()) {
        for (const auto& it : pn->array_value) if (it.IsString()) add_name(it.string_value);
      }
    }
    if (const JsonValue* pp = pe_json.Get("ProcessPath")) {
      if (pp->IsString()) add_path(pp->string_value);
      if (pp->IsArray()) {
        for (const auto& it : pp->array_value) if (it.IsString()) add_path(it.string_value);
      }
    }
  }
}

inline ExecutorReport ExecuteRulesPackage(const RulesPackage& pkg, const ExecutorOptions& opt) {
  ExecutorReport rep;

  std::vector<std::pair<std::string, std::string>> kill_matchers;  // (name_pat, path_pat)
  std::vector<std::pair<std::string, bool>> delete_paths;          // (path, recursive)

  for (const auto& r : pkg.rules) {
    if (!r.enable_ad) continue;
    ExtractProcessKillMatchersFromPeJson(r.pe_json.parsed, &kill_matchers);
    ExtractDeletePathsFromDirJson(r.dir_json.parsed, &delete_paths);
  }

  // De-dup basic.
  {
    std::set<std::pair<std::string, std::string>> uniq;
    std::vector<std::pair<std::string, std::string>> tmp;
    tmp.reserve(kill_matchers.size());
    for (const auto& m : kill_matchers) {
      if (uniq.insert(m).second) tmp.push_back(m);
    }
    kill_matchers.swap(tmp);
  }
  {
    std::set<std::pair<std::string, bool>> uniq;
    std::vector<std::pair<std::string, bool>> tmp;
    tmp.reserve(delete_paths.size());
    for (const auto& p : delete_paths) {
      if (uniq.insert(p).second) tmp.push_back(p);
    }
    delete_paths.swap(tmp);
  }

  rep.stats.planned_kill = static_cast<uint64_t>(kill_matchers.size());
  rep.stats.planned_delete = static_cast<uint64_t>(delete_paths.size());

  if (opt.dry_run) {
    if (!kill_matchers.empty()) {
      for (const auto& m : kill_matchers) {
        const std::string desc = !m.first.empty() ? ("name=" + m.first) : ("path=" + m.second);
        LogInfo("Executor", "plan kill matcher: " + desc);
      }
    }
    if (!delete_paths.empty()) {
      for (const auto& p : delete_paths) {
        LogInfo("Executor", std::string("plan delete ") + (p.second ? "recursive " : "") + p.first);
      }
    }
  }

  if ((rep.stats.planned_kill + rep.stats.planned_delete) > opt.max_actions) {
    rep.overall_ok = false;
    rep.last_error = "too many planned actions, capped";
    LogWarn("Executor", "planned actions exceed max_actions, skipping execution");
    return rep;
  }

#ifdef _WIN32
  // Normalize allowlisted delete roots once per execution.
  std::vector<std::string> roots_lower;
  if (!opt.delete_roots_allowlist.empty()) {
    roots_lower.reserve(opt.delete_roots_allowlist.size());
    for (const auto& r : opt.delete_roots_allowlist) {
      std::wstring rw = Utf8ToWide(r);
      if (rw.empty()) continue;
      const std::wstring rn = detail::NormalizePathW(rw);
      std::string rl = detail::EnsureTrailingBackslashLower(WideToUtf8(rn));
      if (!rl.empty()) roots_lower.push_back(std::move(rl));
    }
  }

  // Kill processes
  if (opt.allow_kill_process && !kill_matchers.empty()) {
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snapshot == INVALID_HANDLE_VALUE) {
      rep.overall_ok = false;
      rep.last_error = "CreateToolhelp32Snapshot failed";
      return rep;
    }
    PROCESSENTRY32W pe{};
    pe.dwSize = sizeof(pe);
    if (Process32FirstW(snapshot, &pe)) {
      do {
        const DWORD pid = pe.th32ProcessID;
        if (pid == 0 || pid == GetCurrentProcessId()) continue;

        const std::wstring exe_w(pe.szExeFile);
        const std::string exe = ToLowerAscii(WideToUtf8(exe_w));
        if (!opt.allow_system_processes && detail::IsSystemProcessName(exe)) {
          continue;
        }

        std::wstring full_w = detail::GetProcessImagePathW(pid);
        std::string full = ToLowerAscii(WideToUtf8(full_w));

        bool match = false;
        for (const auto& m : kill_matchers) {
          const std::string& name_pat = m.first;
          const std::string& path_pat = m.second;
          if (!name_pat.empty() && GlobMatchIAscii(name_pat, exe)) {
            match = true;
            break;
          }
          if (!path_pat.empty() && !full.empty() && GlobMatchIAscii(path_pat, full)) {
            match = true;
            break;
          }
        }
        if (!match) continue;

        rep.stats.exec_attempt_kill++;
        if (opt.dry_run) {
          LogInfo("Executor", "dry-run terminate pid=" + std::to_string(pid) + " exe=" + exe + " path=" + full);
          rep.stats.exec_ok_kill++;
          continue;
        }
        if (detail::TerminateProcessByPid(pid)) {
          LogInfo("Executor", "terminated pid=" + std::to_string(pid) + " exe=" + exe);
          rep.stats.exec_ok_kill++;
        } else {
          LogWarn("Executor", "terminate failed pid=" + std::to_string(pid) + " exe=" + exe);
          rep.stats.exec_fail_kill++;
        }
      } while (Process32NextW(snapshot, &pe));
    }
    CloseHandle(snapshot);
  }

  // Delete paths
  if (opt.allow_delete_path && !delete_paths.empty()) {
    for (const auto& it : delete_paths) {
      const std::string raw = it.first;
      const bool recursive = it.second;

      // Safety: reject wildcards for now (requires controlled expansion).
      if (detail::ContainsWildcard(raw)) {
        rep.stats.skipped_safety++;
        LogWarn("Executor", "skip delete path contains wildcard: " + raw);
        continue;
      }

      std::wstring w = Utf8ToWide(raw);
      if (w.empty()) {
        rep.stats.skipped_safety++;
        LogWarn("Executor", "skip delete invalid utf8 path: " + raw);
        continue;
      }

      // Resolve "\foo" (rooted on current drive) into full path.
      if (w.size() >= 1 && w[0] == L'\\' && !(w.size() >= 2 && w[1] == L'\\')) {
        wchar_t cwd[MAX_PATH];
        DWORD n = GetCurrentDirectoryW(MAX_PATH, cwd);
        if (n >= 2 && cwd[1] == L':') {
          w = std::wstring(cwd, cwd + 2) + w;  // "C:" + "\foo"
        }
      }

      const std::wstring norm_w = detail::NormalizePathW(w);
      const std::string norm = ToLowerAscii(WideToUtf8(norm_w));
      if (!detail::IsUnderAnyRootLower(norm, roots_lower)) {
        rep.stats.skipped_safety++;
        LogWarn("Executor", "skip delete not under allowlisted roots: " + norm);
        continue;
      }
      if (!opt.allow_system_paths && detail::IsDangerousPathLower(norm)) {
        rep.stats.skipped_safety++;
        LogWarn("Executor", "skip delete dangerous path (need allow_system_paths): " + norm);
        continue;
      }

      rep.stats.exec_attempt_delete++;
      if (opt.dry_run) {
        LogInfo("Executor", std::string("dry-run delete ") + (recursive ? "recursive " : "") + norm);
        rep.stats.exec_ok_delete++;
        continue;
      }

      std::error_code ec;
      const std::filesystem::path p(norm_w);
      if (recursive) {
        (void)std::filesystem::remove_all(p, ec);
      } else {
        (void)std::filesystem::remove(p, ec);
      }
      if (!ec) {
        LogInfo("Executor", std::string("deleted ") + (recursive ? "recursive " : "") + norm);
        rep.stats.exec_ok_delete++;
      } else {
        LogWarn("Executor", "delete failed: " + norm + " err=" + ec.message());
        rep.stats.exec_fail_delete++;
      }
    }
  }
#else
  (void)pkg;
  (void)opt;
  LogWarn("Executor", "executor implemented for Windows only in this build");
#endif

  rep.overall_ok = (rep.stats.exec_fail_delete + rep.stats.exec_fail_kill) == 0;
  return rep;
}

}  // namespace qgg
