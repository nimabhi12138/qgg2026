<template>
  <div class="wrap">
    <div class="box">
      <strong>页面不存在</strong>
      <span>{{ route.path }}</span>
      <el-button type="primary" @click="router.replace('/dashboard')">回到 Dashboard</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
</script>

<style scoped>
.wrap {
  height: 100%;
  display: grid;
  place-items: center;
}

.box {
  background: #fff;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  padding: 18px;
  display: grid;
  gap: 10px;
}

.box span {
  color: #687789;
  font-size: 12px;
}
</style>

