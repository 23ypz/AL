<template>
  <div class="competition-panel">
    <header class="panel-header">
      <div>
        <p class="eyebrow">竞赛情报中心</p>
        <h2>按学院快速定位专业赛事</h2>
        <p class="hint">先选择学院，再浏览对应的特色竞赛、推荐队伍与备赛节奏。</p>
      </div>
      <div class="actions">
        <input v-model="keyword" type="search" placeholder="搜索赛事 / 关键词" />
        <div class="filters">
          <button
            v-for="option in statusOptions"
            :key="option.key"
            :class="{ active: option.key === status }"
            @click="status = option.key"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </header>

    <div class="layout">
      <aside class="college-nav">
        <button
          v-for="college in collegeOptions"
          :key="college"
          :class="{ active: college === activeCollege }"
          @click="activeCollege = college"
        >
          {{ college }}
        </button>
      </aside>

      <section class="competition-list">
        <div class="list-header">
          <p>当前学院：<strong>{{ activeCollege }}</strong></p>
          <button
            v-if="canPublishHere"
            class="publish-btn"
            @click="openPublish"
          >
            发布竞赛
          </button>
        </div>

        <div v-if="viewMode === 'list'">
          <div v-if="store.loading" class="loading">加载中...</div>
          <div v-else>
            <transition-group name="fade" tag="div" class="cards">
              <article
                v-for="item in filteredCompetitions"
                :key="item.id"
                class="card"
              >
                <header>
                  <div>
                    <p class="tag">{{ item.level }}</p>
                    <h3>{{ item.title }}</h3>
                    <p class="desc">{{ item.description }}</p>
                  </div>
                  <div class="header-meta">
                    <span class="deadline">报名截止：{{ formatDate(item.deadline) }}</span>
                    <button class="avatar-btn" @click="goToProfile(item.createdBy)" :title="`查看 ${item.creatorName || '匿名同学'} 的主页`">
                      <img :src="userAvatar(item)" :alt="item.creatorName || '匿名同学'" />
                    </button>
                  </div>
                </header>

                <ul class="highlights">
                  <li>
                    <strong>备赛主线</strong>
                    <span>{{ item.focus || "持续整理中" }}</span>
                  </li>
                  <li>
                    <strong>往届成就</strong>
                    <span>{{ item.records || "欢迎导师补充" }}</span>
                  </li>
                </ul>

                <footer>
                  <div class="cta">
                    <button class="ghost detail" @click="openDetails(item)">查看详情</button>
                    <button class="ghost">查看招募队伍</button>
                    <button class="primary" :disabled="!isStudent || isCompetitionExpired(item) || !isCompetitionOpen(item)" @click="handleApplyClick(item)">
                      {{ !isStudent ? "仅学生登录可报名" : isCompetitionExpired(item) ? "报名已截止" : !isCompetitionOpen(item) ? "报名已关闭" : "立即报名" }}
                    </button>
                  </div>
                  <div class="owner-actions" v-if="isOwnCompetition(item)">
                    <button class="ghost" @click="toggleApplicants(item)">
                      {{ isApplicantsOpen(item.id) ? "收起报名" : "查看报名" }}
                    </button>
                    <button class="ghost" @click="startEdit(item)">编辑</button>
                    <button class="danger" @click="handleDelete(item)">删除</button>
                  </div>
                </footer>
                <transition name="fade">
                  <div v-if="isApplicantsOpen(item.id)" class="applicant-list">
                    <p v-if="applicantsLoadingId === item.id" class="loading">报名信息加载中...</p>
                    <template v-else>
                      <ul v-if="getApplicants(item.id).length > 0">
                        <li v-for="applicant in getApplicants(item.id)" :key="applicant.id">
                          <div class="row">
                            <strong>{{ applicant.applicantName }}</strong>
                            <span>{{ applicant.studentNumber }} · {{ applicant.major }}</span>
                          </div>
                          <div class="row">
                            <span>{{ applicant.contact }}</span>
                            <small>{{ formatDateTime(applicant.createdAt) }}</small>
                          </div>
                          <p v-if="applicant.note" class="note">备注：{{ applicant.note }}</p>
                        </li>
                      </ul>
                      <p v-else class="empty">暂无报名信息</p>
                    </template>
                  </div>
                </transition>
              </article>
            </transition-group>

            <p v-if="!store.loading && filteredCompetitions.length === 0" class="empty">
              当前条件下暂无赛事，换个关键词试试。
            </p>
          </div>

          <div v-if="isTeacher" class="my-section">
            <h3>我发布的竞赛</h3>
            <ul v-if="myCompetitions.length > 0">
              <li v-for="item in myCompetitions" :key="item.id">
                <span>{{ item.title }} · {{ item.college }} · 截止 {{ formatDate(item.deadline) }}</span>
              </li>
            </ul>
            <p v-else class="empty">还没有发布记录，点击“发布竞赛”开始吧。</p>
          </div>
        </div>

        <div v-else>
          <div v-if="canPublishHere" class="teacher-panel">
            <div class="form-header">
              <button class="ghost" @click="backToList">← 返回竞赛列表</button>
              <h3>{{ isEditing ? "编辑竞赛" : "发布新的竞赛" }}</h3>
            </div>
            <p v-if="isEditing" class="edit-hint">正在编辑：{{ editingCompetition?.title }}</p>
            <form @submit.prevent="handleSubmit">
              <label>
                竞赛名称
                <input v-model="form.title" required />
              </label>
              <label>
                面向学院
                <select v-model="form.college" :disabled="auth.user?.role === 'mentor'" required>
                  <option v-for="college in collegeOptions" :key="college" :value="college">
                    {{ college }}
                  </option>
                </select>
              </label>
              <label>
                竞赛类别
                <input v-model="form.category" placeholder="例如：程序设计 / 数学建模" required />
              </label>
              <div class="grid">
                <label>
                  级别
                  <select v-model="form.level" required>
                    <option value="" disabled>请选择</option>
                    <option value="A">A类</option>
                    <option value="B">B类</option>
                    <option value="C">C类</option>
                    <option value="D">D类</option>
                  </select>
                </label>
                <label>
                  截止日期
                  <input v-model="form.deadline" type="date" required />
                </label>
              </div>
              <label>
                赛事状态
                <select v-model="form.status">
                  <option value="normal">常规</option>
                  <option value="hot">热门进行中</option>
                  <option value="deadline">临近截止</option>
                </select>
              </label>
              <label>
                简介
                <textarea v-model="form.description" rows="3" />
              </label>
              <label>
                备赛主线
                <textarea v-model="form.focus" rows="2" />
              </label>
              <label>
                往届成就
                <textarea v-model="form.records" rows="2" />
              </label>
              <button class="primary" type="submit" :disabled="store.loading">
                {{
                  store.loading ? "提交中..." : isEditing ? "保存修改" : "发布竞赛"
                }}
              </button>
              <p v-if="publishStatus" class="status">{{ publishStatus }}</p>
            </form>
          </div>
          <div v-else class="student-placeholder">
            <p v-if="isTeacher">仅可在所属学院（{{ auth.user?.college || "未设置" }}）下发布竞赛，请切换学院。</p>
            <p v-else>当前角色不可发布赛事，继续浏览列表即可。</p>
            <button class="ghost" @click="backToList">返回列表</button>
          </div>
        </div>
      </section>
    </div>

    <transition name="fade">
      <div v-if="detailVisible && selectedCompetition" class="detail-layer" @click.self="closeDetails">
        <div class="detail-card">
          <button class="close" @click="closeDetails">×</button>
          <p class="tag">{{ selectedCompetition.level }}</p>
          <h3>{{ selectedCompetition.title }}</h3>
          <p class="meta">
            <span>{{ selectedCompetition.college }}</span>
            <span>报名截止：{{ formatDate(selectedCompetition.deadline) }}</span>
          </p>
          <section>
            <h4>赛事简介</h4>
            <p>{{ selectedCompetition.description || "暂无更多介绍" }}</p>
          </section>
          <section>
            <h4>备赛主线</h4>
            <p>{{ selectedCompetition.focus || "导师正在整理备赛方案" }}</p>
          </section>
          <section>
            <h4>往届成就</h4>
            <p>{{ selectedCompetition.records || "欢迎补充历年成绩" }}</p>
          </section>
          <div class="detail-footer">
            <button class="ghost" @click="closeDetails">返回列表</button>
            <button class="primary" :disabled="!isStudent" @click="handleApplyClick(selectedCompetition)">
              {{ isStudent ? "立即报名" : "仅学生登录可报名" }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div
        v-if="applyModalVisible && applyTargetCompetition"
        class="detail-layer"
        @click.self="closeApplyModal"
      >
        <div class="apply-card">
          <button class="close" @click="closeApplyModal">×</button>
          <p class="pill">报名请求</p>
          <h3>{{ applyTargetCompetition.title }}</h3>
          <p class="meta">
            <span>{{ applyTargetCompetition.college }}</span>
            <span>报名截止：{{ formatDate(applyTargetCompetition.deadline) }}</span>
          </p>
          <div class="info-banner">
            <p>
              请留下你的基本资料，便于导师快速联系。我们会把报名信息直接同步给该竞赛的指导老师。
            </p>
          </div>
          <p v-if="isEditingApplication" class="status-pill">已提交报名，可随时修改或撤回</p>
          <form class="apply-form" @submit.prevent="submitApplication">
            <div class="grid two">
              <label>
                <span>姓名</span>
                <input v-model="applyForm.applicantName" required />
              </label>
              <label>
                <span>学号</span>
                <input v-model="applyForm.studentNumber" required />
              </label>
            </div>
            <div class="grid two">
              <label>
                <span>专业</span>
                <input v-model="applyForm.major" required />
              </label>
              <label>
                <span>联系方式（邮箱 / 电话）</span>
                <input v-model="applyForm.contact" required />
              </label>
            </div>
            <label>
              <span>备注</span>
              <textarea
                v-model="applyForm.note"
                rows="4"
                placeholder="例如：擅长方向、可投入时间、是否已有队伍等"
              />
            </label>
            <div class="form-actions">
              <button v-if="isEditingApplication" type="button" class="danger ghost" @click="handleWithdraw">
                撤回报名
              </button>
              <button type="button" class="ghost" @click="closeApplyModal">先等等</button>
              <button type="submit" class="primary" :disabled="applySubmitting">
                {{ applySubmitting ? "提交中..." : isEditingApplication ? "保存修改" : "提交报名" }}
              </button>
            </div>
            <p v-if="applyStatus" class="status">{{ applyStatus }}</p>
          </form>
          <div class="loader" v-if="applyFormLoading">
            <span />
            <p>载入报名信息...</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competition";
import { useAuthStore } from "../stores/auth";

const store = useCompetitionStore();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const defaultColleges = [
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

const statusOptions = [
  { key: "all", label: "全部" },
  { key: "hot", label: "热门进行中" },
  { key: "deadline", label: "临近截止" }
];

const keyword = ref("");
const status = ref("all");
const activeCollege = ref(defaultColleges[0]);
const publishStatus = ref("");
const viewMode = ref("list");

const collegeOptions = computed(() => {
  if (!defaultColleges.includes(activeCollege.value)) {
    activeCollege.value = defaultColleges[0];
  }
  return defaultColleges;
});

const filteredCompetitions = computed(() => {
  return store.competitions
    .filter((item) => item.college === activeCollege.value)
    .filter((item) => {
      const kw = keyword.value.trim();
      if (!kw) return true;
      return (
        item.title.includes(kw) ||
        (item.description && item.description.includes(kw)) ||
        (item.focus && item.focus.includes(kw))
      );
    })
    .filter((item) => {
      if (status.value === "all") return true;
      if (status.value === "hot") return item.status === "hot";
      if (status.value === "deadline") return item.status === "deadline";
      return true;
    });
});

const myCompetitions = computed(() => {
  if (!isTeacher.value || !auth.user) {
    return [];
  }
  return store.competitions.filter((item) => item.createdBy === auth.user.id);
});

const emptyForm = () => ({
  title: "",
  college: defaultColleges[0],
  category: "",
  level: "",
  deadline: "",
  status: "normal",
  description: "",
  focus: "",
  records: ""
});

const form = reactive(emptyForm());
const editingCompetition = ref(null);
const isEditing = computed(() => Boolean(editingCompetition.value));
const selectedCompetition = ref(null);
const detailVisible = ref(false);
const applyModalVisible = ref(false);
const applyTargetCompetition = ref(null);
const applicantsLoadingId = ref(null);
const applicantPanels = ref(new Set());
const applyStatus = ref("");
const applySubmitting = ref(false);
const applyFormLoading = ref(false);

const isTeacher = computed(() => ["mentor", "admin"].includes(auth.user?.role));
const isStudent = computed(() => auth.user?.role === "student");
const canPublishHere = computed(() => {
  if (!isTeacher.value) return false;
  if (auth.user?.role === "admin") return true;
  if (auth.user?.role === "mentor") {
    return auth.user.college && auth.user.college === activeCollege.value;
  }
  return false;
});

const applyForm = reactive({
  applicantName: "",
  studentNumber: "",
  major: "",
  contact: "",
  note: ""
});

const currentApplication = computed(() => {
  if (!applyTargetCompetition.value) return null;
  return store.myApplications[applyTargetCompetition.value.id] || null;
});

const isEditingApplication = computed(() => Boolean(currentApplication.value));

onMounted(() => {
  viewMode.value = "list";
  if (store.competitions.length === 0) {
    store.fetchCompetitions();
  }
});

watch([isTeacher, activeCollege], () => {
  if ((!isTeacher.value || !canPublishHere.value) && viewMode.value !== "list") {
    viewMode.value = "list";
    editingCompetition.value = null;
  }
});

async function handleSubmit() {
  publishStatus.value = "";
  const payload = {
    title: form.title,
    college: form.college,
    category: form.category,
    level: form.level,
    deadline: form.deadline,
    status: form.status,
    description: form.description,
    focus: form.focus,
    records: form.records
  };

  let result;
  if (isEditing.value) {
    result = await store.updateCompetition(editingCompetition.value.id, payload);
  } else {
    result = await store.createCompetition(payload);
  }

  publishStatus.value = result.message;
  if (result.success) {
    Object.assign(form, emptyForm());
    editingCompetition.value = null;
    if (!isEditing.value) {
      // keep college default to current active college
      form.college = auth.user?.role === "mentor" ? auth.user.college : activeCollege.value;
    }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(new Date(dateStr));
}

function openPublish() {
  if (!canPublishHere.value) return;
  viewMode.value = "publish";
}

function backToList() {
  viewMode.value = "list";
  editingCompetition.value = null;
}

function openDetails(item) {
  selectedCompetition.value = item;
  detailVisible.value = true;
}

function closeDetails() {
  detailVisible.value = false;
  selectedCompetition.value = null;
}

function isCompetitionExpired(item) {
  return item.deadline && new Date(item.deadline) < new Date();
}

function isCompetitionOpen(item) {
  // CompetitionPanel 的 status 用于展示状态标签（normal/hot/deadline），
  // 不应影响报名开关。只有明确标记为关闭/下线时才禁止报名。
  const closedStatuses = new Set(["closed", "inactive", "expired"]);
  return !closedStatuses.has(item.status);
}

async function handleApplyClick(item) {
  if (!isStudent.value) {
    applyStatus.value = "请使用学生账号登录后再报名";
    return;
  }
  
  if (isCompetitionExpired(item)) {
    applyStatus.value = "报名已截止，无法报名";
    return;
  }
  
  if (!isCompetitionOpen(item)) {
    applyStatus.value = "竞赛已关闭报名";
    return;
  }
  
  applyTargetCompetition.value = item;
  applyModalVisible.value = true;
  applyStatus.value = "";
  await hydrateApplicationForm(item.id);
}

function closeApplyModal() {
  applyModalVisible.value = false;
  applyTargetCompetition.value = null;
  applyStatus.value = "";
  applyFormLoading.value = false;
}

async function submitApplication() {
  if (!applyTargetCompetition.value) return;
  applySubmitting.value = true;
  applyStatus.value = "";
  const payload = {
    applicantName: applyForm.applicantName,
    studentNumber: applyForm.studentNumber,
    major: applyForm.major,
    contact: applyForm.contact,
    note: applyForm.note
  };
  let result;
  if (isEditingApplication.value) {
    result = await store.updateMyApplication(applyTargetCompetition.value.id, payload);
  } else {
    result = await store.applyToCompetition(applyTargetCompetition.value.id, payload);
  }
  applySubmitting.value = false;
  applyStatus.value = result.message;
  if (result.success) {
    closeApplyModal();
  }
}

async function hydrateApplicationForm(competitionId) {
  applyFormLoading.value = true;
  const { success, application } = await store.fetchMyApplication(competitionId);
  if (success && application) {
    applyForm.applicantName = application.applicantName;
    applyForm.studentNumber = application.studentNumber;
    applyForm.major = application.major;
    applyForm.contact = application.contact;
    applyForm.note = application.note || "";
  } else {
    applyForm.applicantName = auth.user?.fullName || "";
    applyForm.studentNumber = "";
    applyForm.major = auth.user?.major || "";
    applyForm.contact = auth.user?.email || "";
    applyForm.note = "";
  }
  applyFormLoading.value = false;
}

async function handleWithdraw() {
  if (!applyTargetCompetition.value) return;
  const confirmed = window.confirm("确定要撤回报名吗？导师将无法看到你的信息。");
  if (!confirmed) return;
  applyStatus.value = "";
  const result = await store.deleteMyApplication(applyTargetCompetition.value.id);
  applyStatus.value = result.message;
  if (result.success) {
    await hydrateApplicationForm(applyTargetCompetition.value.id);
  }
}

function isOwnCompetition(item) {
  return auth.user && item.createdBy === auth.user.id;
}

function startEdit(competition) {
  if (!isOwnCompetition(competition)) return;
  editingCompetition.value = competition;
  Object.assign(form, {
    title: competition.title,
    college: competition.college,
    level: competition.level,
    deadline: competition.deadline,
    status: competition.status,
    description: competition.description,
    focus: competition.focus,
    records: competition.records
  });
  activeCollege.value = competition.college;
  publishStatus.value = "";
  viewMode.value = "publish";
}

async function handleDelete(competition) {
  if (!isOwnCompetition(competition)) return;
  const confirmed = window.confirm(`确定删除竞赛「${competition.title}」吗？`);
  if (!confirmed) return;
  const result = await store.deleteCompetition(competition.id);
  publishStatus.value = result.message;
  if (result.success && editingCompetition.value?.id === competition.id) {
    editingCompetition.value = null;
    Object.assign(form, emptyForm());
    viewMode.value = "list";
  }
}

async function toggleApplicants(item) {
  if (!isOwnCompetition(item)) return;
  const next = new Set(applicantPanels.value);
  const willOpen = !next.has(item.id);
  if (willOpen) {
    next.add(item.id);
    await fetchApplicants(item.id, true);
  } else {
    next.delete(item.id);
  }
  applicantPanels.value = next;
}

async function fetchApplicants(id, force = false) {
  if (!force && store.applicantsByCompetition[id]) {
    return;
  }
  applicantsLoadingId.value = id;
  await store.fetchApplicants(id);
  applicantsLoadingId.value = null;
}

function isApplicantsOpen(id) {
  return applicantPanels.value.has(id);
}

function getApplicants(id) {
  return store.applicantsByCompetition[id] || [];
}

function userAvatar(item) {
  if (item.avatarUrl) {
    return item.avatarUrl;
  }
  const seed = item.creatorEmail || item.creatorName || "guest";
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
}

function goToProfile(userId) {
  if (!userId) return;
  router.push({
    path: `/users/${userId}`,
    state: { back: route.fullPath }
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateStr));
}
</script>

<style scoped lang="scss">
.competition-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 24px;
  background: #fff;
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);

  .eyebrow {
    margin: 0;
    font-size: 0.85rem;
    color: #2563eb;
    letter-spacing: 0.08em;
  }

  h2 {
    margin: 4px 0;
  }

  .hint {
    margin: 0;
    color: #6b7280;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(420px, 100%);

    input {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 12px 16px;
    }

    .filters {
      display: flex;
      gap: 8px;

      button {
        border: 1px solid #d1d5db;
        border-radius: 999px;
        padding: 6px 16px;
        background: transparent;
        cursor: pointer;

        &.active {
          background: #1d4ed8;
          color: #fff;
          border-color: #1d4ed8;
        }
      }
    }
  }
}

.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
}

.college-nav {
  background: #0f172a;
  color: #f8fafc;
  border-radius: 24px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  button {
    border: none;
    background: transparent;
    color: inherit;
    text-align: left;
    padding: 10px 14px;
    border-radius: 12px;
    cursor: pointer;

    &.active,
    &:hover {
      background: rgba(255, 255, 255, 0.18);
    }
  }
}

.competition-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 22px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 16px;

  header {
    display: flex;
    justify-content: space-between;
    gap: 12px;

    .header-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;

      .avatar-btn {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        border-radius: 16px;
        overflow: hidden;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.06);
        }

        img {
          width: 40px;
          height: 40px;
          border-radius: 16px;
          object-fit: cover;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }

      .deadline {
        font-size: 0.8rem;
        color: #94a3b8;
        white-space: nowrap;
      }
    }

    .desc {
      margin: 0;
      color: #6b7280;
      font-size: 0.95rem;
    }

    .tag {
      margin: 0;
      font-size: 0.85rem;
      color: #2563eb;
    }
  }

  .highlights {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;

    li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;

      strong {
        color: #94a3b8;
        font-weight: 500;
      }

      span {
        color: #334155;
        font-weight: 600;
      }
    }
  }

  footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;

    .cta {
      display: inline-flex;
      gap: 8px;
    }

    .owner-actions {
      display: inline-flex;
      gap: 8px;
      align-items: center;
    }

    button {
      font-weight: 600;
      border-radius: 999px;
      padding: 10px 20px;
      transition: all 0.2s ease;
    }

    .ghost {
      border: 1px solid rgba(37, 99, 235, 0.4);
      color: #1d4ed8;
      background: transparent;

      &:hover {
        background: rgba(37, 99, 235, 0.08);
        box-shadow: 0 10px 18px rgba(37, 99, 235, 0.15);
      }
    }

    .primary {
      border: none;
      background: linear-gradient(120deg, #2563eb, #22d3ee);
      color: #fff;
      box-shadow: 0 12px 30px rgba(37, 99, 235, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 36px rgba(34, 211, 238, 0.35);
      }
    }

    .danger {
      border: 1px solid rgba(248, 113, 113, 0.5);
      color: #b91c1c;
      background: rgba(248, 113, 113, 0.08);

      &:hover {
        background: rgba(248, 113, 113, 0.2);
        box-shadow: 0 10px 18px rgba(248, 113, 113, 0.2);
      }
    }
  }
}

.detail-layer {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 60px 16px;
  z-index: 2000;
  overflow-y: auto;
}

.detail-card {
  background: #fff;
  border-radius: 32px;
  width: min(640px, 100%);
  padding: 32px;
  box-shadow: 0 40px 80px rgba(15, 23, 42, 0.25);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .close {
    position: absolute;
    top: 18px;
    right: 18px;
    border: none;
    background: rgba(15, 23, 42, 0.06);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
    cursor: pointer;

    &:hover {
      background: rgba(15, 23, 42, 0.12);
    }
  }

  .tag {
    color: #2563eb;
    font-weight: 600;
    margin: 0;
  }

  h3 {
    margin: 0;
    font-size: 1.6rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: #475569;
    margin: 0;
  }

  section {
    background: #f8fafc;
    border-radius: 20px;
    padding: 18px;

    h4 {
      margin: 0 0 6px;
      color: #0f172a;
    }

    p {
      margin: 0;
      color: #475569;
      line-height: 1.6;
    }
  }
}

.apply-card {
  @extend .detail-card;
  background: #0f172a;
  color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.2);
  position: relative;

  h3 {
    color: #f8fafc;
  }

  .meta span {
    color: rgba(226, 232, 240, 0.8);
  }

  .pill {
    align-self: flex-start;
    padding: 4px 16px;
    border-radius: 999px;
    background: rgba(79, 70, 229, 0.3);
    color: #c7d2fe;
    margin: 0;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
  }

  .info-banner {
    background: rgba(15, 118, 110, 0.2);
    border: 1px solid rgba(45, 212, 191, 0.4);
    border-radius: 20px;
    padding: 14px 16px;
    margin-bottom: 12px;

    p {
      margin: 0;
      color: #ccfbf1;
    }
  }
}

.status-pill {
  align-self: flex-start;
  background: rgba(251, 191, 36, 0.2);
  color: #fde68a;
  padding: 6px 18px;
  border-radius: 999px;
  font-size: 0.85rem;
}

.apply-form {
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
  textarea {
    border: 1px solid rgba(148, 163, 184, 0.4);
    border-radius: 16px;
    padding: 12px 14px;
    background: rgba(15, 23, 42, 0.55);
    color: #f8fafc;
  }

  ::placeholder {
    color: rgba(226, 232, 240, 0.6);
  }

  .grid.two {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  .danger {
    border: 1px solid rgba(248, 113, 113, 0.5);
    color: #fecaca;
  }
}

.loader {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(2px);
  border-radius: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  span {
    width: 42px;
    height: 42px;
    border: 3px solid rgba(148, 163, 184, 0.3);
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  p {
    color: #e2e8f0;
    margin: 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.applicant-list {
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 12px 16px;
  background: #f8fafc;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  li {
    padding-bottom: 10px;
    border-bottom: 1px dashed #cbd5f5;

    &:last-child {
      border-bottom: none;
    }
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    color: #475569;
  }

  .note {
    margin: 6px 0 0;
    font-size: 0.9rem;
    color: #1e293b;
  }
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.empty {
  text-align: center;
  color: #94a3b8;
}

.teacher-panel {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);

  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-weight: 600;
  }

  input,
  select,
  textarea {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 10px 12px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }

  .status {
    color: #1d4ed8;
    font-weight: 500;
    margin: 0;
  }
}

.loading {
  padding: 16px;
  text-align: center;
  color: #2563eb;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .college-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
