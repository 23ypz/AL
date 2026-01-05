<template>
  <div class="profile-page">
    <div class="profile-header" v-if="!isOwnProfile">
      <button class="back-btn" @click="goBack">
        ← 返回
      </button>
    </div>

    <section class="hero">
      <div class="identity-row">
        <button class="avatar-button" @click="isOwnProfile ? triggerAvatarUpload() : null">
          <img :src="avatarPreview" alt="avatar" />
          <input v-if="isOwnProfile" ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="handleAvatarChange" />
        </button>
        <div class="identity-info">
          <h3>{{ user.fullName }}</h3>
          <p class="role">{{ roleLabel }}</p>
          <div class="identity-meta">
            <span>{{ profile.college }}</span>
            <span>{{ profile.major }}</span>
          </div>
        </div>
      </div>
      <div class="stats">
        <div>
          <small>关注</small>
          <strong>{{ profileStore.stats.following }}</strong>
        </div>
        <div>
          <small>粉丝</small>
          <strong>{{ profileStore.stats.followers }}</strong>
        </div>
        <div>
          <small>发帖</small>
          <strong>{{ profileStore.stats.posts }}</strong>
        </div>
        <div>
          <small>本月贡献</small>
          <strong>{{ profileStore.stats.contributions }}</strong>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="left-column">
        <article class="card intro">
          <header>
            <h2>个人简介</h2>
            <div class="header-actions">
              <span v-if="profileStatus.message" :class="['status-chip', profileStatus.type]">{{ profileStatus.message }}</span>
              <button v-if="isOwnProfile" class="ghost" @click="toggleEditingIntro">
                {{ editingIntro ? "取消" : "编辑资料" }}
              </button>
            </div>
          </header>

          <form v-if="editingIntro && isOwnProfile" class="edit-form" @submit.prevent="saveProfile">
            <label>
              个人简介
              <textarea v-model="form.bio" rows="4" placeholder="写点什么介绍自己吧" />
            </label>
            <label>
              所在学院
              <input v-model="form.college" placeholder="例如：计算机学院" />
            </label>
            <label>
              主修/方向
              <input v-model="form.major" placeholder="例如：人工智能" />
            </label>
            <label>
              擅长领域标签（用逗号分隔）
              <input v-model="form.tagsText" placeholder="算法, 前端, 产品思维" />
            </label>
            <div class="form-actions">
              <button type="button" class="ghost" @click="toggleEditingIntro">取消</button>
              <button type="submit" class="primary" :disabled="savingProfile">
                {{ savingProfile ? "保存中…" : "保存资料" }}
              </button>
            </div>
          </form>

          <template v-else>
            <p class="bio">{{ userBio }}</p>
            <ul class="meta">
              <li>
                <span>学院</span>
                <strong>{{ profile.college }}</strong>
              </li>
              <li>
                <span>主修方向</span>
                <strong>{{ profile.major }}</strong>
              </li>
              <li>
                <span>擅长领域</span>
                <div class="tags">
                  <span v-for="tag in profile.tags" :key="tag">{{ tag }}</span>
                </div>
              </li>
            </ul>
          </template>
        </article>

        <article class="card timeline" v-if="isOwnProfile">
          <header>
            <h2>最近动态</h2>
            <button class="ghost" disabled>更多</button>
          </header>
          <ul>
            <li v-for="item in profileStore.activities" :key="item.id">
              <div class="dot" />
              <div>
                <p>{{ item.title }}</p>
                <small>{{ item.time }}</small>
              </div>
            </li>
            <li v-if="profileStore.activities.length === 0" class="empty-activity">
              <div class="dot" />
              <div>
                <p>暂无动态</p>
                <small>去交流广场发帖或评论吧</small>
              </div>
            </li>
          </ul>
        </article>
      </div>

      <div class="right-column" v-if="isOwnProfile">
        <article class="card placeholder">

        </article>
      </div>

      <div class="right-column" v-else>
        <div class="profile-actions" v-if="!isOwnProfile">
          <button class="friend-request-btn" @click="openFriendRequest">
            <span class="icon">👋</span>
            <span>申请添加好友</span>
          </button>
          <div v-if="friendStatus.message" :class="['friend-status', friendStatus.type]">
            {{ friendStatus.message }}
          </div>
        </div>
      </div>
    </section>

    <!-- 好友申请弹窗 -->
    <transition name="fade">
      <div v-if="showFriendRequest" class="modal-overlay" @click.self="closeFriendRequest">
        <div class="modal-card">
          <button class="close-btn" @click="closeFriendRequest">×</button>
          <h3>申请添加好友</h3>
          <p class="target-user">向 {{ user.fullName }} 发送好友申请</p>
          <form class="friend-request-form" @submit.prevent="submitFriendRequest">
            <label>
              申请理由
              <textarea 
                v-model="friendRequestForm.reason" 
                rows="4" 
                placeholder="请输入申请理由，让对方更好地了解你..."
                required
              />
            </label>
            <div class="form-actions">
              <button type="button" class="ghost" @click="closeFriendRequest">取消</button>
              <button type="submit" class="primary" :disabled="friendRequestSubmitting">
                {{ friendRequestSubmitting ? "发送中..." : "发送申请" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useProfileStore } from "../stores/profile";
import { useUserStore } from "../stores/user";
import { useFriendStore } from "../stores/friend";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const profileStore = useProfileStore();
const userStore = useUserStore();
const friendStore = useFriendStore();

// 记录来源路由，用于返回
const fromRoute = ref(route.query.back || router.options.history.state?.back);

// 支持查看他人主页（通过路由参数）或自己主页（无参数）
const targetUserId = Number(route.params.id);
const isOwnProfile = !route.params.id || Number(route.params.id) === auth.user?.id;

const user = computed(() => {
  if (isOwnProfile) {
    return auth.user || {};
  }
  return userStore.publicUser || {};
});
const avatarPreview = ref(user.value?.avatarUrl || placeholderAvatar(user.value));
const avatarFile = ref(null);
const fileInput = ref(null);
const editingIntro = ref(false);
const savingProfile = ref(false);
const profileStatus = reactive({ message: "", type: "" });

// 好友申请相关
const showFriendRequest = ref(false);
const friendRequestSubmitting = ref(false);
const friendRequestForm = reactive({
  reason: ""
});

// 好友申请状态提示
const friendStatus = reactive({ message: "", type: "" });

const form = reactive({
  bio: user.value?.bio || "",
  college: user.value?.college || "",
  major: user.value?.major || "",
  tagsText: user.value?.expertiseTags || ""
});

watch(
  () => (isOwnProfile ? auth.user : userStore.publicUser),
  (val) => {
    if (!avatarFile.value) {
      avatarPreview.value = val?.avatarUrl || placeholderAvatar(val);
    }
    if (isOwnProfile) {
      form.bio = val?.bio || "";
      form.college = val?.college || "";
      form.major = val?.major || "";
      form.tagsText = val?.expertiseTags || "";
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (!isOwnProfile && targetUserId) {
    userStore.fetchPublicProfile(targetUserId);
  }
  if (isOwnProfile) {
    profileStore.fetchStats();
    profileStore.fetchActivities();
  }
});

const roleLabel = computed(() => {
  switch (user.value.role) {
    case "mentor":
      return "导师";
    case "admin":
      return "管理员";
    default:
      return "学生";
  }
});

const userBio = computed(() => user.value.bio || "这位同学还没有填写简介。");

const profile = computed(() => ({
  location: user.value.college || "未填写学院",
  college: user.value.college || "未填写",
  major: user.value.major || "未填写",
  tags:
    user.value.expertiseTags?.split(",").map((tag) => tag.trim()).filter(Boolean) || ["算法", "前端", "产品思维"],
  bio: user.value.bio
}));

function triggerAvatarUpload() {
  fileInput.value?.click();
}

function handleAvatarChange(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  avatarFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarPreview.value = e.target.result;
    saveAvatar(e.target.result);
  };
  reader.readAsDataURL(file);
}

function placeholderAvatar(user) {
  const seed = user?.email || user?.fullName || "guest";
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
}

function goBack() {
  // 优先返回来源路由；如果没有来源或来源就是当前页，则返回仪表盘
  if (fromRoute.value && fromRoute.value !== route.fullPath) {
    router.push(fromRoute.value);
  } else {
    router.push("/dashboard");
  }
}

async function saveAvatar(dataUrl) {
  profileStatus.message = "";
  const result = await auth.updateProfile({ avatarUrl: dataUrl });
  if (!result.success) {
    profileStatus.message = result.message;
    profileStatus.type = "error";
  }
}

function toggleEditingIntro() {
  editingIntro.value = !editingIntro.value;
  if (!editingIntro.value) {
    profileStatus.message = "";
  }
}

function openFriendRequest() {
  showFriendRequest.value = true;
  friendRequestForm.reason = "";
}

function closeFriendRequest() {
  showFriendRequest.value = false;
  friendRequestForm.reason = "";
  friendStatus.message = "";
}

async function submitFriendRequest() {
  if (!friendRequestForm.reason.trim()) {
    friendStatus.message = "请输入申请理由";
    friendStatus.type = "error";
    return;
  }

  if (!targetUserId) {
    friendStatus.message = "无效的用户ID";
    friendStatus.type = "error";
    return;
  }

  if (targetUserId === auth.user?.id) {
    friendStatus.message = "不能给自己发送好友申请";
    friendStatus.type = "error";
    return;
  }

  friendRequestSubmitting.value = true;
  try {
    const result = await friendStore.sendFriendRequest(targetUserId, friendRequestForm.reason);
    friendStatus.message = result.message;
    friendStatus.type = result.success ? "success" : "error";
    if (result.success) {
      closeFriendRequest();
    }
  } catch (error) {
    friendStatus.message = "发送失败，请重试";
    friendStatus.type = "error";
  } finally {
    friendRequestSubmitting.value = false;
  }
}

async function saveProfile() {
  savingProfile.value = true;
  profileStatus.message = "";
  const payload = {
    bio: form.bio,
    college: form.college || null,
    major: form.major || null,
    expertiseTags: form.tagsText
  };
  const result = await auth.updateProfile(payload);
  savingProfile.value = false;
  profileStatus.message = result.message;
  profileStatus.type = result.success ? "success" : "error";
  if (result.success) {
    editingIntro.value = false;
  }
}
</script>

<style scoped lang="scss">
.profile-actions {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;

  .friend-request-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25);
    }

    &:active {
      transform: translateY(0);
    }

    .icon {
      font-size: 1.1rem;
    }
  }

  .friend-status {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;

    &.success {
      background: #d1fae5;
      color: #065f46;
    }

    &.error {
      background: #fee2e2;
      color: #991b1b;
    }
  }
}

.profile-header {
  margin-bottom: 16px;

  .back-btn {
    background: none;
    border: none;
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #334155;
    }
  }
}

.modal-overlay {
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
  padding: 20px;
}

.modal-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  position: relative;

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }

  h3 {
    margin: 0 0 16px;
    font-size: 1.25rem;
    color: #1e293b;
  }

  .target-user {
    margin: 0 0 20px;
    color: #64748b;
    font-size: 0.95rem;
  }

  .friend-request-form {
    display: flex;
    flex-direction: column;
    gap: 16px;

    label {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;

      textarea {
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 0.9rem;
        resize: vertical;
        min-height: 80px;
        font-family: inherit;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }
  }
}

.profile-page {
  padding: 32px 40px 64px;
  background: linear-gradient(180deg, #f4f6fb 0%, #ffffff 35%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.ghost.back {
  display: none;
}

.ghost.back {
  align-self: flex-start;
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
}

.hero {
  background: #fff;
  border-radius: 28px;
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 35px 65px rgba(15, 23, 42, 0.08);

  .identity-row {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    flex: 1;

    .identity-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      h3 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 700;
        color: #1e293b;
      }

      .role {
        margin: 0;
        font-size: 0.95rem;
        color: #64748b;
      }

      .identity-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: #667;
        margin-top: 4px;
      }
    }

    .avatar-button {
      position: relative;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: 24px;
      overflow: hidden;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.04);
      }

      img {
        width: 80px;
        height: 80px;
        border-radius: 24px;
        object-fit: cover;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
    }
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(80px, 1fr));
    gap: 14px;

    div {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    small {
      color: #94a3b8;
      font-size: 0.85rem;
    }

    strong {
      font-size: 1.3rem;
    }
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
}

.card {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 25px 55px rgba(15, 23, 42, 0.06);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
}

.intro {
  .bio {
    margin: 0 0 16px;
    color: #475569;
    line-height: 1.65;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-chip {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.8rem;

    &.success {
      background: rgba(74, 222, 128, 0.2);
      color: #15803d;
    }

    &.error {
      background: rgba(248, 113, 113, 0.2);
      color: #b91c1c;
    }
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 12px;

    textarea,
    input {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
      font: inherit;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }

  .meta {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;

    li {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    span {
      color: #94a3b8;
    }

    strong {
      font-size: 1rem;
    }

    .tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      span {
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.85rem;
      }
    }
  }
}

.timeline ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  li {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: center;
  }

  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: linear-gradient(120deg, #22d3ee, #38bdf8);
  }

  p {
    margin: 0 0 4px;
    font-weight: 600;
  }

  small {
    color: #94a3b8;
  }

  .empty-activity {
    opacity: 0.5;
  }
}

.placeholder {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;

  p {
    margin: 0;
    color: #475569;
  }
}

@media (max-width: 960px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(80px, 1fr));
  }
}
</style>
