# 目标系统业务对象/API 反推整理（基于已提取前端脚本）与本地 qgg20260423 差距清单

生成时间：2026-04-30  
工作区：`C:\Users\Administrator\Desktop\quguanggao`

本文件的“目标系统”指提取到的传统管理后台前端脚本（jQuery/EasyUI）所对应的后端接口形态与数据模型；主要来源：

- `C:\Users\Administrator\Desktop\quguanggao\agent_mng.js`
- `C:\Users\Administrator\Desktop\quguanggao\client_mng.js`
- `C:\Users\Administrator\Desktop\quguanggao\module_mng.js`
- `C:\Users\Administrator\Desktop\quguanggao\rule_mng.js`
- `C:\Users\Administrator\Desktop\quguanggao\client_group_ip_mng.js`
- `C:\Users\Administrator\Desktop\quguanggao\client_group_policy_mng.js`
- `C:\Users\Administrator\Desktop\quguanggao\main.html.js`
- 抓到的样例响应：`agent_get_all.json / client_get_all.json / client_group_ip_get_all.json / client_group_policy_get_all.json / rule_get_all_rule_after_copy.json / my_rule_decoded.json / decoded_rules.json / decoded_modules.json`

本文件的“本地系统”指 `C:\Users\Administrator\Desktop\quguanggao\qgg20260423`（FastAPI + Vue/Element Plus）当前实现。

---

## 1. 目标系统接口与编码约定（非常关键）

### 1.1 通用响应封装

目标系统大量接口返回形如：

```json
{ "bResult": true, "szMsg": "...", "szData": ... }
```

并且前端会先调用 `RemoveDebugInfoInJsonResult()`，在响应前面可能夹带了日志/SQL 等文本（会截取到第一个 `{"bResult":...}` 开始）。见：

- `C:\Users\Administrator\Desktop\quguanggao\Util.js`

### 1.2 字段值的“十六进制字符串编码”

目标系统里 `szMsg`、以及 `szData` 中的绝大多数字段值，都是“文本 -> UTF8 -> hex string”的编码形式。

前端用：

- `MyJsonDecode(str)` = `Utf8to16(HexToString(str))`

来解码显示。

含义：如果本地要“直接兼容运行这些旧前端脚本”，需要在后端输出同款封装 + 同款 hex 编码；否则（推荐）本地前端走 `/api/v1` 的现代 JSON schema，不要直接复用旧脚本。

---

## 2. 目标系统实际业务对象（从前端使用字段反推）

下面列的是“前端真正用到/展示/提交”的字段集合（不保证穷尽 DB 全字段，但足够支撑 UI 行为）。

### 2.1 Agent（代理商/账号）

来源：`agent_mng.js` + `agent_get_all.json`

核心字段（样例里出现/前端读取）：

- `Id`（内部主键）、`AgentID`（业务 ID）
- `ParentAgentID`、`PopAgentID`（层级/推广关联）
- `AgentName`、`UserName`、`UserPwd`、`sub_password`
- `AgentLevel`
- `qq`、`alipay_acct_name`、`alipay_acct`、`kaihuhang_*`、`identity_number`、`phone`
- `is_banned`（封禁/禁用状态）
- `register_time`
- 统计类：`AgentClientCount`、`InternetBarCount`、`client_count`、`YestBef_client_count`、`ClientDataCount`
- 模块统计类（计数）：`ModuleCount_feedback*`（见样例）

典型状态：

- `is_banned`：0/1（前端支持“切换禁用状态”）
- 密码/二级密码：可修改

### 2.2 Client（客户端终端）

来源：`client_mng.js` + `client_get_all.json`

核心字段：

- `Id`
- `AgentID`、`AgentName`
- `PublicIP`、`InternetBarName`
- `LocalMac`、`PcName`
- `FirstLogin`、`LoginDate`
- `OsVersion`、`ClientVersion`
- 硬件/上报：`cpu_temperature`、`video_card_temperature`、`hw_info_update_time`
- 分组：`client_group_id`、`client_group_name`
- 列表额外显示：`client_online_count`（只在部分权限下展示）

典型动作/状态：

- 批量选择、批量删除（`client_id_list` 用 `_` 拼接）
- 修改 IP 对应网吧名（按 `PublicIP` 写）
- 查看日志（按 agent_name+mac 获取日志 URL）
- 下发远程连接（AgentID+mac）

### 2.3 Rule / AdRule（规则）

来源：`rule_mng.js` + `my_rule_decoded.json`（强烈建议以该解码样例为准）

核心字段：

- `Id`
- `AgentID`
- `OrgnShareAgentID`（来源代理：共享/复制链）
- `AdName`（规则名）
- 开关：`EnableAd`、`IsShare`、`is_hide`
- `run_possibility`（0-100，低于 100 会在 UI 红字提示）
- `Remark`
- `RuleUsedCount`
- `LastModify`

规则内容字段（多类别混合）：

- `PE`
- `DIR`
- `MD5`
- `REG`
- `MD5_REG`
- `IP`
- `CtrlWnd`
- `AntiThread`
- `Process`
- `ThreadControl`

备份/恢复相关字段（UI 会展示并操作）：

- `bk_from_adrule_id`（非 0 表示备份/派生）
- `bk_desc`（备份描述）
- `bk_id_list`、`bk_desc_list`（聚合展示）

典型状态机（由 UI 操作组合出来）：

- 普通规则：创建/修改 -> 启用/禁用 -> 可见/隐藏
- 共享：`IsShare=1` 后可被“分享给其他 Agent”（多种分享方式）
- 复制：从共享规则复制到目标（`copy_rule`），之后可“一键更新所有从此规则复制出来的规则”
- 备份：存在“恢复备份/删除备份”的动作（`restore_rule`、对备份 ID 的 delete）

### 2.4 Module（模块/插件）

来源：`module_mng.js` + `client_group_policy_get_all.json` + `decoded_modules.json`

核心字段（UI 列表会展示/编辑）：

- `Id`
- `AgentID`、`AgentName`
- `module_type`
- `module_name`、`module_display_name`
- `module_dll_file_path`（URL/多 URL 分号分隔）
- `md5`
- `enabled`
- `visible`
- `display_order`
- `downloaded_count`
- 运行策略：`run_possibility`、`run_time_segment`、`run_type`
- 可见性策略：`agent_visible`
- 关联规则：`relational_rule_id` + UI 展示 `AdName`
- `remark`
- `add_time`、`last_update_time`
- 分成/权重类：`percent_*`（目标系统里出现了很多导航位 percent 字段）
- `is_test`

典型动作/状态：

- 模块 CRUD
- 清空 MD5（`module_clear_md5`）
- 分配到所有代理 / 从所有代理取消
- 分配到指定代理列表 / 从指定代理列表取消
- 查询“已分配代理列表”、查询“未分配代理列表”

### 2.5 ClientGroup（网吧分组）与 IP/规则分配（client_group_ip_mng）

来源：`client_group_ip_mng.js` + `client_group_ip_get_all.json`

对象与字段（按 `get_all_client_group_ip` 的 `szData` 结构）：

- `tAllClientGroup`：`Id / AgentID / client_group_name / remark / add_time / boot_bat`
- `tAllClientGroupIp`：`client_group_id / client_ip_list`
- `tAllClientGroupAdRule`：`client_group_id / adrule_list / adrule_id_list`
- `tAllClientIp`：`PublicIP / InternetBarName / AgentID`
- `tAllAgentInfo`：`AgentID / AgentName`

典型规则：

- `default_client_group` 不能删除、不能修改（前端显式拦截）
- `boot_bat` 最大 8000 字符；部分场景会要求短信验证码（前端判断可见性）

### 2.6 ClientGroupPolicy（分组模块配置 + 代理全局模块配置）

来源：`client_group_policy_mng.js` + `client_group_policy_get_all.json`

核心对象（按 `get_all_client_group_policy` 的 `szData` 结构）：

- `tAllAgentModule`：每行对应一个（AgentID, ClientGroupId）的“模块配置快照”
  - 分组模块：`m_id_list / m_d_name_list`
  - 全局模块：`m_id_list_GM / m_d_name_list_GM`
  - 全局模块参数：`m_d_param_list_GM`
  - 全局排除/包含：`m_d_excl_mac_GM`（路由 MAC 列表）、`m_d_excl_ip_GM`（外网 IP 列表）
- `tAllModule`：模块主数据（见 2.4）
- `tAllOuterIpBarName`：外网 IP 到网吧名映射（供勾选 UI）

关键约束（前端强制校验）：

- 同一 Agent 下：“分组模块”与“全局模块”不能存在相同 module_id
- 某些模块存在互斥组合（脚本里硬编码：例如 `daidai` 与 `Nav9` 不可同时选中；以及“陪玩”类数量限制）

参数/排除列表的输入校验（前端正则）：

- `exclude_route_mac_list`：`^[0-9a-zA-Z;+]*$`（并存在 “+” 表示 include/排除模式切换 的逻辑）
- `exclude_outer_ip_list`：`^[0-9;\\.+]*$`（并存在同样的 include/排除切换逻辑）

---

## 3. 目标系统接口清单（从 $.ajax 调用点整理）

完整抽取结果见：

- `C:\Users\Administrator\Desktop\quguanggao\target_ajax_calls.json`
- `C:\Users\Administrator\Desktop\quguanggao\target_endpoints_grouped.json`
- `C:\Users\Administrator\Desktop\quguanggao\target_strOp_values.json`

这里列“业务上最关键”的接口（按管理域分组，保留原始路径形态）：

### 3.1 agent_mng / agent_module_mng

- `GET agent_mng/get_all_agent`（分页/排序/搜索/ModuleParam/AgentID_ToDisplay/is_display_client_count）
- `POST agent_mng/insert_agent`、`POST agent_mng/update_agent`
- `GET agent_mng/delete_agent/agent_id/{agent_id}`
- `POST agent_mng/change_password`、`POST agent_mng/change_sub_password`
- `GET agent_mng/switch_agent_is_banned?agent_id=...&is_banned=...`
- `GET agent_mng/switch_agent_feedback_module?agent_id=...&enable=...&module_name=...`
- `GET agent_mng/generate_client?type=...`
- `GET agent_mng/check_generate_client_progress?type=...`
- `GET agent_mng/get_recent_agent_client_count`（以及带 `AgentID_ToDisplay` 的变体）
- `GET agent_mng/get_agent_client_decrease?AgentClientDecrease_Rate=...`
- `GET nf_statt/get_idle_nf_account/`
- `GET/POST agent_module_mng/...`（见 module/策略域）

### 3.2 client_mng / client_upload / client_remote_control / debug_rule_mng

- `GET client_mng/get_all_client`（分页/排序/搜索/条件/AgentID_ToDisplay）
- `POST client_mng/insert_client`、`POST client_mng/update_client`
- `POST client_mng/delete_client`（`client_id_list` 下划线分隔）
- `POST client_mng/delete_client_3month_not_online`
- `POST client_mng/delete_bar_20client_5day`
- `GET client_mng/get_recent_statt`
- `POST client_mng/set_ip_internet_bar_name`（PublicIP + InternetBarName）
- `POST client_mng/restore_internet_bar_name`
- `GET client_upload/get_last_client_log_url/agent_name/{agent_name}/mac/{mac}`
- `POST client_remote_control/insert_client_remote_control`（AgentID + mac）
- `POST debug_rule_mng/generate_static_rule`（从输入 rule JSON 生成“静态规则”）

### 3.3 rule_mng

- `GET rule_mng/get_all_rule`（ModuleParam/AgentID_ToDisplay/rule_name）
- `POST rule_mng/insert_rule`、`POST rule_mng/update_rule`
- `GET rule_mng/delete_rule/AdRule_id/{id}`
- `GET rule_mng/update_rule_field/AdRule_id/{id}/f/{EnableAd|IsShare|is_hide}/v/{0|1}`
- `GET rule_mng/get_havenot_assigned_rule_count`
- `GET rule_mng/copy_rule/AdRule_id/{id}/assign_to/{assign_to}`
- `GET rule_mng/update_shared_rule`（前端以 serialize 提交，但 method 是 GET，属于目标系统的历史包袱）
- 分享/分配：
  - `GET rule_mng/share_rule_to_specified_agent/AdRule_id/{id}/agent_id_share_to/{agent_id}`
  - `POST rule_mng/share_rule_to_many__Agent`（AdRule_id + agent_id_share_to__list）
  - `POST rule_mng/share_rule_to_all__Agent`（AdRule_id）
  - `GET rule_mng/get_shared_rule_assigned_agent_list`（AdRule_id=...）
  - `GET rule_mng/get_shared_rule_assigned_agent_2_list`（AdRule_id=...）
  - `POST rule_mng/delete_share_rule_to_many__agent`（AdRule_id + agent_id_share_to__list）
- 备份/更新链：
  - `GET rule_mng/restore_rule/AdRule_id/{id}`
  - `POST/GET rule_mng/update_all_copyed_from_this_rule/AdRule_id/{id}`

### 3.4 module_mng / agent_module_mng

- `GET module_mng/get_all_module`（order/orderesc/ModuleParam/AgentID_ToDisplay）
- `POST module_mng/insert_module`、`POST module_mng/update_module`
- `GET module_mng/delete_module/module_id/{id}`
- `GET module_mng/module_clear_md5/module_id/{id}`
- `GET module_mng/get_module_assigned_agent_list?module_id=...`
- `GET module_mng/get_havnt_assign_module_agent/module_item_list/{...}`
- 分配（agent_module_mng）：
  - `GET agent_module_mng/assign_to_all_agent/module_id/{id}`
  - `GET agent_module_mng/unassign_to_all_agent/module_id/{id}`
  - `POST agent_module_mng/assign_to_agent_list`（module_id + agent_name_list）
  - `POST agent_module_mng/unassign_to_agent_list`（module_id + agent_name_list）
  - `GET agent_module_mng/assign_agent_module_single?agent_id=...&module_id=...`
  - `GET agent_module_mng/unassign_agent_module_single__Simple?agent_id=...&module_id=...`
  - `GET agent_module_mng/update_agent_module__single_wrapper/module_id/{id}`

### 3.5 client_group_ip_mng

- `GET client_group_ip_mng/get_all_client_group_ip`（分页/搜索/AgentID_ToDisplay）
- `POST client_group_ip_mng/insert_client_group`、`POST client_group_ip_mng/update_client_group`
- `GET client_group_ip_mng/delete_client_group/client_group_id/{id}`
- `POST client_group_ip_mng/insert_client_group_ip`、`POST client_group_ip_mng/update_client_group_ip`（client_ip_list 由复选框拼接 `_`）
- `POST client_group_ip_mng/insert_client_group_adrule`、`POST client_group_ip_mng/update_client_group_adrule`
- `POST client_group_ip_mng/update_client_group_boot_bat`
- `GET client_group_ip_mng/ensure_default_client_group`

### 3.6 client_group_policy_mng

- `GET client_group_policy_mng/SetHdiAgentConfig_ToAgentModuleParam`（随后刷新全量数据）
- `GET client_group_policy_mng/get_all_client_group_policy`
- `GET client_group_policy_mng/delete_client_group_module?client_group_id=...`
- `POST client_group_policy_mng/insert_client_group_module`、`POST client_group_policy_mng/update_client_group_module`
- `POST agent_module_mng/insert_agent_module`、`POST agent_module_mng/update_agent_module`（全局模块）
- `POST client_group_policy_mng/set_yy_icon_count`（模块参数：图标个数/开关类参数）
- `POST client_group_policy_mng/set_exclude_route_mac_list`
- `POST client_group_policy_mng/set_exclude_outer_ip_list`

### 3.7 main / server_log_mng

- `GET main/CheckSessionTimeout`
- `GET server_log_mng/get_perf_data`

---

## 4. 本地 qgg20260423 当前实现（用于对照）

### 4.1 后端（FastAPI）接口形态

以 `C:\Users\Administrator\Desktop\quguanggao\qgg20260423\backend\openapi\openapi.yaml` 为准（server base: `/api/v1`），当前主要有：

- `POST /auth/login`
- `GET /dashboard`
- `GET/POST/PUT/DELETE /rules`（CRUD）
- `GET/POST /groups`（CRUD 子集）
- `GET/POST/DELETE /groups/{group_id}/rules`（分组绑定规则）
- `GET/POST/PUT/DELETE /modules`（CRUD）
- `POST /rules/publish` + `GET /publishes` + `POST /publishes/{publish_id}/transition`（发布流水线：draft->rolling_out->published）
- `GET /clients`（只读列表）
- 客户端侧：
  - `POST /client/register`
  - `GET /client/config`
  - `GET /client/rules/package`
  - `GET /client/modules/index`
  - `POST /client/heartbeat`
- `GET /audits`

响应封装是 `{code,message,data,request_id}`，与目标系统 `{bResult,szMsg,szData}` 不兼容。

### 4.2 前端（Vue/Element Plus）页面

管理端：`C:\Users\Administrator\Desktop\quguanggao\qgg20260423\frontend\admin-web\src\App.vue`  
门户端：`C:\Users\Administrator\Desktop\quguanggao\qgg20260423\frontend\portal-web\src\App.vue`

目前页面主要覆盖：dashboard / rules / groups / modules / clients / publishes / audits（均为“轻量版”）。

---

## 5. 差距清单（目标系统 vs 本地 qgg20260423）

下面按“要对齐目标系统”这个假设，列出本地需要补齐的点。为了可执行，我把它拆成后端与前端两部分，并尽量对应到目标系统的对象与接口。

### 5.1 后端需要补齐（高优先级）

1. **Agent 体系**（目标系统的核心多租户/分级单位）
   - 缺：Agent 数据表与字段（含 Parent/Pop、禁用、统计字段等）
   - 缺：Agent CRUD、删代理、禁用切换、反馈模块开关
   - 缺：密码/二级密码修改 API 与权限模型（管理员 vs 代理商自己）

2. **“模块分配”与“分组模块策略”全域缺失**
   - 缺：agent_module_mng（全局模块分配、单代理分配、批量分配/取消、查询已分配/未分配）
   - 缺：client_group_policy_mng（分组模块配置、全局模块参数、排除/包含列表、互斥约束）
   - 缺：相关持久化表（AgentModule、ClientGroupModule、ModuleParam、ExcludeRouteMac、ExcludeOuterIp 等）

3. **ClientGroup 的 IP 维度映射缺失**
   - 本地有 `client_group`，但缺：`client_ip_list` -> group 的绑定模型与接口
   - 缺：group -> adrule 列表绑定（目标系统在 `tAllClientGroupAdRule` 里维护）
   - 缺：ensure_default_client_group 逻辑

4. **Client 管理动作缺失**
   - 缺：删除客户端（含批量）
   - 缺：清理类动作（3 个月不在线、网吧 20 台/5 天等规则化清理）
   - 缺：设置 IP 对应网吧名、恢复网吧名
   - 缺：客户端日志 URL 下发接口（client_upload/get_last_client_log_url）
   - 缺：远程控制下发任务（client_remote_control/insert_client_remote_control）

5. **Rule 的“共享/复制/备份链”缺失**
   - 本地有 `is_share/is_hide/enable_ad/run_possibility`，但缺：
     - share_to_specified / share_to_many / share_to_all
     - copy_rule（从共享库复制到目标）
     - update_shared_rule、update_all_copyed_from_this_rule
     - 备份字段与 restore/delete backup 的行为
   - 缺：`Process` 等规则类别字段（本地 schema 里没有）

6. **兼容层缺失（如果要直接跑旧前端脚本）**
   - 缺：`bResult/szMsg/szData` 响应封装
   - 缺：hex 编码/解码约定（MyJsonDecode 依赖）
   - 缺：旧路径路由（`rule_mng/...` 等）到 `/api/v1/...` 的适配

### 5.2 前端需要补齐（对齐目标系统 UI/流程）

1. 缺：代理商管理页（列表、搜索、层级、禁用、改密、生成客户端下载、统计图）
2. 缺：模块管理的“分配/取消分配”工作流（全体/指定列表/查看差集）
3. 缺：网吧分组管理（分组 CRUD、IP 绑定、分组规则绑定、boot_bat 配置）
4. 缺：模块分配策略页（全局模块 vs 分组模块、参数编辑、排除列表编辑、互斥校验提示）
5. 缺：客户端管理动作（批量删除/清理、设置网吧名、查看日志、下发远程连接、静态规则生成）
6. 缺：规则共享/复制链相关界面（共享库、分享给谁、复制到谁、更新链路、备份恢复）

### 5.3 “设计分歧”提醒（本地有但目标系统脚本里没看到）

本地 `qgg20260423` 引入了“发布（publish）状态机 + 灰度/全量/回滚”的抽象（见 `draft -> rolling_out -> published`）。从已提取的目标系统前端脚本看，它更偏向“直接分配/直接生效”的管理方式。

如果最终目标是“完全复刻目标系统”，需要决定：

- 是保留 publish 概念并为旧能力加一层发布流程，还是
- 为了对齐目标系统，提供兼容模式（直配直生效），publish 作为增强能力隐藏/可选。

---

## 6. 建议的落地顺序（把差距拆成可交付里程碑）

1. 先做 **数据模型对齐**：Agent / ClientGroupIp / ClientGroupAdRule / AgentModule / ClientGroupModule（至少能把关系存下来）
2. 再做 **核心读接口**：get_all_agent / get_all_client / get_all_rule / get_all_module / get_all_client_group_ip / get_all_client_group_policy
3. 再补 **关键写接口**：规则 CRUD + share/copy、模块 CRUD + 分配、分组 IP/规则绑定、boot_bat
4. 最后补 **边缘能力**：日志 URL、远程控制、静态规则生成、perf/session 等

---

## 7. 字段/接口名对照建议（用于把目标系统数据灌入本地 schema）

这一节只做“最常用字段”的映射建议，便于后续写迁移脚本或兼容层。

### 7.1 Rule（目标系统 -> 本地 qgg20260423）

- `Id` -> `id`
- `AgentID` -> `agent_id`（本地当前没有 Agent 实体表，需要先落地 Agent）
- `OrgnShareAgentID` -> `orgn_share_agent_id`
- `AdName` -> `name`
- `EnableAd` -> `enable_ad`
- `IsShare` -> `is_share`
- `is_hide` -> `is_hide`
- `run_possibility` -> `run_possibility`
- `Remark` -> `remark`
- `PE/DIR/MD5/REG/MD5_REG/IP/CtrlWnd/AntiThread/ThreadControl` -> `pe_json/dir_json/md5_json/reg_json/md5_reg_json/ip_json/ctrl_wnd_json/anti_thread_json/thread_control_json`

目标系统里尚有但本地缺失的规则字段（需要决定是否补齐）：`Process`、以及备份链字段 `bk_from_adrule_id/bk_desc/bk_id_list/bk_desc_list`、共享更新提示 `has_update`。

### 7.2 Module（目标系统 -> 本地 qgg20260423）

- `module_name` -> `module_name`
- `module_display_name` -> `module_display_name`
- `module_dll_file_path` -> `module_url`（语义接近，但目标系统支持“多 URL 分号分隔”）
- `md5` -> `md5`
- `visible` -> `visible`
- `display_order` -> `display_order`
- `run_possibility` -> `run_possibility`
- `enabled` -> `enabled`

目标系统里尚有但本地缺失的模块字段：`module_type/run_time_segment/run_type/agent_visible/relational_rule_id/downloaded_count/percent_*/is_test/last_update_time` 等。

### 7.3 Client / Group（目标系统 -> 本地 qgg20260423）

- Client：
  - `Id` -> `client_device.id`（本地还有 `device_uuid`，目标系统没有对应概念）
  - `LocalMac` -> `mac_addr`
  - `PublicIP` -> `public_ip`
  - `PcName` -> `hostname`
  - `OsVersion` -> `os_version`
  - `ClientVersion` -> `client_version`
  - `InternetBarName` -> `internet_bar_name`
  - `client_group_id` -> `group_id`

- Group：
  - `client_group_name` -> `group_name`
  - `boot_bat` -> `boot_bat`
  - `remark` -> `remark`

目标系统的“IP -> group”绑定（`client_ip_list`）本地没有等价物，需要新增表/接口。

