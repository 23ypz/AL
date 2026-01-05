import { defineStore } from "pinia";
import axios from "axios";

// 创建axios实例
const api = axios.create({
  baseURL: "http://localhost:4000/api"
});

// 设置token
const token = localStorage.getItem("academic_light_token");
if (token) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export const useCompetitionCenterStore = defineStore("competitionCenter", {
  state: () => ({
    competitions: [],
    currentCompetition: null,
    stats: null,
    loading: false,
    error: null,
    filters: {
      level: "",
      category: "",
      search: "",
      page: 1,
      limit: 12
    },
    pagination: {
      current: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  }),

  actions: {
    // 获取竞赛列表
    async fetchCompetitions() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get("/competition-center", {
          params: this.filters
        });
        
        this.competitions = response.data.data || [];
        this.pagination = response.data.pagination || {};
        
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取竞赛列表失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 获取竞赛详情
    async fetchCompetitionById(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get(`/competition-center/${id}`);
        this.currentCompetition = response.data.data;
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取竞赛详情失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 创建竞赛（仅导师）
    async createCompetition(competitionData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post("/competition-center", competitionData);
        
        // 刷新列表
        await this.fetchCompetitions();
        
        return { success: true, message: response.data.message };
      } catch (error) {
        this.error = error.response?.data?.message || "创建竞赛失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 更新竞赛（仅导师）
    async updateCompetition(id, competitionData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.put(`/competition-center/${id}`, competitionData);
        
        // 刷新列表
        await this.fetchCompetitions();
        
        return { success: true, message: response.data.message };
      } catch (error) {
        this.error = error.response?.data?.message || "更新竞赛失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 删除竞赛（仅导师）
    async deleteCompetition(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.delete(`/competition-center/${id}`);
        
        // 刷新列表
        await this.fetchCompetitions();
        
        return { success: true, message: response.data.message };
      } catch (error) {
        this.error = error.response?.data?.message || "删除竞赛失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 获取统计数据
    async fetchStats() {
      try {
        const response = await api.get("/competition-center/stats");
        this.stats = response.data.data;
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取统计数据失败";
        return { success: false, message: this.error };
      }
    },

    // 设置筛选条件
    setFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters };
      this.filters.page = 1; // 重置页码
    },

    // 设置页码
    setPage(page) {
      this.filters.page = page;
    },

    // 重置筛选条件
    resetFilters() {
      this.filters = {
        level: "",
        category: "",
        search: "",
        page: 1,
        limit: 12
      };
    },

    // 清空错误
    clearError() {
      this.error = null;
    },

    // 清空当前竞赛
    clearCurrentCompetition() {
      this.currentCompetition = null;
    }
  },

  getters: {
    // 按级别分组的竞赛
    competitionsByLevel: (state) => {
      const grouped = {
        A: [],
        B: [],
        C: [],
        D: []
      };
      
      state.competitions.forEach(comp => {
        if (grouped[comp.level]) {
          grouped[comp.level].push(comp);
        }
      });
      
      return grouped;
    },

    // 热门竞赛
    popularCompetitions: (state) => {
      return state.competitions
        .filter(comp => comp.popularity_score >= 8.0)
        .sort((a, b) => b.popularity_score - a.popularity_score)
        .slice(0, 5);
    },

    // 竞赛级别标签
    levelLabels: () => ({
      A: { text: "A类 - 国家级重大赛事", color: "#f59e0b", icon: "🥇" },
      B: { text: "B类 - 国家级一般赛事", color: "#6b7280", icon: "🥈" },
      C: { text: "C类 - 省级赛事", color: "#8b5cf6", icon: "🥉" },
      D: { text: "D类 - 校级赛事", color: "#3b82f6", icon: "⭐" }
    })
  }
});
