<template>
  <div class="dashboard">
    <header>
      <div>
        <p class="eyebrow">欢迎回来</p>
        <h2>{{ user.fullName }} · {{ roleLabel }}</h2>
        <p class="meta">加入时间：{{ formatDate(user.joinedAt) }}</p>
      </div>
      <button class="ghost" @click="$emit('logout')">退出登录</button>
    </header>

    <div class="grid">
      <article class="card">
        <h3>竞赛情报板</h3>
        <ul>
          <li>
            <strong>ACM/ICPC</strong>
            <span>本周报名截止 · 查看备赛资料</span>
          </li>
          <li>
            <strong>互联网+</strong>
            <span>优秀案例复盘已更新</span>
          </li>
        </ul>
      </article>

      <article class="card">
        <h3>科研协作</h3>
        <ul>
          <li><strong>导师课题</strong><span>3 个开放名额</span></li>
          <li><strong>实验室开放日</strong><span>1 月 5 日预约通道开启</span></li>
        </ul>
      </article>

      <article class="card">
        <h3>保研经验</h3>
        <ul>
          <li><strong>夏令营时间轴</strong><span>新增 2025 计划</span></li>
          <li><strong>面试题回顾</strong><span>数学建模方向更新 4 篇</span></li>
        </ul>
      </article>
    </div>

    <footer class="status" v-if="status.message" :class="status.type">
      {{ status.message }}
    </footer>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  user: { type: Object, required: true },
  token: { type: String, required: true },
  status: { type: Object, required: true }
});

defineEmits(["logout"]);

const roleLabel = computed(() => {
  switch (props.user.role) {
    case "mentor":
      return "导师";
    case "admin":
      return "管理员";
    default:
      return "学生";
  }
});

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(value));
}
</script>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  .eyebrow {
    margin: 0;
    font-size: 0.9rem;
    color: #64748b;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h2 {
    margin: 6px 0 4px;
  }

  .meta {
    margin: 0;
    color: #6b7280;
    font-size: 0.95rem;
  }
}

.ghost {
  border: 1px solid #cbd5f5;
  background: transparent;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2563eb;
    color: #2563eb;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 20px;
  background: #f8fafc;

  h3 {
    margin-top: 0;
  }

  ul {
    list-style: none;
    padding-left: 0;
    margin: 12px 0 0;
    display: flex;
    flex-direction: column;
    gap: 12px;

    li {
      display: flex;
      flex-direction: column;
      gap: 4px;

      span {
        color: #64748b;
        font-size: 0.9rem;
      }
    }
  }
}

.status {
  padding: 14px 16px;
  border-radius: 14px;
  background: #ecfccb;
  color: #3f6212;
}
</style>
