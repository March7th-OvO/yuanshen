---
kind: build_system
name: 基于 Vite + GitHub Pages 的静态站点构建与部署
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - vite.config.js
    - .github/workflows/deploy-pages.yml
    - scripts/localize-fonts.mjs
---

## 1. 构建系统概览

本项目是一个基于 **Vite 5** + **React 18** 的单页应用，采用极简的前端构建方案：通过 `package.json` 中的 npm scripts 调用 Vite CLI 完成开发、构建与预览，最终产物为纯静态 HTML/CSS/JS，部署到 **GitHub Pages**。

- 包管理器：npm（无 lock 文件提交，依赖版本使用 `^` 语义化范围）
- 构建工具：Vite 5，插件 `@vitejs/plugin-react`
- 输出目录：`dist/`（由 Vite 默认生成）
- 运行环境：Node.js 20（CI 中指定）

## 2. 关键文件与脚本

- `package.json`：定义项目元信息、依赖及三个核心脚本：
  - `dev` → `vite`（启动本地开发服务器，端口 5173）
  - `build` → `vite build`（生产构建，输出至 `dist/`）
  - `preview` → `vite preview`（本地预览构建产物）
- `vite.config.js`：仅启用 React 插件并固定开发服务器端口为 5173，无额外优化配置。
- `.github/workflows/deploy-pages.yml`：GitHub Actions 工作流，触发条件为 push 到 `main` 分支或手动 `workflow_dispatch`。流程分为两个 job：
  - `build`：检出 main、安装依赖、执行 `npm run build`，将 `./dist` 上传为 Pages artifact，并通过 `outputs.built_sha` 记录源码 SHA。
  - `deploy`：校验 artifact 对应的源码 SHA 仍为最新 main 分支，否则跳过部署，避免陈旧产物被发布。
- `scripts/localize-fonts.mjs`：字体本地化工具脚本，从 Fontsource 包中抽取仅含 latin / latin-ext 子集的 woff2 字体文件到 `public/fonts/`，并复制对应 OFL 许可证。该脚本需手动运行（非 npm script），用于离线化字体资源。

## 3. 架构与约定

- **零自定义构建逻辑**：未编写 Makefile、Shell 构建脚本或 Dockerfile；所有构建行为完全委托给 Vite 默认行为。
- **字体内联策略**：字体不通过 Google Fonts CDN 加载，而是通过 `scripts/localize-fonts.mjs` 预下载到 `public/fonts/`，并在 `src/fonts.css` 中以 `@font-face` 引用，确保页面可离线渲染且不受网络限制。
- **部署即发布**：没有独立的 release/tag 流程；任何推送到 `main` 的变更都会自动触发构建与部署，版本号仅存在于 `package.json` 的 `version` 字段（当前 0.1.0），不参与构建过程。
- **并发控制**：CI 中使用 `concurrency: { group: pages, cancel-in-progress: true }` 保证同一时间只有一个 Pages 部署任务在运行，新任务会取消旧任务。

## 4. 约束与规则

- 构建命令必须通过 `npm run build` 执行（CI 直接调用此脚本），产物必须位于 `./dist`（GitHub Pages 要求）。
- 部署前会校验 artifact 的源码 SHA 是否与远程 `main` 一致，不一致则跳过部署，防止陈旧构建被误发。
- Node 版本锁定为 20（`actions/setup-node@v4` with `node-version: 20`）。
- 字体更新需手动运行 `node scripts/localize-fonts.mjs`，修改后需同步更新 `src/fonts.css` 中的 `@font-face` 声明以匹配文件名。
- 项目标记为 `private: true`，不发布到 npm registry，仅作为静态站点托管。