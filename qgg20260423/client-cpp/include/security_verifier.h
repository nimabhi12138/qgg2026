#pragma once

#include <string>

namespace qgg {

class SecurityVerifier {
 public:
  bool VerifyHash(const std::string& content, const std::string& expected_hash);
  bool VerifySignature(const std::string& content, const std::string& signature, const std::string& key_id);
};

}  // namespace qgg

