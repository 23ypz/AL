<template>
  <div class="login-panel">
    <div class="tabs">
      <button :class="{ active: mode === 'login' }" @click="emit('change-mode', 'login')">
        登录
      </button>
      <button :class="{ active: mode === 'register' }" @click="emit('change-mode', 'register')">
        注册
      </button>
    </div>

    <form @submit.prevent="emit('submit')">
      <label v-if="mode === 'register'">
        姓名
        <input
          v-model="form.fullName"
          type="text"
          placeholder="如：李明"
          required
        />
      </label>

      <label>
        邮箱
        <input
          v-model="form.email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </label>

      <label>
        密码
        <input
          v-model="form.password"
          type="password"
          placeholder="不少于 6 位"
          minlength="6"
          required
        />
      </label>

      <label v-if="mode === 'register'">
        角色
        <select v-model="form.role">
          <option value="student">学生</option>
          <option value="mentor">导师</option>
        </select>
      </label>

      <label v-if="mode === 'register' && form.role === 'mentor'">
        所属学院
        <select v-model="form.college">
          <option v-for="college in colleges" :key="college" :value="college">
            {{ college }}
          </option>
        </select>
      </label>

      <button class="primary" type="submit" :disabled="loading">
        {{ loading ? '提交中…' : mode === 'login' ? '立即登录' : '立即注册' }}
      </button>
    </form>

    <p class="status" v-if="status.message" :class="status.type">
      {{ status.message }}
    </p>
  </div>
</template>

<script setup>
import { toRefs } from "vue";

const props = defineProps({
  mode: { type: String, required: true },
  form: { type: Object, required: true },
  status: { type: Object, required: true },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(["change-mode", "submit"]);

const { mode, form, status, loading } = toRefs(props);
const colleges = [
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
</script>

<style scoped lang="scss">
.login-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 4px;
  gap: 6px;

  button {
    border: none;
    border-radius: 999px;
    padding: 12px 0;
    background: transparent;
    font-weight: 600;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.2s ease;

    &.active {
      background: linear-gradient(120deg, #2563eb, #22d3ee);
      color: #fff;
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
    }
  }
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;

  label {
    display: flex;
    flex-direction: column;
    font-weight: 600;
    color: #1f2937;
    gap: 6px;
  }

  input,
  select {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 1rem;
    transition: border 0.2s ease;

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 18px 40px rgba(99, 102, 241, 0.25);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.status {
  margin-top: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 500;
  text-align: center;

  &.success {
    background: #ecfccb;
    color: #3f6212;
  }

  &.error {
    background: #fee2e2;
    color: #b91c1c;
  }

  &.info {
    background: #e0f2fe;
    color: #075985;
  }
}
</style>
