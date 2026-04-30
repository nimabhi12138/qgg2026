# QGG 复刻项目（2026-04-23）

本仓库用于复刻“网吧去广告”系统，目标为 full_plus + 多区域高可用。

技术栈：

- 客户端：C++（Windows）
- 后端：Python（FastAPI + SQLAlchemy）
- 前端：Vue3（管理端 + 用户端）

## 当前落地内容

### 后端

- FastAPI 核心服务骨架：`backend/app/main.py`
- 数据模型：`backend/app/models.py`
- 鉴权与 RBAC：`backend/app/security.py` + `backend/app/deps.py`
- 业务 CRUD：`backend/app/crud.py`
- 初始化种子：`backend/app/seed.py`
- OpenAPI 草案：`backend/openapi/openapi.yaml`
- SQL 基线：`backend/sql/001_init_schema.sql`
- 测试样例：`backend/tests/test_api.py`

### 前端

- 管理端骨架：`frontend/admin-web`
- 用户端骨架：`frontend/portal-web`

### 客户端

- C++ 工程骨架：`client-cpp`
- 关键模块：`runtime_core/config_agent/rule_engine/module_manager/security_verifier`

## 文档目录

- `docs/01-后端领域模型与数据库设计.md`
- `docs/02-后端API契约与权限策略.md`
- `docs/03-Vue3后台信息架构与权限矩阵.md`
- `docs/04-C++客户端分层架构设计.md`
- `docs/05-签名灰度回滚多区域方案.md`

## 本地运行（准备好运行时后）

### 后端

1. 安装依赖：`python -m pip install -r backend/requirements.txt`
2. 初始化数据：`python -m app.seed`（在 `backend` 目录）
3. 启动服务：`uvicorn app.main:app --reload --port 8000`
4. 运行测试：`pytest`

默认测试账号：

- `admin / admin123`（super_admin）
- `agent1 / agent123`（agent_admin）
- `17629075264 / 17629075264`（agent_admin，本地复刻账号）

### 前端

管理端：

- `cd frontend/admin-web`
- `npm install`
- `npm run dev`

用户端：

- `cd frontend/portal-web`
- `npm install`
- `npm run dev`

### C++ 客户端

- `cd client-cpp`
- `cmake -S . -B build`
- `cmake --build build`
