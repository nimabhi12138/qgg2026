<template>
  <el-container class="layout">
    <el-aside width="240px" class="aside">
      <div class="brand">
        <div class="mark">QGG</div>
        <div class="texts">
          <strong>管理后台</strong>
          <small>admin-web</small>
        </div>
      </div>

      <el-menu :default-active="active" class="menu" @select="onSelect">
        <el-menu-item index="/dashboard">Dashboard</el-menu-item>
        <el-menu-item index="/rules">规则管理</el-menu-item>
        <el-menu-item index="/groups">分组管理</el-menu-item>
        <el-menu-item index="/publishes">发布记录</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <strong class="page-title">{{ title }}</strong>
          <span class="page-sub">{{ subtitle }}</span>
        </div>
        <div class="header-right">
          <span class="user" v-if="auth.username">账号 {{ auth.username }}</span>
          <el-button @click="logout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const active = computed(() => route.path);
const title = computed(() => (route.meta.title as string) || "管理后台");
const subtitle = computed(() => {
  if (route.path === "/dashboard") return "概览与关键指标";
  if (route.path === "/rules") return "规则 CRUD";
  if (route.path === "/groups") return "分组列表 / 新增 / 绑定规则";
  if (route.path === "/publishes") return "发布批次与状态变更";
  return "";
});

function onSelect(index: string) {
  router.push(index);
}

function logout() {
  auth.logout();
  router.replace({ path: "/login" });
}
</script>

<style scoped>
.layout {
  height: 100%;
}

.aside {
  background: #102033;
  color: #e5eef8;
}

.brand {
  height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mark {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #28a0a8;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.texts strong {
  display: block;
}

.texts small {
  display: block;
  margin-top: 4px;
  color: #9fb3c8;
}

.menu {
  border-right: 0;
  background: transparent;
}

.menu :deep(.el-menu-item) {
  color: #c7d5e5;
}

.menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: #1f5f74;
}

.header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #dbe3ec;
}

.page-title {
  display: block;
  font-size: 18px;
  line-height: 1.1;
}

.page-sub {
  display: block;
  margin-top: 6px;
  color: #687789;
  font-size: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user {
  color: #687789;
  font-size: 12px;
}

.main {
  padding: 18px;
}

@media (max-width: 900px) {
  .aside {
    width: 0 !important;
  }
}
</style>

