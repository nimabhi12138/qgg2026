<template>
  <section v-if="!token" class="portal-login">
    <div class="login-copy">
      <p>ADHunter portal</p>
      <h1>网吧代理操作台</h1>
      <span>管理自己的规则、分组、客户端和发布批次。</span>
    </div>
    <el-form class="login-box" :model="loginForm" label-position="top" @submit.prevent>
      <el-form-item label="账号">
        <el-input v-model="loginForm.username" placeholder="17629075264" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="loginForm.password" type="password" show-password />
      </el-form-item>
      <el-button type="primary" size="large" :loading="busy" @click="login">登录</el-button>
    </el-form>
  </section>

  <el-container v-else class="portal-shell">
    <el-aside width="230px" class="portal-sidebar">
      <div class="brand">
        <strong>广告猎手</strong>
        <span>代理侧</span>
      </div>
      <el-menu :default-active="active" @select="active = $event">
        <el-menu-item index="overview">我的概览</el-menu-item>
        <el-menu-item index="rules">我的规则</el-menu-item>
        <el-menu-item index="groups">我的分组</el-menu-item>
        <el-menu-item index="modules">我的模块</el-menu-item>
        <el-menu-item index="clients">我的客户端</el-menu-item>
        <el-menu-item index="publishes">发布记录</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="portal-topbar">
        <div>
          <strong>{{ title }}</strong>
          <span>账号 {{ loginForm.username }}</span>
        </div>
        <div>
          <el-button @click="loadAll" :loading="busy">刷新</el-button>
          <el-button @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main class="portal-main">
        <section v-if="active === 'overview'" class="overview">
          <div class="metric">
            <span>规则</span>
            <strong>{{ dashboard?.rule_count ?? 0 }}</strong>
          </div>
          <div class="metric">
            <span>分组</span>
            <strong>{{ dashboard?.group_count ?? 0 }}</strong>
          </div>
          <div class="metric">
            <span>客户端</span>
            <strong>{{ dashboard?.client_count ?? 0 }}</strong>
          </div>
          <div class="metric">
            <span>在线</span>
            <strong>{{ dashboard?.online_client_count ?? 0 }}</strong>
          </div>
          <div class="panel span-two">
            <div class="panel-head">
              <h3>操作焦点</h3>
              <span>代理日常</span>
            </div>
            <div class="task-grid">
              <div>复制共享规则后按分组发布</div>
              <div>查看客户端公网 IP 和在线状态</div>
              <div>启用模块并观察客户端拉取</div>
              <div>保留审计记录便于回滚</div>
            </div>
          </div>
        </section>

        <section v-if="active === 'rules'" class="panel">
          <div class="panel-head">
            <h3>我的规则</h3>
            <span>{{ rules.length }} 条</span>
          </div>
          <el-table :data="rules" height="620">
            <el-table-column prop="name" label="规则名" min-width="180" />
            <el-table-column prop="enable_ad" label="启用" width="80">
              <template #default="{ row }">{{ row.enable_ad ? "是" : "否" }}</template>
            </el-table-column>
            <el-table-column prop="is_share" label="共享" width="80">
              <template #default="{ row }">{{ row.is_share ? "是" : "否" }}</template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="80" />
            <el-table-column prop="updated_at" label="更新时间" min-width="170">
              <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
            </el-table-column>
          </el-table>
        </section>

        <section v-if="active === 'groups'" class="panel">
          <div class="panel-head">
            <h3>我的分组</h3>
            <span>{{ groups.length }} 个</span>
          </div>
          <el-table :data="groups" height="620">
            <el-table-column prop="group_name" label="名称" />
            <el-table-column prop="is_default" label="默认" width="90">
              <template #default="{ row }">{{ row.is_default ? "是" : "否" }}</template>
            </el-table-column>
            <el-table-column prop="boot_bat" label="开机批处理" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </section>

        <section v-if="active === 'modules'" class="panel">
          <div class="panel-head">
            <h3>我的模块</h3>
            <span>{{ modules.length }} 个</span>
          </div>
          <el-table :data="modules" height="620">
            <el-table-column prop="module_display_name" label="显示名" min-width="160" />
            <el-table-column prop="module_name" label="模块名" min-width="160" />
            <el-table-column prop="enabled" label="启用" width="90">
              <template #default="{ row }">{{ row.enabled ? "是" : "否" }}</template>
            </el-table-column>
            <el-table-column prop="module_url" label="下载地址" min-width="260" />
          </el-table>
        </section>

        <section v-if="active === 'clients'" class="panel">
          <div class="panel-head">
            <h3>我的客户端</h3>
            <span>{{ clients.length }} 台</span>
          </div>
          <el-table :data="clients" height="620">
            <el-table-column prop="internet_bar_name" label="网吧" min-width="160" />
            <el-table-column prop="hostname" label="主机名" width="130" />
            <el-table-column prop="mac_addr" label="MAC" min-width="150" />
            <el-table-column prop="public_ip" label="公网 IP" width="130" />
            <el-table-column prop="client_version" label="版本" width="110" />
            <el-table-column prop="status" label="状态" width="100" />
          </el-table>
        </section>

        <section v-if="active === 'publishes'" class="panel">
          <div class="panel-head">
            <h3>发布记录</h3>
            <span>{{ publishes.length }} 条</span>
          </div>
          <el-table :data="publishes" height="620">
            <el-table-column prop="publish_code" label="批次号" min-width="180" />
            <el-table-column prop="publish_type" label="类型" width="90" />
            <el-table-column prop="target_scope" label="范围" width="90" />
            <el-table-column prop="status" label="状态" width="90" />
            <el-table-column prop="created_at" label="创建时间" min-width="170">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </section>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api/v1";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface Dashboard {
  rule_count: number;
  group_count: number;
  client_count: number;
  online_client_count: number;
  module_count: number;
}

interface Row {
  [key: string]: string | number | boolean | null;
}

const token = ref(localStorage.getItem("qgg_portal_token") || "");
const active = ref("overview");
const busy = ref(false);
const dashboard = ref<Dashboard | null>(null);
const rules = ref<Row[]>([]);
const groups = ref<Row[]>([]);
const modules = ref<Row[]>([]);
const clients = ref<Row[]>([]);
const publishes = ref<Row[]>([]);
const loginForm = reactive({ username: "17629075264", password: "" });

const title = computed(() => {
  const map: Record<string, string> = {
    overview: "我的概览",
    rules: "我的规则",
    groups: "我的分组",
    modules: "我的模块",
    clients: "我的客户端",
    publishes: "发布记录"
  };
  return map[active.value];
});

function headers() {
  return {
    "Content-Type": "application/json",
    "X-Request-Id": `portal-${Date.now()}`,
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
  };
}

async function request<T>(path: string, options: RequestInit = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...((options.headers || {}) as Record<string, string>) }
  });
  const body = (await resp.json()) as ApiResponse<T>;
  if (!resp.ok || body.code !== 0) {
    throw new Error(body.message || "请求失败");
  }
  return body.data;
}

async function login() {
  busy.value = true;
  try {
    const data = await request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(loginForm)
    });
    token.value = data.access_token;
    localStorage.setItem("qgg_portal_token", token.value);
    await loadAll();
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    busy.value = false;
  }
}

function logout() {
  token.value = "";
  localStorage.removeItem("qgg_portal_token");
}

async function loadAll() {
  if (!token.value) return;
  busy.value = true;
  try {
    const [dash, ruleRows, groupRows, moduleRows, clientRows, publishRows] = await Promise.all([
      request<Dashboard>("/dashboard"),
      request<Row[]>("/rules"),
      request<Row[]>("/groups"),
      request<Row[]>("/modules"),
      request<Row[]>("/clients"),
      request<Row[]>("/publishes")
    ]);
    dashboard.value = dash;
    rules.value = ruleRows;
    groups.value = groupRows;
    modules.value = moduleRows;
    clients.value = clientRows;
    publishes.value = publishRows;
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    busy.value = false;
  }
}

function formatTime(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

onMounted(loadAll);
</script>

<style scoped>
:global(body) {
  margin: 0;
  background: #f4f6f8;
  color: #1f2933;
  font-family: Inter, "Microsoft YaHei", Arial, sans-serif;
}

.portal-login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  align-items: center;
  gap: 42px;
  padding: 0 8vw;
  background: #102033;
}

.login-copy {
  color: #fff;
}

.login-copy p {
  margin: 0 0 12px;
  color: #7bd8de;
}

.login-copy h1 {
  margin: 0 0 18px;
  font-size: 46px;
}

.login-copy span {
  color: #c7d5e5;
  font-size: 18px;
}

.login-box {
  padding: 30px;
  background: #fff;
  border-radius: 8px;
}

.login-box .el-button {
  width: 100%;
}

.portal-shell {
  min-height: 100vh;
}

.portal-sidebar {
  background: #fff;
  border-right: 1px solid #dbe3ec;
}

.brand {
  height: 76px;
  display: grid;
  align-content: center;
  padding: 0 22px;
  border-bottom: 1px solid #dbe3ec;
}

.brand span {
  margin-top: 4px;
  color: #687789;
}

.portal-topbar {
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #dbe3ec;
}

.portal-topbar strong {
  display: block;
  font-size: 20px;
}

.portal-topbar span {
  display: block;
  margin-top: 4px;
  color: #687789;
}

.portal-main {
  padding: 24px;
}

.overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric,
.panel {
  background: #fff;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
}

.metric {
  padding: 20px;
  display: grid;
  gap: 8px;
}

.metric span {
  color: #687789;
}

.metric strong {
  font-size: 34px;
}

.panel {
  padding: 20px;
}

.span-two {
  grid-column: span 2;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-head h3 {
  margin: 0;
  font-size: 18px;
}

.panel-head span {
  color: #687789;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.task-grid div {
  padding: 16px;
  background: #eef7f8;
  border: 1px solid #cde7eb;
  border-radius: 8px;
}

@media (max-width: 900px) {
  .portal-login,
  .overview,
  .task-grid {
    grid-template-columns: 1fr;
  }

  .span-two {
    grid-column: span 1;
  }
}
</style>
