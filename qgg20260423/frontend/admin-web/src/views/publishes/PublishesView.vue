<template>
  <section class="page">
    <div class="toolbar">
      <div class="toolbar-left">
        <strong>发布记录</strong>
        <span>{{ rows.length }} 条</span>
      </div>
      <div class="toolbar-right">
        <el-button :loading="busy" @click="load">刷新</el-button>
      </div>
    </div>

    <el-table :data="rows" height="640" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="publish_code" label="发布号" min-width="160" />
      <el-table-column prop="publish_type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.publish_type === 'gray' ? 'warning' : 'success'">{{ row.publish_type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="target_scope" label="目标范围" width="120" />
      <el-table-column prop="created_at" label="创建时间" min-width="170">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" min-width="170">
        <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 'draft'"
            size="small"
            type="primary"
            :loading="savingId === row.id"
            @click="transition(row.id, 'rolling_out')"
          >
            转 rolling_out
          </el-button>
          <el-button
            v-if="row.status === 'draft' || row.status === 'rolling_out'"
            size="small"
            type="success"
            :loading="savingId === row.id"
            @click="transition(row.id, 'published')"
          >
            转 published
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>

  <el-dialog v-model="detailOpen" title="发布详情" width="920px">
    <div v-if="detail" class="detail-grid">
      <div class="kv">
        <span>ID</span>
        <strong>{{ detail.id }}</strong>
      </div>
      <div class="kv">
        <span>publish_code</span>
        <strong>{{ detail.publish_code }}</strong>
      </div>
      <div class="kv">
        <span>publish_type</span>
        <strong>{{ detail.publish_type }}</strong>
      </div>
      <div class="kv">
        <span>status</span>
        <strong>{{ detail.status }}</strong>
      </div>
      <div class="kv span-all">
        <span>target_json</span>
        <el-input :model-value="prettyJson(detail.target_json)" type="textarea" :rows="8" readonly />
      </div>
      <div class="kv span-all">
        <span>rule_version_map_json</span>
        <el-input :model-value="prettyJson(detail.rule_version_map_json)" type="textarea" :rows="10" readonly />
      </div>
    </div>
    <template #footer>
      <el-button @click="detailOpen = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";

import { apiListPublishes, apiTransitionPublish } from "@/api/publishes";
import type { Publish } from "@/types/models";

const busy = ref(false);
const savingId = ref<number | null>(null);
const rows = ref<Publish[]>([]);

const detailOpen = ref(false);
const detail = ref<Publish | null>(null);

function statusTag(status: Publish["status"]) {
  if (status === "published") return "success";
  if (status === "rolling_out") return "warning";
  return "info";
}

function prettyJson(value: string) {
  const raw = (value || "").trim();
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return value;
  }
}

function formatTime(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

async function load() {
  busy.value = true;
  try {
    rows.value = await apiListPublishes();
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    busy.value = false;
  }
}

function openDetail(row: Publish) {
  detail.value = row;
  detailOpen.value = true;
}

async function transition(publishId: number, toStatus: "rolling_out" | "published") {
  savingId.value = publishId;
  try {
    await apiTransitionPublish(publishId, toStatus);
    ElMessage.success("状态已更新");
    await load();
    if (detail.value?.id === publishId) {
      detail.value = rows.value.find((x) => x.id === publishId) || null;
    }
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    savingId.value = null;
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
  margin-bottom: 12px;
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

.toolbar-right {
  display: flex;
  gap: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.kv {
  display: grid;
  gap: 6px;
}

.kv span {
  color: #687789;
  font-size: 12px;
}

.kv strong {
  font-size: 14px;
}

.span-all {
  grid-column: 1 / -1;
}
</style>

