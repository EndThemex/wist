import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Plus,
  BarChart3,
  Settings,
  Package,
  FolderTree,
  Tag as TagIcon,
  Layers,
  MoreHorizontal,
  Check,
} from 'lucide-react';
import { newItemLink } from '@/lib/url';
import './AppShell.css';

// 主导航：单一数据源，桌面侧栏与移动底栏均从此派生
const NAV = [
  { to: '/', label: '物品', icon: Package, end: true },
  { to: '/groups', label: '分组', icon: FolderTree },
  { to: '/categories', label: '分类', icon: Layers },
  { to: '/tags', label: '标签', icon: TagIcon },
  { to: '/stats', label: '统计', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: Settings },
];

// 移动端底栏直出的项；其余折叠进「更多」下拉
const TABBAR_PINNED = ['/', '/stats', '/settings'];

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);

  return (
    <div className="shell">
      {/* 桌面侧栏 */}
      <aside className="sidebar" aria-label="主导航">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">⌘</span>
          <div className="brand-text">
            <div className="brand-name">Where is it</div>
            <div className="brand-sub mono">v0.1 · local-first</div>
          </div>
        </div>
        <NavList />
        <div className="sidebar-foot mono subtle">数据仅保存在本机浏览器</div>
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
  return (
    <nav className="nav" aria-label="主导航">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={18} strokeWidth={1.5} aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// 顶部栏：标题 / 当前段提示 / 主操作
function Topbar({ pageMeta }) {
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
          <NavLink
            to={newItemLink()}
            className="icon-btn icon-btn-primary"
            aria-label="新增物品"
            title="新增物品"
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden />
            <span className="icon-btn-label hide-mobile">新增</span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}

// 移动端底部 Tab 栏：固定直出 + 「更多」下拉
function TabBar() {
  const { pathname } = useLocation();
  const pinned = NAV.filter((n) => TABBAR_PINNED.includes(n.to));
  const more = NAV.filter((n) => !TABBAR_PINNED.includes(n.to));
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // 当前是否激活「更多」分组中的某项（用于高亮触发按钮）
  const moreActive = more.some((m) =>
    m.to === '/' ? pathname === '/' : pathname.startsWith(m.to)
  );

  // 点击外部 / Esc 关闭
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <nav className="tabbar" aria-label="底部导航">
      <div className="tabbar-inner">
        {pinned.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
            aria-label={label}
            title={label}
          >
            <Icon size={16} strokeWidth={1.5} aria-hidden />
            <span className="tab-label">{label}</span>
          </NavLink>
        ))}

        {/* 「更多」下拉：承载 分组 / 分类 / 标签 */}
        <div
          className={`tab-more${open ? ' open' : ''}${moreActive ? ' active' : ''}`}
          ref={rootRef}
        >
          <button
            type="button"
            className="tab-item tab-more-trigger"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="更多"
            title="更多"
            onClick={() => setOpen((o) => !o)}
          >
            <MoreHorizontal size={16} strokeWidth={1.5} aria-hidden />
            <span className="tab-label">更多</span>
          </button>
          {open && (
            <div className="tab-more-panel" role="menu">
              {more.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  role="menuitem"
                  className={({ isActive }) => `tab-more-item${isActive ? ' active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={14} strokeWidth={1.5} aria-hidden />
                  <span className="tab-more-name">{label}</span>
                  {(() => {
                    const active = to === '/'
                      ? pathname === '/'
                      : pathname.startsWith(to);
                    return active ? <Check size={12} strokeWidth={2} aria-hidden /> : null;
                  })()}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <NavLink
          to={newItemLink()}
          className="tab-item tab-fab"
          aria-label="新增物品"
          title="新增物品"
        >
          <Plus size={18} strokeWidth={2} aria-hidden />
        </NavLink>
      </div>
    </nav>
  );
}

/* ============ 路径 → 标题 / 提示 ============ */

function getPageMeta(pathname) {
  if (pathname === '/') {
    return { title: '物品', hint: 'ITEMS' };
  }
  if (pathname === '/items/new') {
    return { title: '新增物品', hint: 'ITEMS / NEW' };
  }
  const editMatch = /^\/items\/([^/]+)\/edit/.exec(pathname);
  if (editMatch) {
    return { title: '编辑物品', hint: `ITEMS / ${editMatch[1].slice(0, 8)}` };
  }
  const detailMatch = /^\/items\/([^/]+)/.exec(pathname);
  if (detailMatch) {
    return { title: '物品详情', hint: `ITEMS / ${detailMatch[1].slice(0, 8)}` };
  }
  if (pathname.startsWith('/groups')) return { title: '分组', hint: 'GROUPS' };
  if (pathname.startsWith('/categories')) return { title: '分类', hint: 'CATEGORIES' };
  if (pathname.startsWith('/tags')) return { title: '标签', hint: 'TAGS' };
  if (pathname.startsWith('/stats')) return { title: '统计', hint: 'STATS' };
  if (pathname.startsWith('/settings')) return { title: '设置', hint: 'SETTINGS' };
  return { title: '', hint: '' };
}