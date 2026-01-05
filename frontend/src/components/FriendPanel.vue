<template>
  <div class="friend-panel">
    <header class="panel-header">
      <div>
        <p class="eyebrow">好友管理</p>
        <h2>我的好友与申请</h2>
        <p class="hint">管理好友关系，处理好友申请，拓展学术人脉。</p>
      </div>
      <div class="actions">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </header>

    <main class="content">
      <!-- 好友列表 -->
      <section v-if="activeTab === 'friends'" class="friends-section">
        <div v-if="friendStore.loading" class="loading">加载中...</div>
        <div v-else-if="friendStore.friends.length === 0" class="empty">
          <p>暂无好友</p>
          <p>去交流广场认识新朋友吧！</p>
        </div>
        <div v-else class="friends-grid">
          <div 
            v-for="friend in friendStore.friends" 
            :key="friend.id"
            class="friend-card"
          >
            <div class="friend-info">
              <img :src="friend.avatar_url || placeholderAvatar(friend)" :alt="friend.full_name" class="avatar" />
              <div class="details">
                <h3>{{ friend.full_name }}</h3>
                <p>{{ friend.college }} · {{ friend.major }}</p>
                <small>添加于 {{ formatDate(friend.created_at) }}</small>
              </div>
            </div>
            <div class="friend-actions">
              <button class="ghost" @click="goToProfile(friend.id)">查看主页</button>
              <button class="primary chat-btn" @click="openChat(friend)">
                <span class="icon">💬</span>
                聊天
              </button>
              <button class="danger" @click="handleRemoveFriend(friend)">删除好友</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 收到的申请 -->
      <section v-if="activeTab === 'received'" class="requests-section">
        <div v-if="friendStore.loading" class="loading">加载中...</div>
        <div v-else-if="friendStore.receivedRequests.length === 0" class="empty">
          <p>暂无收到的好友申请</p>
        </div>
        <div v-else class="requests-list">
          <div 
            v-for="request in friendStore.receivedRequests" 
            :key="request.id"
            class="request-card"
          >
            <div class="request-info">
              <img :src="request.avatar_url || placeholderAvatar(request)" :alt="request.full_name" class="avatar" />
              <div class="details">
                <h3>{{ request.full_name }}</h3>
                <p class="message">{{ request.message || "无申请理由" }}</p>
                <small>申请于 {{ formatDate(request.created_at) }}</small>
              </div>
            </div>
            <div class="request-actions">
              <button class="primary" @click="handleAcceptRequest(request)">接受</button>
              <button class="ghost" @click="handleRejectRequest(request)">拒绝</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 发送的申请 -->
      <section v-if="activeTab === 'sent'" class="requests-section">
        <div v-if="friendStore.loading" class="loading">加载中...</div>
        <div v-else-if="friendStore.sentRequests.length === 0" class="empty">
          <p>暂无发送的好友申请</p>
        </div>
        <div v-else class="requests-list">
          <div 
            v-for="request in friendStore.sentRequests" 
            :key="request.id"
            class="request-card"
          >
            <div class="request-info">
              <img :src="request.avatar_url || placeholderAvatar(request)" :alt="request.full_name" class="avatar" />
              <div class="details">
                <h3>{{ request.full_name }}</h3>
                <p class="message">{{ request.message || "无申请理由" }}</p>
                <small>申请于 {{ formatDate(request.created_at) }}</small>
              </div>
            </div>
            <div class="status">
              <span :class="['status-badge', request.status]">
                {{ getStatusText(request.status) }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 私聊组件 -->
    <PrivateChat 
      v-if="showChat" 
      :friend="currentChatFriend" 
      :show-chat="showChat"
      @close="closeChat"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useFriendStore } from "../stores/friend";
import { useAuthStore } from "../stores/auth";
import PrivateChat from "./PrivateChat.vue";

const router = useRouter();
const friendStore = useFriendStore();
const auth = useAuthStore();

const activeTab = ref("friends");

// 私聊相关
const showChat = ref(false);
const currentChatFriend = ref(null);

const tabs = [
  { key: "friends", label: "好友列表" },
  { key: "received", label: "收到申请" },
  { key: "sent", label: "发送申请" },
];

function placeholderAvatar(user) {
  const seed = user?.email || user?.full_name || "guest";
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function getStatusText(status) {
  const statusMap = {
    pending: "待处理",
    accepted: "已接受",
    rejected: "已拒绝",
  };
  return statusMap[status] || status;
}

function goToProfile(userId) {
  router.push(`/users/${userId}`);
}

async function handleRemoveFriend(friend) {
  const confirmed = window.confirm(`确定删除好友「${friend.full_name}」吗？`);
  if (!confirmed) return;
  
  const result = await friendStore.removeFriend(friend.id);
  if (result.success) {
    // 显示成功提示
    console.log(result.message);
  }
}

async function handleAcceptRequest(request) {
  const result = await friendStore.handleFriendRequest(request.id, "accept");
  if (result.success) {
    // 显示成功提示
    console.log(result.message);
  }
}

async function handleRejectRequest(request) {
  const confirmed = window.confirm(`确定拒绝「${request.full_name}」的好友申请吗？`);
  if (!confirmed) return;
  
  const result = await friendStore.handleFriendRequest(request.id, "reject");
  if (result.success) {
    console.log(result.message);
  }
}

function openChat(friend) {
  currentChatFriend.value = friend;
  showChat.value = true;
}

function closeChat() {
  showChat.value = false;
  currentChatFriend.value = null;
}

onMounted(async () => {
  await Promise.all([
    friendStore.fetchFriends(),
    friendStore.fetchReceivedRequests(),
    friendStore.fetchSentRequests(),
  ]);
});
</script>

<style scoped lang="scss">
.friend-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 24px;
  background: #fff;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);

  .eyebrow {
    margin: 0;
    font-size: 0.85rem;
    color: #2563eb;
    letter-spacing: 0.08em;
  }

  h2 {
    margin: 4px 0;
  }

  .hint {
    margin: 0;
    color: #6b7280;
    font-size: 0.95rem;
  }

  .actions {
    display: flex;
    gap: 8px;

    button {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      background: #fff;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f9fafb;
      }

      &.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
    }
  }
}

.content {
  background: #fff;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;

  p:first-child {
    font-size: 1.1rem;
    margin-bottom: 8px;
  }
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.friend-card, .request-card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.friend-info, .request-info {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    object-fit: cover;
  }

  .details {
    h3 {
      margin: 0 0 4px;
      font-size: 1rem;
    }

    p {
      margin: 0 0 4px;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .message {
      font-style: italic;
      color: #374151;
    }

    small {
      color: #9ca3af;
      font-size: 0.8rem;
    }
  }
}

.friend-actions, .request-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;

  button {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &.primary {
      background: #3b82f6;
      color: white;
      border: none;

      &:hover {
        background: #2563eb;
      }

      &.chat-btn {
        display: flex;
        align-items: center;
        gap: 4px;

        .icon {
          font-size: 0.9rem;
        }
      }
    }

    &.ghost {
      background: none;
      border: 1px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        background: #f9fafb;
        color: #374151;
      }
    }

    &.danger {
      background: none;
      border: 1px solid #ef4444;
      color: #ef4444;

      &:hover {
        background: #ef4444;
        color: white;
      }
    }
  }
}

.status {
  .status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;

    &.pending {
      background: #fef3c7;
      color: #92400e;
    }

    &.accepted {
      background: #d1fae5;
      color: #065f46;
    }

    &.rejected {
      background: #fee2e2;
      color: #991b1b;
    }
  }
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
