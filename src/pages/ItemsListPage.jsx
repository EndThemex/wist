import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  Rows3,
  MapPin,
  Plus,
  FolderTree,
  Layers,
  Tag as TagIcon,
} from "lucide-react";
import { useCatalogStore } from "@/store/useCatalogStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import Empty from "@/components/Empty.jsx";
import Thumb from "@/components/Thumb.jsx";
import MultiSelect from "@/components/MultiSelect.jsx";
import { getDB } from "@/lib/db";
import { newItemLink } from "@/lib/url";
import { useT, useLocale } from "@/i18n";
import "./ItemsListPage.css";

// 排序选项 label 由 i18n 在组件内注入
const SORT_KEYS = [
  { v: "newest", labelKey: "items.sort.newest" },
  { v: "oldest", labelKey: "items.sort.oldest" },
  { v: "name", labelKey: "items.sort.name" },
  { v: "priceDesc", labelKey: "items.sort.priceDesc" },
  { v: "priceAsc", labelKey: "items.sort.priceAsc" },
  { v: "qtyDesc", labelKey: "items.sort.qtyDesc" },
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

  const t = useT();
  const lang = useLocale();
  const navigate = useNavigate();

  const groupMap = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g])),
    [groups],
  );
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  );
  const tagMap = useMemo(
    () => Object.fromEntries(tags.map((t) => [t.id, t])),
    [tags],
  );

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
      if (gSet.size > 0 && !gSet.has(it.groupId || "")) return false;
      if (cSet.size > 0 && !cSet.has(it.categoryId || "")) return false;
      if (tSet.size > 0) {
        const its = new Set(it.tagIds || []);
        for (const id of tSet) {
          if (!its.has(id)) return false;
        }
      }
      if (!kw) return true;
      const tagNames = (it.tagIds || [])
        .map((id) => tagMap[id]?.name || "")
        .join(" ");
      const hay = [it.name, it.model, it.location, it.note, tagNames]
        .join(" ")
        .toLowerCase();
      return hay.includes(kw);
    });
    arr = arr.slice();
    // 名称排序：中文按拼音 / 英文按字母，用当前语言对应的 locale
    const nameLocale = lang === "zh" ? "zh" : "en";
    switch (sort) {
      case "newest":
        arr.sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || ""),
        );
        break;
      case "oldest":
        arr.sort((a, b) =>
          (a.createdAt || "").localeCompare(b.createdAt || ""),
        );
        break;
      case "name":
        arr.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", nameLocale),
        );
        break;
      case "priceDesc":
        arr.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "priceAsc":
        arr.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "qtyDesc":
        arr.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
        break;
      default:
        break;
    }
    return arr;
  }, [items, deferredQ, groupIds, categoryIds, tagIds, sort, tagMap, lang]);

  const hasActiveFilter =
    groupIds.length + categoryIds.length + tagIds.length > 0;
  const viewLabel =
    view === "grid" ? t("items.viewToggle.list") : t("items.viewToggle.grid");

  return (
    <div className="items-page">
      <div className="filters">
        <div className="filters-row filters-search">
          <div className="search">
            <Search size={16} strokeWidth={1.5} />
            <input
              className="search-input"
              placeholder={t("items.search.placeholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t("items.search.ariaLabel")}
            />
          </div>
        </div>
        <div className="filters-row filters-controls">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            aria-label={t("items.viewToggle.list")}
            title={t("items.viewToggle.list")}
          >
            {view === "grid" ? (
              <Rows3 size={16} strokeWidth={1.5} />
            ) : (
              <LayoutGrid size={16} strokeWidth={1.5} />
            )}
            <span className="icon-btn-label">{viewLabel}</span>
          </button>
          <select
            className="filters-controls__sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label={t("items.sort.ariaLabel")}
          >
            {SORT_KEYS.map((o) => (
              <option key={o.v} value={o.v}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="filters-row filters-selects">
          <div className="filters-select">
            <MultiSelect
              value={groupIds}
              onChange={setGroupIds}
              options={groups.map((g) => ({
                id: g.id,
                name: g.name,
                hint: groupCounts[g.id],
              }))}
              placeholder={t("items.filter.allGroups")}
              ariaLabel={t("items.filter.allGroups")}
            />
          </div>
          <div className="filters-select">
            <MultiSelect
              value={categoryIds}
              onChange={setCategoryIds}
              options={categories.map((c) => ({ id: c.id, name: c.name }))}
              placeholder={t("items.filter.allCategories")}
              ariaLabel={t("items.filter.allCategories")}
            />
          </div>
          <div className="filters-select">
            <MultiSelect
              value={tagIds}
              onChange={setTagIds}
              options={tags.map((t2) => ({ id: t2.id, name: t2.name }))}
              placeholder={t("items.filter.allTags")}
              prefix="#"
              ariaLabel={t("items.filter.allTags")}
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
              {t("items.filter.clear")}
            </button>
          )}
        </div>
      </div>

      <div className="result-meta mono subtle">
        {t("items.result", { count: filtered.length, total: items.length })}
      </div>

      <div className="manage-entries">
        <Link to="/groups" className="manage-entry">
          <FolderTree size={14} strokeWidth={1.5} />
          <span>{t("items.manageGroups")}</span>
        </Link>
        <Link to="/categories" className="manage-entry">
          <Layers size={14} strokeWidth={1.5} />
          <span>{t("items.manageCategories")}</span>
        </Link>
        <Link to="/tags" className="manage-entry">
          <TagIcon size={14} strokeWidth={1.5} />
          <span>{t("items.manageTags")}</span>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Empty
          title={
            items.length === 0
              ? "items.empty.title"
              : "items.emptyFiltered.title"
          }
          hint={
            items.length === 0
              ? t("items.empty.hint")
              : t("items.emptyFiltered.hint")
          }
          action={
            items.length === 0 ? (
              <Link to={newItemLink()} className="btn">
                <Plus size={16} />
                &nbsp;{t("items.empty.action")}
              </Link>
            ) : null
          }
        />
      ) : view === "grid" ? (
        <div className="item-grid">
          {filtered.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              group={groupMap[it.groupId]}
              category={categoryMap[it.categoryId]}
              tags={(it.tagIds || []).map((id) => tagMap[id]).filter(Boolean)}
              blobId={firstBlobIds[it.id]}
              priceLabel={formatPrice(it.price)}
              qtyLabel={t("items.qty", { n: it.quantity })}
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
              priceLabel={formatPrice(it.price)}
              qtyLabel={t("items.qty", { n: it.quantity })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const ItemCard = memo(function ItemCard({
  item,
  group,
  category,
  tags,
  blobId,
  priceLabel,
  qtyLabel,
}) {
  const navigate = useNavigate();
  const hasImage = (item.imageIds || []).length > 0;
  return (
    <article
      className={`item-card${hasImage ? "" : " no-image"}`}
      onClick={() => navigate(`/items/${item.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === "Enter" ? navigate(`/items/${item.id}`) : null
      }
    >
      {hasImage && <Thumb blobId={blobId} className="thumb" alt="" />}
      <div className="item-card-body">
        <div className="item-title">
          <span className="ellipsis-1">{item.name}</span>
          <span className="qty mono">{qtyLabel}</span>
        </div>
        {item.model && (
          <div className="muted ellipsis-1" style={{ fontSize: 12 }}>
            {item.model}
          </div>
        )}
        <div className="meta">
          {group && <span className="tag">{group.name}</span>}
          {category && <span className="tag">{category.name}</span>}
          {tags.slice(0, 3).map((t2) => (
            <span key={t2.id} className="tag">
              #{t2.name}
            </span>
          ))}
        </div>
        <div className="footer">
          <span className="price mono">{priceLabel}</span>
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

const ItemRow = memo(function ItemRow({
  item,
  group,
  category,
  blobId,
  priceLabel,
  qtyLabel,
}) {
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
          <span className="qty mono">{qtyLabel}</span>
        </div>
        <div className="muted ellipsis-1" style={{ fontSize: 12 }}>
          {[group?.name, category?.name, item.location]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      <div className="row-end mono">{priceLabel}</div>
    </div>
  );
});

function PackageIcon(props) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 7.7 4.4 7.7-4.4" />
      <path d="M12 22V12" />
    </svg>
  );
}

// 把每个 item 的首图 imageId 映射到对应的 blobId
// 依赖只跟「首图 imageId」有关，避免 addItem/updateItem/removeItem 触发整次重算
// 取数：一次 db.getAll('images') 拿到全表，按 itemId 分组后查每个 item 的首图
function useFirstBlobIds(items) {
  const [map, setMap] = useState({});
  // 派生稳定 key：item.id + 首图 imageId
  const depsKey = useMemo(() => {
    let s = "";
    for (const it of items || []) {
      s += it.id + ":" + ((it.imageIds && it.imageIds[0]) || "") + ",";
    }
    return s;
  }, [items]);
  useEffect(() => {
    let cancelled = false;
    if (!items || items.length === 0) {
      setMap({});
      return undefined;
    }
    (async () => {
      try {
        const db = await getDB();
        // 只读 transaction + 全表一次扫描，前端按 itemId 分组后取首图
        const allImages = await db.getAll("images");
        const byItem = new Map();
        for (const row of allImages) {
          const arr = byItem.get(row.itemId) || [];
          arr.push(row);
          byItem.set(row.itemId, arr);
        }
        const out = {};
        for (const it of items) {
          const arr = byItem.get(it.id);
          if (!arr || arr.length === 0) continue;
          // 已有 order 字段时按 order 取最小
          arr.sort((a, b) => (a.order || 0) - (b.order || 0));
          const first = arr[0];
          if (first?.blobId) out[it.id] = first.blobId;
        }
        if (!cancelled) setMap(out);
      } catch (_) {
        if (!cancelled) setMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [depsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return map;
}

// 价格 / 货币：跟随当前 locale，英文用 $，中文保留 ¥ 占位符
// 实际生产应支持多币种，目前先用硬编码 + 当前 locale 的 Intl
function formatPrice(p) {
  if (p == null || p === "") return "—";
  const n = Number(p);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 2,
    }).format(n);
  } catch (_) {
    return `¥ ${n.toFixed(2)}`;
  }
}
