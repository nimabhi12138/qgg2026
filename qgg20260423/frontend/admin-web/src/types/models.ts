export type DashboardSummary = {
  rule_count: number;
  group_count: number;
  client_count: number;
  online_client_count: number;
  module_count: number;
};

export type Rule = {
  id: number;
  tenant_id: number;
  agent_id: number;
  orgn_share_agent_id: number | null;
  name: string;
  enable_ad: boolean;
  is_share: boolean;
  is_hide: boolean;
  run_possibility: number;
  remark: string | null;
  pe_json: string;
  dir_json: string;
  md5_json: string;
  reg_json: string;
  md5_reg_json: string;
  ip_json: string;
  ctrl_wnd_json: string;
  anti_thread_json: string;
  thread_control_json: string;
  used_count: number;
  version: number;
  created_at: string;
  updated_at: string;
};

export type RuleUpsert = Omit<
  Rule,
  | "id"
  | "tenant_id"
  | "agent_id"
  | "orgn_share_agent_id"
  | "used_count"
  | "version"
  | "created_at"
  | "updated_at"
>;

export type Group = {
  id: number;
  tenant_id: number;
  agent_id: number;
  group_name: string;
  is_default: boolean;
  boot_bat: string | null;
  remark: string | null;
};

export type GroupCreate = {
  group_name: string;
  is_default: boolean;
  boot_bat: string;
  remark: string;
};

export type GroupRuleBind = {
  id: number;
  group_id: number;
  rule_id: number;
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type GroupRuleBindCreate = {
  rule_id: number;
  priority: number;
  enabled: boolean;
};

export type Publish = {
  id: number;
  tenant_id: number;
  publish_code: string;
  publish_type: "gray" | "full";
  status: "draft" | "rolling_out" | "published";
  target_scope: "agent" | "group" | "device" | "all";
  target_json: string;
  rule_version_map_json: string;
  rollback_of: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
};

