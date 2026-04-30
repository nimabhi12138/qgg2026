import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/overview" },
    { path: "/overview", component: { template: "<span />" } },
    { path: "/rules", component: { template: "<span />" } },
    { path: "/groups", component: { template: "<span />" } },
    { path: "/modules", component: { template: "<span />" } },
    { path: "/clients", component: { template: "<span />" } },
    { path: "/publishes", component: { template: "<span />" } }
  ]
});
