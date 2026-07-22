// 通用：管理分组/分类/标签三页共用结构
import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Empty from '@/components/Empty.jsx';
import './ManagePage.css';

export default function ManagePage({
  title,
  hint,
  items,
  fields, // ['name'] 或 ['name', 'color']
  onAdd,
  onUpdate,
  onRemove,
  renderCount,
  linkTo,
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(() => fields.reduce((a, f) => ({ ...a, [f]: '' }), {}));
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const startAdd = () => {
    setAdding(true);
    setDraft(fields.reduce((a, f) => ({ ...a, [f]: '' }), {}));
  };
  const submitAdd = async () => {
    const clean = sanitize(draft);
    if (!clean.name) return;
    await onAdd(clean);
    setAdding(false);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditDraft(fields.reduce((a, f) => ({ ...a, [f]: row[f] ?? '' }), {}));
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
          <h2 className="manage-title">{title}</h2>
          {hint && <div className="muted" style={{ fontSize: 13 }}>{hint}</div>}
        </div>
        {!adding && (
          <button type="button" className="btn" onClick={startAdd}>
            <Plus size={14} strokeWidth={1.75} /> &nbsp;新增
          </button>
        )}
      </header>

      {adding && (
        <div className="manage-edit-row">
          {fields.includes('name') && (
            <input
              className="input"
              autoFocus
              placeholder="名称"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
            />
          )}
          {fields.includes('color') && (
            <input
              className="input mono"
              placeholder="#000000"
              value={draft.color}
              onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              maxLength={9}
            />
          )}
          <div className="row">
            <button type="button" className="btn-icon" onClick={submitAdd} aria-label="保存">
              <Check size={16} strokeWidth={1.5} />
            </button>
            <button type="button" className="btn-icon" onClick={() => setAdding(false)} aria-label="取消">
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding ? (
        <Empty title="还没有内容" hint={`点击右上角「新增」开始管理${title}`} />
      ) : (
        <ul className="manage-list">
          {items.map((row) =>
            editingId === row.id ? (
              <li key={row.id} className="manage-edit-row">
                {fields.includes('name') && (
                  <input
                    className="input"
                    autoFocus
                    value={editDraft.name}
                    onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                  />
                )}
                {fields.includes('color') && (
                  <input
                    className="input mono"
                    value={editDraft.color}
                    onChange={(e) => setEditDraft({ ...editDraft, color: e.target.value })}
                  />
                )}
                <div className="row">
                  <button type="button" className="btn-icon" onClick={submitEdit} aria-label="保存">
                    <Check size={16} strokeWidth={1.5} />
                  </button>
                  <button type="button" className="btn-icon" onClick={() => setEditingId(null)} aria-label="取消">
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            ) : (
              <li key={row.id} className="manage-row">
                <Link to={linkTo || '/'} className="manage-name ellipsis-1">
                  {fields.includes('color') && row.color && (
                    <span className="dot" style={{ background: row.color }} aria-hidden />
                  )}
                  {row.name}
                </Link>
                {typeof renderCount === 'function' && (
                  <span className="mono subtle">{renderCount(row)}</span>
                )}
                <div className="row">
                  <button type="button" className="btn-icon" aria-label="编辑" onClick={() => startEdit(row)}>
                    <Pencil size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-danger-icon"
                    aria-label="删除"
                    onClick={async () => {
                      if (!window.confirm(`删除「${row.name}」?`)) return;
                      await onRemove(row.id);
                    }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function sanitize(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = v.trim();
    else out[k] = v;
  }
  return out;
}
