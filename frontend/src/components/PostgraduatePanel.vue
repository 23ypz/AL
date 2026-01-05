<template>
  <div class="competition-panel postgraduate-panel">
    <header class="panel-header">
      <div>
        <p class="eyebrow">保研经验站</p>
        <h2>同步各学院保研发布与导师经验</h2>
        <p class="hint">导师发布真实案例与时间轴，学生可按学院、阶段快速查阅。</p>
      </div>
      <div class="actions">
        <input v-model="keyword" type="search" placeholder="搜索标题 / 关键词" />
        <div class="filters">
          <button class="active">经验分享</button>
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
            {{ isEditing ? "编辑保研发布" : "发布保研经验" }}
          </button>
        </div>

        <div v-if="viewMode === 'list'">
          <div v-if="store.loading" class="loading">加载中...</div>
          <div v-else>
            <transition-group name="fade" tag="div" class="cards">
              <article v-for="item in filteredPosts" :key="item.id" class="card">
                <header>
                  <div>
                    <p class="tag">{{ item.category || "经验分享" }}</p>
                    <h3>{{ item.title }}</h3>
                    <p class="desc">{{ item.highlight || "导师正在整理详细亮点" }}</p>
                  </div>
                  <span class="deadline">{{ item.category }}</span>
                </header>

                <ul class="highlights">
                  <li>
                    <strong>导师 / 发布人</strong>
                    <span>{{ item.mentorName || "匿名导师" }}</span>
                  </li>
                  <li>
                    <strong>经验亮点</strong>
                    <span>{{ item.highlight?.slice(0, 32) || "导师正在整理详细亮点" }}</span>
                  </li>
                  <li>
                    <strong>资源概览</strong>
                    <span>{{ item.resources ? "附带资料" : "暂无额外资源" }}</span>
                  </li>
                </ul>

                <footer>
                  <div class="cta">
                    <button class="ghost" @click="openDetails(item)">查看详情</button>
                    <button class="ghost" :disabled="!item.resources">查看资源</button>
                  </div>
                  <div class="owner-actions" v-if="isOwnPost(item)">
                    <button class="ghost" @click="startEdit(item)">编辑</button>
                    <button class="danger" @click="handleDelete(item)">删除</button>
                  </div>
                </footer>
              </article>
            </transition-group>

            <p v-if="!store.loading && filteredPosts.length === 0" class="empty">
              当前筛选暂无保研发布，稍后再来看看。
            </p>
          </div>

          <div v-if="isTeacher" class="my-section">
            <h3>我发布的保研经验</h3>
            <ul v-if="myPosts.length > 0">
              <li v-for="item in myPosts" :key="item.id">
                <span>{{ item.title }} · {{ item.category || "经验分享" }} · {{ item.college }}</span>
              </li>
            </ul>
            <p v-else class="empty">还没有发布记录，点击“发布保研经验”开始吧。</p>
          </div>
        </div>

        <div v-else>
          <div v-if="canPublishHere" class="teacher-panel">
            <div class="form-header">
              <button class="ghost" @click="backToList">← 返回列表</button>
              <h3>{{ isEditing ? "编辑保研经验" : "发布新的保研经验" }}</h3>
            </div>
            <p v-if="isEditing" class="edit-hint">正在编辑：{{ editingPost?.title }}</p>
            <form @submit.prevent="handleSubmit">
              <label>
                标题
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
                  分类
                  <input v-model="form.category" placeholder="经验分享 / 时间轴 / 面试复盘..." />
                </label>
                <label>
                  标签
                  <input v-model="form.stage" placeholder="资料收集 / 面试经验..." />
                </label>
              </div>
              <label>
                亮点摘要
                <textarea v-model="form.highlight" rows="3" placeholder="可分享流程、资料、导师建议等" />
              </label>
              <label>
                资料链接 / 资源
                <textarea v-model="form.resources" rows="3" placeholder="例如：保研经验贴、网盘链接、公众号文章" />
              </label>
              <button class="primary" type="submit" :disabled="store.loading">
                {{ store.loading ? "提交中..." : isEditing ? "保存修改" : "发布信息" }}
              </button>
              <p v-if="publishStatus" class="status">{{ publishStatus }}</p>
            </form>
          </div>
          <div v-else class="student-placeholder">
            <p v-if="isTeacher">仅可在所属学院（{{ auth.user?.college || "未设置" }}）下发布，请切换学院。</p>
            <p v-else>该模块仅展示导师发布的保研信息，保持关注即可。</p>
            <button class="ghost" @click="backToList">返回列表</button>
          </div>
        </div>
      </section>
    </div>

    <transition name="fade">
      <div v-if="detailVisible && selectedPost" class="detail-layer" @click.self="closeDetails">
        <div class="detail-card">
          <button class="close" @click="closeDetails">×</button>
          <p class="tag">{{ selectedPost.category || selectedPost.stage || "经验分享" }}</p>
          <h3>{{ selectedPost.title }}</h3>
          <p class="meta">
            <span>{{ selectedPost.college }}</span>
            <span>{{ selectedPost.category || "经验分享" }}</span>
          </p>
          <section>
            <h4>亮点摘要</h4>
            <p>{{ selectedPost.highlight || "导师稍后补充详情" }}</p>
          </section>
          <section>
            <h4>资源与链接</h4>
            <p>{{ selectedPost.resources || "暂未提供额外资源" }}</p>
          </section>
          <div class="detail-footer">
            <button class="ghost" @click="closeDetails">返回列表</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { usePostgraduateStore } from "../stores/postgraduate";
import { useAuthStore } from "../stores/auth";

const store = usePostgraduateStore();
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

const keyword = ref("");
const activeCollege = ref(defaultColleges[0]);
const publishStatus = ref("");
const viewMode = ref("list");
const detailVisible = ref(false);
const selectedPost = ref(null);

const collegeOptions = computed(() => {
  const fetched = store.posts.map((p) => p.college);
  const merged = Array.from(new Set([...defaultColleges, ...fetched]));
  if (!merged.includes(activeCollege.value)) {
    activeCollege.value = merged[0] || defaultColleges[0];
  }
  return merged;
});

const filteredPosts = computed(() => {
  return store.posts
    .filter((item) => item.college === activeCollege.value)
    .filter((item) => {
      const kw = keyword.value.trim();
      if (!kw) return true;
      return (
        (item.title && item.title.includes(kw)) ||
        (item.highlight && item.highlight.includes(kw)) ||
        (item.resources && item.resources.includes(kw))
      );
    });
});

const form = reactive({
  title: "",
  college: defaultColleges[0],
  category: "",
  stage: "资料收集",
  highlight: "",
  resources: ""
});

const editingPost = ref(null);
const isEditing = computed(() => Boolean(editingPost.value));

const isTeacher = computed(() => ["mentor", "admin"].includes(auth.user?.role));
const canPublishHere = computed(() => {
  if (!isTeacher.value) return false;
  if (auth.user?.role === "admin") return true;
  if (auth.user?.role === "mentor") {
    return auth.user.college && auth.user.college === activeCollege.value;
  }
  return false;
});

const myPosts = computed(() => {
  if (!isTeacher.value || !auth.user) return [];
  return store.posts.filter((item) => item.createdBy === auth.user.id);
});

onMounted(() => {
  viewMode.value = "list";
  if (store.posts.length === 0) {
    store.fetchPosts();
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
  form.category = "";
  form.stage = "资料收集";
  form.highlight = "";
  form.resources = "";
  form.college = auth.user?.role === "mentor" ? auth.user.college : activeCollege.value;
  editingPost.value = null;
  publishStatus.value = "";
}

async function handleSubmit() {
  publishStatus.value = "";
  const payload = {
    title: form.title,
    college: form.college,
    category: form.category,
    stage: form.stage,
    highlight: form.highlight,
    resources: form.resources
  };

  let result;
  if (isEditing.value) {
    result = await store.updatePost(editingPost.value.id, payload);
  } else {
    result = await store.createPost(payload);
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
  selectedPost.value = item;
  detailVisible.value = true;
}

function closeDetails() {
  detailVisible.value = false;
  selectedPost.value = null;
}

function isOwnPost(item) {
  return auth.user && item.createdBy === auth.user.id;
}

function startEdit(post) {
  if (!isOwnPost(post)) return;
  editingPost.value = post;
  form.title = post.title;
  form.college = post.college;
  form.category = post.category || "";
  form.stage = post.stage;
  form.highlight = post.highlight || "";
  form.resources = post.resources || "";
  publishStatus.value = "";
  viewMode.value = "publish";
}

async function handleDelete(post) {
  if (!isOwnPost(post)) return;
  const confirmed = window.confirm(`确定删除保研发布「${post.title}」吗？`);
  if (!confirmed) return;
  const result = await store.deletePost(post.id);
  publishStatus.value = result.message;
  if (result.success && editingPost.value?.id === post.id) {
    resetForm();
    viewMode.value = "list";
  }
}

function formatStageDescription() {
  return "往届经验整理";
}
</script>

<style scoped lang="scss">
@use "../styles/panel-base";

.postgraduate-panel {
  .publish-btn {
    border: 1px dashed #a5b4fc;
    background: transparent;
    color: #4338ca;
  }
}
</style>
