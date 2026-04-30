<template>
  <section class="page">
    <div class="toolbar">
      <div class="toolbar-left">
        <strong>分组</strong>
        <span>列表 / 新增 / 绑定规则</span>
      </div>
      <div class="toolbar-right">
        <el-button :loading="busy" @click="loadAll">刷新</el-button>
        <el-button type="primary" @click="openCreateGroup">新增分组</el-button>
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <div class="panel-title">
          <strong>分组列表</strong>
          <span>{{ groups.length }} 个</span>
        </div>
        <el-table
          :data="groups"
          height="560"
          border
          highlight-current-row
          row-key="id"
          @current-change="onGroupChange"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="group_name" label="名称" min-width="200" />
          <el-table-column prop="is_default" label="默认" width="90">
            <template #default="{ row }">
              <el-tag :type="row.is_default ? 'success' : 'info'">{{ row.is_default ? "是" : "否" }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-title">
          <div>
            <strong>分组规则绑定</strong>
            <span v-if="currentGroup">当前：{{ currentGroup.group_name }} (ID {{ currentGroup.id }})</span>
            <span v-else>请选择一个分组</span>
          </div>
          <el-button type="primary" :disabled="!currentGroup" @click="openBindRule">绑定规则</el-button>
        </div>

        <el-table :data="bindings" height="560" border>
          <el-table-column prop="rule_id" label="规则" min-width="240">
            <template #default="{ row }">
              <div class="rule-cell">
                <strong>{{ ruleName(row.rule_id) }}</strong>
                <small>ID {{ row.rule_id }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="110" />
          <el-table-column prop="enabled" label="启用" width="90">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? "是" : "否" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updated_at" label="更新时间" min-width="170">
            <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="danger" :disabled="!currentGroup" @click="unbind(row.rule_id)">解绑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </section>

  <el-dialog v-model="groupDialogOpen" title="新增分组" width="560px">
    <el-form ref="groupFormRef" :model="groupForm" :rules="groupRules" label-width="100px">
      <el-form-item label="名称" prop="group_name">
        <el-input v-model="groupForm.group_name" maxlength="128" show-word-limit />
      </el-form-item>
      <el-form-item label="默认分组" prop="is_default">
        <el-switch v-model="groupForm.is_default" />
      </el-form-item>
      <el-form-item label="boot_bat" prop="boot_bat">
        <el-input v-model="groupForm.boot_bat" type="textarea" :rows="3" placeholder="可留空" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="groupForm.remark" type="textarea" :rows="2" placeholder="可留空" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="groupDialogOpen = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="createGroup">创建</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="bindDialogOpen" title="绑定规则到分组" width="640px">
    <el-form ref="bindFormRef" :model="bindForm" :rules="bindRules" label-width="110px">
      <el-form-item label="规则" prop="rule_id">
        <el-select v-model="bindForm.rule_id" filterable placeholder="选择规则" style="width: 100%">
          <el-option v-for="rule in availableRules" :key="rule.id" :label="`${rule.name} (ID ${rule.id})`" :value="rule.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-input-number v-model="bindForm.priority" :min="0" :max="1000000" />
      </el-form-item>
      <el-form-item label="启用" prop="enabled">
        <el-switch v-model="bindForm.enabled" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="bindDialogOpen = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="bindRule">绑定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

import { apiBindRuleToGroup, apiCreateGroup, apiListGroupRules, apiListGroups, apiUnbindRuleFromGroup } from "@/api/groups";
import { apiListRules } from "@/api/rules";
import type { Group, GroupCreate, GroupRuleBind, GroupRuleBindCreate, Rule } from "@/types/models";

const busy = ref(false);
const saving = ref(false);

const groups = ref<Group[]>([]);
const currentGroup = ref<Group | null>(null);

const rules = ref<Rule[]>([]);
const bindings = ref<GroupRuleBind[]>([]);

const ruleMap = computed(() => {
  const m = new Map<number, Rule>();
  for (const r of rules.value) m.set(r.id, r);
  return m;
});

const availableRules = computed(() => {
  const bound = new Set(bindings.value.map((x) => x.rule_id));
  return rules.value.filter((r) => !bound.has(r.id));
});

function ruleName(ruleId: number) {
  return ruleMap.value.get(ruleId)?.name || "（未知规则）";
}

async function loadAll() {
  busy.value = true;
  try {
    const [g, r] = await Promise.all([apiListGroups(), apiListRules()]);
    groups.value = g;
    rules.value = r;
    if (!currentGroup.value && groups.value.length) {
      currentGroup.value = groups.value[0];
    }
    if (currentGroup.value) {
      await loadBindings(currentGroup.value.id);
    } else {
      bindings.value = [];
    }
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    busy.value = false;
  }
}

async function loadBindings(groupId: number) {
  bindings.value = await apiListGroupRules(groupId);
}

function onGroupChange(row: Group | undefined) {
  if (!row) return;
  currentGroup.value = row;
  busy.value = true;
  apiListGroupRules(row.id)
    .then((list) => {
      bindings.value = list;
    })
    .catch((err) => {
      ElMessage.error((err as Error).message);
    })
    .finally(() => {
      busy.value = false;
    });
}

function formatTime(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

// --- create group
const groupDialogOpen = ref(false);
const groupFormRef = ref<FormInstance>();
const groupForm = reactive<GroupCreate>({
  group_name: "",
  is_default: false,
  boot_bat: "",
  remark: ""
});
const groupRules: FormRules = {
  group_name: [{ required: true, message: "请输入名称", trigger: "blur" }]
};

function openCreateGroup() {
  Object.assign(groupForm, { group_name: "", is_default: false, boot_bat: "", remark: "" } satisfies GroupCreate);
  groupDialogOpen.value = true;
}

async function createGroup() {
  const ok = await groupFormRef.value?.validate().catch(() => false);
  if (!ok) return;
  saving.value = true;
  try {
    const created = await apiCreateGroup({ ...groupForm });
    ElMessage.success("分组已创建");
    groupDialogOpen.value = false;
    await loadAll();
    currentGroup.value = created;
    await loadBindings(created.id);
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    saving.value = false;
  }
}

// --- bind rule
const bindDialogOpen = ref(false);
const bindFormRef = ref<FormInstance>();
const bindForm = reactive<GroupRuleBindCreate>({
  rule_id: 0,
  priority: 100,
  enabled: true
});
const bindRules: FormRules = {
  rule_id: [{ required: true, message: "请选择规则", trigger: "change" }],
  priority: [{ type: "number", required: true, message: "请输入优先级", trigger: "blur" }]
};

function openBindRule() {
  if (!currentGroup.value) return;
  Object.assign(bindForm, { rule_id: 0, priority: 100, enabled: true } satisfies GroupRuleBindCreate);
  bindDialogOpen.value = true;
}

async function bindRule() {
  if (!currentGroup.value) return;
  const ok = await bindFormRef.value?.validate().catch(() => false);
  if (!ok) return;
  saving.value = true;
  try {
    await apiBindRuleToGroup(currentGroup.value.id, { ...bindForm });
    ElMessage.success("已绑定");
    bindDialogOpen.value = false;
    await loadBindings(currentGroup.value.id);
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    saving.value = false;
  }
}

async function unbind(ruleId: number) {
  if (!currentGroup.value) return;
  try {
    await ElMessageBox.confirm(`确认从分组「${currentGroup.value.group_name}」解绑规则 ID ${ruleId}？`, "解绑确认", {
      type: "warning",
      confirmButtonText: "解绑",
      cancelButtonText: "取消"
    });
  } catch {
    return;
  }

  saving.value = true;
  try {
    await apiUnbindRuleFromGroup(currentGroup.value.id, ruleId);
    ElMessage.success("已解绑");
    await loadBindings(currentGroup.value.id);
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    saving.value = false;
  }
}

onMounted(loadAll);
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

.grid {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 14px;
}

.panel {
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  padding: 14px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-title strong {
  display: block;
  font-size: 15px;
}

.panel-title span {
  display: block;
  margin-top: 4px;
  color: #687789;
  font-size: 12px;
}

.rule-cell strong {
  display: block;
}

.rule-cell small {
  display: block;
  margin-top: 2px;
  color: #687789;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

