import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  Rows3,
  MapPin,
  Plus,
  FolderTree,
  Layers,
  Tag as TagIcon,
} from 'lucide-react';
import { useCatalogStore } from '@/store/useCatalogStore';
import { usePrefsStore } from '@/store/usePrefsStore';
import Empty from '@/components/Empty.jsx';
import Thumb from '@/components/Thumb.jsx';
import MultiSelect from '@/components/MultiSelect.jsx';
import { getDB } from '@/lib/db';
import { newItemLink } from '@/lib/url';
import './ItemsListPage.css';

const SORT_OPTIONS = [
  { v: 'newest', label: '最新' },
  { v: 'oldest', label: '最旧' },
  { v: 'name', label: '名称 A→Z' },
  { v: 'priceDesc', label: '价格 高→低' },
  { v: 'priceAsc', label: '价格 低→高' },
  { v: 'qtyDesc', label: '数量 多→少' },
];

export default function ItemsListPage() {
  const items = useCatalogStore((s) => s.items);
  const groups = useCatalogStore((s) => s.groups);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);

  const q = usePrefsStore((s) => s.q);
  const groupIds = usePrefsStore((s) => s.groupIds);
  const categoryIds = usePrefsStore((s) => s.categoryIds);
  const tagIds = usePrefsStore((s) => s.tagIds);
  const sort = usePrefsStore((s) => s.sort);
  const view = usePrefsStore((s) => s.view);

  const setQ = usePrefsStore((s) => s.setQ);
  const setGroupIds = usePrefsStore((s) => s.setGroupIds);
  const setCategoryIds = usePrefsStore((s) => s.setCategoryIds);
  const setTagIds = usePrefsStore((s) => s.setTagIds);
  const setSort = usePrefsStore((s) => s.setSort);
  const setView = usePrefsStore((s) => s.setView);

  const navigate = useNavigate();

  const groupMap = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);
  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const tagMap = useMemo(() => Object.fromEntries(tags.map((t) => [t.id, t])), [tags]);

  // 搜索值走 useDeferredValue：输入流畅，过滤延后到空闲时执行
  const deferredQ = useDeferredValue(q);

  // 预取每个 item 的第一张图的 blobId：一次性 DB 读代替 N 次
  const firstBlobIds = useFirstBlobIds(items);

  // 用于 MultiSelect 显示每个选项当前的物品数量
  const groupCounts = useMemo(() => {
    const m = Object.fromEntries(groups.map((g) => [g.id, 0]));
    items.forEach((it) => {
      if (it.groupId && m[it.groupId] !== undefined) m[it.groupId]++;
    });
    return m;
  }, [items, groups]);

  const filtered = useMemo(() => {
    const kw = deferredQ.trim().toLowerCase();
    const gSet = new Set(groupIds);
    const cSet = new Set(categoryIds);
    const tSet = new Set(tagIds);
    let arr = items.filter((it) => {
      if (gSet.size > 0 && !gSet.has(it.groupId || '')) return false;
      if (cSet.size > 0 && !cSet.has(it.categoryId || '')) return false;
      if (tSet.size > 0) {
        const its = new Set(it.tagIds || []);
        for (const id of tSet) {
          if (!its.has(id)) return false;
        }
      }
      if (!kw) return true;
      const tagNames = (it.tagIds || []).map((id) => tagMap[id]?.name || '').join(' ');
      const hay = [it.name, it.model, it.location, it.note, tagNames].join(' ').toLowerCase();
      return hay.includes(kw);
    });
    arr = arr.slice();
    switch (sort) {
      case 'newest':
        arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        break;
      case 'oldest':
        arr.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        break;
      case 'name':
        arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh'));
        break;
      case 'priceDesc':
        arr.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'priceAsc':
        arr.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'qtyDesc':
        arr.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
        break;
      default:
        break;
    }
    return arr;
  }, [items, deferredQ, groupIds, categoryIds, tagIds, sort, tagMap]);

  const hasActiveFilter = groupIds.length + categoryIds.length + tagIds.length > 0;

  return (
    <div className="items-page">
      <div className="filters">
        <div className="filters-row filters-search">
          <div className="search">
            <Search size={16} strokeWidth={1.5} />
            <input
              className="search-input"
              placeholder="搜索名称、型号、标签、位置…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="搜索"
            />
          </div>
        </div>
        <div className="filters-row filters-controls">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            aria-label="切换视图"
            title="切换视图"
          >
            {view === 'grid' ? <Rows3 size={16} strokeWidth={1.5} /> : <LayoutGrid size={16} strokeWidth={1.5} />}
            <span className="icon-btn-label">{view === 'grid' ? '列表' : '网格'}</span>
          </button>
          <select className="filters-controls__sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="排序">
            {SORT_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filters-row filters-selects">
          <div className="filters-select">
            <MultiSelect
              value={groupIds}
              onChange={setGroupIds}
              options={groups.map((g) => ({ id: g.id, name: g.name, hint: groupCounts[g.id] }))}
              placeholder="全部分组"
              ariaLabel="筛选分组"
            />
          </div>
          <div className="filters-select">
            <MultiSelect
              value={categoryIds}
              onChange={setCategoryIds}
              options={categories.map((c) => ({ id: c.id, name: c.name }))}
              placeholder="全部分类"
              ariaLabel="筛选分类"
            />
          </div>
          <div className="filters-select">
            <MultiSelect
              value={tagIds}
              onChange={setTagIds}
              options={tags.map((t) => ({ id: t.id, name: t.name }))}
              placeholder="全部标签"
              prefix="#"
              ariaLabel="筛选标签"
            />
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              className="filters-clear"
              onClick={() => {
                setGroupIds([]);
                setCategoryIds([]);
                setTagIds([]);
              }}
            >
              清除
            </button>
          )}
        </div>
      </div>

      <div className="result-meta mono subtle">
        共 {filtered.length} 项 / 总 {items.length}
      </div>

      <div className="manage-entries">
        <Link to="/groups" className="manage-entry">
          <FolderTree size={14} strokeWidth={1.5} />
          <span>管理分组</span>
        </Link>
        <Link to="/categories" className="manage-entry">
          <Layers size={14} strokeWidth={1.5} />
          <span>管理分类</span>
        </Link>
        <Link to="/tags" className="manage-entry">
          <TagIcon size={14} strokeWidth={1.5} />
          <span>管理标签</span>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Empty
          title={items.length === 0 ? '还没有物品' : '没有匹配的物品'}
          hint={items.length === 0 ? '点击右下方 + 开始记录第一个物品' : '试试调整搜索词或筛选条件'}
          action={
            items.length === 0 ? (
              <Link to={newItemLink()} className="btn">
                <Plus size={16} />
                &nbsp;新增物品
              </Link>
            ) : null
          }
        />
      ) : view === 'grid' ? (
        <div className="item-grid">
          {filtered.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              group={groupMap[it.groupId]}
              category={categoryMap[it.categoryId]}
              tags={(it.tagIds || []).map((id) => tagMap[id]).filter(Boolean)}
              blobId={firstBlobIds[it.id]}
            />
          ))}
        </div>
      ) : (
        <div className="item-list">
          {filtered.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              group={groupMap[it.groupId]}
              category={categoryMap[it.categoryId]}
              blobId={firstBlobIds[it.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const ItemCard = memo(function ItemCard({ item, group, category, tags, blobId }) {
  const navigate = useNavigate();
  const hasImage = (item.imageIds || []).length > 0;
  return (
    <article
      className={`item-card${hasImage ? '' : ' no-image'}`}
      onClick={() => navigate(`/items/${item.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' ? navigate(`/items/${item.id}`) : null)}
    >
      {hasImage && <Thumb blobId={blobId} className="thumb" alt="" />}
      <div className="item-card-body">
        <div className="item-title">
          <span className="ellipsis-1">{item.name}</span>
          <span className="qty mono">×{item.quantity}</span>
        </div>
        {item.model && <div className="muted ellipsis-1" style={{ fontSize: 12 }}>{item.model}</div>}
        <div className="meta">
          {group && <span className="tag">{group.name}</span>}
          {category && <span className="tag">{category.name}</span>}
          {tags.slice(0, 3).map((t) => (
            <span key={t.id} className="tag">#{t.name}</span>
          ))}
        </div>
        <div className="footer">
          <span className="price mono">{formatPrice(item.price)}</span>
          {item.location && (
            <span className="loc mono ellipsis-1">
              <MapPin size={12} strokeWidth={1.5} /> {item.location}
            </span>
          )}
        </div>
      </div>
    </article>
  );
});

const ItemRow = memo(function ItemRow({ item, group, category, blobId }) {
  const navigate = useNavigate();
  return (
    <div className="item-row" onClick={() => navigate(`/items/${item.id}`)}>
      <div className="row-thumb">
        {item.imageIds?.length > 0 ? (
          <Thumb blobId={blobId} className="thumb" alt="" compact />
        ) : (
          <span className="row-thumb-placeholder" aria-hidden>
            <PackageIcon size={14} strokeWidth={1.25} />
          </span>
        )}
      </div>
      <div className="row-main">
        <div className="row-line1">
          <span className="ellipsis-1">{item.name}</span>
          <span className="qty mono">×{item.quantity}</span>
        </div>
        <div className="muted ellipsis-1" style={{ fontSize: 12 }}>
          {[group?.name, category?.name, item.location].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className="row-end mono">{formatPrice(item.price)}</div>
    </div>
  );
});

function PackageIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 7.7 4.4 7.7-4.4" />
      <path d="M12 22V12" />
    </svg>
  );
}

// 把每个 item 的首图 imageId 映射到对应的 blobId（一次 DB 事务 + 并行 get）
function useFirstBlobIds(items) {
  const [map, setMap] = useState({});
  useEffect(() => {
    let cancelled = false;
    if (!items || items.length === 0) {
      setMap({});
      return undefined;
    }
    (async () => {
      try {
        const db = await getDB();
        const tx = db.transaction('images', 'readonly');
        const store = tx.objectStore('images');
        const out = {};
        await Promise.all(
          items.map(async (it) => {
            const firstId = (it.imageIds || [])[0];
            if (!firstId) return;
            const row = await store.get(firstId);
            if (row && row.blobId) out[it.id] = row.blobId;
          }),
        );
        await tx.done;
        if (!cancelled) setMap(out);
      } catch (_) {
        if (!cancelled) setMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);
  return map;
}

function formatPrice(p) {
  if (!p) return '—';
  const n = Number(p);
  if (!Number.isFinite(n)) return '—';
  return `¥ ${n.toFixed(2)}`;
}
