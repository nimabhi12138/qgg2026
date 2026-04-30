<template>
  <div class="login-page">
    <div class="panel">
      <div class="brand">
        <div class="mark">QGG</div>
        <div>
          <strong>管理后台</strong>
          <small>登录</small>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" autocomplete="username" placeholder="admin" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-button type="primary" size="large" :loading="busy" @click="submit">登录</el-button>
      </el-form>

      <div class="hint">
        <span>默认：admin / admin123</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const formRef = ref<FormInstance>();
const busy = ref(false);
const form = reactive({
  username: auth.username || "admin",
  password: ""
});

const rules: FormRules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false);
  if (!ok) return;
  busy.value = true;
  try {
    await auth.login(form.username.trim(), form.password);
    ElMessage.success("登录成功");
    const redirect = (route.query.redirect as string) || "/dashboard";
    router.replace(redirect);
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.login-page {
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #102033;
}

.panel {
  width: min(420px, 100%);
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.mark {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #28a0a8;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: #fff;
}

.brand strong {
  display: block;
}

.brand small {
  display: block;
  margin-top: 4px;
  color: #687789;
}

.panel :deep(.el-button) {
  width: 100%;
}

.hint {
  margin-top: 12px;
  color: #687789;
  font-size: 12px;
}
</style>

