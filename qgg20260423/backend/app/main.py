import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import Base, engine, get_db
from .deps import CurrentUser, get_current_user, require_roles
from .security import create_access_token


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="QGG API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def request_id_or_new(x_request_id: str | None) -> str:
    return x_request_id or f"req-{uuid.uuid4().hex[:16]}"


def ok(data, request_id: str, message: str = "ok"):
    return {"code": 0, "message": message, "data": data, "request_id": request_id}


@app.exception_handler(Exception)
async def catch_all_exception(request: Request, exc: Exception):
    request_id = request.headers.get("X-Request-Id") or f"req-{uuid.uuid4().hex[:16]}"
    return JSONResponse(
        status_code=500,
        content={"code": 5000, "message": str(exc), "data": None, "request_id": request_id},
    )


@app.get("/api/v1/health")
def health(x_request_id: str | None = Header(default=None, alias="X-Request-Id")):
    request_id = request_id_or_new(x_request_id)
    return ok({"status": "up"}, request_id)


@app.post("/api/v1/auth/login")
def login(payload: schemas.LoginIn, db: Session = Depends(get_db), x_request_id: str | None = Header(default=None, alias="X-Request-Id")):
    request_id = request_id_or_new(x_request_id)
    user = crud.authenticate_user(db, payload.username, payload.password)
    if not user:
        return {"code": 1002, "message": "用户名或密码错误", "data": None, "request_id": request_id}
    token = create_access_token(subject=user.username, role=user.role)
    return ok(schemas.TokenOut(access_token=token).model_dump(), request_id)


@app.get("/api/v1/rules")
def list_rules(
    _: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin", "agent_operator")),
    current: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_rules(db, current)
    return ok([schemas.RuleOut.model_validate(x).model_dump() for x in rows], request_id)


@app.get("/api/v1/dashboard")
def dashboard(
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin", "agent_operator")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rule_count = len(crud.list_rules(db, current))
    group_count = len(crud.list_groups(db, current))
    client_rows = crud.list_clients(db, current)
    module_count = len(crud.list_modules(db, current))
    return ok(
        {
            "rule_count": rule_count,
            "group_count": group_count,
            "client_count": len(client_rows),
            "online_client_count": len([x for x in client_rows if x.status == "online"]),
            "module_count": module_count,
        },
        request_id,
    )


@app.get("/api/v1/agents/{agent_id}/policy")
def get_agent_policy(
    agent_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin", "agent_operator")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.get_agent_policy(db, current, agent_id)
    if not row:
        return ok(None, request_id)
    return ok(schemas.AgentPolicyOut.model_validate(row).model_dump(), request_id)


@app.put("/api/v1/agents/{agent_id}/policy")
def upsert_agent_policy(
    agent_id: int,
    payload: schemas.AgentPolicyUpdate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.upsert_agent_policy(db, current, agent_id, payload, request_id)
    return ok(schemas.AgentPolicyOut.model_validate(row).model_dump(), request_id)


@app.delete("/api/v1/agents/{agent_id}/policy")
def delete_agent_policy(
    agent_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    crud.delete_agent_policy(db, current, agent_id, request_id)
    return ok({"deleted": True}, request_id)


@app.post("/api/v1/rules")
def create_rule(
    payload: schemas.RuleCreate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.create_rule(db, current, payload, request_id)
    return ok(schemas.RuleOut.model_validate(row).model_dump(), request_id)


@app.put("/api/v1/rules/{rule_id}")
def update_rule(
    rule_id: int,
    payload: schemas.RuleUpdate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.get_rule_or_404(db, current, rule_id)
    updated = crud.update_rule(db, current, row, payload, request_id)
    return ok(schemas.RuleOut.model_validate(updated).model_dump(), request_id)


@app.delete("/api/v1/rules/{rule_id}")
def delete_rule(
    rule_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.get_rule_or_404(db, current, rule_id)
    crud.delete_rule(db, current, row, request_id)
    return ok({"deleted": True}, request_id)


@app.post("/api/v1/rules/{rule_id}/copy")
def copy_rule(
    rule_id: int,
    payload: schemas.RuleCopyIn,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.copy_rule(db, current, rule_id, payload, request_id)
    return ok(schemas.RuleOut.model_validate(row).model_dump(), request_id)


@app.post("/api/v1/rules/{rule_id}/backups")
def create_rule_backup(
    rule_id: int,
    payload: schemas.RuleBackupCreate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.create_rule_backup(db, current, rule_id, payload, request_id)
    return ok(schemas.RuleBackupOut.model_validate(row).model_dump(), request_id)


@app.get("/api/v1/rules/{rule_id}/backups")
def list_rule_backups(
    rule_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_rule_backups(db, current, rule_id)
    return ok([schemas.RuleBackupOut.model_validate(x).model_dump() for x in rows], request_id)


@app.post("/api/v1/rules/{rule_id}/backups/{backup_id}/restore")
def restore_rule_backup(
    rule_id: int,
    backup_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.restore_rule_from_backup(db, current, rule_id, backup_id, request_id)
    return ok(schemas.RuleOut.model_validate(row).model_dump(), request_id)


@app.get("/api/v1/groups")
def list_groups(
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin", "agent_operator")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_groups(db, current)
    return ok([schemas.GroupOut.model_validate(x).model_dump() for x in rows], request_id)


@app.post("/api/v1/groups")
def create_group(
    payload: schemas.GroupCreate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.create_group(db, current, payload, request_id)
    return ok(schemas.GroupOut.model_validate(row).model_dump(), request_id)


@app.get("/api/v1/groups/{group_id}/rules")
def list_group_rules(
    group_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin", "agent_operator")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_group_rule_bindings(db, current, group_id)
    return ok([schemas.GroupRuleOut.model_validate(x).model_dump() for x in rows], request_id)


@app.post("/api/v1/groups/{group_id}/rules")
def bind_group_rule(
    group_id: int,
    payload: schemas.GroupRuleBindCreate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.bind_group_rule(db, current, group_id, payload, request_id)
    return ok(schemas.GroupRuleOut.model_validate(row).model_dump(), request_id)


@app.delete("/api/v1/groups/{group_id}/rules/{rule_id}")
def unbind_group_rule(
    group_id: int,
    rule_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    crud.unbind_group_rule(db, current, group_id, rule_id, request_id)
    return ok({"deleted": True}, request_id)


@app.post("/api/v1/rules/publish")
def create_publish(
    payload: schemas.PublishCreate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.create_publish(db, current, payload, request_id)
    return ok(schemas.PublishOut.model_validate(row).model_dump(), request_id)


@app.get("/api/v1/publishes")
def list_publishes(
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin", "agent_operator")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_publishes(db, current)
    return ok([schemas.PublishOut.model_validate(x).model_dump() for x in rows], request_id)


@app.post("/api/v1/publishes/{publish_id}/transition")
def transition_publish(
    publish_id: int,
    payload: schemas.PublishTransitionIn,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    pub = crud.get_publish_or_404(db, current, publish_id)
    updated = crud.transition_publish(db, current, pub, payload.to_status, request_id)
    return ok(schemas.PublishOut.model_validate(updated).model_dump(), request_id)


@app.get("/api/v1/modules")
def list_modules(
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin", "agent_operator")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_modules(db, current)
    return ok([schemas.ModuleOut.model_validate(x).model_dump() for x in rows], request_id)


@app.post("/api/v1/modules")
def create_module(
    payload: schemas.ModuleCreate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.create_module(db, current, payload, request_id)
    return ok(schemas.ModuleOut.model_validate(row).model_dump(), request_id)


@app.put("/api/v1/modules/{module_id}")
def update_module(
    module_id: int,
    payload: schemas.ModuleUpdate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.get_module_or_404(db, current, module_id)
    updated = crud.update_module(db, current, row, payload, request_id)
    return ok(schemas.ModuleOut.model_validate(updated).model_dump(), request_id)


@app.delete("/api/v1/modules/{module_id}")
def delete_module(
    module_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.get_module_or_404(db, current, module_id)
    crud.delete_module(db, current, row, request_id)
    return ok({"deleted": True}, request_id)


@app.get("/api/v1/module-assignments")
def list_module_assignments(
    scope: str | None = Query(None, description="tenant|agent|group"),
    agent_id: int | None = Query(None),
    group_id: int | None = Query(None),
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_module_assignments(db, current, scope_type=scope, agent_id=agent_id, group_id=group_id)
    out = []
    for r in rows:
        scope_type = "group" if r.group_id is not None else ("agent" if r.agent_id is not None else "tenant")
        out.append(
            schemas.ModuleAssignmentOut(
                id=r.id,
                tenant_id=r.tenant_id,
                scope_type=scope_type,
                agent_id=r.agent_id,
                group_id=r.group_id,
                module_id=r.module_id,
                priority=r.priority,
                enabled=r.enabled,
                module_param=r.module_param,
                created_at=r.created_at,
                updated_at=r.updated_at,
            ).model_dump()
        )
    return ok(out, request_id)


@app.post("/api/v1/module-assignments")
def create_module_assignment(
    payload: schemas.ModuleAssignmentCreate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.create_module_assignment(db, current, payload, request_id)
    scope_type = "group" if row.group_id is not None else ("agent" if row.agent_id is not None else "tenant")
    return ok(
        schemas.ModuleAssignmentOut(
            id=row.id,
            tenant_id=row.tenant_id,
            scope_type=scope_type,
            agent_id=row.agent_id,
            group_id=row.group_id,
            module_id=row.module_id,
            priority=row.priority,
            enabled=row.enabled,
            module_param=row.module_param,
            created_at=row.created_at,
            updated_at=row.updated_at,
        ).model_dump(),
        request_id,
    )


@app.put("/api/v1/module-assignments/{assignment_id}")
def update_module_assignment(
    assignment_id: int,
    payload: schemas.ModuleAssignmentUpdate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.get_module_assignment_or_404(db, current, assignment_id)
    updated = crud.update_module_assignment(db, current, row, payload, request_id)
    scope_type = "group" if updated.group_id is not None else ("agent" if updated.agent_id is not None else "tenant")
    return ok(
        schemas.ModuleAssignmentOut(
            id=updated.id,
            tenant_id=updated.tenant_id,
            scope_type=scope_type,
            agent_id=updated.agent_id,
            group_id=updated.group_id,
            module_id=updated.module_id,
            priority=updated.priority,
            enabled=updated.enabled,
            module_param=updated.module_param,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        ).model_dump(),
        request_id,
    )


@app.delete("/api/v1/module-assignments/{assignment_id}")
def delete_module_assignment(
    assignment_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.get_module_assignment_or_404(db, current, assignment_id)
    crud.delete_module_assignment(db, current, row, request_id)
    return ok({"deleted": True}, request_id)


@app.get("/api/v1/module-exclusions")
def list_module_exclusions(
    agent_id: int | None = Query(None),
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_module_exclusions(db, current, agent_id=agent_id)
    out = [
        schemas.ModuleExclusionOut(
            id=r.id,
            tenant_id=r.tenant_id,
            agent_id=r.agent_id,
            exclude_type=r.exclude_type,
            value=r.value,
            enabled=r.enabled,
            remark=r.remark,
            created_at=r.created_at,
            updated_at=r.updated_at,
        ).model_dump()
        for r in rows
    ]
    return ok(out, request_id)


@app.post("/api/v1/module-exclusions")
def create_module_exclusion(
    payload: schemas.ModuleExclusionCreate,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.create_module_exclusion(db, current, payload, request_id)
    return ok(
        schemas.ModuleExclusionOut(
            id=row.id,
            tenant_id=row.tenant_id,
            agent_id=row.agent_id,
            exclude_type=row.exclude_type,
            value=row.value,
            enabled=row.enabled,
            remark=row.remark,
            created_at=row.created_at,
            updated_at=row.updated_at,
        ).model_dump(),
        request_id,
    )


@app.delete("/api/v1/module-exclusions/{exclusion_id}")
def delete_module_exclusion(
    exclusion_id: int,
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    row = crud.get_module_exclusion_or_404(db, current, exclusion_id)
    crud.delete_module_exclusion(db, current, row, request_id)
    return ok({"deleted": True}, request_id)


@app.get("/api/v1/clients")
def list_clients(
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin", "agent_operator")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_clients(db, current)
    return ok([schemas.ClientOut.model_validate(x).model_dump() for x in rows], request_id)


@app.post("/api/v1/client/register")
def client_register(x_request_id: str | None = Header(default=None, alias="X-Request-Id")):
    request_id = request_id_or_new(x_request_id)
    token = f"ct-{uuid.uuid4().hex}"
    return ok({"client_token": token}, request_id)


@app.get("/api/v1/client/config")
def client_config(
    device_uuid: str | None = Query(None, description="设备 UUID（推荐）"),
    device_id: str | None = Query(None, description="兼容旧参数；可为 UUID 字符串或数字主键"),
    publish_code: str | None = Query(None),
    publish_version: str = Query("v1", description="兼容占位；pb-* 视为 publish_code"),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    ident = (device_uuid or device_id or "").strip()
    if not ident:
        raise HTTPException(status_code=422, detail="必须提供 device_uuid 或 device_id")
    device = None
    tenant_id = 1
    device = db.query(models.ClientDevice).filter(models.ClientDevice.device_uuid == ident).first()
    if not device and ident.isdigit():
        device = db.query(models.ClientDevice).filter(models.ClientDevice.id == int(ident)).first()
    if device:
        tenant_id = device.tenant_id
    resolved = crud.build_client_rules_package(
        db,
        tenant_id=tenant_id,
        device=device,
        publish_code=publish_code,
        publish_version_legacy=publish_version,
    )
    rows = resolved["rules"]
    rule_hash = crud.compute_rules_payload_hash(rows)
    module_hash = crud.compute_module_index_hash(db, tenant_id)
    out_uuid = device.device_uuid if device else ident
    return ok(
        {
            "device_uuid": out_uuid,
            "device_db_id": device.id if device else None,
            "publish_version": resolved["publish_label"],
            "publish_id": resolved["publish_id"],
            "package_source": resolved["package_source"],
            "rule_hash": rule_hash,
            "module_version": module_hash,
            "module_index_version": module_hash,  # legacy alias
        },
        request_id,
    )


@app.get("/api/v1/client/rules/package")
def client_rules_package(
    publish_version: str = "v1",
    device_uuid: str | None = None,
    device_id: str | None = None,
    publish_code: str | None = None,
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    """
    客户端规则包：按有效发布（published/rolling_out + 目标范围/灰度）或分组绑定生成；否则租户内可见规则降级。
    无 device_uuid 时 tenant 固定为 1；publish_code（或 publish_version 形如 pb-*）用于指定发布代号。
    """
    request_id = request_id_or_new(x_request_id)
    device = None
    tenant_id = 1
    ident = (device_uuid or device_id or "").strip()
    if ident:
        device = db.query(models.ClientDevice).filter(models.ClientDevice.device_uuid == ident).first()
        if not device and ident.isdigit():
            device = db.query(models.ClientDevice).filter(models.ClientDevice.id == int(ident)).first()
        if device:
            tenant_id = device.tenant_id
    resolved = crud.build_client_rules_package(
        db,
        tenant_id=tenant_id,
        device=device,
        publish_code=publish_code,
        publish_version_legacy=publish_version,
    )
    rows = resolved["rules"]
    pkg_hash = crud.compute_rules_payload_hash(rows)
    return ok(
        {
            "publish_version": resolved["publish_label"],
            "publish_id": resolved["publish_id"],
            "package_source": resolved["package_source"],
            "rules": [schemas.RuleOut.model_validate(x).model_dump() for x in rows],
            "hash": pkg_hash,
            "signature": "",
        },
        request_id,
    )


@app.get("/api/v1/client/modules/index")
def client_modules_index(publish_version: str = "v1", db: Session = Depends(get_db), x_request_id: str | None = Header(default=None, alias="X-Request-Id")):
    request_id = request_id_or_new(x_request_id)
    rows = db.query(models.ModuleMain).filter(models.ModuleMain.enabled == True).order_by(models.ModuleMain.display_order.asc()).all()  # noqa: E712
    return ok(
        {
            "publish_version": publish_version,
            "modules": [schemas.ModuleOut.model_validate(x).model_dump() for x in rows],
            "hash": "unsigned-dev-index",
            "signature": "",
        },
        request_id,
    )


@app.post("/api/v1/client/heartbeat")
def client_heartbeat(payload: schemas.HeartbeatIn, db: Session = Depends(get_db), x_request_id: str | None = Header(default=None, alias="X-Request-Id")):
    request_id = request_id_or_new(x_request_id)
    device = crud.record_heartbeat(db, payload)
    return ok({"device_id": device.id, "status": device.status}, request_id)


@app.get("/api/v1/audits")
def list_audits(
    current: CurrentUser = Depends(require_roles("super_admin", "tenant_admin", "agent_admin")),
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    request_id = request_id_or_new(x_request_id)
    rows = crud.list_audits(db, current)
    return ok([schemas.AuditOut.model_validate(x).model_dump() for x in rows], request_id)

