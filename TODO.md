# 待移除 Mock 数据模块清单

本文档记录了前端项目中尚未被真实数据（后端 API 或智能合约）替换的模拟数据点。后续开发请参考此清单进行逐项替换。

## 1. 学生学习历史 (`front-end/src/pages/Student/History.tsx`)

- [ ] **总观看时长 (`totalWatchTime`)**: 需后端支持或前端复杂聚合。
- [ ] **当前连胜/打卡 (`currentStreak`)**: 需后端提供每日活跃数据支持。
- [ ] **周学习进度图表 (`Weekly Progress`)**: 需聚合过去7天的学习记录。

## 2. 学生 NFT 证书页 (`front-end/src/pages/Student/NFT.tsx`)

- [ ] **无证书时的回退数据**: 当无真实证书时显示的 `mockNftCertificates` 应移除，替换为“暂无证书”的空状态 UI。

## 3. 教师收益页 (`front-end/src/pages/Teacher/Earnings.tsx`)

- [x] **流动钱包余额 (`liquidBalance`)**: 已通过 `YDToken` 合约读取 `balanceOf`。
- [ ] **DeFi 金库余额 (`defiBalance`)**: 需调用 `CoursePlatform` 合约读取平台/教师在合约中的待提现余额或理财份额。

## 4. 教师 NFT 徽章页 (`front-end/src/pages/Teacher/NFT.tsx`)

- [ ] **NFT 徽章列表 (`nftBadges`)**: 需调用 `TeacherBadge` 合约查询教师持有的徽章。
- [ ] **“即将获得的徽章”**: 需根据评分规则和当前数据进行前端计算或后端接口支持。