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

export const useFriendStore = defineStore("friend", {
  state: () => ({
    friends: [],
    receivedRequests: [],
    sentRequests: [],
    loading: false,
    error: null,
  }),

  actions: {
    // 发送好友申请
    async sendFriendRequest(receiverId, message) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post("/friends/requests", {
          receiverId,
          message,
        });
        return { success: true, message: response.data.message };
      } catch (error) {
        this.error = error.response?.data?.message || "发送失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 获取收到的好友申请
    async fetchReceivedRequests() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get("/friends/requests/received");
        this.receivedRequests = response.data.data || [];
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 获取发送的好友申请
    async fetchSentRequests() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get("/friends/requests/sent");
        this.sentRequests = response.data.data || [];
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 处理好友申请（接受/拒绝）
    async handleFriendRequest(requestId, action) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post(`/friends/requests/${requestId}/handle`, {
          action,
        });
        
        // 更新本地状态
        if (action === 'accept') {
          await this.fetchFriends();
        }
        await this.fetchReceivedRequests();
        
        return { success: true, message: response.data.message };
      } catch (error) {
        this.error = error.response?.data?.message || "操作失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 获取好友列表
    async fetchFriends() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get("/friends");
        this.friends = response.data.data || [];
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 删除好友
    async removeFriend(friendId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.delete(`/friends/${friendId}`);
        await this.fetchFriends();
        return { success: true, message: response.data.message };
      } catch (error) {
        this.error = error.response?.data?.message || "删除失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 清空错误
    clearError() {
      this.error = null;
    },
  },
});
