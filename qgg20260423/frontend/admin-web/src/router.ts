import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "@/layouts/AdminLayout.vue";
import LoginView from "@/views/LoginView.vue";
import DashboardView from "@/views/DashboardView.vue";
import RulesView from "@/views/rules/RulesView.vue";
import GroupsView from "@/views/groups/GroupsView.vue";
import PublishesView from "@/views/publishes/PublishesView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import { getToken } from "@/utils/token";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/login", component: LoginView, meta: { public: true, title: "登录" } },
    {
      path: "/",
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "dashboard", component: DashboardView, meta: { title: "Dashboard" } },
        { path: "rules", component: RulesView, meta: { title: "规则管理" } },
        { path: "groups", component: GroupsView, meta: { title: "分组管理" } },
        { path: "publishes", component: PublishesView, meta: { title: "发布记录" } }
      ]
    },
    { path: "/:pathMatch(.*)*", component: NotFoundView, meta: { public: true, title: "404" } }
  ]
});

router.beforeEach((to) => {
  if (to.meta.public) return true;
  const token = getToken();
  if (token) return true;
  return { path: "/login", query: { redirect: to.fullPath } };
});

