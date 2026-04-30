from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserAccount(Base, TimestampMixin):
    __tablename__ = "user_account"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), index=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1)
    agent_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[bool] = mapped_column(Boolean, default=True)


class Agent(Base, TimestampMixin):
    __tablename__ = "agent"

    # 与现有各表的 agent_id 对齐：以 id 作为 agent_id
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)

    # 基本信息（预留字段，后续可扩展）
    agent_name: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    contact_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    ext_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[bool] = mapped_column(Boolean, default=True)


class RuleMain(Base, TimestampMixin):
    __tablename__ = "rule_main"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, index=True, default=1)
    agent_id: Mapped[int] = mapped_column(Integer, index=True)
    orgn_share_agent_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    name: Mapped[str] = mapped_column(String(80), index=True)
    enable_ad: Mapped[bool] = mapped_column(Boolean, default=True)
    is_share: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hide: Mapped[bool] = mapped_column(Boolean, default=False)
    run_possibility: Mapped[int] = mapped_column(Integer, default=100)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    pe_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    dir_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    md5_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    reg_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    md5_reg_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    ctrl_wnd_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    anti_thread_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    thread_control_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    used_count: Mapped[int] = mapped_column(Integer, default=0)
    version: Mapped[int] = mapped_column(Integer, default=1)


class ClientGroup(Base, TimestampMixin):
    __tablename__ = "client_group"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1)
    agent_id: Mapped[int] = mapped_column(Integer, index=True)
    group_name: Mapped[str] = mapped_column(String(128))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    boot_bat: Mapped[str | None] = mapped_column(Text, nullable=True)
    remark: Mapped[str | None] = mapped_column(String(512), nullable=True)


class ClientGroupIP(Base, TimestampMixin):
    """
    分组 IP / 网吧映射：public_ip + route_mac -> internet_bar_name + group_id

    说明：route_mac 可空（仅按 public_ip 映射的场景）。
    """

    __tablename__ = "client_group_ip"
    __table_args__ = (
        UniqueConstraint("tenant_id", "public_ip", "route_mac", name="uk_group_ip_tenant_public_ip_route_mac"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    agent_id: Mapped[int] = mapped_column(Integer, index=True)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("client_group.id"), index=True)
    public_ip: Mapped[str] = mapped_column(String(64), index=True)
    route_mac: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    internet_bar_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    remark: Mapped[str | None] = mapped_column(String(512), nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    group: Mapped[ClientGroup] = relationship("ClientGroup")


class ClientGroupRule(Base, TimestampMixin):
    __tablename__ = "client_group_rule"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("client_group.id"), index=True)
    rule_id: Mapped[int] = mapped_column(Integer, index=True)
    priority: Mapped[int] = mapped_column(Integer, default=100)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class RulePublish(Base, TimestampMixin):
    __tablename__ = "rule_publish"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    publish_code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    publish_type: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(16), default="draft")
    target_scope: Mapped[str] = mapped_column(String(16))
    target_json: Mapped[str] = mapped_column(Text)
    rule_version_map_json: Mapped[str] = mapped_column(Text)
    rollback_of: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class ClientDevice(Base, TimestampMixin):
    __tablename__ = "client_device"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1)
    agent_id: Mapped[int] = mapped_column(Integer, index=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("client_group.id"), nullable=True)
    device_uuid: Mapped[str] = mapped_column(String(128), unique=True)
    mac_addr: Mapped[str] = mapped_column(String(64), index=True)
    public_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    route_mac: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    hostname: Mapped[str | None] = mapped_column(String(128), nullable=True)
    os_version: Mapped[str | None] = mapped_column(String(128), nullable=True)
    client_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    internet_bar_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="online")

    group: Mapped[ClientGroup | None] = relationship("ClientGroup")


class ModuleMain(Base, TimestampMixin):
    __tablename__ = "module_main"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    module_name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    module_display_name: Mapped[str] = mapped_column(String(128))
    module_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    md5: Mapped[str | None] = mapped_column(String(64), nullable=True)
    signature_sha256: Mapped[str | None] = mapped_column(String(128), nullable=True)
    visible: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(Integer, default=1000)
    run_possibility: Mapped[int] = mapped_column(Integer, default=100)
    module_param_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class ModuleAssignment(Base, TimestampMixin):
    """
    Module assignment policy rows.

    Scope:
    - tenant global: agent_id IS NULL AND group_id IS NULL
    - agent global:  agent_id IS NOT NULL AND group_id IS NULL
    - group:         group_id IS NOT NULL
    """

    __tablename__ = "module_assignment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    agent_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("client_group.id"), nullable=True, index=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("module_main.id"), index=True)
    priority: Mapped[int] = mapped_column(Integer, default=100)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    module_param: Mapped[str | None] = mapped_column(Text, nullable=True)

    module: Mapped[ModuleMain] = relationship("ModuleMain")
    group: Mapped[ClientGroup | None] = relationship("ClientGroup")


class ModuleGlobalExclusion(Base, TimestampMixin):
    """
    Global exclusion list for module delivery.

    If a client matches any enabled exclusion (by public_ip or router_mac),
    the effective modules list will be empty.
    """

    __tablename__ = "module_global_exclusion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    agent_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    exclude_type: Mapped[str] = mapped_column(String(32), index=True)  # public_ip | router_mac
    value: Mapped[str] = mapped_column(String(128), index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    remark: Mapped[str | None] = mapped_column(String(512), nullable=True)


class ClientHeartbeat(Base):
    __tablename__ = "client_heartbeat"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    device_id: Mapped[int] = mapped_column(Integer, index=True)
    cpu_usage: Mapped[str | None] = mapped_column(String(16), nullable=True)
    mem_usage: Mapped[str | None] = mapped_column(String(16), nullable=True)
    ping_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ext_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    operator_id: Mapped[int] = mapped_column(Integer, index=True)
    role: Mapped[str] = mapped_column(String(32))
    action: Mapped[str] = mapped_column(String(64))
    resource_type: Mapped[str] = mapped_column(String(64))
    resource_id: Mapped[str] = mapped_column(String(64))
    before_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    after_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class AgentPolicy(Base, TimestampMixin):
    """
    Agent-side policy/settings (homepage lock, whitelist, boot scripts, etc.).

    This table is intentionally flexible; fields may expand as we align more of the
    target system pages.
    """

    __tablename__ = "agent_policy"
    __table_args__ = (UniqueConstraint("tenant_id", "agent_id", name="uk_agent_policy_tenant_agent"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    agent_id: Mapped[int] = mapped_column(Integer, index=True)

    lock_homepage: Mapped[bool] = mapped_column(Boolean, default=False)
    homepage_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    homepage_whitelist_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    boot_bat: Mapped[str | None] = mapped_column(Text, nullable=True)
    fast_shutdown: Mapped[bool] = mapped_column(Boolean, default=False)
    random_main_process_name: Mapped[bool] = mapped_column(Boolean, default=False)

    # additional knobs / keys that we haven't normalized yet
    extras_json: Mapped[str | None] = mapped_column(Text, nullable=True)


class RuleDerivedLink(Base):
    """
    Link table for rule copies/clones.

    - origin_rule_id: the shared/original rule
    - derived_rule_id: the copied rule (owned by current agent)
    """

    __tablename__ = "rule_derived_link"
    __table_args__ = (UniqueConstraint("tenant_id", "origin_rule_id", "derived_rule_id", name="uk_rule_derived_link"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    origin_rule_id: Mapped[int] = mapped_column(Integer, index=True)
    derived_rule_id: Mapped[int] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class RuleBackup(Base):
    """
    Rule snapshot backups (for restore / audit).
    """

    __tablename__ = "rule_backup"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    rule_id: Mapped[int] = mapped_column(Integer, index=True)
    backup_desc: Mapped[str] = mapped_column(String(256), default="")
    snapshot_json: Mapped[str] = mapped_column(Text, default="{}")
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

