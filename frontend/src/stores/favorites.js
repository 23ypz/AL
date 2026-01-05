import { defineStore } from "pinia";
import axios from "axios";

// 创建axios实例
const api = axios.create({
  baseURL: "http://localhost:4000/api"
});

// 动态设置token的函数
function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// 初始化时设置token
const token = localStorage.getItem("academic_light_token");
if (token) {
  setAuthToken(token);
}

export const useFavoritesStore = defineStore("favorites", {
  state: () => ({
    favorites: [],
    loading: false,
    error: null,
    pagination: {
      current: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  }),

  actions: {
    // 更新认证token
    updateToken(token) {
      setAuthToken(token);
    },

    // 收藏/取消收藏竞赛
    async toggleFavorite(competitionId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post("/favorites", { competitionId });
        
        // 更新收藏列表
        if (response.data.favorited) {
          // 如果是收藏，添加到列表
          await this.fetchFavorites();
        } else {
          // 如果是取消收藏，从列表中移除
          this.favorites = this.favorites.filter(fav => fav.id !== competitionId);
        }
        
        return { 
          success: true, 
          message: response.data.message, 
          favorited: response.data.favorited 
        };
      } catch (error) {
        this.error = error.response?.data?.message || "操作失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 获取收藏列表
    async fetchFavorites(page = 1) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get("/favorites", {
          params: { page }
        });
        
        this.favorites = response.data.data || [];
        this.pagination = response.data.pagination || {};
        
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取收藏列表失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 检查收藏状态
    async checkFavoriteStatus(competitionId) {
      try {
        const response = await api.get(`/favorites/${competitionId}/status`);
        return { success: true, favorited: response.data.favorited };
      } catch (error) {
        return { success: false, favorited: false };
      }
    },

    // 清空错误
    clearError() {
      this.error = null;
    }
  },

  getters: {
    // 检查特定竞赛是否已收藏
    isFavorited: (state) => (competitionId) => {
      return state.favorites.some(fav => fav.id === competitionId);
    },

    // 获取收藏数量
    favoriteCount: (state) => state.pagination.total
  }
});
