---
kind: frontend_style
name: 基于 CSS 变量与 BEM 风格的编辑排版式暗色主题系统
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/fonts.css
    - index.html
    - public/fonts/inter-latin-wght-normal.woff2
    - public/fonts/playfair-display-latin-wght-normal.woff2
    - public/fonts/playwrite-de-sas-guides-latin-400-normal.woff2
    - scripts/localize-fonts.mjs
---

## 1. 使用的体系与方法
- 纯 CSS（无 SCSS/Less、无 Tailwind、无 CSS-in-JS），通过 `src/index.css` 作为全局样式入口，由 Vite 构建。
- 采用 **CSS 自定义属性（CSS Variables）** 集中管理设计令牌（颜色、字体族、缓动曲线等），定义在 `:root` 中，组件样式通过 `var(--xxx)` 引用。
- 类名风格为 **BEM/块修饰符**：如 `.editorial-shell`、`.cup-panel`、`.stage-note--left`、`.percent.is-boost`、`.ambient--violet`，以 `--` 表示变体、以 `is-` 表示状态。
- 布局使用 **原生 CSS Grid + Flexbox**：根容器 `.editorial-shell` 是 12 列网格，配合 `clamp()` 实现响应式间距；组件内 `.profile-frame` 也复用同一 12 列网格。
- 动画与过渡统一通过 `@keyframes` + CSS transitions 实现，缓动用 `--ease-slide: cubic-bezier(0.76, 0, 0.24, 1)` 统一管理。

## 2. 关键文件
- `src/index.css`：全局主题、设计令牌、页面骨架、组件样式、媒体查询、动画与 `prefers-reduced-motion` 降级。
- `src/fonts.css`：本地自托管字体声明（Inter、Playfair Display、Playwrite DE SAS Guides），按 unicode-range 拆分 woff2 变体，避免依赖 Google Fonts。
- `index.html`：设置 `<html lang="zh-CN">`、`theme-color: #0A0A0C`，并对三种字体做 `<link rel="preload" as="font">` 预加载。
- `public/fonts/*.woff2`：实际字体资源，由脚本 `scripts/localize-fonts.mjs` 从网络下载到本地。

## 3. 架构与约定
- **设计令牌层**（`:root`）
  - 背景：`--bg: #0a0a0c`（深黑）、`--surface` / `--surface-strong` 用于半透明卡片。
  - 强调色：`--gold: #c5a059` 及其柔化/浅版本 `--gold-soft`、`--gold-pale`，用于保底进度高亮、标题首字母、分割线装饰。
  - 数据色：`--blue-soft: #8fb6d9` 用于百分比数值，进入软保底时切换为 `--gold-pale`（通过 `.is-boost` 修饰符）。
  - 文本：`--text: #f1eee8`、`--text-dim: #8f8c88`。
  - 线条：`--line`、`--line-soft` 用于分隔线与网格线。
  - 字体族：`--serif`（Playfair Display）、`--sans`（Inter）、`--hand`（手写体 Playwrite DE SAS Guides）。
  - 缓动：`--ease-slide` 统一所有滑入/切换动画的曲线。
- **视觉风格**：编辑排版式（editorial）暗色主题。背景用径向渐变模拟顶部光晕，叠加固定定位的星空（`.stars`）和模糊光斑（`.ambient--violet`、`.ambient--blue`）营造氛围；12 列网格线（`.editorial-grid`）作为背景纹理贯穿全页。
- **组件样式组织**：每个功能区域一个块（`.app-header`、`.stage`、`.switch`、`.cup`、`.percent`），子元素通过 BEM 命名区分；状态通过 `is-active`、`is-boost`、`is-reached` 等 class 切换。
- **响应式策略**：仅使用 CSS `@media (max-width: 820px)` 与 `520px` 两个断点，调整 12 列网格的列跨度、字号（`clamp()`）、间距与最小高度；移动端将双杯面板改为纵向堆叠。
- **可访问性**：提供 `@media (prefers-reduced-motion: reduce)` 关闭所有非必要的动画与过渡；按钮使用 `focus-visible` 金色轮廓。

## 4. 约定与约束
- 颜色、字体、缓动必须通过 `:root` 中的 CSS 变量引用，禁止在组件样式中硬编码颜色值（除极个别临时调试外）。
- 字体全部本地化：`fonts.css` 注释明确“不再依赖 fonts.googleapis.com”，并通过 `index.html` 的 `<link rel="preload">` 预加载 woff2，确保离线或外网不可达时样式正常。
- 布局统一基于 12 列 CSS Grid（`.editorial-shell`、`.profile-frame`），新增区块应沿用该栅格而非引入新布局系统。
- 交互状态统一通过添加 `is-*` class 驱动样式变化（如 `.is-active`、`.is-boost`、`.is-reached`），JS 只负责切换 class，不直接操作 style。
- 动画统一使用 `@keyframes` 与 `transition`，并遵守 `--ease-slide` 缓动；对减少动效用户通过 `prefers-reduced-motion` 禁用。
- 媒体查询断点集中在 `index.css` 底部（820px、520px），新增响应式规则应追加到对应断点块内，保持单一来源。
- 主题色 `#0A0A0C` 同时出现在 `index.html` 的 `theme-color` meta 中，保证浏览器地址栏与系统 UI 一致。