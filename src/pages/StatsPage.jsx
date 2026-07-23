import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCatalogStore } from "@/store/useCatalogStore";
import Empty from "@/components/Empty.jsx";
import { useT, useLocale } from "@/i18n";
import "./StatsPage.css";

const LOW_STOCK_THRESHOLD = 2;

export default function StatsPage() {
  const items = useCatalogStore((s) => s.items);
  const groups = useCatalogStore((s) => s.groups);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);
  const t = useT();
  const lang = useLocale();

  const totals = useMemo(() => {
    const totalQty = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
    const totalValue = items.reduce(
      (acc, it) => acc + (it.price || 0) * (it.quantity || 0),
      0,
    );
    const distinct = new Set(items.map((it) => it.name)).size;
    const low = items.filter(
      (it) =>
        (it.quantity || 0) > 0 && (it.quantity || 0) <= LOW_STOCK_THRESHOLD,
    );
    return { totalQty, totalValue, distinct, low };
  }, [items]);

  const byCategory = useMemo(
    () => aggregate(items, categories, "categoryId", t("nav.categories")),
    [items, categories, t],
  );
  const byGroup = useMemo(
    () => aggregate(items, groups, "groupId", t("nav.groups")),
    [items, groups, t],
  );
  const tagUsage = useMemo(() => {
    const counts = new Map();
    for (const tg of tags) counts.set(tg.id, 0);
    for (const it of items)
      for (const tid of it.tagIds || []) {
        counts.set(tid, (counts.get(tid) || 0) + 1);
      }
    return [...counts.entries()]
      .map(([tid, n]) => ({
        id: tid,
        name: tags.find((tg) => tg.id === tid)?.name || "?",
        n,
      }))
      .filter((x) => x.name !== "?")
      .sort((a, b) => b.n - a.n)
      .slice(0, 10);
  }, [items, tags]);

  const recent = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 6),
    [items],
  );

  // 货币/日期按当前 locale 渲染
  const fmtValue = useMemo(
    () =>
      new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en-US", {
        style: "currency",
        currency: "CNY",
        minimumFractionDigits: 2,
      }),
    [lang],
  );
  const fmtDate = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [lang],
  );

  if (items.length === 0) {
    return <Empty title="stats.empty.title" hint={t("stats.empty.hint")} />;
  }

  return (
    <div className="stats">
      <section className="stats-cards">
        <StatCard label={t("stats.card.items")} value={items.length} />
        <StatCard label={t("stats.card.totalQty")} value={totals.totalQty} />
        <StatCard
          label={t("stats.card.totalValue")}
          value={fmtValue.format(totals.totalValue)}
        />
        <StatCard
          label={t("stats.card.lowStock")}
          value={totals.low.length}
          warn={totals.low.length > 0}
        />
      </section>

      <section className="stats-section">
        <header className="section-head">
          <h3>{t("stats.section.byCategory")}</h3>
          <span className="mono subtle">{categories.length}</span>
        </header>
        <Bars data={byCategory} />
      </section>

      <section className="stats-section">
        <header className="section-head">
          <h3>{t("stats.section.byGroup")}</h3>
          <span className="mono subtle">{groups.length}</span>
        </header>
        <Bars data={byGroup} />
      </section>

      {tagUsage.length > 0 && (
        <section className="stats-section">
          <header className="section-head">
            <h3>{t("stats.section.topTags", { n: tagUsage.length })}</h3>
            <span className="mono subtle">
              {t("stats.section.byGroup").split("·")[0] || ""}
            </span>
          </header>
          <TagBars data={tagUsage} />
        </section>
      )}

      <section className="stats-section">
        <header className="section-head">
          <h3>{t("stats.section.recent")}</h3>
          <span className="mono subtle">
            {t("stats.recent.count", { n: recent.length })}
          </span>
        </header>
        <ul className="recent-list">
          {recent.map((it) => (
            <li key={it.id} className="recent-row">
              <Link to={`/items/${it.id}`} className="recent-name ellipsis-1">
                {it.name}
              </Link>
              <span className="mono subtle">
                {it.createdAt ? fmtDate.format(new Date(it.createdAt)) : "—"}
              </span>
              <span className="mono">
                {t("items.qty", { n: it.quantity || 0 })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {totals.low.length > 0 && (
        <section className="stats-section">
          <header className="section-head">
            <h3>{t("stats.section.lowStock")}</h3>
            <span className="mono subtle">
              {t("stats.lowStock.hint", { n: LOW_STOCK_THRESHOLD })}
            </span>
          </header>
          <ul className="recent-list">
            {totals.low.map((it) => (
              <li key={it.id} className="recent-row">
                <Link to={`/items/${it.id}`} className="recent-name ellipsis-1">
                  {it.name}
                </Link>
                <span className="mono">
                  {t("items.qty", { n: it.quantity || 0 })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function aggregate(items, options, key, fallbackName) {
  const counts = new Map();
  for (const it of items)
    counts.set(it[key] || "", (counts.get(it[key] || "") || 0) + 1);
  const arr = [...counts.entries()].map(([oid, n]) => ({
    id: oid,
    name: options.find((o) => o.id === oid)?.name || fallbackName,
    n,
  }));
  return arr.sort((a, b) => b.n - a.n);
}

function StatCard({ label, value, warn }) {
  return (
    <div className={`stat-card${warn ? " warn" : ""}`}>
      <div className="stat-label mono">{label}</div>
      <div className="stat-value mono">{value}</div>
    </div>
  );
}

function Bars({ data }) {
  const max = data.reduce((m, x) => Math.max(m, x.n), 0) || 1;
  if (data.length === 0) return <div className="muted">—</div>;
  return (
    <ul className="bar-list">
      {data.map((d) => (
        <li key={d.id} className="bar-row">
          <div className="bar-name ellipsis-1">{d.name}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(d.n / max) * 100}%` }}
            />
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
            <div
              className="bar-fill"
              style={{ width: `${(d.n / max) * 100}%` }}
            />
          </div>
          <div className="bar-val mono">{d.n}</div>
        </li>
      ))}
    </ul>
  );
}
