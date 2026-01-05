import { defineStore } from "pinia";
import axios from "axios";

export const useProfileStore = defineStore("profile", {
  state: () => ({
    stats: {
      posts: 0,
      comments: 0,
      following: 0,
      followers: 0,
      contributions: 0
    },
    activities: [],
    statsLoading: false,
    activitiesLoading: false
  }),

  actions: {
    async fetchStats() {
      this.statsLoading = true;
      try {
        const { data } = await axios.get("/api/profile/stats");
        this.stats = data.stats;
      } catch (error) {
        console.error("获取统计数据失败", error);
      } finally {
        this.statsLoading = false;
      }
    },

    async fetchActivities() {
      this.activitiesLoading = true;
      try {
        const { data } = await axios.get("/api/profile/activities");
        this.activities = data.activities;
      } catch (error) {
        console.error("获取动态失败", error);
      } finally {
        this.activitiesLoading = false;
      }
    }
  }
});
