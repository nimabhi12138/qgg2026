# 02. 后端 API 契约与权限策略

## 1. API 设计原则

- 基础路径：`/api/v1`
- 鉴权方式：`Bearer JWT`（管理端/用户端）+ `ClientToken`（客户端）
- 请求追踪：`X-Request-Id` 必传
- 幂等写操作：支持 `Idempotency-Key`
- 统一响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "request_id": "..."
}
```

## 2. 角色与权限

### 2.1 角色定义

- `super_admin`：平台管理员
- `tenant_admin`：租户管理员
- `agent_admin`：代理主账号
- `agent_operator`：代理子账号（受限）
- `client_device`：客户端设备身份

### 2.2 权限矩阵（核心）

- 规则管理：`super_admin/tenant_admin/agent_admin`
- 共享规则：`super_admin/tenant_admin/agent_admin`（仅能共享自己租户内资源）
- 分组策略：`tenant_admin/agent_admin`
- 模块管理：`super_admin/tenant_admin`（代理只分配/启用）
- 发布与回滚：`super_admin/tenant_admin`
- 客户端拉取：`client_device`
- 审计查看：`super_admin/tenant_admin`

## 3. 管理端 API

### 3.1 认证

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### 3.2 规则

- `GET /rules`
- `GET /rules/{rule_id}`
- `POST /rules`
- `PUT /rules/{rule_id}`
- `DELETE /rules/{rule_id}`
- `POST /rules/{rule_id}/share`
- `POST /rules/{rule_id}/copy`
- `POST /rules/publish`
- `POST /rules/publish/{publish_id}/rollback`

### 3.3 分组

- `GET /groups`
- `POST /groups`
- `PUT /groups/{group_id}`
- `DELETE /groups/{group_id}`
- `POST /groups/{group_id}/rules:bind`
- `POST /groups/{group_id}/ips:bind`
- `PUT /groups/{group_id}/policy`

### 3.4 模块

- `GET /modules`
- `POST /modules`
- `PUT /modules/{module_id}`
- `DELETE /modules/{module_id}`
- `POST /agents/{agent_id}/modules:assign`
- `POST /groups/{group_id}/modules:assign`

### 3.5 客户端资产

- `GET /clients`
- `GET /clients/{device_id}`
- `POST /clients/{device_id}/commands`
- `GET /clients/{device_id}/states`

### 3.6 审计与事件

- `GET /audits`
- `GET /events`
- `GET /publishes`
- `GET /publishes/{publish_id}`

## 4. 用户端 API（代理/网维操作台）

- `GET /portal/me`
- `GET /portal/rules`
- `POST /portal/rules`
- `PUT /portal/rules/{rule_id}`
- `GET /portal/groups`
- `PUT /portal/groups/{group_id}/policy`
- `GET /portal/clients`
- `GET /portal/stats/online`
- `GET /portal/stats/rule-apply`

说明：用户端调用同一服务，但强制 `agent_id` 数据域隔离。

## 5. 客户端 API（设备）

### 5.1 注册与鉴权

- `POST /client/register`
- `POST /client/token/refresh`

### 5.2 拉取配置

- `GET /client/config?device_id=...`
  - 返回：规则发布版本、分组策略、模块索引、签名摘要

### 5.3 拉取规则包

- `GET /client/rules/package?publish_version=...`
  - 返回：规则 JSON 包 + 签名 + hash

### 5.4 拉取模块清单

- `GET /client/modules/index?publish_version=...`

### 5.5 状态上报

- `POST /client/heartbeat`
- `POST /client/rules/state`
- `POST /client/modules/state`
- `POST /client/events`

## 6. 请求体约束（关键）

### 6.1 新增规则 `POST /rules`

必填：

- `name`, `enable_ad`

规则字段（允许空串）：

- `pe_json`, `dir_json`, `md5_json`, `reg_json`, `md5_reg_json`
- `ip_json`, `ctrl_wnd_json`, `anti_thread_json`, `thread_control_json`

校验：

- 名称 2~40 字符
- 每个规则字段长度 <= 10000
- 若非空，必须是合法 JSON
- 至少一个规则字段非空

### 6.2 发布 `POST /rules/publish`

- `publish_type`: `gray | full`
- `target_scope`: `agent | group | device | all`
- `target_ids`: `[]`
- `rule_ids`: `[]`
- `rollback_of`: nullable

## 7. 错误码建议

- `1001` 参数错误
- `1002` 未授权
- `1003` 权限不足
- `1004` 资源不存在
- `1005` 幂等冲突
- `1006` 版本冲突
- `2001` 规则校验失败
- `2002` 发布状态非法
- `3001` 客户端签名校验失败
- `3002` 客户端版本不兼容

## 8. 安全策略

- JWT 15 分钟有效 + Refresh Token 7 天
- 客户端令牌绑定 `device_uuid + mac_hash`
- 所有写接口记录审计
- 规则/模块包下载必须返回签名与哈希
