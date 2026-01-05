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

export const usePostgraduateStore = defineStore("postgraduate", {
  state: () => ({
    posts: [],
    loading: false,
    error: ""
  }),
  actions: {
    // 更新认证token
    updateToken(token) {
      setAuthToken(token);
    },

    async fetchPosts() {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await api.get("/postgraduate-posts");
        this.posts = data;
      } catch (error) {
        this.error = error.response?.data?.message || "获取保研信息失败";
      } finally {
        this.loading = false;
      }
    },
    async createPost(payload) {
      this.error = "";
      try {
        const { data } = await api.post("/postgraduate-posts", payload);
        this.posts.unshift(data.post);
        return { success: true, message: data.message, post: data.post };
      } catch (error) {
        const message = error.response?.data?.message || "发布保研信息失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async updatePost(id, payload) {
      this.error = "";
      try {
        const { data } = await api.put(`/postgraduate-posts/${id}`, payload);
        const idx = this.posts.findIndex((item) => item.id === id);
        if (idx !== -1) {
          this.posts[idx] = data.post;
        }
        return { success: true, message: data.message, post: data.post };
      } catch (error) {
        const message = error.response?.data?.message || "更新保研信息失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async deletePost(id) {
      this.error = "";
      try {
        const { data } = await api.delete(`/postgraduate-posts/${id}`);
        this.posts = this.posts.filter((item) => item.id !== id);
        return { success: true, message: data.message };
      } catch (error) {
        const message = error.response?.data?.message || "删除保研信息失败";
        this.error = message;
        return { success: false, message };
      }
    }
  }
});
