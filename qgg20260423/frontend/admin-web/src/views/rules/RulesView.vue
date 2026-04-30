<template>
  <section class="page">
    <div class="toolbar">
      <div class="toolbar-left">
        <strong>规则</strong>
        <span>{{ rows.length }} 条</span>
      </div>
      <div class="toolbar-right">
        <el-button :loading="busy" @click="load">刷新</el-button>
        <el-button type="primary" @click="openCreate">新增规则</el-button>
      </div>
    </div>

    <el-table :data="rows" height="640" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="220" />
      <el-table-column prop="enable_ad" label="启用" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enable_ad ? 'success' : 'info'">{{ row.enable_ad ? "是" : "否" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_share" label="共享" width="90">
        <template #default="{ row }">
          <el-tag :type="row.is_share ? 'warning' : 'info'">{{ row.is_share ? "是" : "否" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_hide" label="隐藏" width="90">
        <template #default="{ row }">
          <el-tag :type="row.is_hide ? 'danger' : 'info'">{{ row.is_hide ? "是" : "否" }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="used_count" label="被引用" width="100" />
      <el-table-column prop="version" label="版本" width="90" />
      <el-table-column prop="updated_at" label="更新时间" min-width="170">
        <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>

  <el-dialog v-model="dialogOpen" :title="editing ? '编辑规则' : '新增规则'" width="920px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" maxlength="40" show-word-limit />
      </el-form-item>

      <el-form-item label="启用" prop="enable_ad">
        <el-switch v-model="form.enable_ad" />
      </el-form-item>

      <el-form-item label="共享" prop="is_share">
        <el-switch v-model="form.is_share" />
      </el-form-item>

      <el-form-item label="隐藏" prop="is_hide">
        <el-switch v-model="form.is_hide" />
      </el-form-item>

      <el-form-item label="执行概率" prop="run_possibility">
        <el-input-number v-model="form.run_possibility" :min="0" :max="100" />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="2" />
      </el-form-item>

      <el-divider />

      <el-collapse v-model="openedJsonPanels">
        <el-collapse-item name="pe_json" title="pe_json (JSON 字符串)">
          <el-input v-model="form.pe_json" type="textarea" :rows="6" placeholder="例如: {} 或 []" />
        </el-collapse-item>
        <el-collapse-item name="dir_json" title="dir_json (JSON 字符串)">
          <el-input v-model="form.dir_json" type="textarea" :rows="6" placeholder="例如: {\"*\": {\"\\\\a.dll\": [\"noCreate\"]}}" />
        </el-collapse-item>
        <el-collapse-item name="md5_json" title="md5_json (JSON 字符串)">
          <el-input v-model="form.md5_json" type="textarea" :rows="6" placeholder="例如: []" />
        </el-collapse-item>
        <el-collapse-item name="reg_json" title="reg_json (JSON 字符串)">
          <el-input v-model="form.reg_json" type="textarea" :rows="6" placeholder="例如: []" />
        </el-collapse-item>
        <el-collapse-item name="md5_reg_json" title="md5_reg_json (JSON 字符串)">
          <el-input v-model="form.md5_reg_json" type="textarea" :rows="6" placeholder="例如: []" />
        </el-collapse-item>
        <el-collapse-item name="ip_json" title="ip_json (JSON 字符串)">
          <el-input v-model="form.ip_json" type="textarea" :rows="6" placeholder="例如: []" />
        </el-collapse-item>
        <el-collapse-item name="ctrl_wnd_json" title="ctrl_wnd_json (JSON 字符串)">
          <el-input v-model="form.ctrl_wnd_json" type="textarea" :rows="6" placeholder="例如: []" />
        </el-collapse-item>
        <el-collapse-item name="anti_thread_json" title="anti_thread_json (JSON 字符串)">
          <el-input v-model="form.anti_thread_json" type="textarea" :rows="6" placeholder="例如: []" />
        </el-collapse-item>
        <el-collapse-item name="thread_control_json" title="thread_control_json (JSON 字符串)">
          <el-input v-model="form.thread_control_json" type="textarea" :rows="6" placeholder="例如: []" />
        </el-collapse-item>
      </el-collapse>
    </el-form>

    <template #footer>
      <el-button @click="dialogOpen = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

import { apiCreateRule, apiDeleteRule, apiListRules, apiUpdateRule } from "@/api/rules";
import type { Rule, RuleUpsert } from "@/types/models";

const busy = ref(false);
const saving = ref(false);
const rows = ref<Rule[]>([]);

const dialogOpen = ref(false);
const editing = ref<Rule | null>(null);
const formRef = ref<FormInstance>();
const openedJsonPanels = ref<string[]>(["dir_json"]);

const form = reactive<RuleUpsert>(blankRule());

function blankRule(): RuleUpsert {
  return {
    name: "",
    enable_ad: true,
    is_share: false,
    is_hide: false,
    run_possibility: 100,
    remark: "",
    pe_json: "",
    dir_json: "",
    md5_json: "",
    reg_json: "",
    md5_reg_json: "",
    ip_json: "",
    ctrl_wnd_json: "",
    anti_thread_json: "",
    thread_control_json: ""
  };
}

function jsonFieldRule(label: string) {
  return {
    validator: (_: unknown, value: unknown, callback: (err?: Error) => void) => {
      const raw = String(value ?? "").trim();
      if (!raw) return callback();
      try {
        JSON.parse(raw);
        callback();
      } catch {
        callback(new Error(`${label} 必须是合法 JSON`));
      }
    },
    trigger: "blur"
  };
}

const rules: FormRules = {
  name: [
    { required: true, message: "请输入名称", trigger: "blur" },
    { min: 2, max: 40, message: "长度 2~40", trigger: "blur" }
  ],
  run_possibility: [{ type: "number", required: true, message: "请输入 0~100", trigger: "blur" }],
  pe_json: [jsonFieldRule("pe_json")],
  dir_json: [jsonFieldRule("dir_json")],
  md5_json: [jsonFieldRule("md5_json")],
  reg_json: [jsonFieldRule("reg_json")],
  md5_reg_json: [jsonFieldRule("md5_reg_json")],
  ip_json: [jsonFieldRule("ip_json")],
  ctrl_wnd_json: [jsonFieldRule("ctrl_wnd_json")],
  anti_thread_json: [jsonFieldRule("anti_thread_json")],
  thread_control_json: [jsonFieldRule("thread_control_json")]
};

async function load() {
  busy.value = true;
  try {
    rows.value = await apiListRules();
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    busy.value = false;
  }
}

function openCreate() {
  editing.value = null;
  Object.assign(form, blankRule());
  openedJsonPanels.value = ["dir_json"];
  dialogOpen.value = true;
}

function openEdit(row: Rule) {
  editing.value = row;
  Object.assign(form, {
    name: row.name,
    enable_ad: row.enable_ad,
    is_share: row.is_share,
    is_hide: row.is_hide,
    run_possibility: row.run_possibility,
    remark: row.remark || "",
    pe_json: row.pe_json || "",
    dir_json: row.dir_json || "",
    md5_json: row.md5_json || "",
    reg_json: row.reg_json || "",
    md5_reg_json: row.md5_reg_json || "",
    ip_json: row.ip_json || "",
    ctrl_wnd_json: row.ctrl_wnd_json || "",
    anti_thread_json: row.anti_thread_json || "",
    thread_control_json: row.thread_control_json || ""
  } satisfies RuleUpsert);
  openedJsonPanels.value = ["dir_json"];
  dialogOpen.value = true;
}

async function save() {
  const ok = await formRef.value?.validate().catch(() => false);
  if (!ok) return;

  saving.value = true;
  try {
    if (editing.value) {
      await apiUpdateRule(editing.value.id, { ...form });
      ElMessage.success("已更新");
    } else {
      await apiCreateRule({ ...form });
      ElMessage.success("已创建");
    }
    dialogOpen.value = false;
    await load();
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    saving.value = false;
  }
}

async function remove(row: Rule) {
  try {
    await ElMessageBox.confirm(`确认删除规则「${row.name}」？`, "删除确认", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
  } catch {
    return;
  }

  saving.value = true;
  try {
    await apiDeleteRule(row.id);
    ElMessage.success("已删除");
    await load();
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    saving.value = false;
  }
}

function formatTime(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
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
</style>

