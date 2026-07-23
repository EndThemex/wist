import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { useCatalogStore } from "@/store/useCatalogStore";
import { usePrefsStore } from "@/store/usePrefsStore";
import { blobsRepo, imagesRepo } from "@/lib/repos";
import { compressImage, compressImageToSize, formatBytes } from "@/lib/image";
import { uid } from "@/lib/id";
import { getDB } from "@/lib/db";
import Thumb from "@/components/Thumb.jsx";
import { useT } from "@/i18n";
import "./ItemEditPage.css";

const MAX_IMAGES = 5;

// 各可选分类默认折叠状态：第一次进入只显示名称 + 保存按钮
const DEFAULT_OPEN = {
  more: false,
  images: false,
  classify: false,
  tags: false,
  location: false,
  note: false,
};

export default function ItemEditPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = useT();
  // 用户希望创建/编辑完成后回到哪里，支持 ?from= 或 ?to= 显式指定（hash 路径），否则按模式决定
  const backOverride = searchParams.get("from") || searchParams.get("to");
  const item = useCatalogStore((s) => s.items.find((it) => it.id === id));
  const groups = useCatalogStore((s) => s.groups);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);
  const locations = useCatalogStore((s) => s.locations);
  const addItem = useCatalogStore((s) => s.addItem);
  const updateItem = useCatalogStore((s) => s.updateItem);
  const bumpLocationUsage = useCatalogStore((s) => s.bumpLocationUsage);

  const [name, setName] = useState(item?.name || "");
  const [model, setModel] = useState(item?.model || "");
  const [price, setPrice] = useState(item?.price ?? 0);
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const presetGroup = searchParams.get("group") || "";
  const [groupId, setGroupId] = useState(item?.groupId || presetGroup);
  const [categoryId, setCategoryId] = useState(item?.categoryId || "");
  const [tagIds, setTagIds] = useState(item?.tagIds || []);
  const [location, setLocation] = useState(item?.location || "");
  const [note, setNote] = useState(item?.note || "");
  const [imageIds, setImageIds] = useState(item?.imageIds || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 折叠状态：默认全折叠；用户首次点开再展开
  const [open, setOpen] = useState(DEFAULT_OPEN);

  const [tagInput, setTagInput] = useState("");

  const totalCount = imageIds.length;

  const goBack = () => {
    if (backOverride) navigate(backOverride);
    else if (mode === "edit") navigate(`/items/${id}`);
    else navigate("/");
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError(t("edit.error.nameRequired"));
      return;
    }
    setSaving(true);
    setError("");
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
      if (mode === "create") {
        const newId = uid("it");
        payload.id = newId;
        // 把挂起图片的 itemId 校正为 newId
        if (imageIds.length > 0) {
          const db = await getDB();
          const tx = db.transaction("images", "readwrite");
          for (const iid of imageIds) {
            const row = await tx.store.get(iid);
            if (row && row.itemId === "__pending__") {
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
      // 弱关联：把当时填写的 location 文本计入"常用位置"库（同名 +1，否则新建 useCount=1）
      // 仅做后台累计，不影响保存结果
      const trimmedLoc = String(payload.location || "").trim();
      if (trimmedLoc) {
        bumpLocationUsage(trimmedLoc).catch((err) =>
          console.error("常用位置累计失败", err),
        );
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || t("edit.error.saveFail"));
    } finally {
      setSaving(false);
    }
  };

  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const remain = MAX_IMAGES - imageIds.length;
    if (remain <= 0) return;
    const queue = files.slice(0, remain);
    const maxBytes =
      usePrefsStore.getState().maxImageBytes ||
      compressImageToSize.DEFAULT_MAX_BYTES;
    const newIds = [];
    let oversizeCount = 0;
    for (const file of queue) {
      try {
        // 超出限额的图自动按目标体积压缩到 ≤ maxBytes（库内部迭代降质量/降尺寸）
        const compressed =
          file.size > maxBytes
            ? await compressImageToSize(file, { maxSizeBytes: maxBytes })
            : await compressImage(file);
        if (file.size > maxBytes && compressed.size > maxBytes) {
          oversizeCount += 1; // 极端情况：再怎么压缩也压不到限额以下
        }
        const blobId = await blobsRepo.put(compressed);
        // 在新增模式下，最后保存时会写真正的 itemId；这里把 imageId 与 blobId 关联好但 itemId 可在保存时校正
        if (mode === "create") {
          // 占位
          const imageId = uid("img");
          const db = await getDB();
          await db.put("images", {
            id: imageId,
            itemId: "__pending__",
            blobId,
            order: imageIds.length + newIds.length,
          });
          newIds.push(imageId);
        } else {
          const imageId = await imagesRepo.add(
            id,
            blobId,
            imageIds.length + newIds.length,
          );
          newIds.push(imageId);
        }
      } catch (err) {
        console.error("图片处理失败", err);
      }
    }
    setImageIds((cur) => [...cur, ...newIds]);
    if (oversizeCount > 0) {
      setError(
        `有 ${oversizeCount} 张图压缩后仍超过 ${formatBytes(maxBytes)}，已尽量缩小保存`,
      );
    }
  };

  const removeImage = async (imageId) => {
    if (!window.confirm(t("edit.images.confirmRemove"))) return;
    await imagesRepo.remove(imageId);
    setImageIds((cur) => cur.filter((i) => i !== imageId));
  };

  const toggleTag = (tagId) => {
    setTagIds((cur) =>
      cur.includes(tagId) ? cur.filter((i) => i !== tagId) : [...cur, tagId],
    );
  };

  const addTagByName = async (name) => {
    const tagName = name.trim();
    if (!tagName) return;
    let tag = tags.find((x) => x.name.toLowerCase() === tagName.toLowerCase());
    if (!tag) {
      const newId = await useCatalogStore.getState().addTag({ name: tagName });
      tag = { id: newId, name: tagName };
    }
    setTagIds((cur) => (cur.includes(tag.id) ? cur : [...cur, tag.id]));
  };

  const onTagInputKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagByName(tagInput);
      setTagInput("");
    }
  };

  const suggestions = useMemo(() => {
    const kw = tagInput.trim().toLowerCase();
    if (!kw) return [];
    return tags.filter((tg) => tg.name.toLowerCase().includes(kw)).slice(0, 6);
  }, [tagInput, tags]);

  // 常用位置：按使用频次降序；去重同名；剔除当前已输入文本，避免冗余
  const locationSuggestions = useMemo(() => {
    const cur = location.trim().toLowerCase();
    const seen = new Set();
    return locations
      .filter(
        (l) =>
          l.name &&
          !seen.has(l.name.toLowerCase()) &&
          seen.add(l.name.toLowerCase()),
      )
      .sort((a, b) => {
        const ua = a.useCount || 0;
        const ub = b.useCount || 0;
        if (ub !== ua) return ub - ua;
        return (a.name || "").localeCompare(b.name || "");
      })
      .filter((l) => !cur || l.name.toLowerCase() !== cur)
      .slice(0, 12);
  }, [locations, location]);

  // 输入时模糊过滤联想（仅显示前 6 条，避免长列表）
  const locationMatch = useMemo(() => {
    const kw = location.trim().toLowerCase();
    if (!kw) return [];
    return locationSuggestions.filter((l) => l.name.toLowerCase().includes(kw));
  }, [locationSuggestions, location]);

  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  // 用于折叠头部徽标：显示已填写项的简短摘要
  const filledCounts = {
    images: imageIds.length,
    more: [model.trim(), price > 0 ? 1 : 0, quantity > 0 ? 1 : 0].filter(
      Boolean,
    ).length,
    classify: [groupId, categoryId].filter(Boolean).length,
    tags: tagIds.length,
    location: location.trim() ? 1 : 0,
    note: note.trim() ? 1 : 0,
  };

  return (
    <form className="edit" onSubmit={submit}>
      <div className="edit-head">
        <button
          type="button"
          className="icon-btn"
          onClick={goBack}
          aria-label={t("edit.back")}
          title={t("edit.back")}
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="icon-btn-label hide-mobile">{t("edit.back")}</span>
        </button>
        <h2 className="edit-title mono">
          {mode === "create"
            ? t("edit.heading.create")
            : t("edit.heading.edit")}
        </h2>
      </div>

      {error && <div className="form-error mono">{error}</div>}

      {/* 名称：唯一必填项，常驻展开 */}
      <section className="card-block card-block--primary">
        <div className="field">
          <label className="label" htmlFor="f-name">
            {t("edit.field.name")} *
          </label>
          <input
            id="f-name"
            className="input input--lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("edit.name.placeholder")}
            autoFocus
            required
          />
        </div>
      </section>

      {/* 图片：可折叠 */}
      <CollapsibleSection
        title={t("edit.section.images")}
        badge={`${totalCount}/${MAX_IMAGES}`}
        open={open.images}
        onToggle={() => toggle("images")}
      >
        <div className="image-grid">
          {imageIds.map((imageId) => (
            <ImageCell
              key={imageId}
              imageId={imageId}
              onRemove={() => removeImage(imageId)}
            />
          ))}
          {totalCount < MAX_IMAGES && (
            <label className="image-add">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPickImages}
                hidden
              />
              <ImagePlus size={20} strokeWidth={1.25} />
              <span className="mono">{t("edit.images.add")}</span>
            </label>
          )}
        </div>
      </CollapsibleSection>

      {/* 详细信息：型号 / 价格 / 数量 */}
      <CollapsibleSection
        title={t("edit.section.details")}
        badge={
          filledCounts.more
            ? t("edit.badge.countOf", { n: filledCounts.more })
            : t("edit.badge.empty")
        }
        open={open.more}
        onToggle={() => toggle("more")}
      >
        <div className="field">
          <label className="label" htmlFor="f-model">
            {t("edit.field.model")}
          </label>
          <input
            id="f-model"
            className="input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("edit.model.placeholder")}
          />
        </div>
        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor="f-price">
              {t("edit.field.price")} (¥)
            </label>
            <input
              id="f-price"
              type="number"
              step="0.01"
              min="0"
              className="input mono"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t("edit.price.placeholder")}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="f-qty">
              {t("edit.field.quantity")}
            </label>
            <input
              id="f-qty"
              type="number"
              step="1"
              min="0"
              className="input mono"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t("edit.qty.placeholder")}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* 分类 / 分组 */}
      <CollapsibleSection
        title={t("edit.section.classify")}
        badge={
          filledCounts.classify
            ? t("edit.badge.chosen", { n: filledCounts.classify })
            : t("edit.badge.empty")
        }
        open={open.classify}
        onToggle={() => toggle("classify")}
      >
        <div className="grid-2">
          <div className="field">
            <label className="label">{t("nav.groups")}</label>
            <select
              className="select"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">{t("edit.group.none")}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">{t("nav.categories")}</label>
            <select
              className="select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{t("edit.category.none")}</option>
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
        title={t("edit.section.tags")}
        badge={
          filledCounts.tags ? `${filledCounts.tags}` : t("edit.badge.empty")
        }
        open={open.tags}
        onToggle={() => toggle("tags")}
      >
        <div className="tag-input-row">
          {tagIds.length > 0 &&
            tagIds.map((tid) => {
              const tg = tags.find((x) => x.id === tid);
              if (!tg) return null;
              return (
                <span
                  key={tid}
                  className="tag chip-on"
                  onClick={() => toggleTag(tid)}
                  role="button"
                >
                  #{tg.name} <X size={11} strokeWidth={2} />
                </span>
              );
            })}
          <input
            className="input inline"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagInputKey}
            placeholder={t("edit.tag.placeholder")}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="tag-suggest">
            {suggestions.map((tg) => (
              <button
                type="button"
                key={tg.id}
                className="chip"
                onClick={() => addTagByName(tg.name)}
              >
                #{tg.name}
              </button>
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <div className="tag-suggest">
            {tags
              .filter((tg) => !tagIds.includes(tg.id))
              .slice(0, 12)
              .map((tg) => (
                <button
                  type="button"
                  key={tg.id}
                  className="chip"
                  onClick={() => addTagByName(tg.name)}
                >
                  + #{tg.name}
                </button>
              ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 位置 */}
      <CollapsibleSection
        title={t("edit.section.location")}
        badge={
          filledCounts.location ? t("edit.badge.filled") : t("edit.badge.empty")
        }
        open={open.location}
        onToggle={() => toggle("location")}
      >
        <div className="field">
          <input
            id="f-loc"
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("edit.location.placeholder")}
          />
        </div>
        {/* 联想：输入时实时模糊匹配已有位置 */}
        {locationMatch.length > 0 && (
          <div className="tag-suggest">
            {locationMatch.map((l) => (
              <button
                type="button"
                key={l.id}
                className="chip"
                onClick={() => setLocation(l.name)}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
        {/* 常用 chips：仅在输入为空时展示，避免与联想重复 */}
        {location.trim() === "" && locationSuggestions.length > 0 && (
          <div className="tag-suggest">
            {locationSuggestions.map((l) => (
              <button
                type="button"
                key={l.id}
                className="chip"
                onClick={() => setLocation(l.name)}
                title={`×${l.useCount || 0}`}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 备注 */}
      <CollapsibleSection
        title={t("edit.section.note")}
        badge={
          filledCounts.note ? t("edit.badge.filled") : t("edit.badge.empty")
        }
        open={open.note}
        onToggle={() => toggle("note")}
      >
        <div className="field">
          <textarea
            id="f-note"
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder={t("edit.note.placeholder")}
          />
        </div>
      </CollapsibleSection>

      {/* 占位：避免底部 sticky bar 遮挡最后一段内容 */}
      <div className="edit-bottom-spacer" aria-hidden />

      {/* 始终可见的保存栏：固定在视口底部，方便随时保存 */}
      <div className="save-bar" role="region" aria-label={t("edit.save")}>
        <button
          type="button"
          className="btn btn-ghost save-bar__cancel"
          onClick={goBack}
          disabled={saving}
        >
          {t("edit.cancel")}
        </button>
        <button
          type="submit"
          className="btn save-bar__save"
          disabled={saving || !name.trim()}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="spin" /> {t("edit.saving")}
            </>
          ) : (
            <>
              <Check size={16} strokeWidth={1.75} /> {t("edit.save")}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function CollapsibleSection({ title, badge, open, onToggle, children }) {
  return (
    <section className={`card-block collapsible${open ? " open" : ""}`}>
      <button
        type="button"
        className="collapsible-head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="collapsible-title">{title}</span>
        <span className="collapsible-badge mono subtle">{badge}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className="collapsible-caret"
          aria-hidden
        />
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}

function ImageCell({ imageId, onRemove }) {
  const t = useT();
  const [blobId, setBlobId] = useState(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await getDB();
      const row = await db.get("images", imageId);
      if (!row) return;
      setBlobId(row.blobId);
      const blob = await db.get("blobs", row.blobId);
      if (!cancelled && blob) setSize(blob.data.size);
    })();
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  return (
    <div className="image-cell">
      <Thumb blobId={blobId} className="image-cell-img" />
      <button
        type="button"
        className="image-remove"
        aria-label={t("common.delete")}
        onClick={onRemove}
      >
        <X size={14} strokeWidth={1.5} />
      </button>
      {size && (
        <div className="image-size mono subtle">{formatBytes(size)}</div>
      )}
    </div>
  );
}
