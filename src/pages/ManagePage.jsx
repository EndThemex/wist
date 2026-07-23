// 通用：管理分组/分类/标签三页共用结构
// 通过 i18n key 注入文案，避免硬编码中文
import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import Empty from "@/components/Empty.jsx";
import { useT } from "@/i18n";
import "./ManagePage.css";

export default function ManagePage({
  titleKey, // i18n key，例：'nav.groups'
  hintKey, // 可选
  emptyTitleKey, // 例：'manage.empty'
  emptyHintParams, // 例：{ type: 'groups' }
  typeKey, // 例：'groups' / 'categories' / 'tags'
  items,
  fields, // ['name'] 或 ['name', 'color']
  onAdd,
  onUpdate,
  onRemove,
  renderCount,
  linkTo,
}) {
  const t = useT();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(() =>
    fields.reduce((a, f) => ({ ...a, [f]: "" }), {}),
  );
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const startAdd = () => {
    setAdding(true);
    setDraft(fields.reduce((a, f) => ({ ...a, [f]: "" }), {}));
  };
  const submitAdd = async () => {
    const clean = sanitize(draft);
    if (!clean.name) return;
    await onAdd(clean);
    setAdding(false);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditDraft(fields.reduce((a, f) => ({ ...a, [f]: row[f] ?? "" }), {}));
  };

  const submitEdit = async () => {
    const clean = sanitize(editDraft);
    if (!clean.name) return;
    await onUpdate(editingId, clean);
    setEditingId(null);
  };

  return (
    <div className="manage">
      <header className="manage-head">
        <div>
          <h2 className="manage-title">{t(titleKey)}</h2>
          {hintKey && (
            <div className="muted" style={{ fontSize: 13 }}>
              {t(hintKey)}
            </div>
          )}
        </div>
        {!adding && (
          <button type="button" className="btn" onClick={startAdd}>
            <Plus size={14} strokeWidth={1.75} /> &nbsp;{t("manage.add")}
          </button>
        )}
      </header>

      {adding && (
        <div className="manage-edit-row">
          {fields.includes("name") && (
            <input
              className="input"
              autoFocus
              placeholder={t("manage.name.placeholder")}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
            />
          )}
          {fields.includes("color") && (
            <input
              className="input mono"
              placeholder="#000000"
              value={draft.color}
              onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              maxLength={9}
            />
          )}
          <div className="row">
            <button
              type="button"
              className="btn-icon"
              onClick={submitAdd}
              aria-label={t("common.save")}
            >
              <Check size={16} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setAdding(false)}
              aria-label={t("common.cancel")}
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding ? (
        <Empty
          title={
            emptyTitleKey ? t(emptyTitleKey, { type: t(typeKey) }) : undefined
          }
        />
      ) : (
        <ul className="manage-list">
          {items.map((row) =>
            editingId === row.id ? (
              <li key={row.id} className="manage-edit-row">
                {fields.includes("name") && (
                  <input
                    className="input"
                    autoFocus
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, name: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && submitEdit()}
                  />
                )}
                {fields.includes("color") && (
                  <input
                    className="input mono"
                    value={editDraft.color}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, color: e.target.value })
                    }
                  />
                )}
                <div className="row">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={submitEdit}
                    aria-label={t("common.save")}
                  >
                    <Check size={16} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setEditingId(null)}
                    aria-label={t("common.cancel")}
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            ) : (
              <li key={row.id} className="manage-row">
                <Link to={linkTo || "/"} className="manage-name ellipsis-1">
                  {fields.includes("color") && row.color && (
                    <span
                      className="dot"
                      style={{ background: row.color }}
                      aria-hidden
                    />
                  )}
                  {row.name}
                </Link>
                {typeof renderCount === "function" && (
                  <span className="mono subtle">{renderCount(row)}</span>
                )}
                <div className="row">
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={t("common.edit")}
                    onClick={() => startEdit(row)}
                  >
                    <Pencil size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-danger-icon"
                    aria-label={t("common.delete")}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          t("manage.delete.confirm", { name: row.name }),
                        )
                      )
                        return;
                      await onRemove(row.id);
                    }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function sanitize(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") out[k] = v.trim();
    else out[k] = v;
  }
  return out;
}
