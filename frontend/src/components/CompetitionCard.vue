<template>
  <div class="competition-card" :class="{ 'hot': competition.popularity_score >= 9.0 }">
    <div class="card-header">
      <div class="level-badge" :style="{ backgroundColor: levelLabels[competition.level].color }">
        {{ competition.level }}类
      </div>
      <div class="popularity">
        热度 {{ competition.popularity_score }}/10
      </div>
    </div>

    <div class="card-content">
      <h3 class="competition-name">{{ competition.name }}</h3>
      
      <div class="competition-meta">
        <div class="meta-item">
          <span class="icon">时间</span>
          <span>{{ competition.event_time || '时间待定' }}</span>
        </div>
        <div class="meta-item">
          <span class="icon">主办方</span>
          <span>{{ competition.organizer }}</span>
        </div>
        <div class="meta-item">
          <span class="icon">对象</span>
          <span>{{ competition.target_participants || '面向大学生' }}</span>
        </div>
      </div>

      <p class="competition-description">
        {{ competition.description || '暂无简介' }}
      </p>

      <div class="competition-stats">
        <div class="stat">
          <span class="icon">浏览</span>
          <span>{{ formatNumber(competition.view_count) }}</span>
        </div>
        <div class="stat">
          <span class="icon">收藏</span>
          <span>{{ formatNumber(competition.favorite_count) }}</span>
        </div>
      </div>
    </div>

    <div class="card-actions">
      <button class="primary" @click="handleView">
        查看详情
      </button>
      
      <button class="secondary" @click="handleFavorite">
        {{ isFavorited ? '已收藏' : '收藏' }}
      </button>
      <button class="secondary" @click="handleReminder">
        设置提醒
      </button>

      <!-- 导师专属操作 -->
      <template v-if="auth.user?.role === 'mentor'">
        <button class="edit" @click="handleEdit">
          编辑
        </button>
        <button class="delete" @click="handleDelete">
          删除
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCompetitionCenterStore } from '../stores/competitionCenter';
import { useAuthStore } from '../stores/auth';

const props = defineProps({
  competition: {
    type: Object,
    required: true
  },
  isFavorited: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['view', 'edit', 'delete', 'favorite']);

const store = useCompetitionCenterStore();
const auth = useAuthStore();

const levelLabels = computed(() => store.levelLabels);

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

function handleView() {
  emit('view', props.competition);
}

function handleEdit() {
  emit('edit', props.competition);
}

function handleDelete() {
  emit('delete', props.competition);
}

function handleFavorite() {
  emit('favorite', props.competition);
}

function handleReminder() {
  // TODO: 实现提醒功能
  console.log('设置提醒:', props.competition.name);
}
</script>

<style scoped lang="scss">
.competition-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }

  &.hot {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fff 0%, #fef2f2 100%);

    .level-badge {
      animation: pulse 2s infinite;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .level-badge {
    padding: 6px 12px;
    border-radius: 20px;
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .popularity {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    color: #ef4444;
    font-weight: 600;
  }
}

.card-content {
  margin-bottom: 20px;

  .competition-name {
    margin: 0 0 16px 0;
    font-size: 1.3rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    letter-spacing: -0.01em;
  }

  .competition-meta {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.95rem;
      color: #6b7280;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;

      .icon {
        font-size: 1rem;
        font-weight: 600;
        color: #9ca3af;
      }
    }
  }

  .competition-description {
    color: #4b5563;
    font-size: 0.95rem;
    line-height: 1.6;
    margin: 0 0 16px 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-weight: 400;
  }

  .competition-stats {
    display: flex;
    gap: 16px;

    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #6b7280;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;

      .icon {
        font-size: 0.9rem;
        font-weight: 600;
        color: #9ca3af;
      }
    }
  }
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  button {
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    letter-spacing: 0.01em;

    &.primary {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;

      &:hover {
        opacity: 0.9;
      }
    }

    &.secondary {
      background: #f3f4f6;
      color: #4b5563;
      border: 1px solid #e5e7eb;

      &:hover {
        background: #e5e7eb;
      }
    }

    &.edit {
      background: #10b981;
      color: white;

      &:hover {
        background: #059669;
      }
    }

    &.delete {
      background: #ef4444;
      color: white;

      &:hover {
        background: #dc2626;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@media (max-width: 768px) {
  .competition-card {
    padding: 20px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .competition-meta {
    .meta-item {
      font-size: 0.8rem;
    }
  }

  .card-actions {
    button {
      font-size: 0.75rem;
      padding: 6px 10px;
    }
  }
}
</style>
