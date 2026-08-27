---
kind: dependency_management
name: 基于 npm + Vite 的前端依赖管理
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - .github/workflows/deploy-pages.yml
---

## 1. 使用的系统/方法

本项目采用 **npm** 作为包管理器，通过 `package.json` 声明依赖，使用 **Vite** 作为构建工具。项目为纯前端单页应用（React），无后端或 Go/Rust 等语言依赖。

- 包清单：`package.json`
- 运行时依赖：`react`、`react-dom`（版本锁定在 `^18.3.1`）
- 开发依赖：`vite`（`^5.4.8`）、`@vitejs/plugin-react`（`^4.3.1`）
- 模块系统：`"type": "module"`，使用 ESM
- 私有项目：`"private": true`，禁止发布到 npm registry

## 2. 关键文件

- `package.json`：唯一依赖声明入口，定义脚本 `dev` / `build` / `preview` 均委托给 Vite CLI。
- `.github/workflows/deploy-pages.yml`：CI 中通过 `npm install` 安装依赖并执行 `npm run build`，Node 版本固定为 20。
- `node_modules/`：依赖安装目录（当前为空，因为仓库未提交 lockfile）。
- `public/fonts/*.woff2`：字体资源以静态文件形式随源码一起分发，不通过 npm 引入。

## 3. 架构与约定

- **无锁文件**：仓库中不存在 `package-lock.json`、`pnpm-lock.yaml` 或 `yarn.lock`，因此依赖解析可能在不同环境产生不同结果。
- **无 vendoring**：所有第三方库通过 npm 从公共 registry 拉取，没有本地 vendor 目录。
- **无私有 registry**：未发现 `.npmrc`、`.npmrc.js`、`~/.npmrc` 或任何自定义 registry 配置，全部依赖来自默认 npm registry。
- **字体策略**：字体文件直接放入 `public/fonts/` 并通过 CSS 引用，不走 npm 包管理；另有 `scripts/localize-fonts.mjs` 用于处理字体本地化。
- **CI 一致性**：GitHub Actions 通过 `setup-node@v4` 指定 Node 20，并使用 `npm install` 复现依赖安装过程，但同样未缓存 `node_modules` 或 lockfile。

## 4. 约定与约束

- 依赖版本使用 **caret 范围**（`^x.y.z`），允许小版本自动升级，便于获取安全补丁但不保证完全可重复构建。
- 项目标记为 `private`，避免误发布到 npm。
- 构建脚本统一通过 Vite 暴露的 `dev` / `build` / `preview` 命令，不直接调用底层打包器。
- CI 流程强制使用 Node 20 环境进行依赖安装与构建，确保部署产物的一致性。
- 由于缺少 lockfile，本地开发与 CI 之间的依赖解析差异未被显式约束——这是一个潜在风险点。

总结：该项目是一个极简的前端工程，依赖管理方式非常朴素——仅靠 `package.json` 的语义化版本范围 + npm 默认行为，没有 lockfile、私有源或 vendoring 机制。对于小型个人项目而言足够简洁，但在团队协作或多环境构建场景下建议引入 lockfile 以保证可重复性。