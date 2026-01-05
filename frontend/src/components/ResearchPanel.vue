<template>
  <div class="competition-panel research-panel">
    <header class="panel-header">
      <div>
        <p class="eyebrow">科研项目协作</p>
        <h2>按学院浏览导师课题 & 实验室机会</h2>
        <p class="hint">先定位学院，再通过阶段与关键字找到合适的项目，导师可直接发布课题。</p>
      </div>
      <div class="actions">
        <input v-model="keyword" type="search" placeholder="搜索课题 / 关键词" />
        <div class="filters">
          <button
            v-for="option in stageOptions"
            :key="option.key"
            :class="{ active: activeStage === option.key }"
            @click="activeStage = option.key"
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
          <button v-if="canPublishHere" class="publish-btn" @click="openPublish">
            {{ isEditing ? "编辑科研项目" : "发布科研项目" }}
          </button>
        </div>

        <div v-if="viewMode === 'list'">
          <div v-if="store.loading" class="loading">加载中...</div>
          <div v-else>
            <transition-group name="fade" tag="div" class="cards">
              <article v-for="item in filteredProjects" :key="item.id" class="card">
                <header>
                  <div>
                    <p class="tag">{{ item.field }}</p>
                    <h3>{{ item.title }}</h3>
                    <p class="desc">{{ item.summary || "导师稍后补充详情" }}</p>
                  </div>
                  <span class="deadline">{{ item.stage }} · 团队 {{ item.teamSize || 0 }} 人</span>
                </header>

                <ul class="highlights">
                  <li>
                    <strong>导师</strong>
                    <span>{{ item.mentorName || "未公开" }}</span>
                  </li>
                  <li>
                    <strong>实验室 / 位置</strong>
                    <span>{{ item.lab || "联系导师了解" }}</span>
                  </li>
                  <li>
                    <strong>近期计划</strong>
                    <span>{{ item.plan || "导师将根据进度更新" }}</span>
                  </li>
                </ul>

                <footer>
                  <div class="cta">
                    <button class="ghost detail" @click="openDetails(item)">查看详情</button>
                    <button class="ghost" :disabled="!item.mentorName">联系导师</button>
                    <button class="primary" :disabled="!isStudent || isProjectExpired(item) || !isProjectOpen(item)" @click="handleApplyClick(item)">
                      {{ !isStudent ? "登录学生账号申请" : isProjectExpired(item) ? "申请已截止" : !isProjectOpen(item) ? "申请已关闭" : "提交申请" }}
                    </button>
                  </div>
                  <div class="owner-actions" v-if="isOwnProject(item)">
                    <button class="ghost" @click="toggleApplicants(item)">
                      {{ isApplicantsOpen(item.id) ? "收起申请" : "查看申请" }}
                    </button>
                    <button class="ghost" @click="startEdit(item)">编辑</button>
                    <button class="danger" @click="handleDelete(item)">删除</button>
                  </div>
                </footer>
                <transition name="fade">
                  <div v-if="isApplicantsOpen(item.id)" class="applicant-list">
                    <p v-if="applicantsLoadingId === item.id" class="loading">申请信息加载中...</p>
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
                      <p v-else class="empty">暂无申请信息</p>
                    </template>
                  </div>
                </transition>
              </article>
            </transition-group>

            <p v-if="!store.loading && filteredProjects.length === 0" class="empty">
              当前学院暂无科研项目，切换筛选或等待导师发布。
            </p>
          </div>

          <div v-if="isTeacher" class="my-section">
            <h3>我发布的科研项目</h3>
            <ul v-if="myProjects.length > 0">
              <li v-for="item in myProjects" :key="item.id">
                <span>{{ item.title }} · {{ item.college }} · {{ item.stage }}</span>
              </li>
            </ul>
            <p v-else class="empty">还没有发布记录，点击“发布科研项目”开始吧。</p>
          </div>
        </div>

        <div v-else>
          <div v-if="canPublishHere" class="teacher-panel">
            <div class="form-header">
              <button class="ghost" @click="backToList">← 返回项目列表</button>
              <h3>{{ isEditing ? "编辑科研项目" : "发布新的科研项目" }}</h3>
            </div>
            <p v-if="isEditing" class="edit-hint">正在编辑：{{ editingProject?.title }}</p>
            <form @submit.prevent="handleSubmit">
              <label>
                项目名称
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
              <div class="grid">
                <label>
                  研究方向
                  <input v-model="form.field" placeholder="人工智能 / 生命科学..." required />
                </label>
                <label>
                  项目阶段
                  <select v-model="form.stage">
                    <option value="课题招募">课题招募</option>
                    <option value="数据采集">数据采集</option>
                    <option value="论文撰写">论文撰写</option>
                    <option value="成果申报">成果申报</option>
                  </select>
                </label>
              </div>
              <label>
                实验室 / 位置
                <input v-model="form.lab" />
              </label>
              <label>
                近期计划
                <textarea v-model="form.plan" rows="2" />
              </label>
              <label>
                项目简介
                <textarea v-model="form.summary" rows="3" />
              </label>
              <label>
                团队人数
                <input v-model.number="form.teamSize" type="number" min="0" />
              </label>
              <button class="primary" type="submit" :disabled="store.loading">
                {{ store.loading ? "提交中..." : isEditing ? "保存修改" : "发布项目" }}
              </button>
              <p v-if="publishStatus" class="status">{{ publishStatus }}</p>
            </form>
          </div>
          <div v-else class="student-placeholder">
            <p v-if="isTeacher">仅可在所属学院（{{ auth.user?.college || "未设置" }}）下发布，请切换学院。</p>
            <p v-else>当前角色不可发布科研项目，可浏览列表了解导师课题。</p>
            <button class="ghost" @click="backToList">返回列表</button>
          </div>
        </div>
      </section>
    </div>

    <transition name="fade">
      <div v-if="detailVisible && selectedProject" class="detail-layer" @click.self="closeDetails">
        <div class="detail-card">
          <button class="close" @click="closeDetails">×</button>
          <p class="tag">{{ selectedProject.field }}</p>
          <h3>{{ selectedProject.title }}</h3>
          <p class="meta">
            <span>{{ selectedProject.college }}</span>
            <span>阶段：{{ selectedProject.stage }}</span>
          </p>
          <section>
            <h4>项目简介</h4>
            <p>{{ selectedProject.summary || "导师稍后补充详情" }}</p>
          </section>
          <section>
            <h4>实验室 / 位置</h4>
            <p>{{ selectedProject.lab || "联系导师了解实验室信息" }}</p>
          </section>
          <section>
            <h4>近期计划</h4>
            <p>{{ selectedProject.plan || "导师将根据进度更新" }}</p>
          </section>
          <div class="detail-footer">
            <button class="ghost" @click="closeDetails">返回列表</button>
            <button class="primary" :disabled="!isStudent" @click="handleApplyClick(selectedProject)">
              {{ isStudent ? "提交申请" : "登录学生账号申请" }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="applyModalVisible && applyTargetProject" class="detail-layer" @click.self="closeApplyModal">
        <div class="apply-card research">
          <header class="apply-head">
            <div>
              <p class="pill">科研申请</p>
              <h3>{{ applyTargetProject.title }}</h3>
              <p class="meta">
                <span>{{ applyTargetProject.college }}</span>
                <span>{{ applyTargetProject.stage }}</span>
                <span>导师：{{ applyTargetProject.mentorName || "待公布" }}</span>
              </p>
            </div>
            <button class="close" @click="closeApplyModal">×</button>
          </header>

          <section class="project-brief">
            <div>
              <p class="label">研究方向</p>
              <strong>{{ applyTargetProject.field }}</strong>
            </div>
            <div>
              <p class="label">实验室 / 位置</p>
              <strong>{{ applyTargetProject.lab || "导师稍后确认" }}</strong>
            </div>
            <div>
              <p class="label">计划摘要</p>
              <span>{{ applyTargetProject.plan || "导师将根据进度更新" }}</span>
            </div>
          </section>

          <div class="info-banner">
            <div>
              <p class="label">提交提醒</p>
              <p>
                提交后系统会把个人资料同步给导师。请确保联系方式准确，方便导师安排面谈或线上沟通。
              </p>
            </div>
            <div class="mentor-tip">
              <p class="label">导师建议</p>
              <p>可在备注中说明研究兴趣、投入时间，或附上代表性成果，提升匹配效率。</p>
            </div>
          </div>

          <p v-if="isEditingApplication" class="status-pill">已提交申请，可修改或撤回</p>

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
                placeholder="例如：研究特长、可投入时间、是否已有团队等"
              />
            </label>
            <div class="form-actions">
              <button v-if="isEditingApplication" type="button" class="ghost danger" @click="handleWithdraw">
                撤回申请
              </button>
              <button type="button" class="ghost neutral" @click="closeApplyModal">稍后填写</button>
              <button type="submit" class="primary" :disabled="applySubmitting">
                {{ applySubmitting ? "提交中..." : isEditingApplication ? "保存修改" : "提交申请" }}
              </button>
            </div>
            <p v-if="applyStatus" class="status">{{ applyStatus }}</p>
          </form>

          <div class="loader" v-if="applyFormLoading">
            <span />
            <p>载入申请信息...</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useResearchStore } from "../stores/research";
import { useAuthStore } from "../stores/auth";

const store = useResearchStore();
const auth = useAuthStore();

// 初始化token
const token = localStorage.getItem("academic_light_token");
if (token) {
  store.updateToken(token);
}

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

const stageOptions = [
  { key: "all", label: "全部阶段" },
  { key: "课题招募", label: "课题招募" },
  { key: "数据采集", label: "数据采集" },
  { key: "论文撰写", label: "论文撰写" },
  { key: "成果申报", label: "成果申报" }
];

const keyword = ref("");
const activeStage = ref("all");
const activeCollege = ref(defaultColleges[0]);
const publishStatus = ref("");
const viewMode = ref("list");
const detailVisible = ref(false);
const selectedProject = ref(null);
const applyModalVisible = ref(false);
const applyTargetProject = ref(null);
const applicantsLoadingId = ref(null);
const applicantPanels = ref(new Set());
const applyStatus = ref("");
const applySubmitting = ref(false);
const applyFormLoading = ref(false);

const collegeOptions = computed(() => {
  const fetched = store.projects.map((p) => p.college);
  const merged = Array.from(new Set([...defaultColleges, ...fetched]));
  if (!merged.includes(activeCollege.value)) {
    activeCollege.value = merged[0] || defaultColleges[0];
  }
  return merged;
});

const filteredProjects = computed(() => {
  return store.projects
    .filter((item) => item.college === activeCollege.value)
    .filter((item) => (activeStage.value === "all" ? true : item.stage === activeStage.value))
    .filter((item) => {
      const kw = keyword.value.trim();
      if (!kw) return true;
      return (
        (item.title && item.title.includes(kw)) ||
        (item.summary && item.summary.includes(kw)) ||
        (item.field && item.field.includes(kw)) ||
        (item.mentorName && item.mentorName.includes(kw))
      );
    });
});

const myProjects = computed(() => {
  if (!isTeacher.value || !auth.user) return [];
  return store.projects.filter((item) => item.createdBy === auth.user.id);
});

const form = reactive({
  title: "",
  college: defaultColleges[0],
  field: "",
  stage: "课题招募",
  lab: "",
  plan: "",
  summary: "",
  teamSize: 0
});

const editingProject = ref(null);
const isEditing = computed(() => Boolean(editingProject.value));

const applyForm = reactive({
  applicantName: "",
  studentNumber: "",
  major: "",
  contact: "",
  note: ""
});

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

const currentApplication = computed(() => {
  if (!applyTargetProject.value) return null;
  return store.myApplications[applyTargetProject.value.id] || null;
});

const isEditingApplication = computed(() => Boolean(currentApplication.value));

onMounted(() => {
  viewMode.value = "list";
  if (store.projects.length === 0) {
    store.fetchProjects();
  }
});

watch([isTeacher, activeCollege], () => {
  if ((!isTeacher.value || !canPublishHere.value) && viewMode.value !== "list") {
    viewMode.value = "list";
    resetForm();
  }
});

function resetForm() {
  form.title = "";
  form.field = "";
  form.stage = "课题招募";
  form.lab = "";
  form.plan = "";
  form.summary = "";
  form.teamSize = 0;
  form.college = auth.user?.role === "mentor" ? auth.user.college : activeCollege.value;
  editingProject.value = null;
  publishStatus.value = "";
}

async function handleSubmit() {
  publishStatus.value = "";
  const payload = {
    title: form.title,
    college: form.college,
    field: form.field,
    stage: form.stage,
    lab: form.lab,
    plan: form.plan,
    summary: form.summary,
    teamSize: form.teamSize
  };

  let result;
  if (isEditing.value) {
    result = await store.updateProject(editingProject.value.id, payload);
  } else {
    result = await store.createProject(payload);
  }

  publishStatus.value = result.message;
  if (result.success) {
    resetForm();
    viewMode.value = "list";
  }
}

function openPublish() {
  if (!canPublishHere.value) return;
  resetForm();
  viewMode.value = "publish";
}

function backToList() {
  viewMode.value = "list";
  resetForm();
}

function openDetails(item) {
  selectedProject.value = item;
  detailVisible.value = true;
}

function closeDetails() {
  detailVisible.value = false;
  selectedProject.value = null;
}

function isOwnProject(item) {
  return auth.user && item.createdBy === auth.user.id;
}

function startEdit(project) {
  if (!isOwnProject(project)) return;
  editingProject.value = project;
  form.title = project.title;
  form.college = project.college;
  form.field = project.field;
  form.stage = project.stage;
  form.lab = project.lab || "";
  form.plan = project.plan || "";
  form.summary = project.summary || "";
  form.teamSize = project.teamSize || 0;
  publishStatus.value = "";
  viewMode.value = "publish";
}

async function handleDelete(project) {
  if (!isOwnProject(project)) return;
  const confirmed = window.confirm(`确定删除科研项目「${project.title}」吗？`);
  if (!confirmed) return;
  const result = await store.deleteProject(project.id);
  publishStatus.value = result.message;
  if (result.success && editingProject.value?.id === project.id) {
    resetForm();
    viewMode.value = "list";
  }
}

function isApplicantsOpen(id) {
  return applicantPanels.value.has(id);
}

async function toggleApplicants(item) {
  if (!isOwnProject(item)) return;
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
  if (!force && store.applicantsByProject[id]) {
    return;
  }
  applicantsLoadingId.value = id;
  await store.fetchApplicants(id);
  applicantsLoadingId.value = null;
}

function getApplicants(id) {
  return store.applicantsByProject[id] || [];
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

function isProjectExpired(item) {
  return item.deadline && new Date(item.deadline) < new Date();
}

function isProjectOpen(item) {
  // ResearchPanel 的项目没有 open/closed 状态字段，主要通过阶段(stage)展示。
  // 默认允许申请，只有明确标记为关闭/下线时才禁止申请。
  const closedStatuses = new Set(["closed", "inactive", "expired"]);
  return !closedStatuses.has(item.status);
}

async function handleApplyClick(item) {
  if (!isStudent.value) {
    applyStatus.value = "请使用学生账号登录后再申请";
    return;
  }
  
  if (isProjectExpired(item)) {
    applyStatus.value = "申请已截止，无法申请";
    return;
  }
  
  if (!isProjectOpen(item)) {
    applyStatus.value = "项目已关闭申请";
    return;
  }
  
  applyTargetProject.value = item;
  applyModalVisible.value = true;
  applyStatus.value = "";
  await hydrateApplicationForm(item.id);
}

function closeApplyModal() {
  applyModalVisible.value = false;
  applyTargetProject.value = null;
  applyStatus.value = "";
  applyFormLoading.value = false;
}

async function hydrateApplicationForm(projectId) {
  applyFormLoading.value = true;
  const { success, application } = await store.fetchMyApplication(projectId);
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

async function submitApplication() {
  if (!applyTargetProject.value) return;
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
    result = await store.updateMyApplication(applyTargetProject.value.id, payload);
  } else {
    result = await store.applyToProject(applyTargetProject.value.id, payload);
  }

  applySubmitting.value = false;
  applyStatus.value = result.message;
  if (result.success) {
    closeApplyModal();
  }
}

async function handleWithdraw() {
  if (!applyTargetProject.value) return;
  const confirmed = window.confirm("确定要撤回申请吗？导师将无法看到你的信息。");
  if (!confirmed) return;
  applyStatus.value = "";
  const result = await store.deleteMyApplication(applyTargetProject.value.id);
  applyStatus.value = result.message;
  if (result.success) {
    await hydrateApplicationForm(applyTargetProject.value.id);
  }
}
</script>

<style lang="scss">
@use "../styles/panel-base";

.research-panel {
  .publish-btn {
    border: 1px dashed #cbd5f5;
    background: transparent;
    color: #1d4ed8;
  }
}
</style>
