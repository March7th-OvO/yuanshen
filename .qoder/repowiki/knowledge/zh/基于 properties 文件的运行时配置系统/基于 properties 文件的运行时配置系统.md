---
kind: configuration_system
name: 基于 properties 文件的运行时配置系统
category: configuration_system
scope:
    - '**'
source_files:
    - public/config.properties
    - src/lib/pity.js
    - src/App.jsx
    - vite.config.js
---

## 1. 使用的系统与方案

本项目采用**纯前端、无框架依赖的轻量级配置系统**：通过 Vite 构建后，由浏览器在运行时 `fetch` 静态资源 `public/config.properties`，以 Java Properties 风格的键值对格式解析用户数据。该方案完全运行于客户端，无需后端服务或环境变量注入。

## 2. 关键文件与位置

- `public/config.properties`：唯一的外部配置文件，存放两位玩家（userA / userB）的保底进度数据。
- `src/lib/pity.js`：配置加载、解析与计算的核心模块，导出 `loadProfiles()`、`parseProfiles()`、`calcPercent()` 等 API。
- `src/App.jsx`：应用入口，调用 `loadProfiles()` 获取配置并驱动 UI 渲染。
- `vite.config.js`：Vite 构建配置，未定义任何环境变量或插件来注入配置，仅设置开发服务器端口 5173。

## 3. 架构与设计约定

### 3.1 配置文件格式
`config.properties` 使用类 Java Properties 语法：
- 每行一条 `key = value`，支持 `#` 注释和空行。
- 键前缀限定为 `userA` 或 `userB`，字段仅限 `fates`（已消耗纠缠之缘数）、`primogems`（剩余原石数）、`name`（显示名，可选）。
- 键分隔符同时兼容 `=` 和 `:`（正则 `/[=:]$/` 匹配）。

### 3.2 加载流程
1. `App.jsx` 在挂载时调用 `loadProfiles()`。
2. `loadProfiles()` 通过 `fetch(import.meta.env.BASE_URL + 'config.properties')` 拉取配置，禁用缓存（`cache: 'no-store'`）。
3. 成功时调用 `parseProfiles(text)` 解析；失败时回退到内置兜底数据 `FALLBACK_PROFILES`。
4. 解析结果 `{ profiles, failed }` 传入 React 状态，`failed` 为真时在页面 header 中显示“配置文件读取失败，当前使用内置兜底数据”提示。

### 3.3 解析规则（`parseProfiles`）
- 逐行处理，跳过空行、`#` 注释行、`!` 开头行。
- 用正则 `^(userA|userB)\.(fates|primogems|name)$` 严格校验键名，非法键直接忽略。
- `name` 字段保留字符串；`fates` / `primogems` 转为数字，要求非负且为有效数值，否则忽略该行。
- 初始结构预填充 `FALLBACK_PROFILES`，确保缺失字段有默认值。

### 3.4 计算常量
- `PITY_COST = 14400`：一个保底所需的原石总数（90 × 160）。
- `FATE_COST = 160`：单次抽卡的原石成本。
- `BOOST_THRESHOLD = 82`：软保底阈值，超过此百分比时 UI 高亮显示。
- 百分比公式：`(fates × 160 + primogems) / 14400 × 100%`，保留两位小数。

### 3.5 容错策略
- 网络请求失败、HTTP 错误、解析异常均捕获，返回 `failed: true` 并使用 `FALLBACK_PROFILES`。
- 兜底数据与 `config.properties` 中的默认值保持一致，保证 UI 始终可用。

## 4. 约定与约束

- **配置来源单一**：所有运行时用户数据均来自 `public/config.properties`，不存在 `.env`、`.env.*`、YAML/JSON/TOML 等其他配置源。
- **白名单键校验**：只有 `userA/userB.fates|primogems|name` 这六个键会被接受，其他键被静默丢弃——这是通过正则强制执行的约束。
- **数值非负约束**：`fates` 和 `primogems` 必须为非负数字，负数或 NaN 会被忽略。
- **固定用户集合**：当前硬编码只支持 `userA` 和 `userB` 两个用户，新增用户需修改 `pity.js` 中的正则和 `FALLBACK_PROFILES`，以及 `App.jsx` 中的 `ORDER` 数组。
- **无环境变量注入**：`vite.config.js` 未使用 `import.meta.env` 注入任何构建期配置，`BASE_URL` 来自 Vite 默认行为。
- **部署即更新**：由于是静态文件，更新配置只需替换 `dist/config.properties` 或推送新的 `public/config.properties`，无需重新构建逻辑代码。
- **本地开发路径**：开发服务器默认端口 5173，配置文件通过相对路径 `config.properties` 访问。