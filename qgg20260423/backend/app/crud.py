import hashlib
import json
import uuid

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from .deps import CurrentUser
from .models import (
    Agent,
    AgentPolicy,
    AuditLog,
    ClientDevice,
    ClientGroup,
    ClientGroupIP,
    ClientGroupRule,
    ClientHeartbeat,
    ModuleAssignment,
    ModuleGlobalExclusion,
    ModuleMain,
    RuleBackup,
    RuleDerivedLink,
    RuleMain,
    RulePublish,
    UserAccount,
)
from .schemas import (
    AgentUpdate,
    AgentPolicyUpdate,
    ClientRegisterIn,
    GroupCreate,
    GroupIPBindCreate,
    GroupRuleBindCreate,
    GroupUpdate,
    HeartbeatIn,
    ModuleCreate,
    ModuleAssignmentCreate,
    ModuleAssignmentUpdate,
    ModuleExclusionCreate,
    ModuleUpdate,
    InternetBarUpsertIn,
    PublishCreate,
    RuleBackupCreate,
    RuleCopyIn,
    RuleCreate,
    RuleUpdate,
)

from .security import verify_password

CONSUMABLE_PUBLISH_STATUSES = frozenset({"published", "rolling_out"})


def _normalize_public_ip(value: str | None) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def _normalize_mac(value: str | None) -> str | None:
    if value is None:
        return None
    raw = str(value).strip().lower()
    if not raw:
        return None
    # 兼容 "AA:BB:CC:DD:EE:FF" / "AA-BB-..." / "AABBCCDDEEFF" / 带空格等
    hex_only = "".join([c for c in raw if c in "0123456789abcdef"])
    if len(hex_only) == 12:
        return "-".join(hex_only[i : i + 2] for i in range(0, 12, 2))
    raw = raw.replace(":", "-").replace(".", "-").replace(" ", "")
    return raw


def create_audit(
    db: Session,
    *,
    user: CurrentUser,
    action: str,
    resource_type: str,
    resource_id: str,
    before_json: str | None,
    after_json: str | None,
    request_id: str,
):
    db.add(
        AuditLog(
            tenant_id=user.tenant_id,
            operator_id=user.user_id,
            role=user.role,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            before_json=before_json,
            after_json=after_json,
            request_id=request_id,
        )
    )


def authenticate_user(db: Session, username: str, password: str) -> UserAccount | None:
    user = db.query(UserAccount).filter(UserAccount.username == username, UserAccount.status == True).first()  # noqa: E712
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def get_agent_or_404(db: Session, user: CurrentUser, agent_id: int) -> Agent:
    if user.role in ("agent_admin", "agent_operator") and (user.agent_id or -1) != agent_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="鏉冮檺涓嶈冻")
    row = db.query(Agent).filter(Agent.id == agent_id, Agent.tenant_id == user.tenant_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="agent not found")
    return row


def upsert_agent(db: Session, user: CurrentUser, agent_id: int, payload: AgentUpdate, request_id: str) -> Agent:
    if user.role in ("agent_admin", "agent_operator") and (user.agent_id or -1) != agent_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="鏉冮檺涓嶈冻")
    row = db.query(Agent).filter(Agent.id == agent_id, Agent.tenant_id == user.tenant_id).first()
    before = None
    if row:
        before = {
            "id": row.id,
            "agent_name": row.agent_name,
            "contact_name": row.contact_name,
            "contact_phone": row.contact_phone,
            "status": row.status,
        }
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(row, field, value)
    else:
        data = payload.model_dump(exclude_none=True)
        row = Agent(id=agent_id, tenant_id=user.tenant_id, **data)
        db.add(row)
        db.flush()
    create_audit(
        db,
        user=user,
        action="agent_upsert",
        resource_type="agent",
        resource_id=str(agent_id),
        before_json=json.dumps(before, ensure_ascii=False) if before is not None else None,
        after_json=json.dumps({"id": agent_id, **payload.model_dump(exclude_none=True)}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(row)
    return row


def _enforce_agent_scope(user: CurrentUser, agent_id: int) -> None:
    """
    Enforce that agent-scoped roles can only operate on their own agent_id.
    """

    if user.role in ("agent_admin", "agent_operator") and (user.agent_id or -1) != agent_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="鏉冮檺涓嶈冻")


def get_agent_policy(db: Session, user: CurrentUser, agent_id: int) -> AgentPolicy | None:
    _enforce_agent_scope(user, agent_id)
    return (
        db.query(AgentPolicy)
        .filter(AgentPolicy.tenant_id == user.tenant_id, AgentPolicy.agent_id == agent_id)
        .first()
    )


def get_agent_policy_or_404(db: Session, user: CurrentUser, agent_id: int) -> AgentPolicy:
    row = get_agent_policy(db, user, agent_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="agent_policy not found")
    return row


def upsert_agent_policy(db: Session, user: CurrentUser, agent_id: int, payload: AgentPolicyUpdate, request_id: str) -> AgentPolicy:
    _enforce_agent_scope(user, agent_id)
    row = (
        db.query(AgentPolicy)
        .filter(AgentPolicy.tenant_id == user.tenant_id, AgentPolicy.agent_id == agent_id)
        .first()
    )
    before = None
    if row:
        before = {
            "id": row.id,
            "agent_id": row.agent_id,
            "lock_homepage": row.lock_homepage,
            "homepage_url": row.homepage_url,
            "homepage_whitelist_json": row.homepage_whitelist_json,
            "boot_bat": row.boot_bat,
            "fast_shutdown": row.fast_shutdown,
            "random_main_process_name": row.random_main_process_name,
            "extras_json": row.extras_json,
        }
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(row, field, value)
    else:
        data = payload.model_dump(exclude_none=True)
        row = AgentPolicy(tenant_id=user.tenant_id, agent_id=agent_id, **data)
        db.add(row)
        db.flush()

    create_audit(
        db,
        user=user,
        action="agent_policy_upsert",
        resource_type="agent_policy",
        resource_id=str(row.id),
        before_json=json.dumps(before, ensure_ascii=False) if before is not None else None,
        after_json=json.dumps({"agent_id": agent_id, **payload.model_dump(exclude_none=True)}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(row)
    return row


def delete_agent_policy(db: Session, user: CurrentUser, agent_id: int, request_id: str) -> None:
    row = get_agent_policy_or_404(db, user, agent_id)
    create_audit(
        db,
        user=user,
        action="agent_policy_delete",
        resource_type="agent_policy",
        resource_id=str(row.id),
        before_json=json.dumps({"id": row.id, "agent_id": row.agent_id}, ensure_ascii=False),
        after_json=None,
        request_id=request_id,
    )
    db.delete(row)
    db.commit()


def list_rules(db: Session, user: CurrentUser) -> list[RuleMain]:
    query = db.query(RuleMain).filter(RuleMain.tenant_id == user.tenant_id)
    if user.role in ("agent_admin", "agent_operator"):
        query = query.filter(RuleMain.agent_id == (user.agent_id or -1))
    return query.order_by(RuleMain.updated_at.desc()).all()


def get_rule_or_404(db: Session, user: CurrentUser, rule_id: int) -> RuleMain:
    query = db.query(RuleMain).filter(RuleMain.id == rule_id, RuleMain.tenant_id == user.tenant_id)
    if user.role in ("agent_admin", "agent_operator"):
        query = query.filter(RuleMain.agent_id == (user.agent_id or -1))
    rule = query.first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="规则不存在")
    return rule


def create_rule(db: Session, user: CurrentUser, payload: RuleCreate, request_id: str) -> RuleMain:
    if not payload.has_any_rule_content():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="至少一个规则字段非空")
    rule = RuleMain(
        tenant_id=user.tenant_id,
        agent_id=user.agent_id or 0,
        orgn_share_agent_id=user.agent_id,
        name=payload.name,
        enable_ad=payload.enable_ad,
        is_share=payload.is_share,
        is_hide=payload.is_hide,
        run_possibility=payload.run_possibility,
        remark=payload.remark,
        pe_json=payload.pe_json,
        dir_json=payload.dir_json,
        md5_json=payload.md5_json,
        reg_json=payload.reg_json,
        md5_reg_json=payload.md5_reg_json,
        ip_json=payload.ip_json,
        ctrl_wnd_json=payload.ctrl_wnd_json,
        anti_thread_json=payload.anti_thread_json,
        thread_control_json=payload.thread_control_json,
    )
    db.add(rule)
    db.flush()
    create_audit(
        db,
        user=user,
        action="rule_create",
        resource_type="rule",
        resource_id=str(rule.id),
        before_json=None,
        after_json=json.dumps({"id": rule.id, "name": rule.name}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(rule)
    return rule


def update_rule(db: Session, user: CurrentUser, rule: RuleMain, payload: RuleUpdate, request_id: str) -> RuleMain:
    before = {"id": rule.id, "name": rule.name, "version": rule.version}
    for field in (
        "name",
        "enable_ad",
        "is_share",
        "is_hide",
        "run_possibility",
        "remark",
        "pe_json",
        "dir_json",
        "md5_json",
        "reg_json",
        "md5_reg_json",
        "ip_json",
        "ctrl_wnd_json",
        "anti_thread_json",
        "thread_control_json",
    ):
        setattr(rule, field, getattr(payload, field))
    rule.version += 1
    create_audit(
        db,
        user=user,
        action="rule_update",
        resource_type="rule",
        resource_id=str(rule.id),
        before_json=json.dumps(before, ensure_ascii=False),
        after_json=json.dumps({"id": rule.id, "name": rule.name, "version": rule.version}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(rule)
    return rule


def delete_rule(db: Session, user: CurrentUser, rule: RuleMain, request_id: str):
    create_audit(
        db,
        user=user,
        action="rule_delete",
        resource_type="rule",
        resource_id=str(rule.id),
        before_json=json.dumps({"id": rule.id, "name": rule.name}, ensure_ascii=False),
        after_json=None,
        request_id=request_id,
    )
    db.delete(rule)
    db.commit()


def get_rule_for_copy_or_404(db: Session, user: CurrentUser, rule_id: int) -> RuleMain:
    """
    Copy has slightly different visibility rules than the normal rule CRUD:

    - super_admin / tenant_admin: may copy any tenant rule
    - agent_admin / agent_operator: may copy own rules; may also copy *shared* rules from other agents
    """

    rule = db.query(RuleMain).filter(RuleMain.id == rule_id, RuleMain.tenant_id == user.tenant_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="rule not found")

    if user.role in ("agent_admin", "agent_operator"):
        my_agent_id = user.agent_id or -1
        if rule.agent_id != my_agent_id and not bool(rule.is_share):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")

    return rule


def copy_rule(db: Session, user: CurrentUser, origin_rule_id: int, payload: RuleCopyIn, request_id: str) -> RuleMain:
    origin = get_rule_for_copy_or_404(db, user, origin_rule_id)

    target_agent_id = user.agent_id if user.agent_id is not None else origin.agent_id
    if target_agent_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="target agent_id missing")

    desired_name = (payload.name or "").strip()
    if not desired_name:
        suffix = "-copy"
        base = origin.name or "rule"
        if len(base) + len(suffix) <= 40:
            desired_name = f"{base}{suffix}"
        else:
            desired_name = f"{base[: max(0, 40 - len(suffix))]}{suffix}"

    if len(desired_name) < 2 or len(desired_name) > 40:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="name length must be 2~40")

    derived = RuleMain(
        tenant_id=user.tenant_id,
        agent_id=int(target_agent_id),
        orgn_share_agent_id=origin.orgn_share_agent_id or origin.agent_id,
        name=desired_name,
        enable_ad=origin.enable_ad,
        is_share=False,
        is_hide=origin.is_hide,
        run_possibility=origin.run_possibility,
        remark=origin.remark,
        pe_json=origin.pe_json or "",
        dir_json=origin.dir_json or "",
        md5_json=origin.md5_json or "",
        reg_json=origin.reg_json or "",
        md5_reg_json=origin.md5_reg_json or "",
        ip_json=origin.ip_json or "",
        ctrl_wnd_json=origin.ctrl_wnd_json or "",
        anti_thread_json=origin.anti_thread_json or "",
        thread_control_json=origin.thread_control_json or "",
        used_count=0,
        version=1,
    )
    db.add(derived)
    db.flush()
    db.add(RuleDerivedLink(tenant_id=user.tenant_id, origin_rule_id=origin.id, derived_rule_id=derived.id))

    create_audit(
        db,
        user=user,
        action="rule_copy",
        resource_type="rule",
        resource_id=str(derived.id),
        before_json=None,
        after_json=json.dumps({"origin_rule_id": origin.id, "derived_rule_id": derived.id}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(derived)
    return derived


def _rule_snapshot(rule: RuleMain) -> dict:
    return {
        "id": rule.id,
        "tenant_id": rule.tenant_id,
        "agent_id": rule.agent_id,
        "orgn_share_agent_id": rule.orgn_share_agent_id,
        "name": rule.name,
        "enable_ad": rule.enable_ad,
        "is_share": rule.is_share,
        "is_hide": rule.is_hide,
        "run_possibility": rule.run_possibility,
        "remark": rule.remark,
        "pe_json": rule.pe_json or "",
        "dir_json": rule.dir_json or "",
        "md5_json": rule.md5_json or "",
        "reg_json": rule.reg_json or "",
        "md5_reg_json": rule.md5_reg_json or "",
        "ip_json": rule.ip_json or "",
        "ctrl_wnd_json": rule.ctrl_wnd_json or "",
        "anti_thread_json": rule.anti_thread_json or "",
        "thread_control_json": rule.thread_control_json or "",
        "version": rule.version,
        "used_count": rule.used_count,
        "updated_at": rule.updated_at.isoformat() if getattr(rule, "updated_at", None) else None,
    }


def create_rule_backup(
    db: Session,
    user: CurrentUser,
    rule_id: int,
    payload: RuleBackupCreate,
    request_id: str,
) -> RuleBackup:
    rule = get_rule_or_404(db, user, rule_id)
    snap = _rule_snapshot(rule)
    row = RuleBackup(
        tenant_id=user.tenant_id,
        rule_id=rule.id,
        backup_desc=payload.backup_desc or "",
        snapshot_json=json.dumps(snap, ensure_ascii=False),
        created_by=user.user_id,
    )
    db.add(row)
    db.flush()
    create_audit(
        db,
        user=user,
        action="rule_backup_create",
        resource_type="rule_backup",
        resource_id=str(row.id),
        before_json=None,
        after_json=json.dumps({"rule_id": rule.id, "backup_id": row.id}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(row)
    return row


def list_rule_backups(db: Session, user: CurrentUser, rule_id: int) -> list[RuleBackup]:
    # enforce rule visibility
    get_rule_or_404(db, user, rule_id)
    return (
        db.query(RuleBackup)
        .filter(RuleBackup.tenant_id == user.tenant_id, RuleBackup.rule_id == rule_id)
        .order_by(RuleBackup.created_at.desc(), RuleBackup.id.desc())
        .limit(200)
        .all()
    )


def get_rule_backup_or_404(db: Session, user: CurrentUser, rule_id: int, backup_id: int) -> RuleBackup:
    # enforce rule visibility
    get_rule_or_404(db, user, rule_id)
    row = (
        db.query(RuleBackup)
        .filter(RuleBackup.id == backup_id, RuleBackup.tenant_id == user.tenant_id, RuleBackup.rule_id == rule_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="backup not found")
    return row


def restore_rule_from_backup(db: Session, user: CurrentUser, rule_id: int, backup_id: int, request_id: str) -> RuleMain:
    rule = get_rule_or_404(db, user, rule_id)
    backup = get_rule_backup_or_404(db, user, rule_id, backup_id)

    try:
        snap = json.loads(backup.snapshot_json or "{}")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="backup snapshot invalid") from exc
    if not isinstance(snap, dict):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="backup snapshot invalid")

    before = {"id": rule.id, "name": rule.name, "version": rule.version}

    # restore only editable fields (keep id/tenant_id/agent_id stable)
    for field in (
        "name",
        "enable_ad",
        "is_share",
        "is_hide",
        "run_possibility",
        "remark",
        "pe_json",
        "dir_json",
        "md5_json",
        "reg_json",
        "md5_reg_json",
        "ip_json",
        "ctrl_wnd_json",
        "anti_thread_json",
        "thread_control_json",
    ):
        if field in snap:
            setattr(rule, field, snap.get(field))

    rule.version += 1
    create_audit(
        db,
        user=user,
        action="rule_backup_restore",
        resource_type="rule",
        resource_id=str(rule.id),
        before_json=json.dumps(before, ensure_ascii=False),
        after_json=json.dumps({"id": rule.id, "backup_id": backup.id, "version": rule.version}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(rule)
    return rule


def list_groups(db: Session, user: CurrentUser) -> list[ClientGroup]:
    query = db.query(ClientGroup).filter(ClientGroup.tenant_id == user.tenant_id)
    if user.role in ("agent_admin", "agent_operator"):
        query = query.filter(ClientGroup.agent_id == (user.agent_id or -1))
    return query.order_by(ClientGroup.id.desc()).all()


def create_group(db: Session, user: CurrentUser, payload: GroupCreate, request_id: str) -> ClientGroup:
    group = ClientGroup(
        tenant_id=user.tenant_id,
        agent_id=user.agent_id or 0,
        group_name=payload.group_name,
        is_default=payload.is_default,
        boot_bat=payload.boot_bat,
        remark=payload.remark,
    )
    db.add(group)
    db.flush()
    create_audit(
        db,
        user=user,
        action="group_create",
        resource_type="group",
        resource_id=str(group.id),
        before_json=None,
        after_json=json.dumps({"id": group.id, "name": group.group_name}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(group)
    return group


def update_group(db: Session, user: CurrentUser, group_id: int, payload: GroupUpdate, request_id: str) -> ClientGroup:
    group = get_group_or_404(db, user, group_id)
    before = {
        "id": group.id,
        "group_name": group.group_name,
        "is_default": group.is_default,
        "boot_bat": group.boot_bat,
        "remark": group.remark,
    }
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(group, field, value)
    create_audit(
        db,
        user=user,
        action="group_update",
        resource_type="group",
        resource_id=str(group.id),
        before_json=json.dumps(before, ensure_ascii=False),
        after_json=json.dumps({"id": group.id, **payload.model_dump(exclude_none=True)}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(group)
    return group


def create_publish(db: Session, user: CurrentUser, payload: PublishCreate, request_id: str) -> RulePublish:
    publish = RulePublish(
        tenant_id=user.tenant_id,
        publish_code=f"pb-{uuid.uuid4().hex[:16]}",
        publish_type=payload.publish_type,
        status="draft",
        target_scope=payload.target_scope,
        target_json=json.dumps(payload.target_ids, ensure_ascii=False),
        rule_version_map_json=json.dumps(payload.rule_ids, ensure_ascii=False),
        rollback_of=payload.rollback_of,
        created_by=user.user_id,
    )
    db.add(publish)
    db.flush()
    create_audit(
        db,
        user=user,
        action="publish_create",
        resource_type="publish",
        resource_id=str(publish.id),
        before_json=None,
        after_json=json.dumps({"id": publish.id, "code": publish.publish_code}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(publish)
    return publish


def list_publishes(db: Session, user: CurrentUser) -> list[RulePublish]:
    return (
        db.query(RulePublish)
        .filter(RulePublish.tenant_id == user.tenant_id)
        .order_by(RulePublish.created_at.desc())
        .all()
    )


def list_clients(db: Session, user: CurrentUser) -> list[ClientDevice]:
    query = db.query(ClientDevice).filter(ClientDevice.tenant_id == user.tenant_id)
    if user.role in ("agent_admin", "agent_operator"):
        query = query.filter(ClientDevice.agent_id == (user.agent_id or -1))
    return query.order_by(ClientDevice.updated_at.desc()).all()


def list_modules(db: Session, user: CurrentUser) -> list[ModuleMain]:
    return (
        db.query(ModuleMain)
        .filter(ModuleMain.tenant_id == user.tenant_id)
        .order_by(ModuleMain.display_order.asc(), ModuleMain.id.desc())
        .all()
    )


def get_module_or_404(db: Session, user: CurrentUser, module_id: int) -> ModuleMain:
    module = db.query(ModuleMain).filter(ModuleMain.id == module_id, ModuleMain.tenant_id == user.tenant_id).first()
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模块不存在")
    return module


def create_module(db: Session, user: CurrentUser, payload: ModuleCreate, request_id: str) -> ModuleMain:
    module = ModuleMain(tenant_id=user.tenant_id, **payload.model_dump())
    db.add(module)
    db.flush()
    create_audit(
        db,
        user=user,
        action="module_create",
        resource_type="module",
        resource_id=str(module.id),
        before_json=None,
        after_json=json.dumps({"id": module.id, "name": module.module_name}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(module)
    return module


def update_module(db: Session, user: CurrentUser, module: ModuleMain, payload: ModuleUpdate, request_id: str) -> ModuleMain:
    before = {"id": module.id, "name": module.module_name}
    for field, value in payload.model_dump().items():
        setattr(module, field, value)
    create_audit(
        db,
        user=user,
        action="module_update",
        resource_type="module",
        resource_id=str(module.id),
        before_json=json.dumps(before, ensure_ascii=False),
        after_json=json.dumps({"id": module.id, "name": module.module_name}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(module)
    return module


def delete_module(db: Session, user: CurrentUser, module: ModuleMain, request_id: str):
    create_audit(
        db,
        user=user,
        action="module_delete",
        resource_type="module",
        resource_id=str(module.id),
        before_json=json.dumps({"id": module.id, "name": module.module_name}, ensure_ascii=False),
        after_json=None,
        request_id=request_id,
    )
    db.delete(module)
    db.commit()


def _normalize_mac(value: str) -> str:
    v = (value or "").strip().lower()
    for ch in (":", "-", ".", " "):
        v = v.replace(ch, "")
    return v


def list_module_assignments(
    db: Session,
    user: CurrentUser,
    *,
    scope_type: str | None = None,
    agent_id: int | None = None,
    group_id: int | None = None,
) -> list[ModuleAssignment]:
    q = db.query(ModuleAssignment).filter(ModuleAssignment.tenant_id == user.tenant_id)

    if scope_type == "tenant":
        q = q.filter(ModuleAssignment.agent_id.is_(None), ModuleAssignment.group_id.is_(None))
    elif scope_type == "agent":
        if agent_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="agent_id is required")
        q = q.filter(ModuleAssignment.agent_id == agent_id, ModuleAssignment.group_id.is_(None))
    elif scope_type == "group":
        if group_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="group_id is required")
        q = q.filter(ModuleAssignment.group_id == group_id)

    if user.role in ("agent_admin", "agent_operator"):
        # agent roles only manage their own agent-scope and group-scope policies
        q = q.filter(
            or_(
                ModuleAssignment.agent_id == (user.agent_id or -1),
                ModuleAssignment.group_id.in_(
                    db.query(ClientGroup.id)
                    .filter(ClientGroup.tenant_id == user.tenant_id, ClientGroup.agent_id == (user.agent_id or -1))
                ),
            )
        )

    return q.order_by(ModuleAssignment.priority.asc(), ModuleAssignment.id.asc()).all()


def _ensure_assignment_scope_allowed(
    db: Session,
    user: CurrentUser,
    *,
    scope_type: str,
    agent_id: int | None,
    group_id: int | None,
):
    if scope_type == "tenant":
        if user.role in ("agent_admin", "agent_operator"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="agent role cannot manage tenant scope")
        return

    if scope_type == "agent":
        if agent_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="agent_id is required")
        if user.role in ("agent_admin", "agent_operator") and agent_id != (user.agent_id or -1):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="agent_id out of scope")
        return

    if scope_type == "group":
        if group_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="group_id is required")
        group = db.query(ClientGroup).filter(ClientGroup.id == group_id, ClientGroup.tenant_id == user.tenant_id).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="group not found")
        if user.role in ("agent_admin", "agent_operator") and group.agent_id != (user.agent_id or -1):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="group out of scope")
        return

    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="invalid scope_type")


def create_module_assignment(db: Session, user: CurrentUser, payload: ModuleAssignmentCreate, request_id: str) -> ModuleAssignment:
    _ensure_assignment_scope_allowed(
        db,
        user,
        scope_type=payload.scope_type,
        agent_id=payload.agent_id,
        group_id=payload.group_id,
    )

    module = (
        db.query(ModuleMain)
        .filter(ModuleMain.id == payload.module_id, ModuleMain.tenant_id == user.tenant_id)
        .first()
    )
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="module not found")

    agent_id: int | None = None
    group_id: int | None = None
    if payload.scope_type == "agent":
        agent_id = payload.agent_id
    elif payload.scope_type == "group":
        group_id = payload.group_id

    existing = (
        db.query(ModuleAssignment)
        .filter(
            ModuleAssignment.tenant_id == user.tenant_id,
            ModuleAssignment.module_id == payload.module_id,
            (ModuleAssignment.agent_id == agent_id) if agent_id is not None else ModuleAssignment.agent_id.is_(None),
            (ModuleAssignment.group_id == group_id) if group_id is not None else ModuleAssignment.group_id.is_(None),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="assignment already exists")

    row = ModuleAssignment(
        tenant_id=user.tenant_id,
        agent_id=agent_id,
        group_id=group_id,
        module_id=payload.module_id,
        priority=payload.priority,
        enabled=payload.enabled,
        module_param=payload.module_param,
    )
    db.add(row)
    db.flush()
    create_audit(
        db,
        user=user,
        action="module_assignment_create",
        resource_type="module_assignment",
        resource_id=str(row.id),
        before_json=None,
        after_json=json.dumps(
            {"id": row.id, "scope": payload.scope_type, "module_id": payload.module_id},
            ensure_ascii=False,
        ),
        request_id=request_id,
    )
    db.commit()
    db.refresh(row)
    return row


def get_module_assignment_or_404(db: Session, user: CurrentUser, assignment_id: int) -> ModuleAssignment:
    q = db.query(ModuleAssignment).filter(ModuleAssignment.id == assignment_id, ModuleAssignment.tenant_id == user.tenant_id)
    row = q.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="assignment not found")

    if user.role in ("agent_admin", "agent_operator"):
        allowed = False
        if row.agent_id is not None and row.agent_id == (user.agent_id or -1) and row.group_id is None:
            allowed = True
        if row.group_id is not None:
            group = db.query(ClientGroup).filter(ClientGroup.id == row.group_id, ClientGroup.tenant_id == user.tenant_id).first()
            if group and group.agent_id == (user.agent_id or -1):
                allowed = True
        if not allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="out of scope")

    return row


def update_module_assignment(
    db: Session, user: CurrentUser, row: ModuleAssignment, payload: ModuleAssignmentUpdate, request_id: str
) -> ModuleAssignment:
    before = {
        "id": row.id,
        "tenant_id": row.tenant_id,
        "agent_id": row.agent_id,
        "group_id": row.group_id,
        "module_id": row.module_id,
        "priority": row.priority,
        "enabled": row.enabled,
    }
    data = payload.model_dump(exclude_unset=True)

    # scope updates
    new_agent_id = row.agent_id
    new_group_id = row.group_id
    new_module_id = row.module_id
    if "scope_type" in data:
        st = data["scope_type"]
        if st == "tenant":
            new_agent_id = None
            new_group_id = None
        elif st == "agent":
            new_group_id = None
            new_agent_id = data.get("agent_id", new_agent_id)
        elif st == "group":
            new_agent_id = None
            new_group_id = data.get("group_id", new_group_id)
        else:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="invalid scope_type")
    else:
        if "agent_id" in data:
            new_agent_id = data["agent_id"]
        if "group_id" in data:
            new_group_id = data["group_id"]

    if "module_id" in data and data["module_id"] is not None:
        new_module_id = data["module_id"]

    # derive resulting scope_type for validation
    if new_group_id is not None:
        scope_type = "group"
    elif new_agent_id is not None:
        scope_type = "agent"
    else:
        scope_type = "tenant"

    _ensure_assignment_scope_allowed(db, user, scope_type=scope_type, agent_id=new_agent_id, group_id=new_group_id)

    module = (
        db.query(ModuleMain)
        .filter(ModuleMain.id == new_module_id, ModuleMain.tenant_id == user.tenant_id)
        .first()
    )
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="module not found")

    # apply updates
    row.agent_id = new_agent_id
    row.group_id = new_group_id
    row.module_id = new_module_id
    if "priority" in data and data["priority"] is not None:
        row.priority = int(data["priority"])
    if "enabled" in data and data["enabled"] is not None:
        row.enabled = bool(data["enabled"])
    if "module_param" in data:
        row.module_param = data["module_param"]

    create_audit(
        db,
        user=user,
        action="module_assignment_update",
        resource_type="module_assignment",
        resource_id=str(row.id),
        before_json=json.dumps(before, ensure_ascii=False),
        after_json=json.dumps(
            {
                "id": row.id,
                "agent_id": row.agent_id,
                "group_id": row.group_id,
                "module_id": row.module_id,
                "priority": row.priority,
                "enabled": row.enabled,
            },
            ensure_ascii=False,
        ),
        request_id=request_id,
    )
    db.commit()
    db.refresh(row)
    return row


def delete_module_assignment(db: Session, user: CurrentUser, row: ModuleAssignment, request_id: str) -> None:
    create_audit(
        db,
        user=user,
        action="module_assignment_delete",
        resource_type="module_assignment",
        resource_id=str(row.id),
        before_json=json.dumps(
            {"id": row.id, "agent_id": row.agent_id, "group_id": row.group_id, "module_id": row.module_id},
            ensure_ascii=False,
        ),
        after_json=None,
        request_id=request_id,
    )
    db.delete(row)
    db.commit()


def list_module_exclusions(db: Session, user: CurrentUser, *, agent_id: int | None = None) -> list[ModuleGlobalExclusion]:
    q = db.query(ModuleGlobalExclusion).filter(ModuleGlobalExclusion.tenant_id == user.tenant_id)
    if agent_id is not None:
        q = q.filter(ModuleGlobalExclusion.agent_id == agent_id)
    if user.role in ("agent_admin", "agent_operator"):
        q = q.filter(ModuleGlobalExclusion.agent_id == (user.agent_id or -1))
    return q.order_by(ModuleGlobalExclusion.updated_at.desc(), ModuleGlobalExclusion.id.desc()).all()


def create_module_exclusion(
    db: Session, user: CurrentUser, payload: ModuleExclusionCreate, request_id: str
) -> ModuleGlobalExclusion:
    if payload.exclude_type not in ("public_ip", "router_mac"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="invalid exclude_type")

    agent_id = payload.agent_id
    if user.role in ("agent_admin", "agent_operator"):
        agent_id = user.agent_id
    if agent_id is not None and user.role in ("agent_admin", "agent_operator") and agent_id != (user.agent_id or -1):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="agent_id out of scope")

    value = (payload.value or "").strip()
    if payload.exclude_type == "router_mac":
        value = _normalize_mac(value)
    if not value:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="value is required")

    existing = (
        db.query(ModuleGlobalExclusion)
        .filter(
            ModuleGlobalExclusion.tenant_id == user.tenant_id,
            ModuleGlobalExclusion.agent_id == agent_id if agent_id is not None else ModuleGlobalExclusion.agent_id.is_(None),
            ModuleGlobalExclusion.exclude_type == payload.exclude_type,
            ModuleGlobalExclusion.value == value,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="exclusion already exists")

    row = ModuleGlobalExclusion(
        tenant_id=user.tenant_id,
        agent_id=agent_id,
        exclude_type=payload.exclude_type,
        value=value,
        enabled=payload.enabled,
        remark=payload.remark,
    )
    db.add(row)
    db.flush()
    create_audit(
        db,
        user=user,
        action="module_exclusion_create",
        resource_type="module_global_exclusion",
        resource_id=str(row.id),
        before_json=None,
        after_json=json.dumps({"id": row.id, "type": row.exclude_type, "value": row.value}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(row)
    return row


def get_module_exclusion_or_404(db: Session, user: CurrentUser, exclusion_id: int) -> ModuleGlobalExclusion:
    row = (
        db.query(ModuleGlobalExclusion)
        .filter(ModuleGlobalExclusion.id == exclusion_id, ModuleGlobalExclusion.tenant_id == user.tenant_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="exclusion not found")
    if user.role in ("agent_admin", "agent_operator") and row.agent_id != (user.agent_id or -1):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="out of scope")
    return row


def delete_module_exclusion(db: Session, user: CurrentUser, row: ModuleGlobalExclusion, request_id: str) -> None:
    create_audit(
        db,
        user=user,
        action="module_exclusion_delete",
        resource_type="module_global_exclusion",
        resource_id=str(row.id),
        before_json=json.dumps({"id": row.id, "type": row.exclude_type, "value": row.value}, ensure_ascii=False),
        after_json=None,
        request_id=request_id,
    )
    db.delete(row)
    db.commit()


def _render_module_param(template: str | None, ctx: dict[str, str]) -> str:
    if not template:
        return ""
    out = template
    for key, val in ctx.items():
        out = out.replace(f"{{{{{key}}}}}", val)
        out = out.replace(f"${{{key}}}", val)
        out = out.replace(f"${key}", val)
    return out


def _client_matches_module_exclusion(
    db: Session,
    *,
    tenant_id: int,
    agent_id: int | None,
    public_ip: str | None,
    router_mac: str | None,
) -> bool:
    if not public_ip and not router_mac:
        return False

    q = db.query(ModuleGlobalExclusion).filter(
        ModuleGlobalExclusion.tenant_id == tenant_id,
        ModuleGlobalExclusion.enabled == True,  # noqa: E712
    )
    if agent_id is not None:
        q = q.filter(or_(ModuleGlobalExclusion.agent_id.is_(None), ModuleGlobalExclusion.agent_id == agent_id))
    else:
        q = q.filter(ModuleGlobalExclusion.agent_id.is_(None))

    candidates = q.all()
    if not candidates:
        return False

    ip = (public_ip or "").strip()
    mac = _normalize_mac(router_mac or "")

    for row in candidates:
        if row.exclude_type == "public_ip" and ip and row.value == ip:
            return True
        if row.exclude_type == "router_mac" and mac and _normalize_mac(row.value) == mac:
            return True
    return False


def build_client_modules_index(
    db: Session,
    *,
    tenant_id: int,
    agent_id: int | None,
    group_id: int | None,
    device_uuid: str | None,
    public_ip: str | None,
    router_mac: str | None,
    device_mac: str | None,
) -> tuple[list[dict], str]:
    if _client_matches_module_exclusion(
        db,
        tenant_id=tenant_id,
        agent_id=agent_id,
        public_ip=public_ip,
        router_mac=router_mac,
    ):
        payload: list[dict] = []
        blob = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
        return payload, hashlib.sha256(blob).hexdigest()

    # gather applicable assignments
    filters = [and_(ModuleAssignment.tenant_id == tenant_id, ModuleAssignment.enabled == True)]  # noqa: E712
    scope_filters = [
        and_(ModuleAssignment.agent_id.is_(None), ModuleAssignment.group_id.is_(None)),
    ]
    if agent_id is not None:
        scope_filters.append(and_(ModuleAssignment.agent_id == agent_id, ModuleAssignment.group_id.is_(None)))
    if group_id is not None:
        scope_filters.append(ModuleAssignment.group_id == group_id)

    assignments = (
        db.query(ModuleAssignment)
        .filter(*filters)
        .filter(or_(*scope_filters))
        .order_by(ModuleAssignment.priority.asc(), ModuleAssignment.id.asc())
        .all()
    )

    def scope_rank(a: ModuleAssignment) -> int:
        if a.group_id is not None:
            return 3
        if a.agent_id is not None:
            return 2
        return 1

    selected: dict[int, ModuleAssignment] = {}
    for a in assignments:
        best = selected.get(a.module_id)
        if not best:
            selected[a.module_id] = a
            continue
        ra = scope_rank(a)
        rb = scope_rank(best)
        if ra > rb:
            selected[a.module_id] = a
            continue
        if ra == rb:
            if (a.priority, a.id) < (best.priority, best.id):
                selected[a.module_id] = a

    ctx = {
        "tenant_id": str(tenant_id),
        "agent_id": str(agent_id or ""),
        "group_id": str(group_id or ""),
        "device_uuid": (device_uuid or ""),
        "public_ip": (public_ip or ""),
        "router_mac": (router_mac or ""),
        "mac": (router_mac or ""),
        "device_mac": (device_mac or ""),
    }

    modules: list[ModuleMain] = []
    if selected:
        module_ids = list(selected.keys())
        modules = (
            db.query(ModuleMain)
            .filter(
                ModuleMain.tenant_id == tenant_id,
                ModuleMain.id.in_(module_ids),
                ModuleMain.enabled == True,  # noqa: E712
            )
            .order_by(ModuleMain.display_order.asc(), ModuleMain.id.asc())
            .all()
        )
    else:
        # fallback to tenant-wide modules when no policy is configured
        modules = (
            db.query(ModuleMain)
            .filter(ModuleMain.tenant_id == tenant_id, ModuleMain.enabled == True)  # noqa: E712
            .order_by(ModuleMain.display_order.asc(), ModuleMain.id.asc())
            .all()
        )

    payload: list[dict] = []
    for m in modules:
        a = selected.get(m.id)
        raw_param = ""
        if a and (a.module_param or "").strip():
            raw_param = a.module_param or ""
        else:
            raw_param = m.module_param_template or ""
        module_param = _render_module_param(raw_param, ctx)
        payload.append(
            {
                "id": m.id,
                "module_name": m.module_name,
                "module_display_name": m.module_display_name,
                "module_url": m.module_url or "",
                "md5": m.md5 or "",
                "signature_sha256": m.signature_sha256 or "",
                "visible": m.visible,
                "display_order": m.display_order,
                "run_possibility": m.run_possibility,
                "enabled": m.enabled,
                "module_param": module_param,
            }
        )

    blob = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return payload, hashlib.sha256(blob).hexdigest()


def list_audits(db: Session, user: CurrentUser) -> list[AuditLog]:
    return (
        db.query(AuditLog)
        .filter(AuditLog.tenant_id == user.tenant_id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )


def record_heartbeat(db: Session, payload: HeartbeatIn) -> ClientDevice:
    device = db.query(ClientDevice).filter(ClientDevice.device_uuid == payload.device_uuid).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="客户端不存在")
    db.add(
        ClientHeartbeat(
            device_id=device.id,
            cpu_usage=payload.cpu_usage,
            mem_usage=payload.mem_usage,
            ping_ms=payload.ping_ms,
            ext_json=json.dumps(payload.ext or {}, ensure_ascii=False),
        )
    )
    device.status = "online"
    db.commit()
    db.refresh(device)
    return device


def publish_applies_to_device(publish: RulePublish, device: ClientDevice) -> bool:
    try:
        target_ids = json.loads(publish.target_json)
    except json.JSONDecodeError:
        target_ids = []
    if not isinstance(target_ids, list):
        target_ids = []
    if publish.target_scope == "all":
        return True
    if publish.target_scope == "agent":
        return device.agent_id in target_ids
    if publish.target_scope == "group":
        return device.group_id is not None and device.group_id in target_ids
    if publish.target_scope == "device":
        return device.id in target_ids
    return False


def find_effective_publish_for_client(
    db: Session,
    *,
    tenant_id: int,
    device: ClientDevice | None,
    publish_code: str | None,
) -> RulePublish | None:
    qbase = db.query(RulePublish).filter(
        RulePublish.tenant_id == tenant_id,
        RulePublish.status.in_(CONSUMABLE_PUBLISH_STATUSES),
    )
    if publish_code:
        pub = qbase.filter(RulePublish.publish_code == publish_code).first()
        if not pub:
            return None
        if device is None:
            return pub if pub.target_scope == "all" else None
        return pub if publish_applies_to_device(pub, device) else None

    if device is None:
        return None

    pubs = (
        db.query(RulePublish)
        .filter(
            RulePublish.tenant_id == tenant_id,
            RulePublish.status.in_(CONSUMABLE_PUBLISH_STATUSES),
        )
        .order_by(RulePublish.updated_at.desc())
        .all()
    )
    for pub in pubs:
        if publish_applies_to_device(pub, device):
            return pub
    return None


def _ordered_rules_by_ids(db: Session, tenant_id: int, rule_ids: list[int]) -> list[RuleMain]:
    if not rule_ids:
        return []
    rows = (
        db.query(RuleMain)
        .filter(
            RuleMain.tenant_id == tenant_id,
            RuleMain.id.in_(rule_ids),
            RuleMain.enable_ad == True,  # noqa: E712
            RuleMain.is_hide == False,  # noqa: E712
        )
        .all()
    )
    by_id = {r.id: r for r in rows}
    return [by_id[i] for i in rule_ids if i in by_id]


def compute_rules_payload_hash(rules: list[RuleMain]) -> str:
    """与客户端规则包一致的 SHA256（规则内容快照，用于协商缓存）。"""
    payload = []
    for r in rules:
        payload.append(
            {
                "id": r.id,
                "version": r.version,
                "pe_json": r.pe_json or "",
                "dir_json": r.dir_json or "",
                "md5_json": r.md5_json or "",
                "reg_json": r.reg_json or "",
                "md5_reg_json": r.md5_reg_json or "",
                "ip_json": r.ip_json or "",
                "ctrl_wnd_json": r.ctrl_wnd_json or "",
                "anti_thread_json": r.anti_thread_json or "",
                "thread_control_json": r.thread_control_json or "",
            }
        )
    blob = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()


def compute_module_index_hash(db: Session, tenant_id: int) -> str:
    rows = (
        db.query(ModuleMain)
        .filter(ModuleMain.tenant_id == tenant_id, ModuleMain.enabled == True)  # noqa: E712
        .order_by(ModuleMain.display_order.asc(), ModuleMain.id.asc())
        .all()
    )
    payload = [
        {
            "id": m.id,
            "module_name": m.module_name,
            "md5": m.md5 or "",
            "signature_sha256": m.signature_sha256 or "",
            "display_order": m.display_order,
            "enabled": m.enabled,
            "visible": m.visible,
        }
        for m in rows
    ]
    blob = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()


def build_client_rules_package(
    db: Session,
    *,
    tenant_id: int,
    device: ClientDevice | None,
    publish_code: str | None,
    publish_version_legacy: str,
) -> dict:
    # 优先级：consumable 发布命中范围 > 分组 client_group_rule 绑定 > 租户内可见规则全量。
    # 降级：无有效发布且无分组绑定时返回租户级「enable_ad && !is_hide」规则（旧行为，但补上 tenant_id 边界）。
    # 无 device_uuid：tenant 默认为 1；仅 target_scope=all 的发布可被 publish_code 精确命中。
    effective_code = publish_code
    if not effective_code and publish_version_legacy.startswith("pb-"):
        effective_code = publish_version_legacy

    publish = find_effective_publish_for_client(db, tenant_id=tenant_id, device=device, publish_code=effective_code)

    if publish:
        try:
            raw_ids = json.loads(publish.rule_version_map_json)
        except json.JSONDecodeError:
            raw_ids = []
        if not isinstance(raw_ids, list):
            raw_ids = []
        rule_ids: list[int] = []
        for x in raw_ids:
            try:
                rule_ids.append(int(x))
            except (TypeError, ValueError):
                continue
        rules = _ordered_rules_by_ids(db, tenant_id, rule_ids)
        return {
            "publish_label": publish.publish_code,
            "publish_id": publish.id,
            "package_source": "publish",
            "rules": rules,
        }

    if device and device.group_id:
        bindings = (
            db.query(ClientGroupRule)
            .filter(
                ClientGroupRule.group_id == device.group_id,
                ClientGroupRule.enabled == True,  # noqa: E712
            )
            .order_by(ClientGroupRule.priority.asc(), ClientGroupRule.id.asc())
            .all()
        )
        if bindings:
            rule_ids = [b.rule_id for b in bindings]
            rules = _ordered_rules_by_ids(db, tenant_id, rule_ids)
            return {
                "publish_label": publish_version_legacy,
                "publish_id": None,
                "package_source": "group_binding",
                "rules": rules,
            }

    q = db.query(RuleMain).filter(
        RuleMain.tenant_id == tenant_id,
        RuleMain.enable_ad == True,  # noqa: E712
        RuleMain.is_hide == False,  # noqa: E712
    )
    rules = q.order_by(RuleMain.id.asc()).all()
    return {
        "publish_label": publish_version_legacy,
        "publish_id": None,
        "package_source": "tenant_fallback",
        "rules": rules,
    }


def get_group_or_404(db: Session, user: CurrentUser, group_id: int) -> ClientGroup:
    q = db.query(ClientGroup).filter(ClientGroup.id == group_id, ClientGroup.tenant_id == user.tenant_id)
    if user.role in ("agent_admin", "agent_operator"):
        q = q.filter(ClientGroup.agent_id == (user.agent_id or -1))
    group = q.first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="分组不存在")
    return group


def list_group_rule_bindings(db: Session, user: CurrentUser, group_id: int) -> list[ClientGroupRule]:
    get_group_or_404(db, user, group_id)
    return (
        db.query(ClientGroupRule)
        .filter(ClientGroupRule.group_id == group_id)
        .order_by(ClientGroupRule.priority.asc(), ClientGroupRule.id.asc())
        .all()
    )


def bind_group_rule(
    db: Session, user: CurrentUser, group_id: int, payload: GroupRuleBindCreate, request_id: str
) -> ClientGroupRule:
    group = get_group_or_404(db, user, group_id)
    rule = db.query(RuleMain).filter(RuleMain.id == payload.rule_id, RuleMain.tenant_id == user.tenant_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="规则不存在")
    if user.role in ("agent_admin", "agent_operator"):
        if rule.agent_id != (user.agent_id or -1) or group.agent_id != (user.agent_id or -1):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="权限不足")
    existing = (
        db.query(ClientGroupRule)
        .filter(ClientGroupRule.group_id == group_id, ClientGroupRule.rule_id == payload.rule_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="规则已绑定该分组")
    row = ClientGroupRule(
        group_id=group_id,
        rule_id=payload.rule_id,
        priority=payload.priority,
        enabled=payload.enabled,
    )
    db.add(row)
    db.flush()
    create_audit(
        db,
        user=user,
        action="group_rule_bind",
        resource_type="client_group_rule",
        resource_id=str(row.id),
        before_json=None,
        after_json=json.dumps({"group_id": group_id, "rule_id": payload.rule_id}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(row)
    return row


def unbind_group_rule(db: Session, user: CurrentUser, group_id: int, rule_id: int, request_id: str) -> None:
    get_group_or_404(db, user, group_id)
    row = (
        db.query(ClientGroupRule).filter(ClientGroupRule.group_id == group_id, ClientGroupRule.rule_id == rule_id).first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="绑定不存在")
    bid = row.id
    create_audit(
        db,
        user=user,
        action="group_rule_unbind",
        resource_type="client_group_rule",
        resource_id=str(bid),
        before_json=json.dumps({"group_id": group_id, "rule_id": rule_id}, ensure_ascii=False),
        after_json=None,
        request_id=request_id,
    )
    db.delete(row)
    db.commit()


def get_publish_or_404(db: Session, user: CurrentUser, publish_id: int) -> RulePublish:
    pub = db.query(RulePublish).filter(RulePublish.id == publish_id, RulePublish.tenant_id == user.tenant_id).first()
    if not pub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="发布不存在")
    return pub


_PUBLISH_TRANSITIONS: dict[str, frozenset[str]] = {
    "draft": frozenset({"rolling_out", "published"}),
    "rolling_out": frozenset({"published"}),
}


def transition_publish(
    db: Session, user: CurrentUser, publish: RulePublish, to_status: str, request_id: str
) -> RulePublish:
    allowed = _PUBLISH_TRANSITIONS.get(publish.status, frozenset())
    if to_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"非法状态迁移: {publish.status} -> {to_status}",
        )
    before = {"id": publish.id, "status": publish.status}
    publish.status = to_status
    create_audit(
        db,
        user=user,
        action="publish_transition",
        resource_type="publish",
        resource_id=str(publish.id),
        before_json=json.dumps(before, ensure_ascii=False),
        after_json=json.dumps({"id": publish.id, "status": to_status}, ensure_ascii=False),
        request_id=request_id,
    )
    db.commit()
    db.refresh(publish)
    return publish
