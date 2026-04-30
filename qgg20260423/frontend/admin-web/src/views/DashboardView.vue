<template>
  <section class="page">
    <div class="toolbar">
      <div class="toolbar-left">
        <strong>概览</strong>
        <span>关键统计</span>
      </div>
      <el-button :loading="busy" @click="load">刷新</el-button>
    </div>

    <div class="grid">
      <div class="metric">
        <span>规则</span>
        <strong>{{ data?.rule_count ?? 0 }}</strong>
      </div>
      <div class="metric">
        <span>分组</span>
        <strong>{{ data?.group_count ?? 0 }}</strong>
      </div>
      <div class="metric">
        <span>客户端</span>
        <strong>{{ data?.client_count ?? 0 }}</strong>
      </div>
      <div class="metric">
        <span>在线</span>
        <strong>{{ data?.online_client_count ?? 0 }}</strong>
      </div>
      <div class="metric">
        <span>模块</span>
        <strong>{{ data?.module_count ?? 0 }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { apiGetDashboard } from "@/api/dashboard";
import type { DashboardSummary } from "@/types/models";

const busy = ref(false);
const data = ref<DashboardSummary | null>(null);

async function load() {
  busy.value = true;
  try {
    data.value = await apiGetDashboard();
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    busy.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.page {
  background: #fff;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  padding: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.toolbar-left strong {
  display: block;
  font-size: 16px;
}

.toolbar-left span {
  display: block;
  margin-top: 4px;
  color: #687789;
  font-size: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.metric {
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  padding: 14px;
  display: grid;
  gap: 6px;
}

.metric span {
  color: #687789;
  font-size: 12px;
}

.metric strong {
  font-size: 26px;
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

