import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, MapPin, Copy } from 'lucide-react';
import { useCatalogStore } from '@/store/useCatalogStore';
import Carousel from '@/components/Carousel.jsx';
import { editItemLink } from '@/lib/url';
import './ItemDetailPage.css';

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backOverride = searchParams.get('from') || searchParams.get('to');
  const item = useCatalogStore((s) => s.items.find((it) => it.id === id));
  const groups = useCatalogStore((s) => s.groups);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);
  const removeItem = useCatalogStore((s) => s.removeItem);

  const group = useMemo(() => groups.find((g) => g.id === item?.groupId), [groups, item]);
  const category = useMemo(() => categories.find((c) => c.id === item?.categoryId), [categories, item]);
  const itemTags = useMemo(
    () => (item?.tagIds || []).map((tid) => tags.find((t) => t.id === tid)).filter(Boolean),
    [item, tags]
  );

  if (!item) {
    return (
      <div className="detail-empty">
        <p>未找到该物品</p>
        <Link to="/" className="btn-ghost btn">返回列表</Link>
      </div>
    );
  }

  const onDelete = async () => {
    if (!window.confirm(`删除「${item.name}」?`)) return;
    await removeItem(item.id);
    if (backOverride) navigate(backOverride);
    else navigate('/');
  };

  const copyField = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text ?? ''));
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
          aria-label="返回"
          title="返回"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="icon-btn-label">返回</span>
        </button>
        <div className="spacer" />
        <div className="detail-actions" role="toolbar" aria-label="物品操作">
          <Link to={editItemLink(item.id)} className="icon-btn" title="编辑">
            <Pencil size={18} strokeWidth={1.5} />
            <span className="icon-btn-label">编辑</span>
          </Link>
          <button
            type="button"
            className="icon-btn icon-btn-danger"
            onClick={onDelete}
            title="删除"
            aria-label="删除"
          >
            <Trash2 size={18} strokeWidth={1.5} />
            <span className="icon-btn-label">删除</span>
          </button>
        </div>
      </div>

      <Carousel imageIds={item.imageIds || []} />

      <h1 className="detail-title">{item.name}</h1>
      {item.model && <div className="muted detail-model">{item.model}</div>}

      <div className="kv">
        <KV label="价格" value={<span className="mono">¥ {(item.price || 0).toFixed(2)}</span>} />
        <KV label="数量" value={<span className="mono">{item.quantity}</span>} />
        {group && <KV label="分组" value={group.name} />}
        {category && <KV label="分类" value={category.name} />}
        {item.location && (
          <KV
            label="位置"
            value={
              <span className="row" style={{ gap: 6 }}>
                <MapPin size={14} strokeWidth={1.5} /> {item.location}
              </span>
            }
          />
        )}
        {itemTags.length > 0 && (
          <KV
            label="标签"
            value={
              <span className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {itemTags.map((t) => (
                  <span key={t.id} className="tag">#{t.name}</span>
                ))}
              </span>
            }
          />
        )}
        <KV
          label="添加时间"
          value={<span className="mono">{new Date(item.createdAt).toLocaleString('zh-CN')}</span>}
        />
        {item.updatedAt && item.updatedAt !== item.createdAt && (
          <KV
            label="更新时间"
            value={<span className="mono">{new Date(item.updatedAt).toLocaleString('zh-CN')}</span>}
          />
        )}
      </div>

      {item.note && (
        <section className="note">
          <div className="label">备注</div>
          <div className="note-body">
            <p>{item.note}</p>
            <button className="copy-btn" onClick={() => copyField(item.note)}>
              <Copy size={12} strokeWidth={1.5} /> 复制
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
