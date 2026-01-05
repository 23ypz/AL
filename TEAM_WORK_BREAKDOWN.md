# 学术之光（Academic Light）10 人小组分工 & 实现细节（含技术栈与难点）

> 分组结构：**前端 5 人 + 后端 3 人 + 数据库/测试 2 人**  
> 目标：保证每个人都有明确代码产出；组长工作量略大；并给出每个模块的实现难点与落地方式。

---

## 0. 全局约定（建议统一）

### 0.1 代码协作方式

- **分支策略**：`feat/<module>-<name>` / `fix/<module>-<name>`
- **PR 要求**：
  - PR 描述包含：功能点、影响范围、测试步骤、截图/录屏（如涉及 UI）
  - 自测清单：至少覆盖 1 条正常路径 + 1 条错误路径
- **接口约定**：
  - 成功：`{ message, ...data }`
  - 失败：`{ message }`，HTTP status 与语义匹配（400/401/403/404/409/500）

### 0.2 常见技术难点（全员可能踩坑）

- **Token 注入**：Pinia store 内 axios 实例要能动态 `updateToken()`，避免页面切换后 header 丢失。
- **Vite 代理**：开发环境 `/api` 走 `vite.config.js` proxy；生产环境建议 Nginx 反代 `/api`。
- **数据库约束**：MySQL 字段 NOT NULL / enum / 无默认值会导致 500，需要后端校验并返回 400。
- **模块复用与字段映射**：同一张表被多个业务复用时，需要后端做字段映射或拆表。

---

## 1) 前端组长 / 前端集成（工作量略大）

### 负责范围

- **Dashboard 集成**：模块切换、组件渲染、跨模块跳转（通知→讨论定位等）
- **路由与鉴权联动**：未登录拦截、登录后重定向
- **稳定性**：白屏预防（组件导入缺失、token 未注入导致的请求失败）

### 使用技术栈

- Vue 3（Composition API）
- Vue Router 4（导航守卫、路由跳转）
- Pinia（跨模块 store 初始化/联动）
- Axios（联调排错）
- Vite（开发代理）
- DevTools（Network/Console）

### 功能细节与难点（实现思路）

- **难点 A：Dashboard 动态渲染的组件“解析失败/白屏”**
  - **现象**：控制台 `Failed to resolve component: XxxxPanel`
  - **原因**：模板使用了 `<ResearchPanel/>` 等组件，但 script 未 import
  - **实现**：
    - 确保 `DashboardView.vue` 中**所有在 template 出现的组件都显式 import**
    - 必要时把不再使用的 import 移除，避免循环依赖

- **难点 B：通知跳转到讨论后需要定位到具体帖子**
  - **实现要点**：
    - `selectedSection = 'discussion'`
    - `nextTick(() => discussionPanelRef.value?.openPostById(postId))`
    - DiscussionPanel 暴露 `openPostById`，确保异步拉取后可定位

- **难点 C：统一 token 初始化，避免切换模块后 401/白屏**
  - **实现**：在 Dashboard `onMounted` 读取 `localStorage` token，并对关键 store 调 `updateToken(token)`
  - **验证**：
    - 首次进入 dashboard
    - 刷新页面后 token 仍有效
    - 切换到科研/讨论/收藏等模块请求正常

- **难点 D：导航守卫与登录态恢复**
  - **实现**：在 `router.beforeEach` 中：
    - 若有 token 且未拉 profile，则 `await auth.fetchProfile()`
    - `requiresAuth` → 未登录重定向 auth
    - `guestOnly` → 已登录重定向 dashboard

---

## 2) 登录/注册（Auth）

### 负责范围

- 登录/注册 UI、表单校验、角色/学院字段交互
- 登录态 token 持久化与错误提示体验

### 使用技术栈

- Vue 3
- Pinia（auth store）
- Axios
- Vue Router
- localStorage

### 功能细节与难点（实现思路）

- **难点 A：注册表单字段多，校验与提示易混乱**
  - **实现**：
    - `status = { type, message }` 统一承载提示
    - 前端做必填校验（邮箱格式/密码长度/角色选择）
    - 后端失败时展示 `error.response?.data?.message`

- **难点 B：角色/学院字段联动（导师只能选所属学院等）**
  - **实现**：
    - 前端 role 改变时自动调整可选项
    - 后端二次校验防绕过（mentor/admin 权限）

- **难点 C：登录成功后的初始化动作（好友/私聊/通知预加载）**
  - **实现**：在 `handleSubmit` 成功后：
    - `await auth.fetchProfile()`
    - `friendStore.fetch...`、`chatStore.fetch...`、`notificationStore.fetch...`（按项目实现）
    - 跳转 dashboard

---

## 3) 个人主页/资料

### 负责范围

- 个人主页展示、编辑资料、标签、统计展示
- 查看他人主页（`/users/:id`）

### 使用技术栈

- Vue 3
- Pinia（profile/user store）
- Axios
- Vue Router（动态路由 props）

### 功能细节与难点（实现思路）

- **难点 A：同一页面既支持“自己主页编辑”，也支持“他人主页只读”**
  - **实现**：
    - `isOwnProfile` computed：对比 route 参数与 auth.user.id
    - 模板：`v-if="isOwnProfile"` 控制编辑按钮

- **难点 B：编辑态与展示态切换的状态一致性**
  - **实现**：
    - `editingIntro` 控制 form 显示
    - 进入编辑态时把 store 数据拷贝到 form；取消编辑时重置 form

- **难点 C：标签输入（逗号分隔）与后端结构化字段转换**
  - **实现**：
    - 前端 `tagsText` ↔ `tags: string[]` 互转
    - 后端存 JSON 或逗号拼接（根据 schema）

---

## 4) 竞赛情报（CompetitionPanel）

### 负责范围

- 学院筛选、搜索、发布、报名、撤回/修改报名
- 截止日期与按钮状态判断

### 使用技术栈

- Vue 3（computed/filter）
- Pinia（competition store）
- Axios
- 日期处理（Date/Intl）

### 功能细节与难点（实现思路）

- **难点 A：学院列表出现“奇怪项”（从数据动态合并导致主办方混入）**
  - **实现**：学院列表固定为 `defaultColleges`，不从数据动态追加

- **难点 B：报名按钮一直显示关闭（status 字段被误当作 open/closed）**
  - **实现**：
    - `isCompetitionOpen` 默认 true，只在 status 明确为 `closed/inactive/expired` 才禁止
    - `isCompetitionExpired` 只由截止日期判断

- **难点 C：发布竞赛 500（数据库 enum / 必填字段约束）**
  - **实现**：
    - level 改为 select（A/B/C/D），避免 enum 插入失败
    - 增加 category 字段输入并提交 payload
    - 后端对 level/category 做 400 校验，避免 500

- **难点 D：报名表单与“已报名可修改”逻辑**
  - **实现**：
    - `fetchMyApplication(id)` 预拉取
    - 有 application → 进入编辑态（update），没有 → create
    - 撤回报名：DELETE `/my-application`

---

## 5) 科研/保研/讨论（三屏联动）

### 负责范围

- 科研项目（ResearchPanel）
- 保研经验（PostgraduatePanel）
- 交流广场（DiscussionPanel）

### 使用技术栈

- Vue 3
- Pinia（research/postgraduate/discussion store）
- Axios（axios.create + token header 管理）
- 复杂弹窗表单与列表渲染

### 功能细节与难点（实现思路）

- **难点 A：科研申请按钮显示“申请已关闭”**
  - **原因**：用 `item.status === 'open'` 判断，但科研项目用 stage 无 status
  - **实现**：申请默认开放，仅在明确 `closed/inactive/expired` 才禁用

- **难点 B：三个模块白屏（token 未注入）**
  - **实现**：
    - store 内统一 `axios.create({ baseURL })`
    - `setAuthToken(token)` + `updateToken(token)`
    - 组件加载时读 token 并调用 store.updateToken

- **难点 C：讨论评论的层级与删除**
  - **实现建议**：
    - 后端返回按时间排序的平铺列表 + parentId
    - 前端构建树（可选），或仅支持二级回复

- **难点 D：筛选与搜索性能/体验**
  - **实现**：computed 内链式 filter（学院/阶段/关键词），必要时 debounce

---

## 6) 后端组长 / API 集成（工作量略大）

### 负责范围

- 路由注册、全局错误处理、鉴权中间件一致性
- 合并后端 PR、组织联调

### 使用技术栈

- Node.js（ESM）
- Express 4
- dotenv、cors
- 错误处理中间件模式

### 功能细节与难点（实现思路）

- **难点 A：错误输出不一致导致前端难定位**
  - **实现**：统一在 `app.use((err, req, res, next) => ...)` 输出 `{ message }`
  - development 环境可追加 stack

- **难点 B：鉴权中间件对不同路由的保护策略**
  - **实现**：
    - list 类接口可公开（如 competitions list）
    - create/update/delete/apply 类必须 authenticate

- **难点 C：跨域与代理环境差异**
  - **实现**：
    - 本地开发允许 CORS
    - 生产建议 Nginx 反代避免复杂 CORS

---

## 7) 认证/用户/资料 API

### 负责范围

- 登录/注册、JWT、用户资料/主页接口

### 使用技术栈

- Express 4
- JWT（jsonwebtoken）
- bcryptjs
- mysql2/promise

### 功能细节与难点（实现思路）

- **难点 A：密码安全与错误提示平衡**
  - **实现**：bcrypt hash 存储；登录失败提示避免泄漏（邮箱是否存在可模糊化）

- **难点 B：JWT payload 与用户信息同步**
  - **实现**：token 只放 userId/role 等必要信息；profile 从 DB 拉取

- **难点 C：资料字段扩展（college/major/avatar/tags）**
  - **实现**：
    - 更新接口字段白名单
    - null/空串处理
    - tags 的序列化策略保持一致

---

## 8) 业务 API（竞赛/科研/社区）

### 负责范围

- 竞赛情报接口（competitions）与竞赛中心接口（competition-center）
- 收藏 favorites、报名 applications
- 科研/保研/讨论的核心 CRUD

### 使用技术栈

- Express 4
- mysql2/promise
- RBAC 权限控制
- 参数校验、字段白名单

### 功能细节与难点（实现思路）

- **难点 A：同一张 `competitions` 表服务两个模块（情报 vs 中心）**
  - **实现**：字段映射（例如 name→title、organizer→college 等）
  - 注意不要把“主办方”误当学院用于 UI 列表

- **难点 B：500 常见原因是“列不存在/必填无默认值/enum 不匹配”**
  - **实现**：
    - create/update 前对字段做校验与兜底（category、level）
    - 更新用字段白名单 + map

- **难点 C：报名/申请表的唯一性与并发**
  - **实现**：
    - 表层 `UNIQUE (competition_id, user_id)`
    - 插入前查重；冲突返回 409

- **难点 D：收藏计数与状态查询**
  - **实现**：
    - toggle 收藏时同步更新 competitions.favorite_count
    - 提供 list/status 接口供前端渲染

---

## 9) DB 负责人 A：核心业务表 & 初始化脚本

### 负责范围

- 核心业务表：竞赛/收藏/报名、科研/申请、保研帖
- schema/初始化脚本一致性维护

### 使用技术栈

- MySQL 8
- SQL（DDL/DML）
- 约束/索引设计

### 功能细节与难点（实现思路）

- **难点 A：字段约束导致后端 500**
  - **实现**：
    - 设计合理默认值（如可为空字段设 NULL）
    - 对 NOT NULL 字段（category 等）确保 seed/init 提供

- **难点 B：报名表与用户/竞赛外键**
  - **实现**：
    - `competition_applications` 外键到 `competitions(id)`、`users(id)`
    - 级联删除策略（ON DELETE CASCADE）

- **难点 C：初始化顺序与幂等性**
  - **实现**：
    - `CREATE TABLE IF NOT EXISTS`
    - seed 数据插入前先检查或用 INSERT IGNORE

---

## 10) DB 负责人 B：社区/消息表 + 回归测试

### 负责范围

- 通知、好友、私聊等表结构
- 冒烟/回归测试用例与测试数据准备

### 使用技术栈

- MySQL 8
- SQL
- 测试工具（Postman/Apifox/curl）

### 功能细节与难点（实现思路）

- **难点 A：好友关系通常涉及多表/多状态**
  - **实现建议**：
    - requests 表记录 pending/accepted/rejected
    - accepted 后写入 friends 关系表（如项目已存在则按现有结构）

- **难点 B：私聊消息表的索引与分页**
  - **实现建议**：
    - `INDEX (sender_id, receiver_id, created_at)`
    - 分页用 `LIMIT/OFFSET` 或基于时间游标

- **难点 C：回归测试容易遗漏**
  - **实现**：给出 20~30 条“点击路径”用例，覆盖：
    - 登录→Dashboard
    - 竞赛发布/报名
    - 科研发布/申请
    - 讨论发帖/评论
    - 通知已读
    - 好友/私聊

---

## 11. 统一验收清单（建议所有人提交前自测）

- 登录/注册/退出
- Dashboard 切换各模块不白屏
- 竞赛情报：发布/编辑/删除/报名/撤回
- 竞赛中心：编辑/收藏/收藏栏刷新
- 科研：发布/申请/撤回/查看申请者
- 保研：发布/删除/筛选
- 讨论：发帖/评论/删除
- 通知：未读数/标记已读/跳转
- 好友与私聊：基础流程可用

---

## 完成状态

本文件已基于最终分工方案，为 **每位成员补充了：负责范围、技术栈、实现细节、常见难点与落地方式**，可直接用于小组任务分配与过程管理。
