# 学术之光（Academic Light）项目总结报告

> 课程：Web 开发应用期末项目  
> 形态：前后端分离 Web 应用（SPA + REST API）  
> 目标：围绕“竞赛—科研—保研—交流”学习闭环，提供信息获取、协作、通知与社区互动能力。

---

## 1. 项目概述

**学术之光**是一个面向高校学生/导师/管理员的科研与竞赛协作平台。系统提供统一登录与角色权限控制，围绕以下核心场景：

- 学生：
  - 浏览竞赛情报、报名参赛、查看报名记录
  - 浏览科研项目、提交申请、与导师联系
  - 浏览/发布保研经验帖
  - 在交流广场发帖、评论、互动
  - 收藏竞赛、接收通知、维护好友与私信

- 导师：
  - 发布/编辑竞赛信息与科研项目
  - 查看竞赛报名、科研申请列表

- 管理员：
  - 具备导师能力，并可维护平台数据（按后端权限逻辑）

---

## 2. 技术栈总览

### 2.1 前端（`frontend/`）

- **框架**：Vue 3（Composition API）
- **构建工具**：Vite 5
- **路由**：Vue Router 4
- **状态管理**：Pinia 2
- **HTTP 请求**：Axios 1
- **样式**：SCSS（`sass`）
- **鉴权存储**：`localStorage`（token key：`academic_light_token`）

> 代理配置：`frontend/vite.config.js` 将 `/api` 代理到 `http://localhost:4000`，开发环境下前端请求 `/api/**` 自动转发后端。

### 2.2 后端（`backend/`）

- **运行时**：Node.js（ESM）
- **Web 框架**：Express 4
- **数据库**：MySQL 8（驱动：mysql2/promise）
- **鉴权**：JWT（jsonwebtoken）
- **密码加密**：bcryptjs
- **跨域**：cors
- **环境变量**：dotenv

后端统一挂载：`/api/**`（见 `backend/src/app.js`）。

### 2.3 数据库（MySQL）

- **核心表**（按功能模块）：
  - 用户/资料：`users`、个人资料字段（由 `schema.sql`/初始化脚本创建）
  - 竞赛中心：`competitions`（含热度/收藏次数等字段）、`competition_favorites`、`competition_applications`
  - 竞赛情报（旧接口兼容）：同样基于 `competitions` 表，通过后端字段映射复用
  - 科研项目：`research_projects`、`research_applications`
  - 保研经验：`postgraduate_posts`
  - 交流广场：`discussions`、评论表（由对应 SQL/控制器维护）
  - 通知：`notifications`
  - 好友：`friend_requests` 等
  - 私信：`private_messages`

> SQL 脚本目录：`backend/sql/`（含 schema、seed、竞赛/好友/私信相关脚本）。

---

## 3. 系统架构与数据流

### 3.1 前后端分离

- 前端为 SPA（单页应用），负责页面渲染与交互
- 后端为 REST API，负责鉴权、业务逻辑与数据库读写
- 开发期通过 Vite Proxy 解决跨域与端口差异

### 3.2 鉴权与权限（RBAC）

- 登录成功后后端签发 JWT，前端保存到 `localStorage`（`academic_light_token`）
- 受保护接口由 `authMiddleware.js` 校验 token
- 角色控制：`student` / `mentor` / `admin`
  - 学生：可报名竞赛、申请科研、发帖评论、收藏等
  - 导师/管理员：可发布与管理竞赛/科研项目，并查看申请者

### 3.3 状态管理

- 每个业务模块一个 Pinia Store（`frontend/src/stores/`）
- Store 内部用 Axios 调 API，并把 loading/error/data 统一管理
- 通知/收藏/科研/保研/讨论等模块实现了动态 token 更新（`updateToken`）以避免页面切换后 token 不生效导致的白屏/401

---

## 4. 功能模块详解（功能点 + 对应技术栈）

> 本节以“功能 → 前端页面/组件 → Pinia store → 后端路由/控制器 → 数据库表”的方式梳理。

### 4.1 用户登录与注册

- **功能**：登录/注册、角色选择、学院/专业等字段录入
- **前端**：
  - 页面：`frontend/src/views/AuthView.vue`
  - 组件：`frontend/src/components/LoginPanel.vue`
  - 路由：`frontend/src/router/index.js`（`/` → `AuthView`）
- **状态管理**：`frontend/src/stores/auth.js`
  - token、用户信息、加载状态、`fetchProfile()`
- **后端**：
  - 路由：`backend/src/routes/authRoutes.js`
  - 控制器：`backend/src/controllers/authController.js`
- **关键技术**：JWT、bcryptjs、Vue Router 导航守卫（requiresAuth/guestOnly）

### 4.2 仪表盘与统一工作台

- **功能**：统一入口，按侧边栏切换各模块（竞赛情报/竞赛中心/科研/保研/讨论/好友/个人信息/设置）
- **前端**：`frontend/src/views/DashboardView.vue`
  - 通过 `selectedSection` 控制组件渲染
  - 关联通知铃铛：`NotificationBell`
- **关键技术**：组件化布局、条件渲染、`ref` + `nextTick`（从通知跳转并定位讨论内容）

### 4.3 竞赛情报（按学院筛选、发布、报名）

- **功能**：
  - 学院侧边栏筛选赛事
  - 关键词搜索、状态筛选
  - 导师/管理员发布竞赛、编辑、删除
  - 学生报名、查看/修改/撤回报名
  - 导师查看报名列表
- **前端**：
  - 组件：`frontend/src/components/CompetitionPanel.vue`
  - 使用固定学院列表 `defaultColleges`
- **Store**：`frontend/src/stores/competition.js`
  - `fetchCompetitions/createCompetition/updateCompetition/deleteCompetition`
  - `applyToCompetition/fetchMyApplication/updateMyApplication/deleteMyApplication`
- **后端**：
  - 路由：`backend/src/routes/competitionRoutes.js`（`/api/competitions`）
  - 控制器：`backend/src/controllers/competitionController.js`
  - 说明：为兼容“竞赛情报”与“竞赛中心”共用 `competitions` 表，通过字段映射实现兼容
- **数据库**：
  - `competitions`
  - `competition_applications`（报名记录）
- **关键技术**：
  - Vue 表单/弹窗、计算属性过滤
  - 角色权限（mentor/admin 才能发布）
  - MySQL 约束字段校验（如 level、category）

### 4.4 竞赛中心（卡片展示、管理面板、收藏）

- **功能**：
  - 竞赛卡片展示、详情、导师编辑
  - 管理面板展示统计与快捷操作
  - 收藏竞赛：右侧“我的收藏栏”展示收藏列表
- **前端**：
  - 页面：`frontend/src/views/CompetitionCenterView.vue`
  - 组件：`CompetitionCard.vue`、`CompetitionModal.vue`、`ManagePanel.vue`
- **Store**：
  - `frontend/src/stores/competitionCenter.js`
  - `frontend/src/stores/favorites.js`
- **后端**：
  - 竞赛中心：`backend/src/controllers/competitionCenterController.js` + `competitionCenterRoutes.js`
  - 收藏：`backend/src/controllers/favoritesController.js` + `favoritesRoutes.js`
- **数据库**：
  - `competitions`（含 favorite_count / popularity_score 等）
  - `competition_favorites`
- **关键技术**：
  - Pinia getter（是否已收藏、收藏数量）
  - 后端字段白名单更新（防止非法字段导致 500）

### 4.5 科研项目（项目列表、导师发布、学生申请）

- **功能**：
  - 项目列表、按学院/阶段筛选
  - 导师发布/编辑/删除项目
  - 学生提交申请、修改/撤回
  - 导师查看申请者列表
- **前端**：
  - 组件：`frontend/src/components/ResearchPanel.vue`
- **Store**：`frontend/src/stores/research.js`
- **后端**：
  - 路由：`backend/src/routes/researchRoutes.js`（`/api/research-projects`）
  - 控制器：`backend/src/controllers/researchController.js`
- **数据库**：
  - `research_projects`
  - `research_applications`
- **关键技术**：
  - Vue 组合式 API + 表单弹窗
  - 动态 token 更新（避免白屏/401）

### 4.6 保研经验（经验帖列表与发布）

- **功能**：经验帖浏览、按学院/关键词筛选；导师/学生按权限发布与删除（按控制器设定）
- **前端**：`frontend/src/components/PostgraduatePanel.vue`
- **Store**：`frontend/src/stores/postgraduate.js`
- **后端**：`backend/src/controllers/postgraduateController.js` + `postgraduateRoutes.js`
- **数据库**：`postgraduate_posts`

### 4.7 交流广场（讨论与评论）

- **功能**：
  - 发帖、删除
  - 评论、回复、删除评论
  - 从通知跳转到指定帖子
- **前端**：`frontend/src/components/DiscussionPanel.vue`
- **Store**：`frontend/src/stores/discussion.js`
- **后端**：`backend/src/controllers/discussionController.js` + `discussionRoutes.js`
- **数据库**：`discussions` + 评论表（由 schema 创建/维护）

### 4.8 通知系统（通知铃铛、未读数、标记已读）

- **功能**：
  - 顶部铃铛展示通知列表
  - 未读数提示
  - 标记单条/全部已读
  - 通知点击可触发页面切换（如跳转讨论）
- **前端**：
  - 组件：`frontend/src/components/NotificationBell.vue`
  - Store：`frontend/src/stores/notifications.js`
- **后端**：
  - `backend/src/controllers/notificationController.js` + `notificationRoutes.js`
- **数据库**：`notifications`
- **关键技术**：
  - 动态 token 更新（`updateToken`）
  - 点击外部关闭菜单、交互状态管理

### 4.9 好友系统与私聊

- **功能**：
  - 好友申请、同意/拒绝
  - 好友列表展示
  - 私信聊天（按接口与 store 实现）
- **前端**：
  - `frontend/src/components/FriendPanel.vue`
  - `frontend/src/components/PrivateChat.vue`
  - store：`friend.js`、`privateChat.js`
- **后端**：
  - 好友：`friendController.js` + `friendRoutes.js`
  - 私聊：`privateMessageController.js` + `privateMessageRoutes.js`
- **数据库**：
  - `friend_requests`（以及相关好友关系表）
  - `private_messages`

### 4.10 个人主页 / 资料编辑

- **功能**：
  - 展示个人信息、统计（粉丝/发帖/贡献等）
  - 编辑个人简介、学院、方向、标签
  - 查看他人主页
- **前端**：
  - 页面：`frontend/src/views/ProfileView.vue`
  - 组件：`frontend/src/components/ProfilePanel.vue`
  - Store：`frontend/src/stores/profile.js`、`user.js`
- **后端**：
  - `profileController.js` + `profileRoutes.js`
  - `userController.js` + `userRoutes.js`

---

## 5. 关键工程化与稳定性实践（项目迭代中解决的问题）

- **动态 token 初始化**：
  - 多个 store 使用 `axios.create` 并提供 `updateToken()` 动态注入 Authorization header
  - 解决页面切换后请求未携带 token 导致 401 与白屏

- **循环依赖/组件导入清理**：
  - 避免在主视图中不必要的组件导入造成构建/运行异常
  - Dashboard 中确保使用到的组件都显式 import

- **后端字段白名单更新**：
  - 更新接口仅允许特定字段，避免数据库列不存在导致 500

- **数据表缺失补齐**：
  - 报名表 `competition_applications` 缺失时补充建表，确保报名链路完整

---

## 6. 项目运行方式（本地开发）

### 6.1 后端

- 目录：`backend/`
- 启动：
  - `npm run dev`（nodemon）
  - 或 `npm start`
- 健康检查：`GET /health`

### 6.2 前端

- 目录：`frontend/`
- 启动：`npm run dev`
- Vite Proxy：`/api -> http://localhost:4000`

---

## 7. 后续可拓展方向（建议）

- **统一 API Base 配置**：用 `VITE_API_BASE` 环境变量替代硬编码 baseURL
- **Docker Compose 部署**：前端 Nginx + 后端 Node + MySQL 一键启动
- **文件/资源中心**：对象存储（OSS/COS）+ 权限控制 + 下载统计
- **搜索与推荐**：对竞赛/科研/经验帖加入全文索引与标签推荐
- **实时通知/聊天**：Socket.IO 推送（替代轮询）

---

## 8. 项目总结

本项目完成了一个覆盖 **竞赛情报、竞赛中心收藏、科研项目申请、保研经验社区、讨论互动、通知系统、好友与私聊、个人主页** 的综合平台，并采用 Vue3 + Pinia + Express + MySQL 的经典前后端分离架构，具备清晰的模块划分与可持续迭代空间。
