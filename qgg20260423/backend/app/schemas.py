from datetime import datetime
import json
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


RULE_FIELDS = [
    "pe_json",
    "dir_json",
    "md5_json",
    "reg_json",
    "md5_reg_json",
    "ip_json",
    "ctrl_wnd_json",
    "anti_thread_json",
    "thread_control_json",
]


class ApiResponse(BaseModel):
    code: int = 0
    message: str = "ok"
    data: Any = None
    request_id: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    username: str
    password: str


class RuleBase(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    enable_ad: bool = True
    is_share: bool = False
    is_hide: bool = False
    run_possibility: int = 100
    remark: str | None = None
    pe_json: str | None = ""
    dir_json: str | None = ""
    md5_json: str | None = ""
    reg_json: str | None = ""
    md5_reg_json: str | None = ""
    ip_json: str | None = ""
    ctrl_wnd_json: str | None = ""
    anti_thread_json: str | None = ""
    thread_control_json: str | None = ""

    @field_validator(*RULE_FIELDS, mode="before")
    @classmethod
    def normalize_rule_field(cls, value: str | None) -> str:
        if value is None:
            return ""
        if len(value) > 10000:
            raise ValueError("规则字段长度不能超过10000")
        if str(value).strip():
            try:
                json.loads(value)
            except json.JSONDecodeError as exc:
                raise ValueError("规则字段必须是合法 JSON") from exc
        return value

    @field_validator("run_possibility")
    @classmethod
    def check_run_possibility(cls, value: int) -> int:
        if value < 0 or value > 100:
            raise ValueError("run_possibility 必须在 0~100")
        return value

    def has_any_rule_content(self) -> bool:
        return any((getattr(self, field) or "").strip() for field in RULE_FIELDS)


class RuleCreate(RuleBase):
    pass


class RuleUpdate(RuleBase):
    pass


class RuleOut(RuleBase):
    id: int
    agent_id: int
    tenant_id: int
    orgn_share_agent_id: int | None
    used_count: int
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GroupCreate(BaseModel):
    group_name: str = Field(min_length=1, max_length=128)
    is_default: bool = False
    boot_bat: str | None = None
    remark: str | None = None


class GroupUpdate(BaseModel):
    group_name: str | None = Field(default=None, min_length=1, max_length=128)
    is_default: bool | None = None
    boot_bat: str | None = None
    remark: str | None = None


class GroupOut(BaseModel):
    id: int
    group_name: str
    is_default: bool
    boot_bat: str | None
    remark: str | None
    agent_id: int
    tenant_id: int

    class Config:
        from_attributes = True


class GroupRuleBindCreate(BaseModel):
    rule_id: int
    priority: int = Field(default=100, ge=0, le=1_000_000)
    enabled: bool = True


class GroupRuleOut(BaseModel):
    id: int
    group_id: int
    rule_id: int
    priority: int
    enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PublishCreate(BaseModel):
    publish_type: str = Field(pattern="^(gray|full)$")
    target_scope: str = Field(pattern="^(agent|group|device|all)$")
    target_ids: list[int]
    rule_ids: list[int]
    rollback_of: int | None = None


class PublishOut(BaseModel):
    id: int
    tenant_id: int
    publish_code: str
    publish_type: str
    status: str
    target_scope: str
    target_json: str
    rule_version_map_json: str
    rollback_of: int | None
    created_by: int | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PublishTransitionIn(BaseModel):
    to_status: Literal["rolling_out", "published"]


class ClientOut(BaseModel):
    id: int
    device_uuid: str
    mac_addr: str
    public_ip: str | None
    route_mac: str | None
    hostname: str | None
    os_version: str | None
    client_version: str | None
    internet_bar_name: str | None
    status: str
    agent_id: int
    group_id: int | None

    class Config:
        from_attributes = True


class ModuleBase(BaseModel):
    module_name: str = Field(min_length=2, max_length=128)
    module_display_name: str = Field(min_length=2, max_length=128)
    module_url: str | None = ""
    md5: str | None = ""
    signature_sha256: str | None = ""
    visible: bool = True
    display_order: int = 1000
    run_possibility: int = 100
    module_param_template: str | None = ""
    enabled: bool = True

    @field_validator("run_possibility")
    @classmethod
    def check_module_run_possibility(cls, value: int) -> int:
        if value < 0 or value > 100:
            raise ValueError("run_possibility 必须在 0~100")
        return value


class ModuleCreate(ModuleBase):
    pass


class ModuleUpdate(ModuleBase):
    pass


class ModuleOut(ModuleBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ModuleAssignmentBase(BaseModel):
    scope_type: Literal["tenant", "agent", "group"] = "tenant"
    agent_id: int | None = None
    group_id: int | None = None
    module_id: int
    priority: int = Field(default=100, ge=0, le=1_000_000)
    enabled: bool = True
    module_param: str | None = None

    @model_validator(mode="after")
    def validate_scope(self):
        if self.scope_type == "tenant":
            if self.agent_id is not None or self.group_id is not None:
                raise ValueError("tenant scope does not accept agent_id/group_id")
        elif self.scope_type == "agent":
            if self.agent_id is None or self.group_id is not None:
                raise ValueError("agent scope requires agent_id and forbids group_id")
        elif self.scope_type == "group":
            if self.group_id is None:
                raise ValueError("group scope requires group_id")
        return self


class ModuleAssignmentCreate(ModuleAssignmentBase):
    pass


class ModuleAssignmentUpdate(BaseModel):
    scope_type: Literal["tenant", "agent", "group"] | None = None
    agent_id: int | None = None
    group_id: int | None = None
    module_id: int | None = None
    priority: int | None = Field(default=None, ge=0, le=1_000_000)
    enabled: bool | None = None
    module_param: str | None = None

    @model_validator(mode="after")
    def validate_scope_optional(self):
        # Only validate cross-field rules when scope_type is explicitly provided.
        if self.scope_type is None:
            return self
        tmp = ModuleAssignmentBase(
            scope_type=self.scope_type,
            agent_id=self.agent_id,
            group_id=self.group_id,
            module_id=self.module_id or 0,
            priority=self.priority or 100,
            enabled=self.enabled if self.enabled is not None else True,
            module_param=self.module_param,
        )
        _ = tmp  # silence "unused" while keeping validation side effects
        return self


class ModuleAssignmentOut(BaseModel):
    id: int
    tenant_id: int
    scope_type: Literal["tenant", "agent", "group"]
    agent_id: int | None
    group_id: int | None
    module_id: int
    priority: int
    enabled: bool
    module_param: str | None
    created_at: datetime
    updated_at: datetime


class ModuleExclusionCreate(BaseModel):
    exclude_type: Literal["public_ip", "router_mac"]
    value: str = Field(min_length=1, max_length=128)
    agent_id: int | None = None
    enabled: bool = True
    remark: str | None = None


class ModuleExclusionOut(BaseModel):
    id: int
    tenant_id: int
    agent_id: int | None
    exclude_type: Literal["public_ip", "router_mac"]
    value: str
    enabled: bool
    remark: str | None
    created_at: datetime
    updated_at: datetime


class ClientModuleOut(BaseModel):
    id: int
    module_name: str
    module_display_name: str
    module_url: str | None
    md5: str | None
    signature_sha256: str | None
    visible: bool
    display_order: int
    run_possibility: int
    enabled: bool
    module_param: str

class AuditOut(BaseModel):
    id: int
    tenant_id: int
    operator_id: int
    role: str
    action: str
    resource_type: str
    resource_id: str
    before_json: str | None
    after_json: str | None
    request_id: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class HeartbeatIn(BaseModel):
    device_uuid: str
    public_ip: str | None = None
    route_mac: str | None = None
    cpu_usage: str | None = None
    mem_usage: str | None = None
    ping_ms: int | None = None
    ext: dict[str, Any] | None = None


class ClientRegisterIn(BaseModel):
    # payload 可选：为了兼容现有 stub /client/register（无 body 也能调用）
    device_uuid: str = Field(min_length=1, max_length=128)
    mac_addr: str = Field(min_length=1, max_length=64)
    public_ip: str | None = None
    route_mac: str | None = None
    hostname: str | None = None
    os_version: str | None = None
    client_version: str | None = None
    # 可由映射表自动推导，也允许客户端上报备用
    internet_bar_name: str | None = None
    agent_id: int | None = None
    tenant_id: int | None = None


class AgentUpdate(BaseModel):
    agent_name: str | None = Field(default=None, max_length=128)
    contact_name: str | None = Field(default=None, max_length=64)
    contact_phone: str | None = Field(default=None, max_length=32)
    remark: str | None = None
    ext_json: str | None = None
    status: bool | None = None


class AgentOut(BaseModel):
    id: int
    tenant_id: int
    agent_name: str | None
    contact_name: str | None
    contact_phone: str | None
    remark: str | None
    ext_json: str | None
    status: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GroupIPBindCreate(BaseModel):
    public_ip: str = Field(min_length=1, max_length=64)
    route_mac: str | None = Field(default=None, max_length=64)
    internet_bar_name: str | None = Field(default=None, max_length=128)
    remark: str | None = Field(default=None, max_length=512)
    enabled: bool = True


class GroupIPOut(BaseModel):
    id: int
    tenant_id: int
    agent_id: int
    group_id: int
    public_ip: str
    route_mac: str | None
    internet_bar_name: str | None
    remark: str | None
    enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InternetBarUpsertIn(BaseModel):
    public_ip: str = Field(min_length=1, max_length=64)
    route_mac: str | None = Field(default=None, max_length=64)
    internet_bar_name: str | None = Field(default=None, max_length=128)
    group_id: int
    remark: str | None = Field(default=None, max_length=512)
    enabled: bool = True


class AgentPolicyUpdate(BaseModel):
    lock_homepage: bool | None = None
    homepage_url: str | None = Field(default=None, max_length=512)
    homepage_whitelist_json: str | None = None
    boot_bat: str | None = None
    fast_shutdown: bool | None = None
    random_main_process_name: bool | None = None
    extras_json: str | None = None


class AgentPolicyOut(BaseModel):
    id: int
    tenant_id: int
    agent_id: int
    lock_homepage: bool
    homepage_url: str | None
    homepage_whitelist_json: str | None
    boot_bat: str | None
    fast_shutdown: bool
    random_main_process_name: bool
    extras_json: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RuleCopyIn(BaseModel):
    # optional override name when copying; empty means auto
    name: str | None = Field(default=None, max_length=80)


class RuleBackupCreate(BaseModel):
    backup_desc: str = Field(default="", max_length=256)


class RuleBackupOut(BaseModel):
    id: int
    tenant_id: int
    rule_id: int
    backup_desc: str
    created_by: int | None
    created_at: datetime

    class Config:
        from_attributes = True

