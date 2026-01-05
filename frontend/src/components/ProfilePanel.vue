<template>
  <div class="profile-panel">
    <header>
      <h2>个人资料</h2>
      <p>更新姓名、邮箱、角色或重设密码（可选）。</p>
    </header>

    <form @submit.prevent="handleSubmit">
      <label>
        姓名
        <input v-model="form.fullName" type="text" required />
      </label>

      <label>
        邮箱
        <input v-model="form.email" type="email" required />
      </label>

      <label>
        角色
        <select v-model="form.role">
          <option value="student">学生</option>
          <option value="mentor">导师</option>
        </select>
      </label>

      <label>
        新密码（可选）
        <input v-model="form.password" type="password" minlength="6" placeholder="留空则不修改" />
      </label>

      <button class="primary" type="submit" :disabled="auth.loading">
        {{ auth.loading ? '保存中…' : '保存修改' }}
      </button>

      <p class="status" v-if="status.message" :class="status.type">{{ status.message }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const emit = defineEmits(["saved"]);

const status = reactive({ message: "", type: "" });
const form = reactive({
  fullName: "",
  email: "",
  role: "student",
  password: ""
});

watch(
  () => auth.user,
  (user) => {
    if (!user) return;
    form.fullName = user.fullName;
    form.email = user.email;
    form.role = user.role;
    form.password = "";
  },
  { immediate: true }
);

async function handleSubmit() {
  status.message = "";
  const payload = {
    fullName: form.fullName,
    email: form.email,
    role: form.role
  };

  if (form.password) {
    payload.password = form.password;
  }

  const result = await auth.updateProfile(payload);
  status.message = result.message;
  status.type = result.success ? "success" : "error";

  if (result.success) {
    form.password = "";
    emit("saved");
  }
}
</script>

<style scoped lang="scss">
.profile-panel {
  background: #fff;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 6px;
  }

  p {
    margin: 0;
    color: #6b7280;
  }
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-weight: 600;
  }

  input,
  select {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 1rem;
  }
}

.primary {
  margin-top: 8px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(120deg, #2563eb, #7c3aed);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.status {
  padding: 12px 14px;
  border-radius: 12px;

  &.success {
    background: #ecfccb;
    color: #3f6212;
  }

  &.error {
    background: #fee2e2;
    color: #b91c1c;
  }
}
</style>
