import { defineStore } from "pinia";
import { apiLogin } from "@/api/auth";
import { clearToken, getToken, setToken } from "@/utils/token";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: getToken(),
    username: localStorage.getItem("qgg_admin_username") || ""
  }),
  actions: {
    async login(username: string, password: string) {
      const out = await apiLogin(username, password);
      this.token = out.access_token;
      this.username = username;
      setToken(out.access_token);
      localStorage.setItem("qgg_admin_username", username);
      return out;
    },
    logout() {
      this.token = "";
      clearToken();
    }
  }
});

