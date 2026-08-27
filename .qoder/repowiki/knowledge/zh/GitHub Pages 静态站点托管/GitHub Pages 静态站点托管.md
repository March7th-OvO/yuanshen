---
kind: external_dependency
name: GitHub Pages 静态站点托管
slug: github-pages
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

站点通过 `.github/workflows/deploy-pages.yml` 工作流部署：push 到 main 或手动触发 workflow_dispatch 时，在 ubuntu-latest 上 checkout、setup-node@v4 (Node 20)、`npm install && npm run build`，随后用 `actions/configure-pages@v5` + `actions/upload-pages-artifact@v3` 上传 `dist/`，再由 `actions/deploy-pages@v4` 发布到 GitHub Pages。部署前会比对构建 SHA 与远程 main 分支最新提交，防止陈旧 artifact 被重复部署。自定义域名通过根目录 `CNAME` 及 `public/CNAME` 声明。