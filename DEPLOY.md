# 前端 Cloudflare Pages 部署指南

本指南说明如何将前端（Webpack 构建产物）通过 Cloudflare Pages 连接 GitHub 仓库后自动部署。

## 前置条件
- 已有 Cloudflare 账号与 Pages 权限。
- 仓库包含前端目录 `front-end/`，CI/CD 可直接访问。

## 构建配置
- Build command: `npm run build`
- Install command: 默认使用 npm（仓库保留 package-lock.json，已移除 pnpm/yarn lock 以避免 Pages 强制使用 pnpm/yarn）
- Build output directory: `dist`
- Node 版本：使用 Cloudflare 默认版本即可（如需固定可在 Pages 设置或 `.nvmrc`）。

## 环境变量
在 Cloudflare Pages「Environment Variables」中添加：
- `API_URL`：后端 GraphQL 地址，例如 `https://your-backend-domain/graphql`

说明：前端代码通过 `process.env.API_URL` 注入后端地址，未设置时默认 `http://127.0.0.1:3000/graphql`，因此在云端必须配置该变量。

## 路由与 SPA 回退
- 已在 `public/_redirects` 配置 `/* /index.html 200`，确保前端路由直刷不 404。无需额外设置。

## 操作步骤（通过 CF 控制台）
1) 打开 Cloudflare Pages → Create a project → Connect to Git。
2) 选择本仓库并指定前端目录：
   - Root directory: `front-end`
3) 设置构建：
   - Build command: `npm run build`
   - Build output: `dist`
4) 添加环境变量：
   - `API_URL = https://<你的后端域名>/graphql`
5) 部署，完成后获取 Pages 域名。若使用自定义域名，记得在后端 CORS 允许该域名。

## 本地验证
```bash
cd front-end
npm install
npm run build
```
完成后生成 `dist/`，可用 `npx serve dist` 等方式本地预览。
