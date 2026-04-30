from fastapi.testclient import TestClient

from app.main import app
from app.seed import run_seed

client = TestClient(app)


def _headers(token: str | None = None):
    base = {"X-Request-Id": "test-req-001"}
    if token:
        base["Authorization"] = f"Bearer {token}"
    return base


def _login(username: str, password: str) -> str:
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
        headers=_headers(),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    return body["data"]["access_token"]


def test_health():
    run_seed()
    resp = client.get("/api/v1/health", headers=_headers())
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "up"


def test_auth_and_rule_crud():
    run_seed()
    token = _login("admin", "admin123")

    payload = {
        "name": "rule_test_01",
        "enable_ad": True,
        "is_share": False,
        "is_hide": False,
        "run_possibility": 100,
        "remark": "pytest",
        "dir_json": '{"*":{"\\\\\\\\a.dll":["noCreate"]}}',
        "reg_json": "",
        "ip_json": "",
        "ctrl_wnd_json": "",
        "anti_thread_json": "",
        "thread_control_json": "",
        "pe_json": "",
        "md5_json": "",
        "md5_reg_json": "",
    }
    create_resp = client.post("/api/v1/rules", json=payload, headers=_headers(token))
    assert create_resp.status_code == 200
    create_body = create_resp.json()
    assert create_body["code"] == 0
    rule_id = create_body["data"]["id"]

    list_resp = client.get("/api/v1/rules", headers=_headers(token))
    assert list_resp.status_code == 200
    assert list_resp.json()["code"] == 0
    assert any(item["id"] == rule_id for item in list_resp.json()["data"])

    update_payload = payload | {"name": "rule_test_01_u", "remark": "updated"}
    update_resp = client.put(f"/api/v1/rules/{rule_id}", json=update_payload, headers=_headers(token))
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["name"] == "rule_test_01_u"

    delete_resp = client.delete(f"/api/v1/rules/{rule_id}", headers=_headers(token))
    assert delete_resp.status_code == 200
    assert delete_resp.json()["data"]["deleted"] is True


def test_group_and_publish():
    run_seed()
    admin_token = _login("admin", "admin123")

    group_resp = client.post(
        "/api/v1/groups",
        json={"group_name": "pytest_group", "is_default": False, "boot_bat": "", "remark": "r"},
        headers=_headers(admin_token),
    )
    assert group_resp.status_code == 200
    assert group_resp.json()["code"] == 0

    publish_resp = client.post(
        "/api/v1/rules/publish",
        json={
            "publish_type": "gray",
            "target_scope": "group",
            "target_ids": [1],
            "rule_ids": [1],
            "rollback_of": None,
        },
        headers=_headers(admin_token),
    )
    assert publish_resp.status_code == 200
    assert publish_resp.json()["code"] == 0
    assert publish_resp.json()["data"]["publish_type"] == "gray"
    assert publish_resp.json()["data"]["status"] == "draft"

    pub_id = publish_resp.json()["data"]["id"]
    tr = client.post(
        f"/api/v1/publishes/{pub_id}/transition",
        json={"to_status": "published"},
        headers=_headers(admin_token),
    )
    assert tr.status_code == 200
    assert tr.json()["data"]["status"] == "published"


def test_client_rules_package_respects_publish():
    run_seed()
    admin_token = _login("admin", "admin123")
    pkg_before = client.get("/api/v1/client/rules/package?device_uuid=dev-001", headers=_headers())
    assert pkg_before.status_code == 200
    assert pkg_before.json()["data"]["package_source"] == "tenant_fallback"

    publish_resp = client.post(
        "/api/v1/rules/publish",
        json={
            "publish_type": "gray",
            "target_scope": "group",
            "target_ids": [1],
            "rule_ids": [1],
            "rollback_of": None,
        },
        headers=_headers(admin_token),
    )
    assert publish_resp.status_code == 200
    pub_body = publish_resp.json()["data"]
    pub_id = pub_body["id"]
    pcode = pub_body["publish_code"]

    still_draft = client.get("/api/v1/client/rules/package?device_uuid=dev-001", headers=_headers())
    assert still_draft.json()["data"]["package_source"] == "tenant_fallback"

    client.post(
        f"/api/v1/publishes/{pub_id}/transition",
        json={"to_status": "rolling_out"},
        headers=_headers(admin_token),
    )
    rollout_pkg = client.get(f"/api/v1/client/rules/package?device_uuid=dev-001&publish_code={pcode}", headers=_headers())
    assert rollout_pkg.json()["data"]["package_source"] == "publish"
    assert len(rollout_pkg.json()["data"]["rules"]) == 1
    assert rollout_pkg.json()["data"]["rules"][0]["id"] == 1


def test_group_rule_binding_and_package():
    run_seed()
    admin_token = _login("admin", "admin123")

    bind = client.post(
        "/api/v1/groups/1/rules",
        json={"rule_id": 1, "priority": 10, "enabled": True},
        headers=_headers(admin_token),
    )
    assert bind.status_code == 200
    assert bind.json()["code"] == 0

    listed = client.get("/api/v1/groups/1/rules", headers=_headers(admin_token))
    assert listed.status_code == 200
    assert any(x["rule_id"] == 1 for x in listed.json()["data"])

    pkg = client.get("/api/v1/client/rules/package?device_uuid=dev-001", headers=_headers())
    assert pkg.json()["data"]["package_source"] == "group_binding"
    assert len(pkg.json()["data"]["rules"]) >= 1

    del_resp = client.delete("/api/v1/groups/1/rules/1", headers=_headers(admin_token))
    assert del_resp.status_code == 200


def test_publish_illegal_transition():
    run_seed()
    admin_token = _login("admin", "admin123")
    publish_resp = client.post(
        "/api/v1/rules/publish",
        json={
            "publish_type": "full",
            "target_scope": "all",
            "target_ids": [],
            "rule_ids": [1],
            "rollback_of": None,
        },
        headers=_headers(admin_token),
    )
    pub_id = publish_resp.json()["data"]["id"]
    client.post(
        f"/api/v1/publishes/{pub_id}/transition",
        json={"to_status": "published"},
        headers=_headers(admin_token),
    )
    bad = client.post(
        f"/api/v1/publishes/{pub_id}/transition",
        json={"to_status": "rolling_out"},
        headers=_headers(admin_token),
    )
    assert bad.status_code == 400


def test_agent_can_list_clients():
    run_seed()
    token = _login("agent1", "agent123")
    resp = client.get("/api/v1/clients", headers=_headers(token))
    assert resp.status_code == 200
    assert resp.json()["code"] == 0
    assert isinstance(resp.json()["data"], list)


def test_replica_account_and_dashboard():
    run_seed()
    token = _login("17629075264", "17629075264")
    resp = client.get("/api/v1/dashboard", headers=_headers(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["data"]["client_count"] >= 1


def test_client_config_matches_package_hash():
    run_seed()
    cfg = client.get("/api/v1/client/config?device_uuid=dev-001", headers=_headers())
    assert cfg.status_code == 200
    assert cfg.json()["code"] == 0
    pkg = client.get("/api/v1/client/rules/package?device_uuid=dev-001", headers=_headers())
    assert pkg.status_code == 200
    assert pkg.json()["code"] == 0
    assert cfg.json()["data"]["rule_hash"] == pkg.json()["data"]["hash"]
    assert cfg.json()["data"]["publish_version"] == pkg.json()["data"]["publish_version"]
    assert cfg.json()["data"]["module_version"] == cfg.json()["data"]["module_index_version"]


def test_invalid_token_returns_401():
    resp = client.get("/api/v1/rules", headers=_headers("bad-token"))
    assert resp.status_code == 401


def test_modules_and_client_heartbeat():
    run_seed()
    token = _login("admin", "admin123")

    modules_resp = client.get("/api/v1/modules", headers=_headers(token))
    assert modules_resp.status_code == 200
    assert modules_resp.json()["code"] == 0

    heartbeat_resp = client.post(
        "/api/v1/client/heartbeat",
        json={"device_uuid": "dev-001", "cpu_usage": "12.5", "mem_usage": "36.1", "ping_ms": 18, "ext": {"source": "pytest"}},
        headers=_headers(),
    )
    assert heartbeat_resp.status_code == 200
    assert heartbeat_resp.json()["code"] == 0

    index_resp = client.get("/api/v1/client/modules/index?publish_version=v1", headers=_headers())
    assert index_resp.status_code == 200
    assert "modules" in index_resp.json()["data"]


def test_agent_policy_and_rule_copy_backup_restore():
    run_seed()
    token = _login("agent1", "agent123")

    up = client.put(
        "/api/v1/agents/1001/policy",
        json={"lock_homepage": True, "homepage_url": "https://example.com", "fast_shutdown": True},
        headers=_headers(token),
    )
    assert up.status_code == 200
    assert up.json()["code"] == 0
    assert up.json()["data"]["agent_id"] == 1001
    assert up.json()["data"]["lock_homepage"] is True

    got = client.get("/api/v1/agents/1001/policy", headers=_headers(token))
    assert got.status_code == 200
    assert got.json()["code"] == 0
    assert got.json()["data"]["homepage_url"] == "https://example.com"

    payload = {
        "name": "rule_copy_src",
        "enable_ad": True,
        "is_share": True,
        "is_hide": False,
        "run_possibility": 100,
        "remark": "src",
        "dir_json": "{}",
        "reg_json": "",
        "ip_json": "",
        "ctrl_wnd_json": "",
        "anti_thread_json": "",
        "thread_control_json": "",
        "pe_json": "",
        "md5_json": "",
        "md5_reg_json": "",
    }
    created = client.post("/api/v1/rules", json=payload, headers=_headers(token))
    assert created.status_code == 200
    rid = created.json()["data"]["id"]

    copied = client.post(f"/api/v1/rules/{rid}/copy", json={"name": "rule_copy_dst"}, headers=_headers(token))
    assert copied.status_code == 200
    assert copied.json()["code"] == 0
    assert copied.json()["data"]["id"] != rid
    assert copied.json()["data"]["name"] == "rule_copy_dst"

    bk = client.post(f"/api/v1/rules/{rid}/backups", json={"backup_desc": "b1"}, headers=_headers(token))
    assert bk.status_code == 200
    assert bk.json()["code"] == 0
    backup_id = bk.json()["data"]["id"]

    listed = client.get(f"/api/v1/rules/{rid}/backups", headers=_headers(token))
    assert listed.status_code == 200
    assert any(x["id"] == backup_id for x in listed.json()["data"])

    updated = client.put(f"/api/v1/rules/{rid}", json=payload | {"name": "rule_copy_src_u", "remark": "u"}, headers=_headers(token))
    assert updated.status_code == 200
    assert updated.json()["data"]["name"] == "rule_copy_src_u"

    restored = client.post(f"/api/v1/rules/{rid}/backups/{backup_id}/restore", headers=_headers(token))
    assert restored.status_code == 200
    assert restored.json()["code"] == 0
    assert restored.json()["data"]["name"] == "rule_copy_src"
    assert restored.json()["data"]["remark"] == "src"

    deleted = client.delete("/api/v1/agents/1001/policy", headers=_headers(token))
    assert deleted.status_code == 200
    assert deleted.json()["data"]["deleted"] is True

    got2 = client.get("/api/v1/agents/1001/policy", headers=_headers(token))
    assert got2.status_code == 200
    assert got2.json()["data"] is None

