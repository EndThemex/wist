# Where Is It?

**一个 Local-first 的私人物品账本 —— 记下每件物品的位置，三年后翻出来依然找得到。**

🌐 **[English](README.en.md)** · 简体中文

[![MIT License](https://img.shields.io/badge/license-MIT-000000.svg)](#许可证)
[![React 18](https://img.shields.io/badge/React-18-000000?logo=react&logoColor=white)](https://react.dev)
[![Vite 5](https://img.shields.io/badge/Vite-5-000000?logo=vite&logoColor=white)](https://vitejs.dev)
[![IndexedDB](https://img.shields.io/badge/Storage-IndexedDB-000000)](https://developer.mozilla.org/docs/Web/API/IndexedDB_API)
[![Zero Network](https://img.shields.io/badge/Network-Zero-000000)](#理念)

---

## 目录

- [特性](#特性)
- [理念](#理念)
- [截图](#截图)
- [快速开始](#快速开始)
- [使用指南](#使用指南)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [数据存储与备份](#数据存储与备份)
- [设计原则](#设计原则)
- [可访问性与性能](#可访问性与性能)
- [国际化](#国际化)
- [路线图](#路线图)
- [贡献](#贡献)
- [许可证](#许可证)

---

## 特性

- **物品全字段管理** —— 名称、型号、价格、数量、位置、备注、标签、图片（最多 5 张）
- **三维度组织** —— 分组 / 分类 / 标签互相解耦，按需交叉筛选
- **常用位置库** —— 独立维护常用位置（书房 / 玄关 / 抽屉…），删除不影响物品历史位置文本
- **本地全文检索** —— 毫秒级匹配名称、型号、标签、位置；输入用 `useDeferredValue` 防抖
- **多选筛选 + 排序** —— 按添加时间 / 价格 / 数量 / 名称排序；分组抽屉快速切换
- **图片本地压缩** —— 上传时 Canvas 压缩到 1600px / 质量 0.82，以 Blob 存 IndexedDB
- **轻量统计仪表板** —— 总数、总价值、低库存提醒、按分类 / 标签 SVG 分布图
- **三态主题** —— 亮 / 暗 / 跟随系统；CSS 变量驱动，刷新无闪烁
- **中英双语 UI** —— 极简自管 i18n（zh / en），不引入 `react-i18next`
- **响应式优先** —— 移动 375px 单列 → 桌面 ≥1024px 多列网格；侧栏 / 底栏自适应
- **Local-first** —— 全部数据写入浏览器 IndexedDB，零网络请求
- **零账号 / 零后端 / 零追踪** —— 打开即用，关闭即走
- **数据导入导出** —— JSON 备份（含图片 base64），带格式版本号与跨版本迁移

---

## 理念

> 「三个月、一年、五年后，你还记得自己买过什么、放在哪里吗？」

把身边的物品逐条记进浏览器：名称、位置、价格、标签、图片。下次想找 —— 打开 **Where Is It?** 搜一搜就知道它是否还在、被放在了哪里。准备剁手前先搜一遍，避免重复下单。

它不是「待办清单」「资产管理」「云同步笔记」。它的全部野心只有一件事 —— **让你忘记的东西，三秒内想起来**。

为了这件事，我们放弃了：

- 账号系统（没人愿意为「找个螺丝刀」注册账号）
- 云同步（数据是你的，不是服务器的）
- 一切 AI 渐变、紫粉蓝大圆角卡片（你打开的是工具，不是 Instagram）

---

## 截图

首次打开应用时，呈现一张说明站点身份与特点的引导首页：

![首页](docs/imgs/home.png)

移动端的响应式布局：桌面侧栏折叠为底部导航栏，次要入口收纳进「更多」下拉：

![手机截图](docs/imgs/phone.png)

> 更多截图（物品列表 / 详情 / 统计 / 设置 等）将在 `docs/imgs/` 持续补充。

---

## 快速开始

需要 **Node.js ≥ 18**。推荐使用 `pnpm`，亦兼容 `npm` / `yarn`。

```bash
# 克隆仓库
git clone https://github.com/EndThemex/where-is-it.git
cd where-is-it

# 安装依赖
pnpm install          # 或 npm install / yarn install

# 启动开发服务器（默认 http://localhost:5173）
pnpm dev

# 生产构建
pnpm build

# 本地预览生产产物
pnpm preview
```

构建产物在 `dist/`，可直接部署到任意静态托管（GitHub Pages / Vercel / Netlify / Cloudflare Pages…）。

---

## 使用指南

| 场景                   | 路径                             |
| ---------------------- | -------------------------------- |
| 录入第一件物品         | 首页 → 「记录第一件物品」        |
| 查看全部物品           | `/`（首页）                      |
| 新增 / 编辑物品        | `/items/new` · `/items/:id/edit` |
| 物品详情               | `/items/:id`                     |
| 管理分组               | `/groups`                        |
| 管理分类               | `/categories`                    |
| 管理标签               | `/tags`                          |
| 管理常用位置           | `/locations`                     |
| 查看统计仪表板         | `/stats`                         |
| 主题 / 语言 / 数据备份 | `/settings`                      |

**首页约定**：`items.length === 0` 时渲染引导首页 `HomePage`；一旦有数据即降级为 `ItemsListPage`，**不会跳路由**——避免丢失筛选条件。

---

## 技术栈

| 类别        | 选型                                                       |
| ----------- | ---------------------------------------------------------- |
| 框架        | React 18 + React Router 6（HashRouter）                    |
| 构建        | Vite 5 + `@vitejs/plugin-react-swc`                        |
| 状态        | Zustand（catalog / prefs / theme / locale 四仓）           |
| 持久化      | IndexedDB（`idb` 封装，见 [src/lib/db.js](src/lib/db.js)） |
| 偏好 / 主题 | `localStorage`（`wii.prefs` / `wii.theme` / `wii.locale`） |
| 图标        | lucide-react（统一 `strokeWidth={1.5}`）                   |
| 样式        | 原生 CSS + CSS 变量（无 UI 框架 / 无 Tailwind）            |
| 路径别名    | `@/*` → `src/*`（jsconfig.json）                           |

> **为什么不引入 TypeScript / Tailwind / 图表库？**
> 仓库刻意保持精简：项目体量未到需要类型与组件库的拐点，类型反而拖慢开发；Tailwind 的默认风格（渐变、大圆角、彩色）与本项目「克制、对比、黑白」的设计语言冲突；统计页图表用纯 SVG 手写即可，避免引入 ~100KB 图表库。

---

## 项目结构

```
src/
├── components/        # 通用 UI（AppShell、MultiSelect、Thumb、Carousel、Drawer、Empty）
├── pages/             # 路由级页面（首页 / 列表 / 详情 / 编辑 / 管理 / 统计 / 设置）
├── store/             # Zustand store（目录 / 偏好 / 主题 / 语言）
├── lib/               # 工具与持久化（db / image / url / prefs / repos / blobCache / id）
├── hooks/             # 自定义 hooks（useBlobURL 等）
├── i18n/              # 极简自管字典（zh / en）+ 占位符替换
├── styles/            # 全局样式 + 设计令牌（CSS 变量）
├── App.jsx            # 路由表 + Suspense（数据页 lazy 加载）
└── main.jsx           # 入口（HashRouter + 主题防闪烁内联脚本）
```

---

## 数据存储与备份

所有数据写入浏览器 IndexedDB，不上云、不上传、不联网。关键对象库：

| Store        | 内容                         | 索引                                            |
| ------------ | ---------------------------- | ----------------------------------------------- |
| `items`      | 物品主数据                   | `name` / `groupId` / `categoryId` / `createdAt` |
| `images`     | 物品-图片关联                | `itemId`                                        |
| `blobs`      | 图片二进制（Blob）           | —                                               |
| `groups`     | 分组（含默认分类绑定）       | `name`                                          |
| `categories` | 分类（与分组解耦）           | `name`                                          |
| `tags`       | 标签                         | `name`                                          |
| `locations`  | 常用位置备选库（不绑定物品） | `name`                                          |

**物品字段**：`{ id, name, model, price, quantity, location, note, groupId, categoryId, tagIds[], imageIds[], createdAt, updatedAt }`

### 备份与迁移

在 **设置 → 数据** 中可一键导出 JSON 备份（含图片以 base64 序列化）。备份文件带 `formatVersion`，导入时自动链式迁移（v1 → v2 → v3 …）。

> 清除浏览器站点数据会一并删除以上内容。**请按需自行导出备份**——这是 local-first 应用的代价。

---

## 设计原则

> 详见 [`.trae/documents/prd.md`](.trae/documents/prd.md) 与 [`Agent.md`](Agent.md)。

1. **配色**：纯黑 `#0A0A0A` / 纯白 `#FAFAFA` 主色 + 中性灰阶 + 单色警示（琥珀 `#A16207` / 暗色 `#D4A373`）。**禁止紫 / 蓝 / 粉渐变**。
2. **形状**：直角或极小圆角（`--radius: 2px`，少数 4px）。**禁止大圆角卡片与重阴影**。
3. **字体**：标题 `IBM Plex Serif` / `Noto Serif SC`；正文 `Inter Tight` / `Noto Sans SC`；数字与代码 `JetBrains Mono`。
4. **图标**：线性，统一 `strokeWidth={1.5}`。
5. **过渡**：仅颜色与背景 `200ms ease`，不使用渐变与阴影。
6. **响应式**：移动优先（默认 375px），≥1024px 升级为多列网格。
7. **触控区**：所有可点击区域 ≥ 44×44px。

---

## 可访问性与性能

- 所有图标按钮带 `aria-label`；占位图 `alt=""` 不污染读屏
- 搜索输入走 `useDeferredValue`，避免每次按键都重算过滤结果
- 列表项用 `memo()` 包裹；图片 `useBlobURL` hook 严格清理避免内存泄漏
- DB 读批量：`db.transaction()` + 并行 `store.get()`，避免 N 次 `await getDB()`
- 数据页全部 `lazy()` + `Suspense`，首屏 JS 体量最小化
- 主题防闪烁：内联脚本在 CSS / JS 之前执行，提前读取 `localStorage` 设定 `data-theme`

---

## 国际化

UI 文案集中在 [`src/i18n/zh.js`](src/i18n/zh.js) 与 [`src/i18n/en.js`](src/i18n/en.js)，通过 [`src/i18n/index.js`](src/i18n/index.js) 的 `useT()` 钩子消费。

- 占位符语法：`{name}`，缺失变量原样保留
- 字典分层：`common.*` / `nav.*` / `home.*` / `items.*` / `settings.*`
- 缺失 key 回退到 fallback（zh），再缺失返回 key 本身（便于发现未翻译项）
- 浏览器语言嗅探：`navigator.language.startsWith('zh') ? 'zh' : 'en'`
- 日期格式用 `Intl.DateTimeFormat(lang, ...)`，按 locale 自动排版

> **不翻译用户数据**（物品名 / 标签 / 分组名）——那是用户录入的内容。

---

## 路线图

- [x] 数据导入 / 导出（JSON）（v0.1 已实现）
- [x] 三态主题 + 系统跟随（v0.1 已实现）
- [x] 常用位置库（与物品解耦）（v0.1 已实现）
- [x] 中英双语 UI 框架（v0.1 已实现）
- [ ] PWA：可安装、Service Worker 离线启动
- [ ] 条码 / 二维码扫描录入
- [ ] 可选云同步（CRDT / WebDAV）
- [ ] 全文检索升级到 FlexSearch / MiniSearch
- [ ] 列表虚拟滚动（@tanstack/react-virtual）

---

## 贡献

欢迎 Issue 与 PR。请保持代码风格与现有项目一致：

- 提交前 `pnpm build` 必须 exit 0
- 桌面（≥1024）与移动（375）各看一遍
- 主题切换（亮 / 暗）各看一遍
- 不引入新依赖、新 UI 框架、新渐变 —— **先开 Issue 讨论**

完整规范见 [`Agent.md`](Agent.md)。

---

## 许可证

[MIT](LICENSE) © 2026 [EndThemex](https://github.com/EndThemex)
