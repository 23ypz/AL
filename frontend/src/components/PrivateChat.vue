<template>
  <div class="private-chat-modal" v-if="showChat">
    <div class="chat-header">
      <div class="friend-info">
        <img :src="friend?.avatar_url || placeholderAvatar(friend)" :alt="friend?.full_name" class="avatar" />
        <div class="details">
          <h3>{{ friend?.full_name }}</h3>
          <p>{{ friend?.college }} · {{ friend?.major }}</p>
          <small class="status-indicator">🟢 实时连接中</small>
        </div>
      </div>
      <button class="close-btn" @click="closeChat">×</button>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="chatStore.loading" class="loading">加载中...</div>
      <div v-else-if="chatStore.currentChat.length === 0" class="empty-chat">
        <p>暂无消息记录</p>
        <p>开始你们的第一次对话吧！</p>
      </div>
      <div v-else class="messages">
        <div
          v-for="message in chatStore.currentChat"
          :key="message.id"
          :class="['message', { 'own': message.sender_id === currentUserId }]"
        >
          <div class="message-content">
            <p>{{ message.message }}</p>
            <small>{{ formatTime(message.created_at) }}</small>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <form @submit.prevent="sendMessage">
        <div class="input-group">
          <input
            v-model="newMessage"
            type="text"
            placeholder="输入消息..."
            maxlength="500"
            :disabled="sending"
            @keyup.enter="sendMessage"
          />
          <button type="submit" :disabled="!newMessage.trim() || sending" class="send-btn">
            {{ sending ? '发送中...' : '发送' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { usePrivateChatStore } from '../stores/privateChat';
import { useAuthStore } from '../stores/auth';

const props = defineProps({
  friend: {
    type: Object,
    required: true
  },
  showChat: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const chatStore = usePrivateChatStore();
const auth = useAuthStore();

const newMessage = ref('');
const sending = ref(false);
const messagesContainer = ref(null);
const pollingInterval = ref(null);

const currentUserId = computed(() => auth.user?.id);

// 监听showChat变化，加载聊天记录
watch(() => props.showChat, async (show) => {
  if (show && props.friend?.id) {
    chatStore.setCurrentFriend(props.friend);
    await loadMessages();
    startPolling();
  } else {
    stopPolling();
  }
});

// 监听friend变化，重新加载聊天记录
watch(() => props.friend?.id, async (newId, oldId) => {
  if (newId && newId !== oldId && props.showChat) {
    chatStore.setCurrentFriend(props.friend);
    await loadMessages();
    startPolling();
  }
});

// 监听聊天记录变化，自动滚动到底部
watch(() => chatStore.currentChat, () => {
  nextTick(() => scrollToBottom());
}, { deep: true });

function placeholderAvatar(user) {
  const seed = user?.email || user?.full_name || 'guest';
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return date.toLocaleDateString('zh-CN');
}

async function loadMessages() {
  if (props.friend?.id) {
    await chatStore.fetchChatMessages(props.friend.id);
    await chatStore.markAsRead(props.friend.id);
    scrollToBottom();
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return;
  
  sending.value = true;
  try {
    const result = await chatStore.sendMessage(props.friend.id, newMessage.value);
    if (result.success) {
      newMessage.value = '';
      scrollToBottom();
    }
  } finally {
    sending.value = false;
  }
}

async function refreshMessages() {
  await loadMessages();
}

// 轮询相关函数
function startPolling() {
  stopPolling(); // 确保没有重复的轮询
  pollingInterval.value = setInterval(async () => {
    if (props.friend?.id && props.showChat) {
      await chatStore.fetchChatMessages(props.friend.id);
    }
  }, 3000); // 每3秒轮询一次
}

function stopPolling() {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
}

function closeChat() {
  emit('close');
  chatStore.clearCurrentChat();
  newMessage.value = '';
  stopPolling();
}

onMounted(async () => {
  if (props.showChat && props.friend?.id) {
    chatStore.setCurrentFriend(props.friend);
    await loadMessages();
    startPolling();
  }
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<style scoped lang="scss">
.private-chat-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 16px 16px 0 0;

  .friend-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .details {
      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 0.85rem;
        color: #6b7280;
      }

      .status-indicator {
        margin: 4px 0 0 0;
        color: #10b981;
        font-size: 0.75rem;
        font-weight: 500;
      }
    }
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      background: #f3f4f6;
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f9fafb;

  .loading, .empty-chat {
    text-align: center;
    color: #6b7280;
    padding: 40px 20px;

    p {
      margin: 8px 0;
    }
  }

  .messages {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .message {
    display: flex;
    
    &.own {
      justify-content: flex-end;

      .message-content {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        align-self: flex-end;
      }
    }

    .message-content {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 18px;
      background: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

      p {
        margin: 0 0 4px 0;
        line-height: 1.4;
        word-wrap: break-word;
      }

      small {
        font-size: 0.75rem;
        opacity: 0.7;
      }
    }
  }
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 16px 16px;

  .input-group {
    display: flex;
    gap: 8px;

    input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 24px;
      font-size: 0.9rem;
      outline: none;

      &:focus {
        border-color: #3b82f6;
      }

      &:disabled {
        background: #f9fafb;
      }
    }

    .send-btn {
      padding: 12px 20px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      border: none;
      border-radius: 24px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}
</style>
