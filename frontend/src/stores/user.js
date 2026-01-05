import { defineStore } from "pinia";
import axios from "axios";

export const useUserStore = defineStore("user", {
  state: () => ({
    publicUser: null,
    loading: false,
    error: ""
  }),

  actions: {
    async fetchPublicProfile(userId) {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await axios.get(`/api/users/${userId}`);
        this.publicUser = data.user;
      } catch (error) {
        this.error = error.response?.data?.message || "获取用户信息失败";
        console.error(this.error);
      } finally {
        this.loading = false;
      }
    },

    clearPublicUser() {
      this.publicUser = null;
      this.error = "";
    }
  }
});
