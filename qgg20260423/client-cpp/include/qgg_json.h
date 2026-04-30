#pragma once

#include <cctype>
#include <cstdint>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <limits>
#include <string>
#include <utility>
#include <vector>

namespace qgg {

// A tiny JSON DOM + parser/writer (C++17, no external deps).
// Supports: null, bool, number (double), string (UTF-8), array, object.
// Object is stored as an ordered list of (key,value) pairs.

struct JsonValue {
  enum class Type { kNull, kBool, kNumber, kString, kArray, kObject };

  Type type{Type::kNull};
  bool bool_value{false};
  double number_value{0.0};
  std::string string_value;
  std::vector<JsonValue> array_value;
  std::vector<std::pair<std::string, JsonValue>> object_value;

  static JsonValue Null() { return JsonValue(); }
  static JsonValue Bool(bool v) {
    JsonValue j;
    j.type = Type::kBool;
    j.bool_value = v;
    return j;
  }
  static JsonValue Number(double v) {
    JsonValue j;
    j.type = Type::kNumber;
    j.number_value = v;
    return j;
  }
  static JsonValue String(std::string v) {
    JsonValue j;
    j.type = Type::kString;
    j.string_value = std::move(v);
    return j;
  }
  static JsonValue Array() {
    JsonValue j;
    j.type = Type::kArray;
    return j;
  }
  static JsonValue Object() {
    JsonValue j;
    j.type = Type::kObject;
    return j;
  }

  bool IsNull() const { return type == Type::kNull; }
  bool IsBool() const { return type == Type::kBool; }
  bool IsNumber() const { return type == Type::kNumber; }
  bool IsString() const { return type == Type::kString; }
  bool IsArray() const { return type == Type::kArray; }
  bool IsObject() const { return type == Type::kObject; }

  const JsonValue* Get(const std::string& key) const {
    if (type != Type::kObject) {
      return nullptr;
    }
    for (const auto& kv : object_value) {
      if (kv.first == key) {
        return &kv.second;
      }
    }
    return nullptr;
  }

  // Best-effort getters (return default on mismatch).
  std::string GetString(const std::string& key, const std::string& def = "") const {
    const JsonValue* v = Get(key);
    if (v && v->IsString()) {
      return v->string_value;
    }
    return def;
  }
  bool GetBool(const std::string& key, bool def = false) const {
    const JsonValue* v = Get(key);
    if (v && v->IsBool()) {
      return v->bool_value;
    }
    return def;
  }
  double GetNumber(const std::string& key, double def = 0.0) const {
    const JsonValue* v = Get(key);
    if (v && v->IsNumber()) {
      return v->number_value;
    }
    return def;
  }
};

namespace json {

namespace detail {

inline bool IsWs(char c) {
  return c == ' ' || c == '\n' || c == '\r' || c == '\t';
}

inline int HexVal(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return 10 + (c - 'a');
  if (c >= 'A' && c <= 'F') return 10 + (c - 'A');
  return -1;
}

inline void AppendUtf8(uint32_t cp, std::string* out) {
  if (!out) return;
  if (cp <= 0x7F) {
    out->push_back(static_cast<char>(cp));
  } else if (cp <= 0x7FF) {
    out->push_back(static_cast<char>(0xC0 | ((cp >> 6) & 0x1F)));
    out->push_back(static_cast<char>(0x80 | (cp & 0x3F)));
  } else if (cp <= 0xFFFF) {
    out->push_back(static_cast<char>(0xE0 | ((cp >> 12) & 0x0F)));
    out->push_back(static_cast<char>(0x80 | ((cp >> 6) & 0x3F)));
    out->push_back(static_cast<char>(0x80 | (cp & 0x3F)));
  } else {
    out->push_back(static_cast<char>(0xF0 | ((cp >> 18) & 0x07)));
    out->push_back(static_cast<char>(0x80 | ((cp >> 12) & 0x3F)));
    out->push_back(static_cast<char>(0x80 | ((cp >> 6) & 0x3F)));
    out->push_back(static_cast<char>(0x80 | (cp & 0x3F)));
  }
}

class Parser {
 public:
  Parser(const std::string& s, std::string* err) : p_(s.data()), end_(s.data() + s.size()), err_(err) {}

  bool Parse(JsonValue* out) {
    if (!out) return Fail("null out");
    SkipWs();
    if (!ParseValue(out)) return false;
    SkipWs();
    if (p_ != end_) return Fail("trailing characters");
    return true;
  }

 private:
  const char* p_{nullptr};
  const char* end_{nullptr};
  std::string* err_{nullptr};

  void SkipWs() {
    while (p_ < end_ && IsWs(*p_)) ++p_;
  }

  bool Fail(const char* msg) {
    if (err_) {
      *err_ = msg ? msg : "parse error";
    }
    return false;
  }

  bool Consume(char c) {
    if (p_ < end_ && *p_ == c) {
      ++p_;
      return true;
    }
    return false;
  }

  bool ParseValue(JsonValue* out) {
    SkipWs();
    if (p_ >= end_) return Fail("unexpected end");
    const char c = *p_;
    if (c == 'n') return ParseNull(out);
    if (c == 't' || c == 'f') return ParseBool(out);
    if (c == '"') return ParseStringValue(out);
    if (c == '[') return ParseArray(out);
    if (c == '{') return ParseObject(out);
    if (c == '-' || (c >= '0' && c <= '9')) return ParseNumber(out);
    return Fail("invalid value");
  }

  bool ParseNull(JsonValue* out) {
    if ((end_ - p_) >= 4 && std::memcmp(p_, "null", 4) == 0) {
      p_ += 4;
      *out = JsonValue::Null();
      return true;
    }
    return Fail("invalid null");
  }

  bool ParseBool(JsonValue* out) {
    if ((end_ - p_) >= 4 && std::memcmp(p_, "true", 4) == 0) {
      p_ += 4;
      *out = JsonValue::Bool(true);
      return true;
    }
    if ((end_ - p_) >= 5 && std::memcmp(p_, "false", 5) == 0) {
      p_ += 5;
      *out = JsonValue::Bool(false);
      return true;
    }
    return Fail("invalid bool");
  }

  bool ParseNumber(JsonValue* out) {
    const char* start = p_;
    if (Consume('-')) {
      // ok
    }
    if (p_ >= end_) return Fail("invalid number");
    if (*p_ == '0') {
      ++p_;
    } else {
      if (*p_ < '1' || *p_ > '9') return Fail("invalid number");
      while (p_ < end_ && *p_ >= '0' && *p_ <= '9') ++p_;
    }
    if (Consume('.')) {
      if (p_ >= end_ || *p_ < '0' || *p_ > '9') return Fail("invalid number fraction");
      while (p_ < end_ && *p_ >= '0' && *p_ <= '9') ++p_;
    }
    if (p_ < end_ && (*p_ == 'e' || *p_ == 'E')) {
      ++p_;
      if (p_ < end_ && (*p_ == '+' || *p_ == '-')) ++p_;
      if (p_ >= end_ || *p_ < '0' || *p_ > '9') return Fail("invalid number exponent");
      while (p_ < end_ && *p_ >= '0' && *p_ <= '9') ++p_;
    }
    const std::string tok(start, p_);
    char* pend = nullptr;
    errno = 0;
    const double v = std::strtod(tok.c_str(), &pend);
    if (pend == tok.c_str() || errno == ERANGE || !std::isfinite(v)) {
      return Fail("number out of range");
    }
    *out = JsonValue::Number(v);
    return true;
  }

  bool ParseString(std::string* out) {
    if (!Consume('"')) return Fail("expected string");
    std::string s;
    while (p_ < end_) {
      char c = *p_++;
      if (c == '"') {
        if (out) *out = std::move(s);
        return true;
      }
      if (static_cast<unsigned char>(c) < 0x20) {
        return Fail("control char in string");
      }
      if (c != '\\') {
        s.push_back(c);
        continue;
      }
      if (p_ >= end_) return Fail("bad escape");
      const char e = *p_++;
      switch (e) {
        case '"':
        case '\\':
        case '/':
          s.push_back(e);
          break;
        case 'b':
          s.push_back('\b');
          break;
        case 'f':
          s.push_back('\f');
          break;
        case 'n':
          s.push_back('\n');
          break;
        case 'r':
          s.push_back('\r');
          break;
        case 't':
          s.push_back('\t');
          break;
        case 'u': {
          if (end_ - p_ < 4) return Fail("short \\u");
          int h1 = HexVal(p_[0]);
          int h2 = HexVal(p_[1]);
          int h3 = HexVal(p_[2]);
          int h4 = HexVal(p_[3]);
          if (h1 < 0 || h2 < 0 || h3 < 0 || h4 < 0) return Fail("bad \\u hex");
          uint32_t cp = static_cast<uint32_t>((h1 << 12) | (h2 << 8) | (h3 << 4) | h4);
          p_ += 4;
          // Surrogate pair handling.
          if (cp >= 0xD800 && cp <= 0xDBFF) {
            const char* save = p_;
            if (end_ - p_ >= 6 && p_[0] == '\\' && p_[1] == 'u') {
              int l1 = HexVal(p_[2]);
              int l2 = HexVal(p_[3]);
              int l3 = HexVal(p_[4]);
              int l4 = HexVal(p_[5]);
              if (l1 >= 0 && l2 >= 0 && l3 >= 0 && l4 >= 0) {
                uint32_t lo = static_cast<uint32_t>((l1 << 12) | (l2 << 8) | (l3 << 4) | l4);
                if (lo >= 0xDC00 && lo <= 0xDFFF) {
                  p_ += 6;
                  cp = 0x10000 + (((cp - 0xD800) << 10) | (lo - 0xDC00));
                } else {
                  p_ = save;
                }
              } else {
                p_ = save;
              }
            }
          }
          AppendUtf8(cp, &s);
          break;
        }
        default:
          return Fail("unknown escape");
      }
    }
    return Fail("unterminated string");
  }

  bool ParseStringValue(JsonValue* out) {
    std::string s;
    if (!ParseString(&s)) return false;
    *out = JsonValue::String(std::move(s));
    return true;
  }

  bool ParseArray(JsonValue* out) {
    if (!Consume('[')) return Fail("expected [");
    JsonValue arr = JsonValue::Array();
    SkipWs();
    if (Consume(']')) {
      *out = std::move(arr);
      return true;
    }
    while (true) {
      JsonValue v;
      if (!ParseValue(&v)) return false;
      arr.array_value.push_back(std::move(v));
      SkipWs();
      if (Consume(']')) break;
      if (!Consume(',')) return Fail("expected ,");
      SkipWs();
    }
    *out = std::move(arr);
    return true;
  }

  bool ParseObject(JsonValue* out) {
    if (!Consume('{')) return Fail("expected {");
    JsonValue obj = JsonValue::Object();
    SkipWs();
    if (Consume('}')) {
      *out = std::move(obj);
      return true;
    }
    while (true) {
      SkipWs();
      std::string key;
      if (!ParseString(&key)) return false;
      SkipWs();
      if (!Consume(':')) return Fail("expected :");
      SkipWs();
      JsonValue val;
      if (!ParseValue(&val)) return false;
      obj.object_value.emplace_back(std::move(key), std::move(val));
      SkipWs();
      if (Consume('}')) break;
      if (!Consume(',')) return Fail("expected ,");
      SkipWs();
    }
    *out = std::move(obj);
    return true;
  }
};

inline void EscapeJsonString(const std::string& in, std::string* out) {
  if (!out) return;
  for (unsigned char uc : in) {
    switch (uc) {
      case '\"':
        out->append("\\\"");
        break;
      case '\\':
        out->append("\\\\");
        break;
      case '\b':
        out->append("\\b");
        break;
      case '\f':
        out->append("\\f");
        break;
      case '\n':
        out->append("\\n");
        break;
      case '\r':
        out->append("\\r");
        break;
      case '\t':
        out->append("\\t");
        break;
      default:
        if (uc <= 0x1F) {
          char buf[7];
          std::snprintf(buf, sizeof(buf), "\\u%04x", static_cast<unsigned int>(uc));
          out->append(buf);
        } else {
          out->push_back(static_cast<char>(uc));
        }
    }
  }
}

inline void Dump(const JsonValue& v, std::string* out);

inline void DumpString(const std::string& s, std::string* out) {
  if (!out) return;
  out->push_back('\"');
  EscapeJsonString(s, out);
  out->push_back('\"');
}

inline void Dump(const JsonValue& v, std::string* out) {
  if (!out) return;
  switch (v.type) {
    case JsonValue::Type::kNull:
      out->append("null");
      return;
    case JsonValue::Type::kBool:
      out->append(v.bool_value ? "true" : "false");
      return;
    case JsonValue::Type::kNumber: {
      char buf[64];
      std::snprintf(buf, sizeof(buf), "%.17g", v.number_value);
      out->append(buf);
      return;
    }
    case JsonValue::Type::kString:
      DumpString(v.string_value, out);
      return;
    case JsonValue::Type::kArray: {
      out->push_back('[');
      for (size_t i = 0; i < v.array_value.size(); ++i) {
        if (i) out->push_back(',');
        Dump(v.array_value[i], out);
      }
      out->push_back(']');
      return;
    }
    case JsonValue::Type::kObject: {
      out->push_back('{');
      for (size_t i = 0; i < v.object_value.size(); ++i) {
        if (i) out->push_back(',');
        DumpString(v.object_value[i].first, out);
        out->push_back(':');
        Dump(v.object_value[i].second, out);
      }
      out->push_back('}');
      return;
    }
  }
}

}  // namespace detail

inline bool Parse(const std::string& s, JsonValue* out, std::string* err = nullptr) {
  detail::Parser p(s, err);
  return p.Parse(out);
}

inline std::string Dump(const JsonValue& v) {
  std::string out;
  out.reserve(256);
  detail::Dump(v, &out);
  return out;
}

inline std::string EscapeString(const std::string& s) {
  std::string out;
  out.reserve(s.size() + 8);
  detail::EscapeJsonString(s, &out);
  return out;
}

}  // namespace json
}  // namespace qgg
