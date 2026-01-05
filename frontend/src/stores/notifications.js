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

export const useNotificationStore = defineStore("notifications", {
  state: () => ({
    items: [],
    unreadCount: 0,
    loading: false,
    error: ""
  }),
  actions: {
    // 更新认证token
    updateToken(token) {
      setAuthToken(token);
    },

    async fetchNotifications() {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await api.get("/notifications");
        this.items = data;
        this.unreadCount = data.filter((item) => !item.isRead).length;
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取通知失败";
        console.error("获取通知错误:", error);
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },
    async markAsRead(id) {
      try {
        await api.post(`/notifications/${id}/read`);
        this.items = this.items.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        );
        this.unreadCount = this.items.filter((item) => !item.isRead).length;
      } catch (error) {
        this.error = error.response?.data?.message || "标记通知失败";
      }
    },
    async markAllRead() {
      try {
        await api.post("/notifications/mark-all-read");
        this.items = this.items.map((item) => ({ ...item, isRead: true }));
        this.unreadCount = 0;
      } catch (error) {
        this.error = error.response?.data?.message || "清空通知失败";
      }
    },
    pushNotification(notification) {
      this.items = [notification, ...this.items];
      if (!notification.isRead) {
        this.unreadCount += 1;
      }
    },
    // 实时推送好友申请通知
    addFriendRequestNotification(notification) {
      this.pushNotification(notification);
    },
    // 实时推送好友接受通知
    addFriendAcceptedNotification(notification) {
      this.pushNotification(notification);
    },
  }
});
