<template>
  <div class="competition-panel discussion-panel">
    <header class="panel-header">
      <div>
        <p class="eyebrow">交流组队广场</p>
        <h2>发起讨论，寻找同校伙伴</h2>
        <p class="hint">分享你的想法、寻找队友或发起问答，所有同学均可浏览与参与。</p>
      </div>
      <div class="actions">
        <input v-model="keyword" type="search" placeholder="搜索标题 / 关键词" />
        <div class="filters">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </header>

    <div class="layout">
      <aside class="left-column">
        <section class="college-nav">
          <button
            v-for="college in collegeOptions"
            :key="college"
            :class="{ active: college === activeCollege }"
            @click="activeCollege = college"
          >
            {{ college }}
          </button>
        </section>
      </aside>

      <section class="competition-list">
        <div class="list-header">
          <p>当前学院：<strong>{{ activeCollege }}</strong></p>
          <button v-if="canPublish" class="publish-btn" @click="toggleComposer">
            {{ showComposer ? "收起发布" : "发起讨论" }}
          </button>
        </div>

        <transition name="fade">
          <div v-if="showComposer" class="teacher-panel composer">
            <div class="form-header">
              <h3>分享新的讨论</h3>
            </div>
            <form @submit.prevent="handleSubmit">
              <label>
                标题
                <input v-model="form.title" required placeholder="例如：寻找数学建模队友 / 分享面试经验" />
              </label>
              <label>
                所属学院
                <select v-model="form.college">
                  <option v-for="college in collegeOptions" :key="college" :value="college">{{ college }}</option>
                </select>
              </label>
              <label>
                标签 / 关键词
                <input v-model="form.tags" placeholder="例如：组队,ACM,保研" />
              </label>
              <label>
                正文内容
                <textarea v-model="form.content" rows="4" placeholder="简要说明你的需求或共享的经验" required />
              </label>
              <button class="primary" type="submit" :disabled="store.loading">
                {{ store.loading ? "发布中..." : "发布讨论" }}
              </button>
              <p v-if="publishStatus" class="status">{{ publishStatus }}</p>
            </form>
          </div>
        </transition>

        <div class="discussion-content">
          <div v-if="!detailVisible" class="discussion-list">
            <div v-if="store.loading" class="loading">讨论加载中...</div>
            <div v-else>
              <transition-group name="fade" tag="div" class="cards">
                <article v-for="post in filteredDiscussions" :key="post.id" class="card">
                  <header>
                    <div>
                      <p class="tag">{{ post.college || "全校" }}</p>
                      <h3>{{ post.title }}</h3>
                      <p class="desc">{{ post.content.slice(0, 90) }}{{ post.content.length > 90 ? "..." : "" }}</p>
                    </div>
                    <div class="header-meta">
                      <span class="deadline">{{ formatDateTime(post.createdAt) }}</span>
                      <button class="avatar-btn" @click="goToProfile(post.createdBy)" :title="`查看 ${post.authorName || '匿名同学'} 的主页`">
                        <img :src="userAvatar(post)" :alt="post.authorName || '匿名同学'" />
                      </button>
                    </div>
                  </header>

                  <ul class="highlights">
                    <li>
                      <strong>发起人</strong>
                      <span>{{ post.authorName || "匿名同学" }}</span>
                    </li>
                    <li>
                      <strong>标签</strong>
                      <span>{{ post.tags || "未设置标签" }}</span>
                    </li>
                  </ul>

                  <footer>
                    <div class="cta">
                      <button class="ghost" @click="openDetails(post)">查看全文</button>
                    </div>
                    <div class="owner-actions" v-if="isOwnPost(post)">
                      <button class="danger" @click="handleDelete(post)">删除</button>
                    </div>
                  </footer>
                </article>
              </transition-group>

              <p v-if="filteredDiscussions.length === 0" class="empty">暂无讨论，成为第一个发声的同学！</p>
            </div>
          </div>

          <transition name="fade">
            <div v-if="detailVisible && selectedPost" class="discussion-overlay">
              <div class="overlay-header">
                <button class="ghost" @click="closeDetails">← 返回交流广场</button>
                <span>当前讨论 · {{ selectedPost?.title }}</span>
                <button class="ghost" @click="refreshComments" :disabled="store.commentsLoading">
                  {{ store.commentsLoading ? "刷新中..." : "刷新评论" }}
                </button>
              </div>
              <div class="overlay-body">
                <div class="discussion-main">
                  <div class="info-header">
                    <span class="tag">{{ selectedPost?.college || "全校" }}</span>
                    <h3>{{ selectedPost?.title }}</h3>
                  </div>

                  <div class="info-columns">
                    <section class="content-card">
                      <h4>讨论内容</h4>
                      <p>{{ selectedPost?.content }}</p>
                    </section>
                    <aside class="meta-column">
                      <div class="meta-item">
                        <p class="label">发起人</p>
                        <p class="value">{{ selectedPost?.authorName || "匿名同学" }}</p>
                      </div>
                      <div class="meta-item">
                        <p class="label">发布时间</p>
                        <p class="value">{{ formatDateTime(selectedPost?.createdAt) }}</p>
                      </div>
                      <div class="meta-item">
                        <p class="label">所属学院</p>
                        <p class="value">{{ selectedPost?.college || "全校" }}</p>
                      </div>
                      <div class="meta-item" v-if="selectedPost?.tags">
                        <p class="label">标签</p>
                        <p class="value">{{ selectedPost?.tags }}</p>
                      </div>
                    </aside>
                  </div>
                </div>
                <div class="discussion-comments">
                  <div class="comments-surface">
                    <div class="comments-header">
                      <div class="title-block">
                        <h4>交流区</h4>
                        <span class="count">{{ commentCount }} 条讨论</span>
                      </div>
                      <div class="header-actions">
                        <button class="ghost neutral" @click="refreshComments" :disabled="store.commentsLoading">
                          {{ store.commentsLoading ? "刷新中..." : "刷新列表" }}
                        </button>
                      </div>
                    </div>

                    <div v-if="store.commentsLoading" class="loading-card">
                      <p>评论加载中…</p>
                    </div>

                    <div v-else-if="currentComments.length === 0" class="empty-card">
                      <p>暂无评论，快来说说你的想法吧。</p>
                    </div>

                    <ul v-else>
                      <li
                        v-for="comment in currentComments"
                        :key="comment.id"
                        :class="{ replying: replyTarget?.id === comment.id }"
                      >
                        <button class="avatar-badge" @click="goToProfile(comment.createdBy)" :title="`查看 ${comment.authorName || '匿名同学'} 的主页`">
                          <img :src="commentAvatar(comment)" :alt="comment.authorName || '匿名同学'" />
                        </button>
                        <div class="comment-body">
                          <div class="row">
                            <div class="author-block">
                              <strong>{{ comment.authorName || "匿名同学" }}</strong>
                              <span v-if="comment.parentAuthorName" class="reply-chip">
                                回复 {{ comment.parentAuthorName }}
                              </span>
                            </div>
                            <small>{{ formatDateTime(comment.createdAt) }}</small>
                          </div>

                          <div v-if="comment.parentContent" class="quote">
                            <span>{{ comment.parentAuthorName || "原评论" }}</span>
                            <p>{{ comment.parentContent }}</p>
                          </div>

                          <p class="body">{{ comment.content }}</p>

                          <div class="comment-actions">
                            <button class="ghost neutral small" @click="startReply(comment)">↩ 回复</button>
                            <button
                              v-if="isOwnComment(comment)"
                              class="ghost danger small"
                              @click="handleDeleteComment(comment)"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </li>
                    </ul>

                    <div class="composer-shell" v-if="canPublish">
                      <div class="composer-card">
                        <button class="composer-avatar" @click="goToProfile(auth.user?.id)" :title="`查看 ${auth.user?.fullName || '我'} 的主页`">
                          <img :src="userAvatar({ authorEmail: auth.user?.email, authorName: auth.user?.fullName, avatarUrl: auth.user?.avatarUrl })" :alt="auth.user?.fullName || '我'" />
                        </button>
                        <form class="comment-form" @submit.prevent="submitComment">
                          <div v-if="replyTarget" class="reply-banner">
                            <p>正在回复：{{ replyTarget.authorName || "同学" }}</p>
                            <button type="button" class="ghost neutral small" @click="replyTarget = null">取消回复</button>
                          </div>
                          <label class="textarea-wrapper">
                            <textarea
                              v-model="commentContent"
                              rows="4"
                              placeholder="写下你的想法，文明交流"
                              required
                            />
                          </label>
                          <div class="composer-actions">
                            <span class="hint">按 Enter 发送 · Shift+Enter 换行</span>
                            <button class="primary" type="submit" :disabled="commentSubmitting">
                              {{ commentSubmitting ? "发送中..." : "发表" }}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                    <p v-else class="empty">登录后即可参与评论。</p>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useDiscussionStore } from "../stores/discussion";

const store = useDiscussionStore();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

// 初始化token
const token = localStorage.getItem("academic_light_token");
if (token) {
  store.updateToken(token);
}

const defaultColleges = [
  "全部学院",
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
const activeTab = ref("latest");
const tabs = [
  { key: "latest", label: "最新" },
  { key: "team", label: "组队" },
  { key: "qa", label: "问答" }
];

const showComposer = ref(false);
const publishStatus = ref("");
const detailVisible = ref(false);
const selectedPost = ref(null);
const commentContent = ref("");
const commentSubmitting = ref(false);
const replyTarget = ref(null);

const form = reactive({
  title: "",
  college: defaultColleges[0],
  tags: "",
  content: ""
});

const canPublish = computed(() => Boolean(auth.user));

const collegeOptions = computed(() => {
  const fetched = store.posts.map((p) => p.college).filter(Boolean);
  const merged = Array.from(new Set([...defaultColleges, ...fetched]));
  if (!merged.includes(activeCollege.value)) {
    activeCollege.value = merged[0];
  }
  return merged;
});

const filteredDiscussions = computed(() => {
  return store.posts
    .filter((item) => (activeCollege.value === "全部学院" ? true : (item.college || "全部学院") === activeCollege.value))
    .filter((item) => {
      if (activeTab.value === "team") {
        return item.tags?.includes("组队") || item.title.includes("组队");
      }
      if (activeTab.value === "qa") {
        return item.tags?.includes("问答") || item.title.includes("问答");
      }
      return true;
    })
    .filter((item) => {
      const kw = keyword.value.trim();
      if (!kw) return true;
      return (
        (item.title && item.title.includes(kw)) ||
        (item.content && item.content.includes(kw)) ||
        (item.tags && item.tags.includes(kw))
      );
    });
});

onMounted(() => {
  if (store.posts.length === 0) {
    store.fetchPosts();
  }
});

async function ensurePostsLoaded() {
  if (store.posts.length === 0) {
    await store.fetchPosts();
  }
}

async function openPostById(postId) {
  await ensurePostsLoaded();
  const numericId = Number(postId);
  let target = store.posts.find((item) => item.id === numericId);
  if (!target) {
    await store.fetchPosts();
    target = store.posts.find((item) => item.id === numericId);
  }
  if (target) {
    openDetails(target);
  }
}

defineExpose({ openPostById });

function toggleComposer() {
  if (!canPublish.value) return;
  showComposer.value = !showComposer.value;
  publishStatus.value = "";
  if (!showComposer.value) {
    resetForm();
  } else {
    form.college = auth.user?.college || defaultColleges[0];
  }
}

function resetForm() {
  form.title = "";
  form.college = auth.user?.college || defaultColleges[0];
  form.tags = "";
  form.content = "";
}

function userAvatar(post) {
  if (post.avatarUrl) {
    return post.avatarUrl;
  }
  const seed = post.authorEmail || post.authorName || "guest";
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
}

function commentAvatar(comment) {
  if (comment.avatarUrl) {
    return comment.avatarUrl;
  }
  const seed = comment.authorEmail || comment.authorName || "guest";
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
}

function goToProfile(userId) {
  if (!userId) return;
  // 传递来源路由信息，用于返回
  router.push({
    path: `/users/${userId}`,
    state: { back: route.fullPath }
  });
}

async function handleSubmit() {
  publishStatus.value = "";
  const payload = {
    title: form.title,
    content: form.content,
    college: form.college === "全部学院" ? null : form.college,
    tags: form.tags
  };
  const result = await store.createPost(payload);
  publishStatus.value = result.message;
  if (result.success) {
    resetForm();
    showComposer.value = false;
  }
}

function openDetails(post) {
  selectedPost.value = post;
  detailVisible.value = true;
  commentContent.value = "";
  replyTarget.value = null;
  fetchComments(post.id);
}

async function fetchComments(postId) {
  await store.fetchComments(postId);
}

function closeDetails() {
  detailVisible.value = false;
  selectedPost.value = null;
  replyTarget.value = null;
}

function isOwnPost(post) {
  return auth.user && post.createdBy === auth.user.id;
}

async function handleDelete(post) {
  if (!isOwnPost(post)) return;
  const confirmed = window.confirm(`确定删除讨论「${post.title}」吗？`);
  if (!confirmed) return;
  await store.deletePost(post.id);
}

const currentComments = computed(() => {
  if (!selectedPost.value) return [];
  return store.commentsByPost[selectedPost.value.id] || [];
});

const commentCount = computed(() => currentComments.value.length);
const userInitial = computed(() => {
  const source = auth.user?.fullName || auth.user?.email || "同学";
  return source.trim().charAt(0).toUpperCase();
});

async function submitComment() {
  if (!selectedPost.value || !commentContent.value.trim()) return;
  commentSubmitting.value = true;
  const { success } = await store.createComment(
    selectedPost.value.id,
    commentContent.value.trim(),
    replyTarget.value?.id || null
  );
  commentSubmitting.value = false;
  if (success) {
    commentContent.value = "";
    replyTarget.value = null;
  }
}

function isOwnComment(comment) {
  if (!auth.user) return false;
  const owner = comment.createdBy ?? comment.created_by;
  if (owner != null) {
    return String(owner) === String(auth.user.id);
  }
  return (comment.authorName || "").trim() === (auth.user.fullName || "").trim();
}

async function handleDeleteComment(comment) {
  if (!selectedPost.value) return;
  const confirmed = window.confirm("确定删除这条评论吗？");
  if (!confirmed) return;
  await store.deleteComment(selectedPost.value.id, comment.id);
}

function refreshComments() {
  if (!selectedPost.value) return;
  fetchComments(selectedPost.value.id);
}

function startReply(comment) {
  if (!auth.user) return;
  replyTarget.value = comment;
  commentContent.value = "";
  nextTick(() => {
    const textarea = document.querySelector(".discussion-comments textarea");
    textarea?.focus();
  });
}

function commentInitial(comment) {
  const name = (comment.authorName || "同学").trim();
  return name.slice(0, 1).toUpperCase();
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
@use "../styles/panel-base";

.discussion-panel {
  .publish-btn {
    border: 1px dashed #fcd34d;
    background: rgba(251, 191, 36, 0.15);
    color: #92400e;
  }

  .composer {
    background: #fff7ed;
    border-color: #fed7aa;

    input,
    textarea,
    select {
      background: #fff;
    }
  }

  .discussion-overlay {
    grid-column: 1 / -1;
    background: linear-gradient(135deg, #0f172a, #1e1b4b);
    border-radius: 28px;
    padding: 20px;
    box-shadow: 0 35px 65px rgba(15, 23, 42, 0.4);
    color: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-top: 16px;

    .overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }
  }

  .ghost {
    border: none;
    background: rgba(255, 255, 255, 0.12);
    color: #f8fafc;
    padding: 8px 14px;
    border-radius: 999px;
    font-weight: 500;

    &:hover {
      background: rgba(255, 255, 255, 0.24);
    }
  }

  .overlay-body {
    display: block;
  }
}

.discussion-list {
  transition: filter 0.2s ease, opacity 0.2s ease;

  &.blurred {
    filter: blur(2px);
    opacity: 0.4;
    pointer-events: none;
  }

  .card {
    background: #fff;
    border-radius: 22px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
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
    }

    .tag {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(99, 102, 241, 0.1);
      color: #4c1d95;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 500;
      margin-bottom: 8px;
    }

    h3 {
      margin: 0 0 8px;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.4;
    }

    .desc {
      margin: 0;
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .highlights {
      list-style: none;
      padding: 0;
      margin: 12px 0 0;
      display: flex;
      flex-direction: column;
      gap: 6px;

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
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .meta {
      font-size: 0.85rem;
      color: #94a3b8;
    }
  }
}

.discussion-main {
  display: flex;
  flex-direction: column;
  gap: 18px;

  .info-header {
    background: rgba(15, 23, 42, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 18px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    .tag {
      background: rgba(255, 255, 255, 0.12);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.85rem;
      width: fit-content;
      letter-spacing: 0.08em;
    }

    h3 {
      margin: 0;
      font-size: 1.8rem;
      letter-spacing: 0.05em;
    }
  }

  .info-columns {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(220px, 0.9fr);
    gap: 20px;
    align-items: flex-start;
  }

  .content-card {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 18px 20px;

    h4 {
      margin: 0 0 12px;
      letter-spacing: 0.08em;
      color: rgba(248, 250, 252, 0.75);
    }

    p {
      margin: 0;
      color: rgba(248, 250, 252, 0.95);
      line-height: 1.65;
      white-space: pre-wrap;
    }
  }

  .meta-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .meta-item {
    background: rgba(15, 23, 42, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 18px;
    padding: 12px 14px;

    .label {
      margin: 0;
      font-size: 0.75rem;
      color: rgba(248, 250, 252, 0.55);
      letter-spacing: 0.08em;
    }

    .value {
      margin: 6px 0 0;
      font-size: 1.05rem;
      color: #f8fafc;
      font-weight: 600;
      word-break: break-word;
    }
  }
}

.discussion-comments {
  margin-top: 24px;

  .comments-surface {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.9));
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 20px 22px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 25px 50px rgba(15, 23, 42, 0.45);
  }

  .comments-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;

    .title-block {
      display: flex;
      flex-direction: column;
      gap: 2px;

      h4 {
        margin: 0;
        font-size: 1rem;
        letter-spacing: 0.08em;
      }

      .count {
        font-size: 0.8rem;
        color: rgba(248, 250, 252, 0.7);
      }
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  li {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 14px;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(6px);
    color: #e2e8f0;
    transition: transform 0.2s ease, border-color 0.2s ease;

    &:hover {
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    &.replying {
      border-color: #60a5fa;
      box-shadow: 0 18px 35px rgba(96, 165, 250, 0.25);
    }

    .avatar-badge {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      overflow: hidden;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.06);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .comment-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .row {
      display: flex;
      gap: 8px;
    }
  }

  .composer-shell {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    gap: 12px;
  }

  .composer-card {
    flex: 1;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 16px;
    align-items: flex-start;
    padding: 16px 18px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(15, 23, 42, 0.45);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .composer-avatar {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.06);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .comment-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: inherit;
    background: transparent;
  }

  .textarea-wrapper {
    display: block;
    padding: 4px;
    border-radius: 22px;
    background: linear-gradient(120deg, rgba(56, 189, 248, 0.45), rgba(139, 92, 246, 0.4));

    &:focus-within {
      box-shadow: 0 12px 30px rgba(99, 102, 241, 0.35);
    }

    textarea {
      width: 100%;
      border: none;
      border-radius: 18px;
      padding: 16px 18px;
      resize: none;
      background: rgba(15, 23, 42, 0.92);
      color: #f8fafc;
      font-family: inherit;
      font-size: 0.95rem;
      line-height: 1.5;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);

      &:focus {
        outline: none;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
      }

      &::placeholder {
        color: rgba(226, 232, 240, 0.6);
      }
    }
  }

  .composer-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding-top: 4px;

    .hint {
      font-size: 0.8rem;
      color: rgba(226, 232, 240, 0.75);
    }

    .primary {
      padding: 10px 30px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(120deg, #38bdf8, #8b5cf6);
      color: #fff;
      font-weight: 600;
      letter-spacing: 0.08em;
      box-shadow: 0 12px 24px rgba(99, 102, 241, 0.35);
      transition: transform 0.2s ease, filter 0.2s ease;

      &:hover {
        filter: brightness(1.05);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }
    }
  }

  .ghost.neutral {
    border: 1px solid rgba(120, 113, 108, 0.3);
    color: #475569;
    background: rgba(148, 163, 184, 0.12);

    &:hover {
      background: rgba(148, 163, 184, 0.25);
    }
  }

  .reply-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(59, 130, 246, 0.18);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #dbeafe;
    border-radius: 12px;
    padding: 8px 12px;
    margin-bottom: 8px;

    p {
      margin: 0;
      font-weight: 500;
    }
  }

  .loading-card,
  .empty-card {
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    color: rgba(226, 232, 240, 0.8);
    margin-bottom: 16px;
    background: rgba(15, 23, 42, 0.25);
  }
}
</style>
