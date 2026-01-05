<template>
  <div class="avatar-menu">
    <button class="avatar" @click.stop="toggle">
      <img :src="avatarUrl" alt="avatar" />
    </button>
    <transition name="fade">
      <div v-if="isOpen" class="menu">
        <p class="user-name">{{ displayUser.fullName }}</p>
        <button @click="handleEdit">修改个人信息</button>
        <button @click="handleLogout">退出登录</button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const emits = defineEmits(["edit-profile", "logout", "guest-edit", "guest-logout"]);

const props = defineProps({
  user: { type: Object, default: null }
});

const fallbackUser = { fullName: "访客用户", email: "guest@academic-light.test" };

const isOpen = ref(false);
const displayUser = computed(() => props.user || fallbackUser);
const avatarUrl = computed(() => {
  if (displayUser.value.avatarUrl) {
    return displayUser.value.avatarUrl;
  }
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
    displayUser.value.email || displayUser.value.fullName
  )}`;
});

function toggle() {
  isOpen.value = !isOpen.value;
}

function handleEdit() {
  if (props.user) {
    emits("edit-profile");
  } else {
    emits("guest-edit");
  }
}

function handleLogout() {
  if (props.user) {
    emits("logout");
  } else {
    emits("guest-logout");
  }
}

function handleClickOutside(event) {
  if (!event.target.closest(".avatar-menu")) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped lang="scss">
.avatar-menu {
  position: relative;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
}

.menu {
  position: absolute;
  right: 0;
  top: 60px;
  width: 200px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #e5e7eb;

  .user-name {
    margin: 0;
    font-weight: 600;
    color: #0f172a;
  }

  button {
    border: none;
    background: #f1f5f9;
    border-radius: 12px;
    padding: 10px 12px;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: #e2e8f0;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
