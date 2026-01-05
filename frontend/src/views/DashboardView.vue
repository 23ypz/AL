<template>
  <div class="dashboard-shell">
    <header class="topbar">
      <div class="brand">
        <span class="logo">AL</span>
        <div>
          <!-- <p class="subtitle">Academic Light</p> -->
          <h1>科研资源&竞赛协作工作台</h1>
        </div>
      </div>
      <div class="top-actions" v-if="auth.user">
        <NotificationBell @open-discussion="handleNotificationOpen" />
        <UserAvatarMenu
          :user="auth.user"
          @logout="logout"
          @edit-profile="openProfileSettings"
        />
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <nav>
          <p class="section">总览</p>
          <button :class="{ active: selectedSection === 'dashboard' }" @click="selectSection('dashboard')">
            仪表盘
          </button>
          <button :class="{ active: selectedSection === 'competitions' }" @click="selectSection('competitions')">
            竞赛情报
          </button>
          <button :class="{ active: selectedSection === 'competition-center' }" @click="selectSection('competition-center')">
            竞赛中心
          </button>
          <button :class="{ active: selectedSection === 'research' }" @click="selectSection('research')">
            科研项目
          </button>
          <button :class="{ active: selectedSection === 'postgraduate' }" @click="selectSection('postgraduate')">
            保研经验
          </button>
          <button :class="{ active: selectedSection === 'discussion' }" @click="selectSection('discussion')">
            交流广场
          </button>
          <button :class="{ active: selectedSection === 'friends' }" @click="selectSection('friends')">
            我的好友
          </button>
          <button :class="{ active: selectedSection === 'profile' }" @click="selectSection('profile')">
            个人信息
          </button>
          <button>资源中心</button>
        </nav>
        <nav>
          <p class="section">系统</p>
          <button>通知中心</button>
          <button>团队空间</button>
          <button :class="{ active: selectedSection === 'settings' }" @click="selectSection('settings')">
            设置
          </button>
        </nav>
      </aside>

      <main>
        <template v-if="selectedSection === 'dashboard'">
          <section class="hero">
            <h2>欢迎回来，{{ auth.user?.fullName }}</h2>
            <p>实时概览你的竞赛报名与科研申请进度，及时跟进导师与队友反馈。</p>
          </section>

          <section class="cards" v-if="!dashboardLoading">
            <article>
              <header>
                <p>竞赛进度</p>
                <strong>{{ upcomingCompetitions.length }} 个待报名</strong>
              </header>
              <ul>
                <li v-for="competition in upcomingCompetitions" :key="competition.id">
                  <strong>{{ competition.title }}</strong>
                  <span>截止 {{ formatDate(competition.deadline) }}</span>
                </li>
                <li v-if="upcomingCompetitions.length === 0" class="empty">暂无即将截止的竞赛</li>
              </ul>
            </article>

            <article>
              <header>
                <p>科研协作</p>
                <strong>{{ myApplications.length }} 个申请</strong>
              </header>
              <ul>
                <li v-for="application in myApplications" :key="application.projectId">
                  <strong>{{ application.projectTitle }}</strong>
                  <span>{{ application.stage }} · 尝试联系导师</span>
                </li>
                <li v-if="myApplications.length === 0" class="empty">还没有科研申请记录</li>
              </ul>
            </article>

            <article>
              <header>
                <p>导师发布</p>
                <strong>{{ myMentorItems.length }} 个进行中</strong>
              </header>
              <ul>
                <li v-for="item in myMentorItems" :key="item.id">
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.type }} · {{ item.college }}</span>
                </li>
                <li v-if="myMentorItems.length === 0" class="empty">导师发布数据为空</li>
              </ul>
            </article>
          </section>

          <section v-else class="cards loading-block">
            <p>仪表盘数据加载中...</p>
          </section>
        </template>

        <CompetitionPanel
          v-else-if="selectedSection === 'competitions'"
        />

        <CompetitionCenterView
          v-else-if="selectedSection === 'competition-center'"
        />

        <ResearchPanel
          v-else-if="selectedSection === 'research'"
        />

        <PostgraduatePanel
          v-else-if="selectedSection === 'postgraduate'"
        />

        <DiscussionPanel
          v-else-if="selectedSection === 'discussion'"
          ref="discussionPanelRef"
        />

        <FriendPanel
          v-else-if="selectedSection === 'friends'"
        />

        <ProfileView
          v-else-if="selectedSection === 'profile'"
        />

        <SettingsPanel
          v-else-if="selectedSection === 'settings'"
          :active-item="settingsSection"
          @select-item="settingsSection = $event"
        >
          <template v-if="settingsSection === 'profile'">
            <ProfilePanel @saved="handleProfileSaved" />
          </template>
          <template v-else>
            <div class="placeholder">
              <p>该设置页正在规划中，先完成个人资料模块。</p>
            </div>
          </template>
        </SettingsPanel>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useCompetitionStore } from "../stores/competition";
import { useResearchStore } from "../stores/research";
import UserAvatarMenu from "../components/UserAvatarMenu.vue";
import ProfilePanel from "../components/ProfilePanel.vue";
import SettingsPanel from "../components/SettingsPanel.vue";
import CompetitionPanel from "../components/CompetitionPanel.vue";
import ResearchPanel from "../components/ResearchPanel.vue";
import PostgraduatePanel from "../components/PostgraduatePanel.vue";
import DiscussionPanel from "../components/DiscussionPanel.vue";
import CompetitionCenterView from "../views/CompetitionCenterView.vue";
import { useFavoritesStore } from "../stores/favorites";
import { useNotificationStore } from "../stores/notifications";
import FriendPanel from "../components/FriendPanel.vue";
import ProfileView from "../views/ProfileView.vue";
import NotificationBell from "../components/NotificationBell.vue";

const auth = useAuthStore();
const competitionStore = useCompetitionStore();
const researchStore = useResearchStore();
const notificationStore = useNotificationStore();

// 初始化所有store的token
function initializeStoreTokens() {
  const token = localStorage.getItem("academic_light_token");
  if (token) {
    notificationStore.updateToken(token);
    // 其他store如果有需要也可以在这里初始化
  }
}
const router = useRouter();
const selectedSection = ref("dashboard");
const settingsSection = ref("profile");
const dashboardLoading = ref(true);
const discussionPanelRef = ref(null);

onMounted(async () => {
  if (!auth.user) {
    await auth.fetchProfile();
  }
  // 初始化所有store的token
  initializeStoreTokens();
  await fetchDashboardData();
});

async function fetchDashboardData() {
  dashboardLoading.value = true;
  await Promise.all([competitionStore.fetchCompetitions(), researchStore.fetchProjects()]);
  dashboardLoading.value = false;
}

const roleLabel = computed(() => {
  switch (auth.user?.role) {
    case "mentor":
      return "导师";
    case "admin":
      return "管理员";
    default:
      return "学生";
  }
});

const isTeacher = computed(() => ["mentor", "admin"].includes(auth.user?.role));

const upcomingCompetitions = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 重置为当天开始时间
  return competitionStore.competitions
    .filter((item) => item.deadline && new Date(item.deadline) >= today)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);
});

const myMentorItems = computed(() => {
  if (!isTeacher.value || !auth.user) return [];

  const competitions = competitionStore.competitions
    .filter((item) => item.createdBy === auth.user.id)
    .map((item) => ({
      id: `competition-${item.id}`,
      title: item.title,
      college: item.college,
      type: "竞赛"
    }));

  const projects = researchStore.projects
    .filter((item) => item.createdBy === auth.user.id)
    .map((item) => ({
      id: `research-${item.id}`,
      title: item.title,
      college: item.college,
      type: "科研"
    }));

  return [...competitions, ...projects].slice(0, 4);
});

const myApplications = computed(() => {
  const applications = Object.values(researchStore.myApplications || {});
  return applications
    .map((application) => {
      const project = researchStore.projects.find((item) => item.id === application.projectId);
      return {
        ...application,
        projectTitle: project?.title || "科研项目",
        stage: project?.stage || "进度未同步"
      };
    })
    .slice(0, 4);
});

function selectSection(section) {
  selectedSection.value = section;
  if (section === "settings") {
    settingsSection.value = "profile";
  }
}

function openProfileSettings() {
  selectedSection.value = "profile";
}

function logout() {
  auth.logout();
  router.push({ name: "auth" });
}

function handleProfileSaved() {
  settingsSection.value = "profile";
}

function handleNotificationOpen(postId) {
  selectedSection.value = "discussion";
  nextTick(() => {
    discussionPanelRef.value?.openPostById(postId);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(new Date(dateStr));
}
</script>

<style scoped lang="scss">
.dashboard-shell {
  width: 100%;
  min-height: 100vh;
  background: #f5f7fb;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 32px;
  background: #0f172a;
  color: #fff;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;

  .logo {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #2563eb, #22d3ee);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .subtitle {
    margin: 0;
    opacity: 0.7;
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
  }
}

.user {
  display: flex;
  align-items: center;
  gap: 12px;

  .info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.2;
  }
}

.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  flex: 1;
}

.sidebar {
  background: #1e2539;
  color: #cbd5f5;
  padding: 24px 20px;

  nav {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;
  }

  .section {
    text-transform: uppercase;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 6px;
  }

  button {
    color: inherit;
    text-decoration: none;
    padding: 10px 14px;
    border-radius: 12px;
    transition: background 0.2s ease;
    border: none;
    text-align: left;
    background: transparent;
    cursor: pointer;

    &.active,
    &:hover {
      background: rgba(148, 163, 184, 0.2);
    }
  }
}

main {
  padding: 32px 40px;
}

.hero {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
}

.cards {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;

  article {
    background: #fff;
    border-radius: 18px;
    padding: 20px;
    border: 1px solid #e5e7eb;

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
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
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  padding: 8px 16px;
  border-radius: 999px;
  color: inherit;
  cursor: pointer;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    flex-direction: row;
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>
