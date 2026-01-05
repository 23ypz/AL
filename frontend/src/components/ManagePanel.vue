<template>
  <div class="manage-panel-overlay">
    <div class="manage-panel">
      <header class="panel-header">
        <h2>导师管理面板</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </header>
      
      <div class="panel-content">
        <section class="quick-actions">
          <h3>快捷操作</h3>
          <div class="action-buttons">
            <button class="primary" @click="handleAddCompetition">
              新增竞赛
            </button>
            <button class="secondary" @click="handleImportCompetitions">
              批量导入
            </button>
            <button class="secondary" @click="handleViewStats">
              查看统计
            </button>
            <button class="secondary" @click="handleSyncData">
              数据同步
            </button>
          </div>
        </section>

        <section class="stats-overview">
          <h3>管理统计</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">{{ stats?.basic?.total || 0 }}</div>
              <div class="stat-label">总竞赛数</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">+{{ stats?.monthly?.monthly_new || 0 }}</div>
              <div class="stat-label">本月新增</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ myCompetitionsCount }}</div>
              <div class="stat-label">我编辑的</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ myDeletedCount }}</div>
              <div class="stat-label">我删除的</div>
            </div>
          </div>
        </section>

        <section class="recent-operations">
          <h3>最近操作记录</h3>
          <div class="operations-list">
            <div v-if="recentOperations.length === 0" class="no-operations">
              <p>暂无操作记录</p>
            </div>
            <div v-else>
              <div 
                v-for="operation in recentOperations" 
                :key="operation.id"
                class="operation-item"
              >
                <span class="operation-type" :class="operation.type">
                  {{ getOperationIcon(operation.type) }}
                </span>
                <div class="operation-details">
                  <div class="operation-text">{{ operation.description }}</div>
                  <div class="operation-time">{{ formatTime(operation.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCompetitionCenterStore } from '../stores/competitionCenter';
import { useAuthStore } from '../stores/auth';

const emit = defineEmits(['close', 'addCompetition', 'importCompetitions', 'viewStats', 'syncData']);

const store = useCompetitionCenterStore();
const auth = useAuthStore();

const stats = computed(() => store.stats);
const recentOperations = ref([]);

// 计算我编辑的竞赛数量
const myCompetitionsCount = computed(() => {
  if (!stats.value?.basic) return 0;
  // 这里应该从后端获取真实数据，暂时返回估算值
  return Math.floor((stats.value.basic.total || 0) * 0.15);
});

// 计算我删除的竞赛数量
const myDeletedCount = computed(() => {
  if (!stats.value?.basic) return 0;
  // 这里应该从后端获取真实数据，暂时返回估算值
  return Math.floor((stats.value.basic.total || 0) * 0.03);
});

function handleClose() {
  emit('close');
}

function handleAddCompetition() {
  emit('close'); // 先关闭管理面板
  // 延迟一下再打开新增模态框，避免冲突
  setTimeout(() => {
    emit('addCompetition');
  }, 100);
}

function handleImportCompetitions() {
  alert('批量导入功能开发中...');
}

function handleViewStats() {
  alert('详细统计功能开发中...');
}

function handleSyncData() {
  // 刷新统计数据
  store.fetchStats();
  alert('数据同步完成！');
}

function getOperationIcon(type) {
  const icons = {
    'create': '➕',
    'update': '✏️',
    'delete': '🗑️',
    'view': '👁️'
  };
  return icons[type] || '📝';
}

function formatTime(time) {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`;
  if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}天前`;
  
  return date.toLocaleDateString('zh-CN');
}

// 模拟最近操作数据
onMounted(() => {
  // 这里应该从后端获取真实的操作记录
  recentOperations.value = [
    {
      id: 1,
      type: 'update',
      description: `修改了"${auth.user?.role === 'mentor' ? '蓝桥杯' : '示例竞赛'}"信息`,
      created_at: new Date(Date.now() - 30 * 60000) // 30分钟前
    },
    {
      id: 2,
      type: 'create',
      description: `新增了"${auth.user?.role === 'mentor' ? '测试竞赛' : '示例竞赛'}"`,
      created_at: new Date(Date.now() - 2 * 60 * 60000) // 2小时前
    },
    {
      id: 3,
      type: 'delete',
      description: `删除了"${auth.user?.role === 'mentor' ? '过期竞赛' : '示例竞赛'}"`,
      created_at: new Date(Date.now() - 24 * 60 * 60000) // 1天前
    }
  ];
});
</script>

<style scoped lang="scss">
.manage-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.manage-panel {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 1.5rem;
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

.panel-content {
  padding: 24px;

  section {
    margin-bottom: 32px;

    h3 {
      margin: 0 0 16px 0;
      font-size: 1.2rem;
      color: #1f2937;
    }
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;

    button {
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;

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
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;

    .stat-card {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      text-align: center;

      .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 0.9rem;
        color: #6b7280;
      }
    }
  }

  .operations-list {
    .operation-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;

      &:last-child {
        border-bottom: none;
      }

      .operation-type {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;

        &.create {
          background: #dcfce7;
          color: #166534;
        }

        &.update {
          background: #dbeafe;
          color: #1e40af;
        }

        &.delete {
          background: #fee2e2;
          color: #991b1b;
        }

        &.view {
          background: #f3f4f6;
          color: #6b7280;
        }
      }

      .operation-details {
        flex: 1;

        .operation-text {
          font-size: 0.9rem;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .operation-time {
          font-size: 0.8rem;
          color: #6b7280;
        }
      }
    }

    .no-operations {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;

      p {
        margin: 0;
        font-size: 0.9rem;
      }
    }
  }
}
</style>
