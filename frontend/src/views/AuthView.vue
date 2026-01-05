<template>
  <div class="auth-shell">
    <section class="hero">
      <p class="tag">学术之光 Academic Light</p>
      <h1>欢迎加入学术大家庭</h1>
      <p class="subtitle">
        系统打通竞赛、科研、保研、资源中心等模块。
      </p>
    </section>

    <section class="panel">
      <LoginPanel
        :mode="mode"
        :form="form"
        :status="status"
        :loading="auth.loading"
        @change-mode="mode = $event"
        @submit="handleSubmit"
      />
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import LoginPanel from "../components/LoginPanel.vue";
import { useAuthStore } from "../stores/auth";
import { useFriendStore } from "../stores/friend";
import { usePrivateChatStore } from "../stores/privateChat";
import { useNotificationStore } from "../stores/notifications";

const router = useRouter();
const auth = useAuthStore();
const friendStore = useFriendStore();
const chatStore = usePrivateChatStore();
const notificationStore = useNotificationStore();

const mode = ref("login");
const status = reactive({ message: "", type: "" });

const collegeOptions = [
  "数学与计算机学院",
  "工学院",
  "理学院",
  "商学院",
  "法学院",
  "文学院",
  "新闻学院",
  "艺术学院",
  "医学院",
  "创业学院",
  "化学化工学院"
];

const form = reactive({
  fullName: "",
  email: "",
  password: "",
  role: "student",
  college: collegeOptions[0]
});

function resetStatus() {
  status.message = "";
  status.type = "";
}

// 清理所有store状态
function clearAllStores() {
  friendStore.$reset();
  chatStore.$reset();
  notificationStore.$reset();
}

async function handleSubmit() {
  resetStatus();
  
  const payload = {
    email: form.email,
    password: form.password
  };

  if (mode.value === "register") {
    payload.fullName = form.fullName;
    payload.role = form.role;
    if (form.role === "mentor") {
      payload.college = form.college;
    }
  }

  const result = await auth.authenticate(mode.value, payload);
  status.message = result.message;
  status.type = result.success ? "success" : "error";

  if (result.success) {
    // 登录成功后强制刷新页面，确保状态清理
    window.location.href = '/dashboard';
  }
}
</script>

<style scoped lang="scss">
.auth-shell {
  width: min(1200px, 100%);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 32px;
  box-shadow: 0 40px 120px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(12px);
}

.hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 16px 8px;

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.85rem;
    color: #1d4ed8;
    border: 1px solid rgba(37, 99, 235, 0.25);
    background: rgba(59, 130, 246, 0.08);
  }

  h1 {
    margin: 0;
    font-weight: 700;
    font-size: clamp(2rem, 5vw, 2.6rem);
    line-height: 1.25;
  }

  .subtitle {
    color: #4b5563;
    margin: 0;
    max-width: 460px;
  }
}

.panel {
  background: #fff;
  border-radius: 28px;
  padding: 32px;
  border: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .auth-shell {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .panel {
    padding: 24px;
  }
}
</style>
