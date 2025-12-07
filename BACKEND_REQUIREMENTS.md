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
  reviews(courseId: ID, teacherWalletAddress: String): [Review!]!
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