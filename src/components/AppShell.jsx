import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  Plus,
  BarChart3,
  Settings,
  Package,
  FolderTree,
  Tag as TagIcon,
  Layers,
  MapPin,
  MoreHorizontal,
  Check,
  Sun,
  Moon,
  Monitor,
  Languages,
} from "lucide-react";
import { newItemLink } from "@/lib/url";
import { useT, useLocale, setLocale, SUPPORTED_LOCALES } from "@/i18n";
import { useThemeStore } from "@/store/useThemeStore";
import "./AppShell.css";

// 主导航：单一数据源，桌面侧栏与移动底栏均从此派生
const NAV = [
  { to: "/", labelKey: "nav.items", icon: Package, end: true },
  { to: "/groups", labelKey: "nav.groups", icon: FolderTree },
  { to: "/categories", labelKey: "nav.categories", icon: Layers },
  { to: "/tags", labelKey: "nav.tags", icon: TagIcon },
  { to: "/locations", labelKey: "nav.locations", icon: MapPin },
  { to: "/stats", labelKey: "nav.stats", icon: BarChart3 },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

// 移动端底栏直出的项；其余折叠进「更多」下拉
const TABBAR_PINNED = ["/", "/stats", "/settings"];

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const t = useT();
  const pageMeta = useMemo(() => getPageMeta(pathname, t), [pathname, t]);

  return (
    <div className="shell">
      {/* 桌面侧栏 */}
      <aside className="sidebar" aria-label={t("nav.items")}>
        <Link
          to="/"
          className="brand brand-link"
          aria-label={t("nav.items")}
          title={t("nav.items")}
        >
          <span className="brand-mark" aria-hidden="true">
            ⌘
          </span>
          <div className="brand-text">
            <div className="brand-name">Where is it</div>
            <div className="brand-sub mono">
              v0.1 ·{" "}
              {t("settings.about.line1").replace(/^Where is it ·\s*/, "")}
            </div>
          </div>
        </Link>
        <NavList />
        <div className="sidebar-foot mono subtle">
          {t("settings.about.line2")}
        </div>
      </aside>

      <main className="main">
        <Topbar pageMeta={pageMeta} />
        <div className="content">{children}</div>
      </main>

      {/* 移动端底部 Tab 栏（含 FAB） */}
      <TabBar />
    </div>
  );
}

/* ============ 子组件 ============ */

// 共享导航列表（桌面侧栏）
function NavList() {
  const t = useT();
  return (
    <nav className="nav" aria-label={t("nav.items")}>
      {NAV.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Icon size={18} strokeWidth={1.5} aria-hidden />
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// 顶部栏：标题 / 当前段提示 / 主操作
function Topbar({ pageMeta }) {
  const t = useT();
  const addLabel = t("items.empty.action");
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-titles">
          <h1 className="topbar-title">{pageMeta.title}</h1>
          {pageMeta.hint && (
            <span className="topbar-hint mono" aria-hidden>
              {pageMeta.hint}
            </span>
          )}
        </div>

        <div className="topbar-actions">
          {/* 偏好菜单：语言 + 主题切换；桌面始终可见，移动端折叠到 Settings 页 */}
          <PrefsMenu />
          <NavLink
            to={newItemLink()}
            className="icon-btn icon-btn-primary"
            aria-label={addLabel}
            title={addLabel}
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden />
            <span className="icon-btn-label hide-mobile">
              {t("nav.addItem")}
            </span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}

// 偏好菜单：把语言和主题切换合并到一个下拉
// 桌面端常驻在 Topbar 右侧；移动端由 .hide-mobile 隐藏，切换能力仍保留在 SettingsPage
function PrefsMenu() {
  const t = useT();
  const lang = useLocale();
  const themeMode = useThemeStore((s) => s.mode);
  const setTheme = useThemeStore((s) => s.set);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // 当前主题对应图标（不展示文字，只展示状态）
  const ThemeIcon =
    themeMode === "dark" ? Moon : themeMode === "light" ? Sun : Monitor;

  // 点击外部 / Esc 关闭
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const currentLangLabel = SUPPORTED_LOCALES.find((o) => o.code === lang)
    ?.labelKey
    ? t(SUPPORTED_LOCALES.find((o) => o.code === lang).labelKey)
    : lang.toUpperCase();

  return (
    <div className={`prefs-menu${open ? " open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="icon-btn prefs-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("prefs.menu.ariaLabel")}
        title={t("prefs.menu.ariaLabel")}
        onClick={() => setOpen((o) => !o)}
      >
        <Languages size={16} strokeWidth={1.5} aria-hidden />
        <ThemeIcon
          size={14}
          strokeWidth={1.5}
          aria-hidden
          className="prefs-menu-theme"
        />
      </button>
      {open && (
        <div className="prefs-menu-panel" role="menu">
          <div className="prefs-menu-section">
            <div className="prefs-menu-section-title mono">
              {t("settings.section.lang")}
            </div>
            {SUPPORTED_LOCALES.map((o) => {
              const active = lang === o.code;
              return (
                <button
                  key={o.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  className={`prefs-menu-item${active ? " active" : ""}`}
                  onClick={() => setLocale(o.code)}
                >
                  <span>{t(o.labelKey)}</span>
                  {active ? (
                    <Check size={12} strokeWidth={2} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="prefs-menu-divider" aria-hidden />
          <div className="prefs-menu-section">
            <div className="prefs-menu-section-title mono">
              {t("settings.section.theme")}
            </div>
            {[
              { v: "light", labelKey: "settings.theme.light", Icon: Sun },
              { v: "dark", labelKey: "settings.theme.dark", Icon: Moon },
              { v: "system", labelKey: "settings.theme.system", Icon: Monitor },
            ].map((o) => {
              const active = themeMode === o.v;
              return (
                <button
                  key={o.v}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  className={`prefs-menu-item${active ? " active" : ""}`}
                  onClick={() => setTheme(o.v)}
                >
                  <o.Icon size={14} strokeWidth={1.5} aria-hidden />
                  <span>{t(o.labelKey)}</span>
                  {active ? (
                    <Check size={12} strokeWidth={2} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="prefs-menu-divider" aria-hidden />
          <div className="prefs-menu-foot mono subtle">{currentLangLabel}</div>
        </div>
      )}
    </div>
  );
}

// 移动端底部 Tab 栏：固定直出 + 「更多」下拉
function TabBar() {
  const { pathname } = useLocation();
  const t = useT();
  const pinned = NAV.filter((n) => TABBAR_PINNED.includes(n.to));
  const more = NAV.filter((n) => !TABBAR_PINNED.includes(n.to));
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // 当前是否激活「更多」分组中的某项（用于高亮触发按钮）
  const moreActive = more.some((m) =>
    m.to === "/" ? pathname === "/" : pathname.startsWith(m.to),
  );

  // 点击外部 / Esc 关闭
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const addLabel = t("items.empty.action");
  const moreLabel = t("nav.more");

  return (
    <nav className="tabbar" aria-label={t("nav.items")}>
      <div className="tabbar-inner">
        {pinned.map(({ to, labelKey, icon: Icon, end }) => {
          const label = t(labelKey);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `tab-item${isActive ? " active" : ""}`
              }
              aria-label={label}
              title={label}
            >
              <Icon size={16} strokeWidth={1.5} aria-hidden />
              <span className="tab-label">{label}</span>
            </NavLink>
          );
        })}

        {/* 「更多」下拉：承载 分组 / 分类 / 标签 */}
        <div
          className={`tab-more${open ? " open" : ""}${moreActive ? " active" : ""}`}
          ref={rootRef}
        >
          <button
            type="button"
            className="tab-item tab-more-trigger"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={moreLabel}
            title={moreLabel}
            onClick={() => setOpen((o) => !o)}
          >
            <MoreHorizontal size={16} strokeWidth={1.5} aria-hidden />
            <span className="tab-label">{moreLabel}</span>
          </button>
          {open && (
            <div className="tab-more-panel" role="menu">
              {more.map(({ to, labelKey, icon: Icon, end }) => {
                const label = t(labelKey);
                const active =
                  to === "/" ? pathname === "/" : pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    role="menuitem"
                    className={({ isActive }) =>
                      `tab-more-item${isActive ? " active" : ""}`
                    }
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={14} strokeWidth={1.5} aria-hidden />
                    <span className="tab-more-name">{label}</span>
                    {active ? (
                      <Check size={12} strokeWidth={2} aria-hidden />
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        <NavLink
          to={newItemLink()}
          className="tab-item tab-fab"
          aria-label={addLabel}
          title={addLabel}
        >
          <Plus size={18} strokeWidth={2} aria-hidden />
        </NavLink>
      </div>
    </nav>
  );
}

/* ============ 路径 → 标题 / 提示 ============ */

function getPageMeta(pathname, t) {
  if (pathname === "/") {
    return { title: t("nav.items"), hint: t("hint.items") };
  }
  if (pathname === "/items/new") {
    return { title: t("edit.title.create"), hint: t("hint.itemsNew") };
  }
  const editMatch = /^\/items\/([^/]+)\/edit/.exec(pathname);
  if (editMatch) {
    return { title: t("edit.title.edit"), hint: t("hint.itemsEdit") };
  }
  const detailMatch = /^\/items\/([^/]+)/.exec(pathname);
  if (detailMatch) {
    return { title: t("detail.title"), hint: t("hint.itemsDetail") };
  }
  if (pathname.startsWith("/groups"))
    return { title: t("nav.groups"), hint: t("hint.groups") };
  if (pathname.startsWith("/categories"))
    return { title: t("nav.categories"), hint: t("hint.categories") };
  if (pathname.startsWith("/tags"))
    return { title: t("nav.tags"), hint: t("hint.tags") };
  if (pathname.startsWith("/locations"))
    return { title: t("nav.locations"), hint: t("hint.locations") };
  if (pathname.startsWith("/stats"))
    return { title: t("nav.stats"), hint: t("hint.stats") };
  if (pathname.startsWith("/settings"))
    return { title: t("nav.settings"), hint: t("hint.settings") };
  return { title: "", hint: "" };
}
