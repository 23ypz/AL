import { defineStore } from "pinia";
import axios from "axios";

export const useFriendStore = defineStore("friends", {
  state: () => ({
    friends: [],
    loading: false,
    error: ""
  }),
  actions: {
    async fetchFriends() {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await axios.get("/api/friends");
        this.friends = data;
      } catch (error) {
        this.error = error.response?.data?.message || "加载好友失败";
      } finally {
        this.loading = false;
      }
    }
  }
});
