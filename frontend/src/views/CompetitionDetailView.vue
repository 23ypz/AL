<template>
  <div class="competition-detail">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <div class="error-icon">❌</div>
      <h3>加载失败</h3>
      <p>{{ error }}</p>
      <button @click="loadCompetition" class="primary">重试</button>
    </div>
    
    <div v-else-if="competition" class="competition-content">
      <!-- 竞赛头部信息 -->
      <header class="competition-header">
        <div class="header-top">
          <div class="level-badge" :style="{ backgroundColor: levelLabels[competition.level].color }">
            {{ competition.level }}类
          </div>
          <div class="popularity">
            热度 {{ competition.popularity_score }}/10
          </div>
        </div>
        
        <h1 class="competition-title">{{ competition.name }}</h1>
        
        <div class="competition-meta">
          <div class="meta-item">
            <span class="icon">时间</span>
            <span>{{ competition.event_time || '时间待定' }}</span>
          </div>
          <div class="meta-item">
            <span class="icon">主办方</span>
            <span>{{ competition.organizer }}</span>
          </div>
          <div v-if="competition.co_organizer" class="meta-item">
            <span class="icon">承办方</span>
            <span>{{ competition.co_organizer }}</span>
          </div>
          <div class="meta-item">
            <span class="icon">对象</span>
            <span>{{ competition.target_participants || '面向大学生' }}</span>
          </div>
        </div>
      </header>

      <!-- 标签页导航 -->
      <nav class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- 标签页内容 -->
      <main class="tab-content">
        <!-- 基本信息 -->
        <section v-if="activeTab === 'basic'" class="tab-section">
          <div class="info-grid">
            <div class="info-card">
              <h3>竞赛简介</h3>
              <p>{{ competition.description || '暂无简介信息' }}</p>
            </div>
            
            <div class="info-card">
              <h3>官方信息</h3>
              <div class="info-list">
                <div v-if="competition.official_website" class="info-item">
                  <span class="label">官方网站：</span>
                  <a :href="competition.official_website" target="_blank" class="link">
                    {{ competition.official_website }}
                  </a>
                </div>
                <div v-if="competition.contact_email" class="info-item">
                  <span class="label">联系邮箱：</span>
                  <span>{{ competition.contact_email }}</span>
                </div>
                <div v-if="competition.contact_phone" class="info-item">
                  <span class="label">联系电话：</span>
                  <span>{{ competition.contact_phone }}</span>
                </div>
              </div>
            </div>
            
            <div class="info-card">
              <h3>参与统计</h3>
              <div class="stats-list">
                <div class="stat-item">
                  <span class="label">浏览次数：</span>
                  <span class="value">{{ formatNumber(competition.view_count) }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">收藏次数：</span>
                  <span class="value">{{ formatNumber(competition.favorite_count) }}</span>
                </div>
                <div v-if="competition.participant_scale" class="stat-item">
                  <span class="label">参赛规模：</span>
                  <span class="value">{{ competition.participant_scale }}</span>
                </div>
                <div v-if="competition.participating_universities" class="stat-item">
                  <span class="label">参赛高校：</span>
                  <span class="value">{{ competition.participating_universities }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 参赛要求 -->
        <section v-if="activeTab === 'requirements'" class="tab-section">
          <div class="info-grid">
            <div class="info-card">
              <h3>参赛对象</h3>
              <p>{{ competition.target_participants || '暂无限制' }}</p>
            </div>
            
            <div v-if="competition.education_requirement" class="info-card">
              <h3>学历要求</h3>
              <p>{{ competition.education_requirement }}</p>
            </div>
            
            <div v-if="competition.team_requirement" class="info-card">
              <h3>组队要求</h3>
              <p>{{ competition.team_requirement }}</p>
            </div>
            
            <div v-if="competition.registration_fee" class="info-card">
              <h3>报名费用</h3>
              <p>{{ competition.registration_fee }}</p>
            </div>
            
            <div v-if="competition.technical_requirements" class="info-card">
              <h3>技术要求</h3>
              <p>{{ competition.technical_requirements }}</p>
            </div>
          </div>
        </section>

        <!-- 竞赛内容 -->
        <section v-if="activeTab === 'content'" class="tab-section">
          <div class="info-grid">
            <div v-if="competition.competition_format" class="info-card">
              <h3>竞赛形式</h3>
              <p>{{ competition.competition_format }}</p>
            </div>
            
            <div v-if="competition.knowledge_areas" class="info-card">
              <h3>知识领域</h3>
              <p>{{ competition.knowledge_areas }}</p>
            </div>
            
            <div v-if="competition.technical_skills" class="info-card">
              <h3>技术技能</h3>
              <p>{{ competition.technical_skills }}</p>
            </div>
            
            <div v-if="competition.competition_process" class="info-card">
              <h3>竞赛流程</h3>
              <p>{{ competition.competition_process }}</p>
            </div>
          </div>
        </section>

        <!-- 评审奖项 -->
        <section v-if="activeTab === 'awards'" class="tab-section">
          <div class="info-grid">
            <div v-if="competition.evaluation_criteria" class="info-card">
              <h3>评审标准</h3>
              <p>{{ competition.evaluation_criteria }}</p>
            </div>
            
            <div v-if="competition.award_settings" class="info-card">
              <h3>奖项设置</h3>
              <p>{{ competition.award_settings }}</p>
            </div>
            
            <div v-if="competition.award_ratio" class="info-card">
              <h3>获奖比例</h3>
              <p>{{ competition.award_ratio }}</p>
            </div>
          </div>
        </section>

        <!-- 历年数据 -->
        <section v-if="activeTab === 'history'" class="tab-section">
          <div class="info-grid">
            <div v-if="competition.historical_topics" class="info-card">
              <h3>历年题目</h3>
              <p>{{ competition.historical_topics }}</p>
            </div>
            
            <div v-if="competition.growth_trend" class="info-card">
              <h3>增长趋势</h3>
              <p>{{ competition.growth_trend }}</p>
            </div>
          </div>
        </section>
      </main>

      <!-- 操作按钮 -->
      <footer class="action-buttons">
        <button class="primary" @click="handleFavorite">
          收藏竞赛
        </button>
        <button class="secondary" @click="handleReminder">
          设置提醒
        </button>
        <button class="secondary" @click="handleShare">
          分享
        </button>
        
        <!-- 导师专属操作 -->
        <template v-if="auth.user?.role === 'mentor'">
          <button class="edit" @click="handleEdit">
            编辑信息
          </button>
        </template>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCompetitionCenterStore } from '../stores/competitionCenter';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const store = useCompetitionCenterStore();
const auth = useAuthStore();

const activeTab = ref('basic');
const loading = computed(() => store.loading);
const error = computed(() => store.error);
const competition = computed(() => store.currentCompetition);

const tabs = [
  { key: 'basic', label: '基本信息' },
  { key: 'requirements', label: '参赛要求' },
  { key: 'content', label: '竞赛内容' },
  { key: 'awards', label: '评审奖项' },
  { key: 'history', label: '历年数据' }
];

const levelLabels = computed(() => store.levelLabels);

onMounted(() => {
  loadCompetition();
});

async function loadCompetition() {
  const id = route.params.id;
  if (id) {
    await store.fetchCompetitionById(id);
  }
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

function handleFavorite() {
  // TODO: 实现收藏功能
  console.log('收藏竞赛:', competition.value?.name);
}

function handleReminder() {
  // TODO: 实现提醒功能
  console.log('设置提醒:', competition.value?.name);
}

function handleShare() {
  // TODO: 实现分享功能
  console.log('分享竞赛:', competition.value?.name);
}

function handleEdit() {
  // TODO: 跳转到编辑页面或打开编辑模态框
  console.log('编辑竞赛:', competition.value?.name);
}
</script>

<style scoped lang="scss">
.competition-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.loading, .error {
  text-align: center;
  padding: 60px 20px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  .error-icon {
    font-size: 4rem;
    margin-bottom: 16px;
  }

  h3 {
    margin: 0 0 8px 0;
    color: #374151;
  }

  p {
    margin: 0 0 24px 0;
    color: #6b7280;
  }
}

.competition-header {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .level-badge {
    padding: 8px 16px;
    border-radius: 20px;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .popularity {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.9rem;
    color: #ef4444;
    font-weight: 600;
  }

  .competition-title {
    margin: 0 0 20px 0;
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1.3;
  }

  .competition-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: #6b7280;

      .icon {
        font-size: 1rem;
      }
    }
  }
}

.tab-nav {
  background: white;
  padding: 20px 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;

  display: flex;
  gap: 8px;
  overflow-x: auto;

  button {
    padding: 10px 20px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
      background: #f8fafc;
    }

    &.active {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      border-color: #3b82f6;
    }
  }
}

.tab-content {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.tab-section {
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }

  .info-card {
    h3 {
      margin: 0 0 12px 0;
      font-size: 1.1rem;
      color: #1f2937;
    }

    p {
      margin: 0;
      color: #4b5563;
      line-height: 1.6;
    }

    .info-list, .stats-list {
      .info-item, .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f3f4f6;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .value {
          color: #1f2937;
          font-weight: 500;
        }

        .link {
          color: #3b82f6;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }
}

.action-buttons {
  background: white;
  padding: 24px 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  button {
    padding: 12px 24px;
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

    &.edit {
      background: #10b981;
      color: white;

      &:hover {
        background: #059669;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .competition-detail {
    padding: 16px;
  }

  .competition-header {
    padding: 24px;

    .header-top {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .competition-title {
      font-size: 1.5rem;
    }

    .competition-meta {
      flex-direction: column;
      gap: 12px;
    }
  }

  .tab-nav {
    padding: 16px;

    button {
      font-size: 0.8rem;
      padding: 8px 16px;
    }
  }

  .tab-content {
    padding: 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    padding: 20px;
    flex-direction: column;

    button {
      width: 100%;
    }
  }
}
</style>
