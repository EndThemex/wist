# Agent 协作指南

> 面向在该仓库工作的 Coding Agent（Claude Code / Cursor / Trae 等）。
> 本文件是项目级的「长期记忆」：约定、约束、命令、踩过的坑，一次写清，下次直接遵守。

## 1. 项目一句话

**Where Is It?** —— 一个 Local-first 的私人物品账本 Web 应用。所有数据存浏览器 IndexedDB，零账号、零后端、零追踪。

## 2. 技术栈

- React 18 + React Router 6（HashRouter）
- Vite 5（`@vitejs/plugin-react-swc`）
- 状态：Zustand
- 持久化：IndexedDB（封装 `idb`，见 `src/lib/db.js`）
- 图标：`lucide-react`
- 样式：原生 CSS + CSS 变量，**无 UI 框架**
- 路径别名：`@/*` → `src/*`（见 `jsconfig.json`）

## 3. 常用命令

```bash
pnpm install        # 安装依赖
pnpm dev            # 本地开发，默认 http://localhost:5173
pnpm build          # 生产构建（提交前必须跑过）
pnpm preview        # 本地预览构建产物
```

Node.js ≥ 18。

## 4. 目录结构

```
src/
├── components/      # 通用 UI（AppShell、MultiSelect、Thumb、Empty…）
├── pages/           # 路由级页面
├── store/           # Zustand store（catalog / prefs / theme）
├── lib/             # 工具与持久化（db、image、url、prefs、repos）
├── hooks/           # 自定义 hooks
├── styles/          # 全局样式与设计令牌
├── App.jsx          # 路由表 + Suspense
└── main.jsx         # 入口
```

## 5. 设计原则（务必遵守）

PRD 见 `.trae/documents/prd.md`，技术架构见 `.trae/documents/tech-architecture.md`。摘要：

1. **配色**：纯黑/纯白主色 + 中性灰阶 + 单色警示（琥珀 `#A16207` / 暗色 `#D4A373`）。**禁止紫色 / 蓝色 / 粉色渐变**。
2. **形状**：直角或极小圆角（`--radius: 2px`，少数用 4px）。**禁止大圆角卡片**。
3. **字体**：标题用 `IBM Plex Serif` / `Noto Serif SC`；正文 `Inter Tight` / `Noto Sans SC`；数字与标签 `JetBrains Mono`。中文走 `Noto Sans SC` 子集。
4. **图标**：线性、`strokeWidth={1.5}`，统一使用 `lucide-react`。
5. **过渡**：仅颜色与背景 `200ms ease`，**不使用渐变与阴影**。
6. **响应式**：移动优先（默认 375px），≥1024px 升级为多列。
7. **交互区**：可点击区域 ≥ 44×44px。

## 6. 代码风格

- JSX/JS：`function` 声明组件 + 具名导出；不引入 TS（保持精简）。
- 文件命名：组件 `PascalCase.jsx`；hooks `useXxx.js`；其它 `camelCase.js`。
- 样式：与组件同目录同名 `.css` 文件，按 BEM 风格类名（`.item-card-body` / `.filter-row` …）。
- 不要新增 UI 框架（Tailwind / MUI / shadcn …）。如有强需求先讨论。
- **不要写多余的注释、抽象、配置项**。三行重复代码优于一个过早抽象。
- **不要写 fallback / 兜底逻辑给"不会发生的场景"**。仅在边界（用户输入 / 外部 API）做校验。

## 7. 路由与页面

- 路由全部用 HashRouter（见 `src/main.jsx`），链接写 `/path` 形式即可。
- 所有数据页用 `lazy()` + `Suspense` 按需加载（见 `src/App.jsx`）。
- `/`（首页）：当 `items.length === 0` 时渲染引导首页 `HomePage`，否则降级为 `ItemsListPage`（保留全部检索/筛选体验）。这一约定**不要改成 redirect**——会丢失筛选条件。

## 8. 数据约定

- IndexedDB 数据库与对象库见 `src/lib/db.js`。修改 schema 必须升级 `DB_VERSION` 并写迁移。
- 图片以 Blob 存储于 `images` store，**不要**转 base64（膨胀 33%）。
- 物品主数据字段：`{ id, name, model, price, quantity, location, note, groupId, categoryId, tagIds[], imageIds[], createdAt, updatedAt }`。
- 用户偏好（视图/排序/筛选）走 `src/lib/prefs.js`，`localStorage` key 用 `wii.prefs`。新增偏好字段时同步加进 `DEFAULTS` 与 `normalize()`。
- 用户数据（物品名 / 标签 / 分组）**永远原样保留**，i18n 不翻译。

## 9. 国际化（i18n）

当前 UI 文案**仍是中文硬编码**。后续若加英文：

- 推荐极简方案：`src/i18n/{index.js, zh.js, en.js}` + `useLocaleStore`（`localStorage` key：`wii.locale`）。
- 占位符语法：`{name}`，`t('items.count', { n: 5 })`。
- 字典分层：`common.*` / `home.*` / `items.*` / `settings.*`。
- 浏览器语言嗅探：`navigator.language.startsWith('zh') ? 'zh' : 'en'`。
- 日期格式用 `Intl.DateTimeFormat(lang, ...)`，按 locale 自动排版。

不要引入 `react-i18next` / `react-intl`，体积与复杂度不匹配项目体量。

## 10. 性能与可访问性

- 搜索输入走 `useDeferredValue`，避免每次按键都重算过滤结果。
- 列表项用 `memo()` 包裹。
- DB 读批量：`db.transaction()` + 并行 `store.get()`，不要 N 次 `await getDB()`。
- 所有图标按钮必须带 `aria-label`；图片 `alt` 不能为空（占位图用 `alt=""`）。

## 11. Git 与提交

- 不要自动提交。等用户明确说「提交」再操作。
- 不要 `push --force` / `reset --hard` / `clean -f` 等破坏性命令。
- 提交信息用中文 / 英文均可，描述「为什么」而非「做了什么」。

## 12. 调试清单（高频踩坑）

| 现象               | 多半原因                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------- |
| 主题闪烁           | 确认 `index.html` 内联脚本在 CSS/JS 之前执行，且读取 `localStorage` key 为 `wii.theme`    |
| IndexedDB 升级失败 | 漏写迁移函数；或新 store 未在 `STORES` 中声明                                             |
| 图片不显示         | `images` 表里没存 `blobId`；或 `useBlobURL` 未清理导致内存泄漏                            |
| 移动端 4 列挤不下  | hero/sample 行用 `grid-template-columns: 16px minmax(0,1fr) auto auto` + `max-width` 截断 |
| 路由刷新后丢失状态 | HashRouter 用 `#/`，刷新走 `index.html`；不要切换到 BrowserRouter                         |

## 13. 反模式（明确禁止）

- ❌ 任何渐变色（`linear-gradient` / `radial-gradient` 用于装饰）
- ❌ 大圆角（≥12px）或重阴影
- ❌ Tailwind / styled-components / 任何新依赖（先讨论）
- ❌ 在组件里直接 `await import()` 数据页（用 `lazy()`）
- ❌ 把用户数据迁移 / 翻译
- ❌ 给"不会发生的场景"写 try/catch 与 fallback
- ❌ 新建文件来装一段三行能写完的逻辑

## 14. 完成定义（DoD）

每次改动提交前自查：

- [ ] `pnpm build` 通过（exit 0）
- [ ] 受影响的页面在桌面 (≥1024) 与移动 (375) 各看一遍
- [ ] 主题切换（亮/暗）各看一遍
- [ ] 新增文案同步考虑过 i18n key 命名（即使暂不实现）
- [ ] 没有引入新依赖 / 没有破坏现有 schema

---

最后更新：2026-07-22
