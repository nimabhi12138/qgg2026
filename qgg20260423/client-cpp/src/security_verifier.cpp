#include "security_verifier.h"

namespace qgg {

bool SecurityVerifier::VerifyHash(const std::string& content, const std::string& expected_hash) {
  // TODO: 接入 SHA256 实现。当前骨架返回“非空即通过”用于联调。
  return !content.empty() && !expected_hash.empty();
}

bool SecurityVerifier::VerifySignature(
    const std::string& content,
    const std::string& signature,
    const std::string& key_id) {
  // TODO: 接入 Ed25519/RSA 验签，支持 key_id 轮换。
  return !content.empty() && !signature.empty() && !key_id.empty();
}

}  // namespace qgg

