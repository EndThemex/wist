import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useCatalogStore } from '@/store/useCatalogStore';
import { blobsRepo, imagesRepo } from '@/lib/repos';
import { compressImage, formatBytes } from '@/lib/image';
import { uid } from '@/lib/id';
import { getDB } from '@/lib/db';
import Thumb from '@/components/Thumb.jsx';
import './ItemEditPage.css';

const MAX_IMAGES = 5;

// 各可选分类默认折叠状态：第一次进入只显示名称 + 保存按钮
const DEFAULT_OPEN = { more: false, images: false, classify: false, tags: false, location: false, note: false };

export default function ItemEditPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 用户希望创建/编辑完成后回到哪里，支持 ?from= 或 ?to= 显式指定（hash 路径），否则按模式决定
  const backOverride = searchParams.get('from') || searchParams.get('to');
  const item = useCatalogStore((s) => s.items.find((it) => it.id === id));
  const groups = useCatalogStore((s) => s.groups);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);
  const addItem = useCatalogStore((s) => s.addItem);
  const updateItem = useCatalogStore((s) => s.updateItem);

  const [name, setName] = useState(item?.name || '');
  const [model, setModel] = useState(item?.model || '');
  const [price, setPrice] = useState(item?.price ?? 0);
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const presetGroup = searchParams.get('group') || '';
  const [groupId, setGroupId] = useState(item?.groupId || presetGroup);
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');
  const [tagIds, setTagIds] = useState(item?.tagIds || []);
  const [location, setLocation] = useState(item?.location || '');
  const [note, setNote] = useState(item?.note || '');
  const [imageIds, setImageIds] = useState(item?.imageIds || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 折叠状态：默认全折叠；用户首次点开再展开
  const [open, setOpen] = useState(DEFAULT_OPEN);

  const [imageMeta, setImageMeta] = useState([]); // [{id, blobId, size, width, height}]
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    // 编辑模式下加载已有图片的 blob 与尺寸
    let cancelled = false;
    (async () => {
      const result = [];
      for (const imageId of imageIds) {
        const row = await getDB().then((db) => db.get('images', imageId));
        if (!row) continue;
        const blob = await getDB().then((db) => db.get('blobs', row.blobId));
        if (!blob) continue;
        const url = URL.createObjectURL(blob.data);
        const dim = await getDimensions(url);
        URL.revokeObjectURL(url);
        result.push({ id: imageId, blobId: row.blobId, size: blob.data.size });
      }
      if (!cancelled) setImageMeta(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [imageIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCount = imageIds.length;

  const goBack = () => {
    if (backOverride) navigate(backOverride);
    else if (mode === 'edit') navigate(`/items/${id}`);
    else navigate('/');
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('名称不能为空');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        model: model.trim(),
        price: Number(price) || 0,
        quantity: parseInt(quantity, 10) || 0,
        groupId,
        categoryId,
        tagIds,
        location: location.trim(),
        note: note.trim(),
        imageIds,
      };
      if (mode === 'create') {
        const newId = uid('it');
        payload.id = newId;
        // 把挂起图片的 itemId 校正为 newId
        if (imageIds.length > 0) {
          const db = await getDB();
          const tx = db.transaction('images', 'readwrite');
          for (const iid of imageIds) {
            const row = await tx.store.get(iid);
            if (row && row.itemId === '__pending__') {
              await tx.store.put({ ...row, itemId: newId });
            }
          }
          await tx.done;
        }
        await addItem(payload);
        // 默认跳到新物品详情；如带 ?from=/items?q=... 则回到原列表以保留筛选状态
        if (backOverride) navigate(backOverride);
        else navigate(`/items/${newId}`);
      } else {
        await updateItem(id, payload);
        if (backOverride) navigate(backOverride);
        else navigate(`/items/${id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const remain = MAX_IMAGES - imageIds.length;
    if (remain <= 0) return;
    const queue = files.slice(0, remain);
    const newIds = [];
    for (const file of queue) {
      try {
        const compressed = await compressImage(file);
        const blobId = await blobsRepo.put(compressed);
        // 在新增模式下，最后保存时会写真正的 itemId；这里把 imageId 与 blobId 关联好但 itemId 可在保存时校正
        if (mode === 'create') {
          // 占位
          const imageId = uid('img');
          const db = await getDB();
          await db.put('images', { id: imageId, itemId: '__pending__', blobId, order: imageIds.length + newIds.length });
          newIds.push(imageId);
        } else {
          const imageId = await imagesRepo.add(id, blobId, imageIds.length + newIds.length);
          newIds.push(imageId);
        }
      } catch (err) {
        console.error('图片处理失败', err);
      }
    }
    setImageIds((cur) => [...cur, ...newIds]);
  };

  const removeImage = async (imageId) => {
    if (!window.confirm('删除这张图片？')) return;
    await imagesRepo.remove(imageId);
    setImageIds((cur) => cur.filter((i) => i !== imageId));
  };

  const toggleTag = (tagId) => {
    setTagIds((cur) => (cur.includes(tagId) ? cur.filter((i) => i !== tagId) : [...cur, tagId]));
  };

  const addTagByName = async (name) => {
    const t = name.trim();
    if (!t) return;
    let tag = tags.find((x) => x.name.toLowerCase() === t.toLowerCase());
    if (!tag) {
      const newId = await useCatalogStore.getState().addTag({ name: t });
      tag = { id: newId, name: t };
    }
    setTagIds((cur) => (cur.includes(tag.id) ? cur : [...cur, tag.id]));
  };

  const onTagInputKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagByName(tagInput);
      setTagInput('');
    }
  };

  const suggestions = useMemo(() => {
    const kw = tagInput.trim().toLowerCase();
    if (!kw) return [];
    return tags.filter((t) => t.name.toLowerCase().includes(kw)).slice(0, 6);
  }, [tagInput, tags]);

  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  // 用于折叠头部徽标：显示已填写项的简短摘要
  const filledCounts = {
    images: imageIds.length,
    more: [model.trim(), price > 0 ? 1 : 0, quantity > 0 ? 1 : 0].filter(Boolean).length,
    classify: [groupId, categoryId].filter(Boolean).length,
    tags: tagIds.length,
    location: location.trim() ? 1 : 0,
    note: note.trim() ? 1 : 0,
  };

  return (
    <form className="edit" onSubmit={submit}>
      <div className="edit-head">
        <button type="button" className="icon-btn" onClick={goBack} aria-label="返回" title="返回">
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="icon-btn-label hide-mobile">返回</span>
        </button>
        <h2 className="edit-title mono">
          {mode === 'create' ? 'NEW · 新增物品' : 'EDIT · 编辑物品'}
        </h2>
      </div>

      {error && <div className="form-error mono">{error}</div>}

      {/* 名称：唯一必填项，常驻展开 */}
      <section className="card-block card-block--primary">
        <div className="field">
          <label className="label" htmlFor="f-name">名称 *</label>
          <input
            id="f-name"
            className="input input--lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="起个名字开始记录…"
            autoFocus
            required
          />
        </div>
      </section>

      {/* 图片：可折叠 */}
      <CollapsibleSection
        title="图片"
        badge={`${totalCount}/${MAX_IMAGES}`}
        open={open.images}
        onToggle={() => toggle('images')}
      >
        <div className="image-grid">
          {imageIds.map((imageId) => (
            <ImageCell key={imageId} imageId={imageId} onRemove={() => removeImage(imageId)} />
          ))}
          {totalCount < MAX_IMAGES && (
            <label className="image-add">
              <input type="file" accept="image/*" multiple onChange={onPickImages} hidden />
              <ImagePlus size={20} strokeWidth={1.25} />
              <span className="mono">添加图片</span>
            </label>
          )}
        </div>
      </CollapsibleSection>

      {/* 详细信息：型号 / 价格 / 数量 */}
      <CollapsibleSection
        title="详细信息"
        badge={filledCounts.more ? `${filledCounts.more} 项` : '可空'}
        open={open.more}
        onToggle={() => toggle('more')}
      >
        <div className="field">
          <label className="label" htmlFor="f-model">型号</label>
          <input
            id="f-model"
            className="input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="例如：EF 50mm f/1.8 STM"
          />
        </div>
        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor="f-price">价格 (¥)</label>
            <input
              id="f-price"
              type="number"
              step="0.01"
              min="0"
              className="input mono"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="f-qty">数量</label>
            <input
              id="f-qty"
              type="number"
              step="1"
              min="0"
              className="input mono"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 分类 / 分组 */}
      <CollapsibleSection
        title="分类与分组"
        badge={filledCounts.classify ? `已选 ${filledCounts.classify}` : '可空'}
        open={open.classify}
        onToggle={() => toggle('classify')}
      >
        <div className="grid-2">
          <div className="field">
            <label className="label">分组</label>
            <select className="select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">无</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">分类</label>
            <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">无</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* 标签 */}
      <CollapsibleSection
        title="标签"
        badge={filledCounts.tags ? `${filledCounts.tags}` : '可空'}
        open={open.tags}
        onToggle={() => toggle('tags')}
      >
        <div className="tag-input-row">
          {tagIds.length > 0 &&
            tagIds.map((tid) => {
              const t = tags.find((x) => x.id === tid);
              if (!t) return null;
              return (
                <span key={tid} className="tag chip-on" onClick={() => toggleTag(tid)} role="button">
                  #{t.name} <X size={11} strokeWidth={2} />
                </span>
              );
            })}
          <input
            className="input inline"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagInputKey}
            placeholder="输入标签名后回车"
          />
        </div>
        {suggestions.length > 0 && (
          <div className="tag-suggest">
            {suggestions.map((t) => (
              <button type="button" key={t.id} className="chip" onClick={() => addTagByName(t.name)}>
                #{t.name}
              </button>
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <div className="tag-suggest">
            {tags
              .filter((t) => !tagIds.includes(t.id))
              .slice(0, 12)
              .map((t) => (
                <button type="button" key={t.id} className="chip" onClick={() => addTagByName(t.name)}>
                  + #{t.name}
                </button>
              ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 位置 */}
      <CollapsibleSection
        title="存放位置"
        badge={filledCounts.location ? '已填' : '可空'}
        open={open.location}
        onToggle={() => toggle('location')}
      >
        <div className="field">
          <input
            id="f-loc"
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例如：客厅第二个抽屉"
          />
        </div>
      </CollapsibleSection>

      {/* 备注 */}
      <CollapsibleSection
        title="备注"
        badge={filledCounts.note ? '已填' : '可空'}
        open={open.note}
        onToggle={() => toggle('note')}
      >
        <div className="field">
          <textarea
            id="f-note"
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="任何附加信息，例如购买渠道、保修期…"
          />
        </div>
      </CollapsibleSection>

      {/* 占位：避免底部 sticky bar 遮挡最后一段内容 */}
      <div className="edit-bottom-spacer" aria-hidden />

      {/* 始终可见的保存栏：固定在视口底部，方便随时保存 */}
      <div className="save-bar" role="region" aria-label="保存操作">
        <button type="button" className="btn btn-ghost save-bar__cancel" onClick={goBack} disabled={saving}>
          取消
        </button>
        <button type="submit" className="btn save-bar__save" disabled={saving || !name.trim()}>
          {saving ? (
            <>
              <Loader2 size={16} className="spin" /> 保存中…
            </>
          ) : (
            <>
              <Check size={16} strokeWidth={1.75} /> 保存
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function CollapsibleSection({ title, badge, open, onToggle, children }) {
  return (
    <section className={`card-block collapsible${open ? ' open' : ''}`}>
      <button
        type="button"
        className="collapsible-head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="collapsible-title">{title}</span>
        <span className="collapsible-badge mono subtle">{badge}</span>
        <ChevronDown size={16} strokeWidth={1.5} className="collapsible-caret" aria-hidden />
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}

function getDimensions(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

function ImageCell({ imageId, onRemove }) {
  const [blobId, setBlobId] = useState(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await getDB();
      const row = await db.get('images', imageId);
      if (!row) return;
      setBlobId(row.blobId);
      const blob = await db.get('blobs', row.blobId);
      if (!cancelled && blob) setSize(blob.data.size);
    })();
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  return (
    <div className="image-cell">
      <Thumb blobId={blobId} className="image-cell-img" />
      <button type="button" className="image-remove" aria-label="删除" onClick={onRemove}>
        <X size={14} strokeWidth={1.5} />
      </button>
      {size && <div className="image-size mono subtle">{formatBytes(size)}</div>}
    </div>
  );
}
