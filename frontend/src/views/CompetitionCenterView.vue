<template>
  <div class="competition-center">
    <header class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>竞赛中心</h1>
          <p>教育部认定大学生竞赛官方展示平台</p>
        </div>
        <div v-if="auth.user?.role === 'mentor'" class="mentor-actions">
          <button class="primary" @click="showAddModal = true">
            新增竞赛
          </button>
          <button class="secondary" @click="showManagePanel = true">
            管理面板
          </button>
        </div>
      </div>
    </header>

    <!-- 搜索筛选区域 -->
    <section class="search-section">
      <div class="search-bar">
        <div class="search-input">
          <input
            v-model="filters.search"
            type="text"
            placeholder="搜索竞赛名称、主办方..."
            @input="handleSearch"
          />
        </div>
        <div class="filter-group">
          <select v-model="filters.level" @change="handleFilter">
            <option value="">所有级别</option>
            <option value="A">A类 - 国家级重大赛事</option>
            <option value="B">B类 - 国家级一般赛事</option>
            <option value="C">C类 - 省级赛事</option>
            <option value="D">D类 - 校级赛事</option>
          </select>
          <select v-model="filters.category" @change="handleFilter">
            <option value="">所有类别</option>
            <option value="科技创新">科技创新</option>
            <option value="文艺体育">文艺体育</option>
            <option value="社会实践">社会实践</option>
            <option value="学术研究">学术研究</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 统计概览 -->
    <section v-if="stats" class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">竞赛</div>
          <div class="stat-content">
            <h3>{{ stats.basic.total }}</h3>
            <p>竞赛总数</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">新增</div>
          <div class="stat-content">
            <h3>+{{ stats.monthly.monthly_new }}</h3>
            <p>本月新增</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">热门</div>
          <div class="stat-content">
            <h3>{{ stats.popular[0]?.name || '暂无' }}</h3>
            <p>热门竞赛</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">浏览</div>
          <div class="stat-content">
            <h3>{{ formatNumber(stats.basic.total_views) }}</h3>
            <p>总浏览量</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 分类标签 -->
    <section class="category-tabs">
      <div class="tabs">
        <button
          v-for="level in ['A', 'B', 'C', 'D']"
          :key="level"
          :class="{ active: activeLevel === level }"
          @click="setActiveLevel(level)"
        >
          {{ levelLabels[level].text }}
        </button>
        <button
          :class="{ active: activeLevel === 'all' }"
          @click="setActiveLevel('all')"
        >
          全部竞赛
        </button>
      </div>
    </section>

    <div class="layout">
      <main class="competitions-section">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="filteredCompetitions.length === 0" class="empty-state">
          <div class="empty-icon">搜索</div>
          <h3>暂无相关竞赛</h3>
          <p>试试调整筛选条件或搜索关键词</p>
        </div>
        
        <div v-else class="competitions-grid">
          <CompetitionCard
            v-for="competition in filteredCompetitions"
            :key="competition.id"
            :competition="competition"
            :is-favorited="favoritesStore.isFavorited(competition.id)"
            @view="viewCompetition"
            @edit="editCompetition"
            @delete="deleteCompetition"
            @favorite="handleFavorite"
          />
        </div>

        <!-- 分页 -->
        <div v-if="pagination.pages > 1" class="pagination">
          <button
            :disabled="pagination.current <= 1"
            @click="changePage(pagination.current - 1)"
          >
            上一页
          </button>
          
          <!-- 页码按钮 -->
          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              :class="{ active: page === pagination.current }"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
            <span v-else class="page-ellipsis">...</span>
          </template>
          
          <button
            :disabled="pagination.current >= pagination.pages"
            @click="changePage(pagination.current + 1)"
          >
            下一页
          </button>
          
          <span class="page-info">
            {{ pagination.current }} / {{ pagination.pages }}
          </span>
        </div>
      </main>

      <!-- 我的收藏栏 -->
      <aside class="favorites-sidebar" v-if="showFavorites">
        <div class="favorites-header">
          <h3>我的收藏</h3>
          <button class="close-btn" @click="showFavorites = false">×</button>
        </div>
        
        <div class="favorites-content">
          <div v-if="favoritesStore.loading" class="loading">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
          
          <div v-else-if="favoritesStore.favorites.length === 0" class="empty-favorites">
            <div class="empty-icon">收藏</div>
            <h4>暂无收藏</h4>
            <p>点击竞赛卡片上的收藏按钮</p>
          </div>
          
          <div v-else class="favorites-list">
            <div
              v-for="favorite in favoritesStore.favorites"
              :key="favorite.id"
              class="favorite-item"
              @click="viewCompetition(favorite)"
            >
              <div class="favorite-info">
                <h4>{{ favorite.name }}</h4>
                <div class="favorite-meta">
                  <span class="level" :style="{ backgroundColor: levelLabels[favorite.level].color }">
                    {{ favorite.level }}类
                  </span>
                  <span class="organizer">{{ favorite.organizer }}</span>
                </div>
                <div class="favorite-time">
                  收藏于 {{ formatTime(favorite.favorited_at) }}
                </div>
              </div>
              <button 
                class="unfavorite-btn"
                @click.stop="handleFavorite(favorite)"
                title="取消收藏"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- 收藏按钮 -->
      <button 
        class="favorites-toggle"
        @click="toggleFavorites"
        :class="{ active: showFavorites }"
        title="我的收藏"
      >
        收藏 ({{ favoritesStore.favoriteCount }})
      </button>
    </div>

    <!-- 回到顶部按钮 -->
    <button 
      v-if="showBackToTop" 
      class="back-to-top"
      @click="scrollToTop"
      title="回到顶部"
    >
      ↑
    </button>

    <!-- 新增/编辑竞赛模态框 -->
    <CompetitionModal
      v-if="showAddModal || showEditModal"
      :competition="editCompetitionData"
      :is-edit="showEditModal"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- 管理面板 -->
    <ManagePanel
      v-if="showManagePanel"
      @close="showManagePanel = false"
      @addCompetition="handleManagePanelAddCompetition"
      @importCompetitions="handleImportCompetitions"
      @viewStats="handleViewStats"
      @syncData="handleSyncData"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCompetitionCenterStore } from '../stores/competitionCenter';
import { useAuthStore } from '../stores/auth';
import CompetitionCard from '../components/CompetitionCard.vue';
import CompetitionModal from '../components/CompetitionModal.vue';
import ManagePanel from '../components/ManagePanel.vue';
import { useFavoritesStore } from '../stores/favorites';

const router = useRouter();
const store = useCompetitionCenterStore();
const auth = useAuthStore();
const favoritesStore = useFavoritesStore();

const activeLevel = ref('all');
const showAddModal = ref(false);
const showEditModal = ref(false);
const showManagePanel = ref(false);
const editCompetitionData = ref(null);
const showBackToTop = ref(false);
const showFavorites = ref(false);

const filters = computed({
  get: () => store.filters,
  set: (value) => store.setFilters(value)
});

const loading = computed(() => store.loading);
const stats = computed(() => store.stats);
const pagination = computed(() => store.pagination);
const levelLabels = computed(() => store.levelLabels);

const filteredCompetitions = computed(() => {
  if (activeLevel.value === 'all') {
    return store.competitions;
  }
  return store.competitions.filter(comp => comp.level === activeLevel.value);
});

// 计算可见的页码
const visiblePages = computed(() => {
  const current = pagination.value.current;
  const total = pagination.value.pages;
  const delta = 2; // 当前页前后显示的页码数
  
  let pages = [];
  
  if (total <= 7) {
    // 总页数少于等于7，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // 总页数大于7，智能显示
    if (current <= delta + 2) {
      // 当前页在前部
      for (let i = 1; i <= delta * 2 + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    } else if (current >= total - delta - 1) {
      // 当前页在后部
      pages.push(1);
      pages.push('...');
      for (let i = total - delta * 2; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // 当前页在中间
      pages.push(1);
      pages.push('...');
      for (let i = current - delta; i <= current + delta; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    }
  }
  
  return pages;
});

onMounted(async () => {
  // 初始化favorites store的token
  const token = localStorage.getItem("academic_light_token");
  if (token) {
    favoritesStore.updateToken(token);
  }
  
  await Promise.all([
    store.fetchCompetitions(),
    store.fetchStats()
  ]);
  
  // 监听滚动事件
  window.addEventListener('scroll', handleScroll);
});

// 监听页面滚动
function handleScroll() {
  showBackToTop.value = window.scrollY > 300;
}

// 处理搜索
function handleSearch() {
  clearTimeout(handleSearch.timer);
  handleSearch.timer = setTimeout(() => {
    store.fetchCompetitions();
  }, 500);
}

// 处理筛选
function handleFilter() {
  store.fetchCompetitions();
}

// 设置活跃级别
function setActiveLevel(level) {
  activeLevel.value = level;
}

// 查看竞赛详情
function viewCompetition(competition) {
  router.push(`/competition-center/${competition.id}`);
}

// 编辑竞赛
function editCompetition(competition) {
  editCompetitionData.value = competition;
  showEditModal.value = true;
}

// 删除竞赛
async function deleteCompetition(competition) {
  const confirmed = window.confirm(`确定删除竞赛「${competition.name}」吗？`);
  if (!confirmed) return;
  
  const result = await store.deleteCompetition(competition.id);
  if (result.success) {
    // 显示成功提示
    console.log(result.message);
  }
}

// 保存竞赛
async function handleSave(competitionData) {
  let result;
  
  if (showEditModal.value) {
    result = await store.updateCompetition(editCompetitionData.value.id, competitionData);
  } else {
    result = await store.createCompetition(competitionData);
  }
  
  if (result.success) {
    closeModal();
  }
}

// 关闭模态框
function closeModal() {
  showAddModal.value = false;
  showEditModal.value = false;
  editCompetitionData.value = null;
}

// 处理管理面板的新增竞赛
function handleManagePanelAddCompetition() {
  showManagePanel.value = false;
  setTimeout(() => {
    showAddModal.value = true;
  }, 100);
}

// 处理批量导入
function handleImportCompetitions() {
  console.log('批量导入功能');
}

// 处理查看统计
function handleViewStats() {
  console.log('查看详细统计');
}

// 处理数据同步
function handleSyncData() {
  store.fetchStats();
}

// 切换页码
function changePage(page) {
  if (page < 1 || page > pagination.value.pages || page === pagination.value.current) {
    return;
  }
  
  store.setPage(page);
  store.fetchCompetitions();
  
  // 滚动到顶部
  scrollToTop();
}

// 滚动到页面顶部
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// 格式化数字
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

// 处理收藏
async function handleFavorite(competition) {
  const result = await favoritesStore.toggleFavorite(competition.id);
  if (result.success) {
    console.log(result.message);
  }
}

// 切换收藏栏
function toggleFavorites() {
  showFavorites.value = !showFavorites.value;
  if (showFavorites.value) {
    favoritesStore.fetchFavorites();
  }
}

// 格式化时间
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
</script>

<style scoped lang="scss">
.competition-center {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.layout {
  display: flex;
  gap: 24px;
  position: relative;
}

.competitions-section {
  flex: 1;
  min-width: 0;
}

.favorites-sidebar {
  width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  height: fit-content;
  max-height: 80vh;
  overflow-y: auto;
  position: sticky;
  top: 24px;

  .favorites-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;

    h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #1f2937;
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

  .favorites-content {
    padding: 20px;

    .loading {
      text-align: center;
      padding: 40px 20px;

      .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }

      p {
        color: #6b7280;
        font-size: 0.9rem;
        margin: 0;
      }
    }

    .empty-favorites {
      text-align: center;
      padding: 40px 20px;

      .empty-icon {
        font-size: 3rem;
        margin-bottom: 16px;
        color: #9ca3af;
      }

      h4 {
        margin: 0 0 8px 0;
        color: #374151;
        font-size: 1.1rem;
      }

      p {
        margin: 0;
        color: #6b7280;
        font-size: 0.9rem;
      }
    }

    .favorites-list {
      .favorite-item {
        padding: 16px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;

        &:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .favorite-info {
          padding-right: 40px;

          h4 {
            margin: 0 0 8px 0;
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.4;
          }

          .favorite-meta {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;

            .level {
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 0.75rem;
              font-weight: 600;
              color: white;
            }

            .organizer {
              font-size: 0.8rem;
              color: #6b7280;
            }
          }

          .favorite-time {
            font-size: 0.8rem;
            color: #9ca3af;
          }
        }

        .unfavorite-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: #ef4444;
          color: white;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;

          &:hover {
            background: #dc2626;
          }
        }
      }
    }
  }
}

.favorites-toggle {
  position: fixed;
  top: 50%;
  right: 24px;
  transform: translateY(-50%);
  padding: 12px 20px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  z-index: 90;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  &:hover {
    transform: translateY(-50%) translateY(-2px);
    box-shadow: 0 6px 30px rgba(59, 130, 246, 0.4);
  }

  &.active {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }
}

@media (max-width: 1024px) {
  .layout {
    flex-direction: column;
  }

  .favorites-sidebar {
    width: 100%;
    position: static;
    max-height: 400px;
    margin-bottom: 24px;
  }

  .favorites-toggle {
    position: static;
    transform: none;
    margin: 0 auto 24px;
    width: fit-content;
  }
}

.page-header {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 40px;
  border-radius: 20px;
  margin-bottom: 32px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }

  .title-section h1 {
    margin: 0 0 8px 0;
    font-size: 2.8rem;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    letter-spacing: -0.02em;
  }

  .title-section p {
    margin: 0;
    font-size: 1.2rem;
    opacity: 0.9;
    font-weight: 400;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }

  .mentor-actions {
    display: flex;
    gap: 12px;

    button {
      padding: 14px 28px;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      letter-spacing: 0.01em;

      &.primary {
        background: white;
        color: #3b82f6;
        font-weight: 600;

        &:hover {
          background: #f8fafc;
        }
      }

      &.secondary {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);

        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }
}

.search-section {
  background: white;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 32px;

  .search-bar {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;

    .search-input {
      flex: 1;
      min-width: 300px;
      position: relative;

      input {
        width: 100%;
        padding: 16px 20px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 1.05rem;
        outline: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
        font-weight: 400;
        transition: all 0.2s;

        &:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }
      }
    }

    .filter-group {
      display: flex;
      gap: 16px;

      select {
        padding: 16px 20px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 500;
        outline: none;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
        transition: all 0.2s;
        background: white;

        &:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }
  }
}

.stats-section {
  margin-bottom: 32px;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
  }

  .stat-card {
    background: white;
    padding: 28px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 20px;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .stat-icon {
      font-size: 2.8rem;
      width: 60px;
      text-align: center;
      font-weight: 600;
      color: #6b7280;
    }

    .stat-content h3 {
      margin: 0 0 6px 0;
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      letter-spacing: -0.02em;
    }

    .stat-content p {
      margin: 0;
      color: #6b7280;
      font-size: 1rem;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    }
  }
}

.category-tabs {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 32px;

  .tabs {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    button {
      padding: 12px 24px;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      letter-spacing: 0.01em;

      &:hover {
        background: #f8fafc;
        border-color: #d1d5db;
      }

      &.active {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        border-color: #3b82f6;
        font-weight: 700;
      }
    }
  }
}

.competitions-section {
  min-height: 400px;

  .loading {
    text-align: center;
    padding: 80px 20px;

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    p {
      color: #6b7280;
      font-size: 1.1rem;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    }
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
      color: #9ca3af;
    }

    h3 {
      margin: 0 0 12px 0;
      color: #374151;
      font-size: 1.4rem;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    }

    p {
      margin: 0;
      color: #6b7280;
      font-size: 1rem;
      font-weight: 400;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    }
  }

  .competitions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 32px;
    flex-wrap: wrap;

    button {
      padding: 10px 16px;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.95rem;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      min-width: 44px;
      height: 44px;

      &:hover:not(:disabled) {
        background: #f8fafc;
        border-color: #d1d5db;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #f9fafb;
      }

      &.active {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        border-color: #3b82f6;
        font-weight: 600;
      }
    }

    .page-info {
      color: #6b7280;
      font-size: 0.95rem;
      font-weight: 500;
      padding: 0 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    }

    .page-ellipsis {
      color: #9ca3af;
      padding: 0 8px;
      font-weight: 500;
    }
  }
}

.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  z-index: 100;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(59, 130, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .competition-center {
    padding: 16px;
  }

  .page-header {
    padding: 24px;

    .title-section h1 {
      font-size: 2rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .search-section .search-bar {
    flex-direction: column;

    .search-input {
      min-width: 100%;
    }

    .filter-group {
      width: 100%;
      justify-content: space-between;
    }
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .competitions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
