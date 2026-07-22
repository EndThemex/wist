import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useCatalogStore } from '@/store/useCatalogStore';
import AppShell from '@/components/AppShell.jsx';
import ItemsListPage from '@/pages/ItemsListPage.jsx';

// 数据页：按需加载，缩减首屏 JS 体量
const ItemDetailPage = lazy(() => import('@/pages/ItemDetailPage.jsx'));
const ItemEditPage = lazy(() => import('@/pages/ItemEditPage.jsx'));
const GroupsPage = lazy(() => import('@/pages/GroupManagePage.jsx'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage.jsx'));
const TagsPage = lazy(() => import('@/pages/TagsPage.jsx'));
const StatsPage = lazy(() => import('@/pages/StatsPage.jsx'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage.jsx'));

function RouteFallback() {
  return (
    <div className="empty" aria-busy="true">
      <p>正在加载…</p>
    </div>
  );
}

export default function App() {
  const refresh = useCatalogStore((s) => s.refresh);
  const loaded = useCatalogStore((s) => s.loaded);

  useEffect(() => {
    // 不再阻塞首次渲染；AppShell 立即可见，页面内部按需消费 store
    if (!loaded) refresh();
  }, [refresh, loaded]);

  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<ItemsListPage />} />
          <Route path="/items/new" element={<ItemEditPage mode="create" />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/items/:id/edit" element={<ItemEditPage mode="edit" />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
