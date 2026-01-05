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

export const usePrivateChatStore = defineStore("privateChat", {
  state: () => ({
    conversations: [],
    currentChat: [],
    currentFriend: null,
    loading: false,
    error: null,
    unreadCounts: {},
  }),

  actions: {
    // 发送私聊消息
    async sendMessage(receiverId, message) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post("/private-chat/messages", {
          receiverId,
          message: message.trim(),
        });
        
        // 添加到当前聊天记录
        if (this.currentFriend && this.currentFriend.id === receiverId) {
          this.currentChat.push(response.data.data);
        }
        
        return { success: true, data: response.data.data };
      } catch (error) {
        this.error = error.response?.data?.message || "发送失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 获取与某个好友的聊天记录
    async fetchChatMessages(friendId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get(`/private-chat/messages/${friendId}`);
        this.currentChat = response.data.data || [];
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取聊天记录失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 获取所有私聊会话列表
    async fetchConversations() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.get("/private-chat/conversations");
        this.conversations = response.data.data || [];
        
        // 更新未读计数
        this.unreadCounts = {};
        this.conversations.forEach(conv => {
          if (conv.unread_count > 0) {
            this.unreadCounts[conv.friend_id] = conv.unread_count;
          }
        });
        
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "获取会话列表失败";
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    // 标记消息为已读
    async markAsRead(friendId) {
      try {
        await api.post(`/private-chat/messages/${friendId}/read`);
        
        // 清除未读计数
        delete this.unreadCounts[friendId];
        
        // 更新当前聊天记录中的已读状态
        this.currentChat.forEach(msg => {
          if (msg.receiver_id === auth.user?.id) {
            msg.is_read = true;
          }
        });
        
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || "标记已读失败";
        return { success: false, message: this.error };
      }
    },

    // 设置当前聊天好友
    setCurrentFriend(friend) {
      this.currentFriend = friend;
      this.currentChat = [];
    },

    // 清除错误
    clearError() {
      this.error = null;
    },

    // 清空当前聊天
    clearCurrentChat() {
      this.currentChat = [];
      this.currentFriend = null;
    },
  },
});
