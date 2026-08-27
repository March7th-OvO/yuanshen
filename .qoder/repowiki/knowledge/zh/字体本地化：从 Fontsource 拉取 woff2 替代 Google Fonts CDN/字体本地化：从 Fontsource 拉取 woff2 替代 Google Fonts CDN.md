---
kind: external_dependency
name: 字体本地化：从 Fontsource 拉取 woff2 替代 Google Fonts CDN
slug: fontsource
category: external_dependency
category_hints:
    - sdk_real_api
scope:
    - '**'
---

项目不再依赖 fonts.googleapis.com，而是通过 `scripts/localize-fonts.mjs` 脚本从 Fontsource 的 npm 包中打包下载所需字体的 latin / latin-ext 子集 woff2 文件到 `public/fonts/`，同时复制 OFL 许可证文件。当前维护三套字体：Inter（正文）、Playfair Display（标题/数字）、Playwrite DE SAS Guides（用户名手写体）。换字体只需修改脚本中的 FAMILIES 列表后重新运行脚本，再同步更新 `src/fonts.css` 的 @font-face 声明。