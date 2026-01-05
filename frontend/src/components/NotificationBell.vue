<template>
  <div class="notify-menu" ref="wrapper">
    <button class="bell" @click.stop="toggleMenu">
      <span class="icon">🔔</span>
      <span v-if="store.unreadCount > 0" class="badge">
        {{ store.unreadCount > 9 ? "9+" : store.unreadCount }}
      </span>
    </button>

    <transition name="fade">
      <div v-if="open" class="panel">
        <header>
          <strong>消息通知</strong>
          <button v-if="store.unreadCount > 0" class="ghost" @click="markAll">
            全部已读
          </button>
        </header>

        <div v-if="store.loading" class="empty">加载中...</div>
        <div v-else-if="store.items.length === 0" class="empty">暂无新消息</div>
        <ul v-else>
          <li
            v-for="item in store.items"
            :key="item.id"
            :class="{ unread: !item.isRead }"
            @click="goDetail(item)"
          >
            <p class="title">
              <span>{{ typeLabel(item.type) }}</span>
              <small>{{ formatDate(item.createdAt) }}</small>
            </p>
            <p class="body">
              <strong>{{ getNotificationSender(item) }}</strong>
              <span>{{ getNotificationMessage(item) }}</span>
            </p>
            <p class="meta">{{ getNotificationMeta(item) }}</p>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useNotificationStore } from "../stores/notifications";
import { useRouter } from "vue-router";

const emits = defineEmits(["open-discussion"]);

const store = useNotificationStore();
const router = useRouter();
const open = ref(false);
const wrapper = ref(null);

onMounted(() => {
  // 确保token已设置
  const token = localStorage.getItem("academic_light_token");
  if (token) {
    store.updateToken(token);
  }
  store.fetchNotifications();
  document.addEventListener("click", handleOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleOutside);
});

function toggleMenu() {
  open.value = !open.value;
  if (open.value && store.items.length === 0) {
    store.fetchNotifications();
  }
}

function handleOutside(event) {
  if (!wrapper.value) return;
  if (open.value && !wrapper.value.contains(event.target)) {
    open.value = false;
  }
}

function typeLabel(type) {
  if (type === "discussion_reply") return "讨论回复";
  if (type === "friend_request") return "好友申请";
  if (type === "friend_accepted") return "好友接受";
  return "消息";
}

function getNotificationSender(item) {
  if (item.type === "friend_request") {
    return item.payload?.senderName || "同学";
  }
  if (item.type === "friend_accepted") {
    return item.payload?.senderName || "同学";
  }
  return item.payload?.fromUser || "同学";
}

function getNotificationMessage(item) {
  if (item.type === "friend_request") {
    return `向你发送了好友申请`;
  }
  if (item.type === "friend_accepted") {
    return `接受了你的好友申请`;
  }
  if (item.type === "discussion_reply") {
    return `回复了你的讨论：${item.payload?.commentContent || ""}`;
  }
  return "有新消息";
}

function getNotificationMeta(item) {
  if (item.type === "friend_request" || item.type === "friend_accepted") {
    return "";
  }
  return item.payload?.postTitle || "";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateStr));
}

function goDetail(item) {
  if (!item.isRead) {
    store.markAsRead(item.id);
  }
  
  // 根据通知类型进行不同的跳转
  if (item.type === "discussion_reply") {
    emits("open-discussion", item.payload?.postId);
  } else if (item.type === "friend_request" || item.type === "friend_accepted") {
    // 跳转到好友页面
    router.push("/dashboard?tab=friends");
  }
  
  open.value = false;
}

function markAll() {
  store.markAllRead();
}
</script>

<style scoped lang="scss">
.notify-menu {
  position: relative;
}

.bell {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .icon {
    font-size: 1.4rem;
  }
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #f87171;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.panel {
  position: absolute;
  right: 0;
  top: 58px;
  width: 320px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
  border: 1px solid #e2e8f0;
  padding: 16px;
  z-index: 20;

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    strong {
      color: #0f172a;
    }

    .ghost {
      border: none;
      background: transparent;
      color: #2563eb;
      cursor: pointer;
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 360px;
    overflow-y: auto;
  }

  li {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 10px 12px;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;

    &.unread {
      border-color: #60a5fa;
      background: rgba(96, 165, 250, 0.12);
    }

    &:hover {
      border-color: #93c5fd;
    }

    .title {
      display: flex;
      justify-content: space-between;
      margin: 0 0 4px;
      color: #64748b;

      span {
        font-weight: 600;
        color: #0f172a;
      }

      small {
        font-size: 0.75rem;
      }
    }

    .body {
      margin: 0;
      color: #1e293b;
      font-size: 0.9rem;

      span {
        color: #0f172a;
      }
    }

    .meta {
      margin: 4px 0 0;
      font-size: 0.85rem;
      color: #475569;
    }
  }

  .empty {
    text-align: center;
    padding: 30px 0;
    color: #94a3b8;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
