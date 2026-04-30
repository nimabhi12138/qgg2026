-- QGG 初始数据库结构
-- MySQL 8.0+

CREATE TABLE IF NOT EXISTS tenant (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS agent (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  parent_agent_id BIGINT NULL,
  name VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NULL,
  qq VARCHAR(32) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  is_banned TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_agent_tenant (tenant_id),
  INDEX idx_agent_parent (parent_agent_id)
);

CREATE TABLE IF NOT EXISTS user_account (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  agent_id BIGINT NULL,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_user_tenant_name (tenant_id, username)
);

CREATE TABLE IF NOT EXISTS rule_main (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  agent_id BIGINT NOT NULL,
  orgn_share_agent_id BIGINT NULL,
  name VARCHAR(80) NOT NULL,
  enable_ad TINYINT NOT NULL DEFAULT 1,
  is_share TINYINT NOT NULL DEFAULT 0,
  is_hide TINYINT NOT NULL DEFAULT 0,
  run_possibility INT NOT NULL DEFAULT 100,
  remark TEXT NULL,
  pe_json LONGTEXT NULL,
  dir_json LONGTEXT NULL,
  md5_json LONGTEXT NULL,
  reg_json LONGTEXT NULL,
  md5_reg_json LONGTEXT NULL,
  ip_json LONGTEXT NULL,
  ctrl_wnd_json LONGTEXT NULL,
  anti_thread_json LONGTEXT NULL,
  thread_control_json LONGTEXT NULL,
  used_count BIGINT NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  created_by BIGINT NULL,
  updated_by BIGINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  INDEX idx_rule_agent (agent_id),
  INDEX idx_rule_enable (enable_ad, is_hide),
  INDEX idx_rule_update (updated_at),
  UNIQUE KEY uk_rule_agent_name_deleted (agent_id, name, deleted_at)
);

CREATE TABLE IF NOT EXISTS rule_version (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rule_id BIGINT NOT NULL,
  version_no INT NOT NULL,
  change_type VARCHAR(16) NOT NULL,
  snapshot_json LONGTEXT NOT NULL,
  operator_id BIGINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_rule_version (rule_id, version_no),
  INDEX idx_rule_version_time (created_at)
);

CREATE TABLE IF NOT EXISTS rule_publish (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  publish_code VARCHAR(64) NOT NULL,
  publish_type VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL,
  target_scope VARCHAR(16) NOT NULL,
  target_json LONGTEXT NOT NULL,
  rule_version_map_json LONGTEXT NOT NULL,
  rollback_of BIGINT NULL,
  created_by BIGINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_publish_code (publish_code),
  INDEX idx_publish_status_time (status, created_at)
);

CREATE TABLE IF NOT EXISTS rule_publish_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  publish_id BIGINT NOT NULL,
  target_type VARCHAR(16) NOT NULL,
  target_id BIGINT NOT NULL,
  result_status VARCHAR(16) NOT NULL DEFAULT 'pending',
  result_message VARCHAR(512) NULL,
  applied_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_publish_item_publish (publish_id),
  INDEX idx_publish_item_target (target_type, target_id)
);

CREATE TABLE IF NOT EXISTS client_group (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  agent_id BIGINT NOT NULL,
  group_name VARCHAR(128) NOT NULL,
  is_default TINYINT NOT NULL DEFAULT 0,
  boot_bat TEXT NULL,
  remark VARCHAR(512) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_group_agent_name (agent_id, group_name),
  INDEX idx_group_agent_default (agent_id, is_default)
);

CREATE TABLE IF NOT EXISTS client_group_rule (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  rule_id BIGINT NOT NULL,
  priority INT NOT NULL DEFAULT 100,
  enabled TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_group_rule (group_id, rule_id),
  INDEX idx_group_rule_priority (group_id, priority)
);

CREATE TABLE IF NOT EXISTS client_group_ip (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  ip_or_range VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_group_ip (group_id, ip_or_range)
);

CREATE TABLE IF NOT EXISTS client_group_policy (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  policy_json LONGTEXT NOT NULL,
  updated_by BIGINT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_group_policy (group_id)
);

CREATE TABLE IF NOT EXISTS module_main (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  module_name VARCHAR(128) NOT NULL,
  module_display_name VARCHAR(128) NOT NULL,
  module_url VARCHAR(1024) NOT NULL,
  md5 VARCHAR(64) NOT NULL,
  signature_sha256 VARCHAR(128) NULL,
  visible TINYINT NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 1000,
  run_possibility INT NOT NULL DEFAULT 100,
  run_time_segment VARCHAR(128) NULL,
  module_param_template LONGTEXT NULL,
  enabled TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_module_name (module_name)
);

CREATE TABLE IF NOT EXISTS agent_module (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  agent_id BIGINT NOT NULL,
  module_id BIGINT NOT NULL,
  enabled TINYINT NOT NULL DEFAULT 1,
  param_json LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_agent_module (agent_id, module_id)
);

CREATE TABLE IF NOT EXISTS client_group_module (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  module_id BIGINT NOT NULL,
  enabled TINYINT NOT NULL DEFAULT 1,
  param_json LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_group_module (group_id, module_id)
);

CREATE TABLE IF NOT EXISTS client_device (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  agent_id BIGINT NOT NULL,
  group_id BIGINT NULL,
  device_uuid VARCHAR(128) NOT NULL,
  mac_addr VARCHAR(64) NOT NULL,
  public_ip VARCHAR(64) NULL,
  hostname VARCHAR(128) NULL,
  os_version VARCHAR(128) NULL,
  client_version VARCHAR(64) NULL,
  internet_bar_name VARCHAR(128) NULL,
  first_seen_at DATETIME(3) NULL,
  last_seen_at DATETIME(3) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'online',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_agent_mac (agent_id, mac_addr),
  INDEX idx_client_group (group_id),
  INDEX idx_client_last_seen (last_seen_at)
);

CREATE TABLE IF NOT EXISTS client_rule_state (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id BIGINT NOT NULL,
  publish_id BIGINT NULL,
  rule_version_hash VARCHAR(128) NOT NULL,
  apply_status VARCHAR(16) NOT NULL,
  apply_message VARCHAR(512) NULL,
  applied_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_client_rule_state_device (device_id, created_at)
);

CREATE TABLE IF NOT EXISTS client_module_state (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id BIGINT NOT NULL,
  module_id BIGINT NOT NULL,
  module_md5 VARCHAR(64) NOT NULL,
  download_status VARCHAR(16) NOT NULL,
  load_status VARCHAR(16) NOT NULL,
  status_message VARCHAR(512) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_device_module (device_id, module_id)
);

CREATE TABLE IF NOT EXISTS client_heartbeat (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id BIGINT NOT NULL,
  cpu_usage DECIMAL(5,2) NULL,
  mem_usage DECIMAL(5,2) NULL,
  ping_ms INT NULL,
  ext_json LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_heartbeat_device_time (device_id, created_at)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  operator_id BIGINT NOT NULL,
  role VARCHAR(32) NOT NULL,
  action VARCHAR(64) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64) NOT NULL,
  before_json LONGTEXT NULL,
  after_json LONGTEXT NULL,
  request_id VARCHAR(64) NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_audit_resource (resource_type, resource_id),
  INDEX idx_audit_time (created_at)
);

CREATE TABLE IF NOT EXISTS event_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  source VARCHAR(64) NOT NULL,
  level VARCHAR(16) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  event_code VARCHAR(64) NULL,
  message VARCHAR(1024) NOT NULL,
  payload_json LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_event_source_time (source, created_at),
  INDEX idx_event_level_time (level, created_at)
);
