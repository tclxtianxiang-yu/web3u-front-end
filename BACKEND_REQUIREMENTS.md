# 后端功能需求文档

本文档旨在记录前端开发过程中发现的、需要后端支持的功能缺口和改进建议。请后端开发人员参考此文档进行相应的开发工作。

---

## 1. 课程评价与评分系统 (Reviews & Ratings)

### 1.1 背景与目的
目前系统缺乏课程评价功能，这导致以下问题：
*   **学生端**：无法在课程详情页查看他人的评价，影响购买决策；无法对已学课程进行反馈。
*   **教师端**：教师仪表盘中的 "Average Rating" (平均评分) 无法计算；无法获取学生反馈以改进教学。
*   **平台运营**：`TeacherBadge` (教师徽章 NFT) 的发放规则依赖于“课程好评率 > 80%”，没有真实的评分数据，此功能无法闭环。

### 1.2 核心功能需求

#### A. 学生视角
1.  **发表评价**：
    *   学生只能对自己**已购买**且**已开始学习**（或已完成）的课程发表评价。
    *   评价内容包括：评分（1-5分，支持小数或整数）、文字评论（可选）。
    *   每个学生对同一门课程只能评价一次（可选：支持修改）。
2.  **查看评价**：
    *   在课程详情页，所有用户（包括未购买者）都可以查看该课程的所有评价列表。
    *   评价列表应包含：评价人（昵称/头像）、评分、评论内容、评价时间。

#### B. 教师视角
1.  **查看反馈**：教师可以在自己的管理后台查看自己课程收到的所有评价。
2.  **数据统计**：
    *   课程维度的“平均评分” (`Course.rating`) 需要根据新评价自动更新。
    *   教师维度的“综合评分” (用于 Dashboard) 需要能够被聚合计算。

#### C. 系统逻辑
1.  **聚合计算**：当新增一条评价时，应自动重新计算并更新对应 `Course` 的 `rating` 字段（避免每次查询都实时计算平均值，提升性能）。
2.  **徽章触发**：(未来扩展) 当课程评分达到特定阈值且评论数达到一定数量时，触发 `awardTeacherBadgeOnchain` 逻辑。

### 1.3 Schema 变更建议

建议新增 `Review` 类型，并更新 `Course` 和 `Query/Mutation` 定义。

```graphql
"""
评价记录
"""
type Review {
  id: ID!
  courseId: ID!
  course: Course
  studentWalletAddress: String!
  student: User  # 关联查询学生信息
  rating: Int!   # 1-5
  comment: String
  createdAt: DateTime!
}

"""
扩展 Course 类型
"""
type Course {
  # ... 现有字段 ...
  
  """
  课程平均评分 (由后端自动维护更新)
  """
  rating: Float! 
  
  """
  评价总数
  """
  reviewCount: Int! 
  
  """
  该课程的评价列表 (支持分页)
  """
  reviews: [Review!]! 
}

"""
新增 Mutations
"""
type Mutation {
  """
  创建评价
  需要校验：1. 学生已购买该课程; 2. 学生未重复评价
  """
  createReview(createReviewInput: CreateReviewInput!): Review!
}

input CreateReviewInput {
  courseId: ID!
  studentWalletAddress: String!
  rating: Int! # 1-5
  comment: String
}

"""
新增 Queries
"""
type Query {
  """
  查询评价列表
  支持按 courseId 或 teacherWalletAddress 过滤
  """
  reviews(courseId: ID, studentWalletAddress: String, teacherWalletAddress: String): [Review!]!
}
```

### 1.4 权限与校验
*   **鉴权**：`createReview` 必须要求用户已登录（携带 Token）。
*   **业务校验**：
    *   `studentWalletAddress` 必须与当前登录用户一致。
    *   必须检查 `transactions` 或 `user_courses` 表，确认学生已购买该课程。

---

## 2. 教师/学生 聚合数据优化 (可选 - 性能优化方向)

### 2.1 背景
目前前端在计算“学生总数”、“总收入”等指标时，需要拉取全量 `transactions` 或 `learningRecords` 进行前端聚合。随着数据量增长，这种方式会导致性能问题。

### 2.2 建议
建议在 `User` (针对教师) 或独立的统计对象中提供聚合字段：

*   `totalStudents`: 教师所有课程的去重学生总数。
*   `totalEarnings`: 教师的历史总收入 (YD)。
*   `totalEnrollments`: 学生已报名的课程总数。

如果后端能在数据库层面维护这些计数器（或提供专门的 Dashboard API），将大大减轻前端负担。

---

## 3. 用户登录与注册流程优化 (自动注册)

### 3.1 背景
目前 `login` 接口仅负责验证签名并分发 JWT Token，不检查用户是否在数据库中存在。
导致的问题：新用户（首次连接钱包并登录的用户）虽然持有有效 Token，但在进行业务操作（如发布课程）时，因 `users` 表中无记录而触发外键约束错误。

### 3.2 需求描述
建议优化 `login` 逻辑，实现“登录即注册”的无感体验。

#### A. 登录逻辑变更
1.  **检查用户**：在验证钱包签名成功后，检查 `users` 表中是否存在该 `walletAddress`。
2.  **自动注册**：
    *   若用户**不存在**：自动在 `users` 表中创建一条新记录。
        *   `walletAddress`: 传入的钱包地址。
        *   `username`: 生成默认昵称（例如 `User_{walletAddress后4位}`）。
        *   `role`: 默认为 `student`（或者根据业务逻辑设为通用角色，后续可升级）。
        *   `email`: 留空或生成占位符。
    *   若用户**存在**：直接生成并返回 Token。
3.  **返回结果**：`login` 接口保持返回 `AuthToken`，但在后端内部确保了用户记录的就绪。

#### B. 用户信息管理接口
为了配合自动注册生成的默认信息，需要完善用户信息管理能力：

1.  **获取当前用户信息 (`me`)**：
    *   **Query**: `me`
    *   **功能**: 返回当前登录用户的完整信息（基于 Token 解析），无需前端传参 `walletAddress`。
    *   **返回字段**: `username`, `email`, `role`, `walletAddress`, `ydTokenBalance`, `avatarUrl` 等。

2.  **修改用户信息 (`updateProfile`)**：
    *   **Mutation**: `updateProfile(input: UpdateProfileInput!)`
    *   **功能**: 允许用户修改自己的资料。
    *   **入参**: `username`, `email`, `avatarUrl` (可选)。
    *   **鉴权**: 必须登录，且只能修改自己的信息。

### 3.3 预期效果
前端无需再手动处理 `checkUser -> createUser -> login` 的繁琐流程。用户只要签名登录，就自动成为合法用户，可以直接进行发布课程、购买等操作。

---

## 4. 课程购买功能 - 链上数据同步问题 (CourseRegistry)

### 4.1 严重问题描述
前端在调用购买课程 (`purchaseCourse`) 功能时报错：`CourseRegistry: course does not exist`。
这表明虽然课程已在后端数据库创建（GraphQL `createCourse` 成功），但**并未在链上 `CourseRegistry` 合约中注册**。

目前 `CoursePlatform` 合约的购买逻辑强依赖于 `CourseRegistry`。如果合约中查不到该 `courseId`，交易就会 revert，导致购买失败。

### 4.2 原因分析
当前的 `createCourse` GraphQL Mutation 似乎仅执行了数据库写入操作，**缺失了调用链上合约进行注册的步骤**。
根据业务逻辑，`CourseRegistry.createCourse` 方法受到权限控制（`PLATFORM_ROLE`），教师无法直接调用，必须由后端（持有 `backendSigner`）代为调用。

### 4.3 需求描述
需要修改后端的 `createCourse` Mutation 逻辑，实现“链下创建 + 链上注册”的原子性或最终一致性。

#### 建议流程：
1.  **接收请求**：后端收到前端的 `createCourse` 请求。
2.  **链上注册**：后端使用 `backendSigner` 私钥，调用 `CourseRegistry` 合约的 `createCourse(courseId, teacherAddress, priceYD)` 方法。
    *   注意：`priceYD` 需要进行精度转换（ETH 18位精度）。
3.  **等待确认**：等待链上交易确认（或采用异步队列处理）。
4.  **数据库写入**：链上注册成功后，将课程信息（包括 `transactionHash`）写入 Supabase 数据库。
5.  **返回结果**：返回创建成功的课程对象。

#### 替代方案（异步）：
如果链上等待时间过长，可以先写入数据库并将状态设为 `PENDING_ONCHAIN`，然后通过后台队列异步上链。但在上链成功前，课程状态不应为 `PUBLISHED`，以防前端尝试购买。

### 4.4 预期效果
教师发布课程后，该课程不仅存在于数据库，也存在于链上 `CourseRegistry` 中。学生随后调用 `purchaseCourse` 时，合约能正确读取到课程信息，从而完成购买。

---

## 5. 前端 Mock 替换所需的后端/合约支持

前端已有的占位/Mock 数据需要用真实接口或合约调用替换，请提供下列能力：

### 5.1 学生学习历史（`Student/History.tsx`）
- 提供聚合数据接口：`totalWatchTime`、`currentStreak`（连续学习天数）。
- 提供过去 7 天的学习记录（按天累积时长或完成度）以绘制周进度图。

### 5.2 学生 NFT 证书（`Student/NFT.tsx`）
- 返回当前学生已拥有的证书列表（链上或数据库），字段建议：`tokenId`、`courseId`、`courseTitle`、`issueTime`、`imageUrl`。
- 当列表为空时，前端可展示“暂无证书”空状态。

### 5.3 教师收益 DeFi 金库余额（`Teacher/Earnings.tsx`）
- 需要查询教师在合约/平台中的待提现或金库余额（与 `YDToken` 余额区分）。请提供 GraphQL/REST 接口或明确合约读方法，返回可展示的余额（18 位精度）。

### 5.4 教师 NFT 徽章（`Teacher/NFT.tsx`）
- 提供教师拥有的徽章列表接口或合约读方法。字段建议：`tokenId`、`name`、`description`、`imageUrl`、`earnedAt`。
- “即将获得的徽章”逻辑：需要后端提供当前教师的达成度（如评分/课程数/好评率）以便前端提示。

## 5. 课程管理功能增强 (编辑与删除)

### 5.1 背景
教师目前无法修改已发布课程的信息（如修正标题、更新视频内容）或删除错误创建的课程。这影响了教师对课程的精细化管理能力。

### 5.2 需求描述

#### A. 编辑课程 (`updateCourse`)
1.  **Mutation**: 建议新增 `updateCourse(updateCourseInput: UpdateCourseInput!, courseId: ID!)`
2.  **功能**: 允许教师修改课程的非链上核心信息。
3.  **入参**:
    *   `courseId`: 待更新课程的 ID。
    *   `updateCourseInput`: 包含以下可选字段：
        *   `title`: String
        *   `description`: String
        *   `category`: String
        *   `thumbnailUrl`: String
        *   `videoUrl`: String
        *   `status`: String (用于修改状态，如从 `draft` 到 `published` 或 `archived`。注意：`published` 状态变更可能需要与链上同步。)
    *   **鉴权**: 必须登录，且只能修改自己发布的课程（即 `teacherWalletAddress` 匹配当前登录用户）。
    *   **链上联动 (可选)**: 如果 `status` 变更为 `published` 且此前未上链，则应触发上链逻辑。如果 `status` 变更为 `archived`，应调用 `CourseRegistry.updateCourseStatus` 更新链上状态。
    *   **价格修改**: `priceYd` 字段是否可修改需根据 `CourseRegistry` 合约的 `updateCoursePrice` 方法来决定。如果合约支持，后端应联动调用。

#### B. 删除课程 (`removeCourse`)
11. **Mutation**: 建议新增 `removeCourse(courseId: ID!)`
12. **功能**: 允许教师删除课程。
13. **入参**: `courseId`: 待删除课程的 ID。
14. **鉴权**: 必须登录，且只能删除自己发布的课程。
15. **逻辑**: 建议实现**软删除**（Soft Delete），即在数据库中标记为 `deleted` 状态而非物理删除，以便数据审计和恢复。
16. **链上处理**: 如果课程已上链，应调用 `CourseRegistry.updateCourseStatus` 将链上课程状态变更为 `ARCHIVED`，防止继续被购买。

### 5.3 预期效果
教师可以在个人后台方便地管理其发布的课程，包括修改内容和状态，以及删除不再需要的课程。
