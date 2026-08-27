---
kind: external_dependency
name: Vite + React 构建与开发服务器
slug: vite
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

项目使用 Vite（@vitejs/plugin-react）作为前端构建工具，React 18 为运行时。开发命令 `npm run dev` 启动 5173 端口本地服务；`npm run build` 输出到 `dist/`；`npm run preview` 预览产物。CI 通过 GitHub Actions 在 ubuntu-latest + Node 20 环境下执行同样的 build 流程，将 `dist/` 作为 artifact 上传并部署到 GitHub Pages。