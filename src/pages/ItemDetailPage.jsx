import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  Copy,
  Calendar,
} from "lucide-react";
import { useCatalogStore } from "@/store/useCatalogStore";
import Carousel from "@/components/Carousel.jsx";
import { editItemLink } from "@/lib/url";
import { useT, useLocale } from "@/i18n";
import "./ItemDetailPage.css";

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backOverride = searchParams.get("from") || searchParams.get("to");
  const item = useCatalogStore((s) => s.items.find((it) => it.id === id));
  const groups = useCatalogStore((s) => s.groups);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);
  const removeItem = useCatalogStore((s) => s.removeItem);
  const t = useT();
  const lang = useLocale();

  const group = useMemo(
    () => groups.find((g) => g.id === item?.groupId),
    [groups, item],
  );
  const category = useMemo(
    () => categories.find((c) => c.id === item?.categoryId),
    [categories, item],
  );
  const itemTags = useMemo(
    () =>
      (item?.tagIds || [])
        .map((tid) => tags.find((tg) => tg.id === tid))
        .filter(Boolean),
    [item, tags],
  );

  const fmtDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [lang],
  );

  // 购买日期专用：仅展示日期（不显示时分），与 ISO YYYY-MM-DD 配合
  const fmtDate = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    [lang],
  );

  const fmtPrice = useMemo(
    () =>
      new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en-US", {
        style: "currency",
        currency: "CNY",
        minimumFractionDigits: 2,
      }),
    [lang],
  );

  if (!item) {
    return (
      <div className="detail-empty">
        <p>{t("detail.notFound")}</p>
        <Link to="/" className="btn-ghost btn">
          {t("detail.backToList")}
        </Link>
      </div>
    );
  }

  const onDelete = async () => {
    if (!window.confirm(t("detail.delete.confirm", { name: item.name })))
      return;
    await removeItem(item.id);
    if (backOverride) navigate(backOverride);
    else navigate("/");
  };

  const copyField = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text ?? ""));
    } catch (_) {
      // ignore
    }
  };

  return (
    <div className="detail">
      <div className="detail-head">
        <button
          type="button"
          className="icon-btn"
          onClick={() => (backOverride ? navigate(backOverride) : navigate(-1))}
          aria-label={t("common.back")}
          title={t("common.back")}
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="icon-btn-label">{t("common.back")}</span>
        </button>
        <div className="spacer" />
        <div
          className="detail-actions"
          role="toolbar"
          aria-label={t("detail.title")}
        >
          <Link
            to={editItemLink(item.id)}
            className="icon-btn"
            title={t("common.edit")}
          >
            <Pencil size={18} strokeWidth={1.5} />
            <span className="icon-btn-label">{t("common.edit")}</span>
          </Link>
          <button
            type="button"
            className="icon-btn icon-btn-danger"
            onClick={onDelete}
            title={t("common.delete")}
            aria-label={t("common.delete")}
          >
            <Trash2 size={18} strokeWidth={1.5} />
            <span className="icon-btn-label">{t("common.delete")}</span>
          </button>
        </div>
      </div>

      <Carousel imageIds={item.imageIds || []} />

      <h1 className="detail-title">{item.name}</h1>
      {item.model && <div className="muted detail-model">{item.model}</div>}

      <div className="kv">
        <KV
          label={t("detail.field.price")}
          value={
            <span className="mono">{fmtPrice.format(item.price || 0)}</span>
          }
        />
        <KV
          label={t("detail.field.quantity")}
          value={<span className="mono">{item.quantity}</span>}
        />
        {group && <KV label={t("detail.field.group")} value={group.name} />}
        {category && (
          <KV label={t("detail.field.category")} value={category.name} />
        )}
        {item.location && (
          <KV
            label={t("detail.field.location")}
            value={
              <span className="row" style={{ gap: 6 }}>
                <MapPin size={14} strokeWidth={1.5} /> {item.location}
              </span>
            }
          />
        )}
        {itemTags.length > 0 && (
          <KV
            label={t("detail.field.tags")}
            value={
              <span className="row" style={{ flexWrap: "wrap", gap: 6 }}>
                {itemTags.map((tg) => (
                  <span key={tg.id} className="tag">
                    #{tg.name}
                  </span>
                ))}
              </span>
            }
          />
        )}
        {item.purchasedAt && (
          <KV
            label={t("detail.field.purchasedAt")}
            value={
              <span className="row" style={{ gap: 6 }}>
                <Calendar size={14} strokeWidth={1.5} />
                <span className="mono">
                  {fmtDate.format(new Date(item.purchasedAt))}
                </span>
              </span>
            }
          />
        )}
        <KV
          label={t("detail.field.createdAt")}
          value={
            <span className="mono">
              {item.createdAt
                ? fmtDateTime.format(new Date(item.createdAt))
                : "—"}
            </span>
          }
        />
        {item.updatedAt && item.updatedAt !== item.createdAt && (
          <KV
            label={t("detail.field.updatedAt")}
            value={
              <span className="mono">
                {fmtDateTime.format(new Date(item.updatedAt))}
              </span>
            }
          />
        )}
      </div>

      {item.note && (
        <section className="note">
          <div className="label">{t("detail.field.note")}</div>
          <div className="note-body">
            <p>{item.note}</p>
            <button className="copy-btn" onClick={() => copyField(item.note)}>
              <Copy size={12} strokeWidth={1.5} /> {t("detail.copy")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="kv-row">
      <div className="kv-label mono">{label}</div>
      <div className="kv-value">{value}</div>
    </div>
  );
}
