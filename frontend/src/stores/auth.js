import { defineStore } from "pinia";
import axios from "axios";

const TOKEN_KEY = "academic_light_token";
const existingToken = localStorage.getItem(TOKEN_KEY);
if (existingToken) {
  axios.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || "",
    user: null,
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user)
  },
  actions: {
    setToken(token) {
      this.token = token;
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      } else {
        localStorage.removeItem(TOKEN_KEY);
        delete axios.defaults.headers.common.Authorization;
      }
    },
    async fetchProfile() {
      if (!this.token) return;
      this.loading = true;
      try {
        const { data } = await axios.get("/api/auth/me");
        this.user = data;
      } catch (error) {
        console.warn("fetchProfile failed", error);
        this.logout();
      } finally {
        this.loading = false;
      }
    },
    async authenticate(mode, payload) {
      this.loading = true;
      try {
        const { data } = await axios.post(`/api/auth/${mode}`, payload);
        this.user = data.user;
        this.setToken(data.token);
        return { success: true, message: data.message };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "请求失败，请稍后再试"
        };
      } finally {
        this.loading = false;
      }
    },
    async updateProfile(payload) {
      this.loading = true;
      try {
        const { data } = await axios.put("/api/auth/me", payload);
        this.user = data.user;
        return { success: true, message: data.message };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "资料更新失败，请稍后再试"
        };
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.user = null;
      this.setToken("");
      // 清理其他store的状态
      this.$reset();
    },
    // 重置所有相关store状态
    $reset() {
      // 这里可以调用其他store的清理方法
      // 由于Pinia的限制，我们需要在组件中手动处理
    }
  }
});
