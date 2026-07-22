import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCatalogStore } from '@/store/useCatalogStore';
import Empty from '@/components/Empty.jsx';
import './StatsPage.css';

export default function StatsPage() {
  const items = useCatalogStore((s) => s.items);
  const groups = useCatalogStore((s) => s.groups);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);

  const totals = useMemo(() => {
    const totalQty = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
    const totalValue = items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 0), 0);
    const distinct = new Set(items.map((it) => it.name)).size;
    const low = items.filter((it) => (it.quantity || 0) > 0 && (it.quantity || 0) <= 2);
    return { totalQty, totalValue, distinct, low };
  }, [items]);

  const byCategory = useMemo(() => aggregate(items, categories, 'categoryId'), [items, categories]);
  const byGroup = useMemo(() => aggregate(items, groups, 'groupId'), [items, groups]);
  const tagUsage = useMemo(() => {
    const counts = new Map();
    for (const t of tags) counts.set(t.id, 0);
    for (const it of items) for (const tid of it.tagIds || []) {
      counts.set(tid, (counts.get(tid) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([tid, n]) => ({ id: tid, name: tags.find((t) => t.id === tid)?.name || '?', n }))
      .filter((x) => x.name !== '?')
      .sort((a, b) => b.n - a.n)
      .slice(0, 10);
  }, [items, tags]);

  const recent = useMemo(
    () => items.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6),
    [items]
  );

  if (items.length === 0) {
    return <Empty title="还没有数据" hint="新增物品后这里将显示统计图表" />;
  }

  return (
    <div className="stats">
      <section className="stats-cards">
        <StatCard label="物品数" value={items.length} />
        <StatCard label="总件数" value={totals.totalQty} />
        <StatCard label="总价值" value={`¥ ${totals.totalValue.toFixed(2)}`} />
        <StatCard label="低库存" value={totals.low.length} warn={totals.low.length > 0} />
      </section>

      <section className="stats-section">
        <header className="section-head">
          <h3>分类分布</h3>
          <span className="mono subtle">{categories.length} 个分类</span>
        </header>
        <Bars data={byCategory} />
      </section>

      <section className="stats-section">
        <header className="section-head">
          <h3>分组数量</h3>
          <span className="mono subtle">{groups.length} 个分组</span>
        </header>
        <Bars data={byGroup} />
      </section>

      {tagUsage.length > 0 && (
        <section className="stats-section">
          <header className="section-head">
            <h3>常用标签 TOP {tagUsage.length}</h3>
            <span className="mono subtle">按使用次数</span>
          </header>
          <TagBars data={tagUsage} />
        </section>
      )}

      <section className="stats-section">
        <header className="section-head">
          <h3>最近添加</h3>
          <span className="mono subtle">最近 {recent.length} 项</span>
        </header>
        <ul className="recent-list">
          {recent.map((it) => (
            <li key={it.id} className="recent-row">
              <Link to={`/items/${it.id}`} className="recent-name ellipsis-1">
                {it.name}
              </Link>
              <span className="mono subtle">
                {new Date(it.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="mono">×{it.quantity}</span>
            </li>
          ))}
        </ul>
      </section>

      {totals.low.length > 0 && (
        <section className="stats-section">
          <header className="section-head">
            <h3>低库存提醒</h3>
            <span className="mono subtle">数量 ≤ 2</span>
          </header>
          <ul className="recent-list">
            {totals.low.map((it) => (
              <li key={it.id} className="recent-row">
                <Link to={`/items/${it.id}`} className="recent-name ellipsis-1">
                  {it.name}
                </Link>
                <span className="mono">×{it.quantity}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function aggregate(items, options, key) {
  const counts = new Map();
  for (const it of items) counts.set(it[key] || '', (counts.get(it[key] || '') || 0) + 1);
  const arr = [...counts.entries()].map(([oid, n]) => ({
    id: oid,
    name: options.find((o) => o.id === oid)?.name || '未分类',
    n,
  }));
  return arr.sort((a, b) => b.n - a.n);
}

function StatCard({ label, value, warn }) {
  return (
    <div className={`stat-card${warn ? ' warn' : ''}`}>
      <div className="stat-label mono">{label}</div>
      <div className="stat-value mono">{value}</div>
    </div>
  );
}

function Bars({ data }) {
  const max = data.reduce((m, x) => Math.max(m, x.n), 0) || 1;
  if (data.length === 0) return <div className="muted">暂无数据</div>;
  return (
    <ul className="bar-list">
      {data.map((d) => (
        <li key={d.id} className="bar-row">
          <div className="bar-name ellipsis-1">{d.name}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.n / max) * 100}%` }} />
          </div>
          <div className="bar-val mono">{d.n}</div>
        </li>
      ))}
    </ul>
  );
}

function TagBars({ data }) {
  const max = data.reduce((m, x) => Math.max(m, x.n), 0) || 1;
  return (
    <ul className="bar-list">
      {data.map((d) => (
        <li key={d.id} className="bar-row">
          <div className="bar-name ellipsis-1">#{d.name}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.n / max) * 100}%` }} />
          </div>
          <div className="bar-val mono">{d.n}</div>
        </li>
      ))}
    </ul>
  );
}
