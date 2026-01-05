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

export const useDiscussionStore = defineStore("discussion", {
  state: () => ({
    posts: [],
    loading: false,
    error: "",
    commentsByPost: {},
    commentsLoading: false
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
        const { data } = await api.get("/discussions");
        this.posts = data;
      } catch (error) {
        this.error = error.response?.data?.message || "获取讨论失败";
      } finally {
        this.loading = false;
      }
    },
    async createPost(payload) {
      this.error = "";
      try {
        const { data } = await api.post("/discussions", payload);
        this.posts.unshift(data.post);
        return { success: true, message: data.message, post: data.post };
      } catch (error) {
        const message = error.response?.data?.message || "发布讨论失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async deletePost(id) {
      this.error = "";
      try {
        const { data } = await api.delete(`/discussions/${id}`);
        this.posts = this.posts.filter((item) => item.id !== id);
        delete this.commentsByPost[id];
        return { success: true, message: data.message };
      } catch (error) {
        const message = error.response?.data?.message || "删除讨论失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async fetchComments(postId) {
      this.commentsLoading = true;
      this.error = "";
      try {
        const { data } = await api.get(`/discussions/${postId}/comments`);
        this.commentsByPost[postId] = data;
        return { success: true, comments: data };
      } catch (error) {
        const message = error.response?.data?.message || "获取评论失败";
        this.error = message;
        return { success: false, message };
      } finally {
        this.commentsLoading = false;
      }
    },
    async createComment(postId, content, parentId = null) {
      this.error = "";
      try {
        const { data } = await api.post(`/discussions/${postId}/comments`, { content, parentId });
        this.commentsByPost[postId] = data.comments;
        return { success: true, comments: data.comments };
      } catch (error) {
        const message = error.response?.data?.message || "发布评论失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async deleteComment(postId, commentId) {
      this.error = "";
      try {
        const { data } = await api.delete(`/discussions/${postId}/comments/${commentId}`);
        this.commentsByPost[postId] = (this.commentsByPost[postId] || []).filter((c) => c.id !== commentId);
        return { success: true, message: data.message };
      } catch (error) {
        const message = error.response?.data?.message || "删除评论失败";
        this.error = message;
        return { success: false, message };
      }
    }
  }
});
