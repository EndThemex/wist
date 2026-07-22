// 多选下拉组件
// props:
// - value: 已选 id 数组
// - onChange: (nextIds) => void
// - options: [{ id, name, hint? }]   （hint 可选，用于显示数字副文本）
// - placeholder: 占位文字（未选择时）
// - allLabel: 全部可选项（如果不存在则不显示）
// - prefix: 前缀字符（如 #）
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './MultiSelect.css';

export default function MultiSelect({
  value = [],
  onChange,
  options = [],
  placeholder = '全部',
  allLabel = '全部',
  prefix = '',
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const toggle = (id) => {
    const set = new Set(value);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange(Array.from(set));
  };

  const clearAll = () => onChange([]);

  const selectedCount = value.length;
  const label = selectedCount === 0
    ? placeholder
    : selectedCount === 1
      ? `${prefix}${options.find((o) => o.id === value[0])?.name || ''}`
      : `已选 ${selectedCount} 项`;

  return (
    <div className={`ms${open ? ' open' : ''}${selectedCount > 0 ? ' has-value' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="ms-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder}
      >
        <span className="ms-trigger-label ellipsis-1">{label}</span>
        <ChevronDown size={14} strokeWidth={1.5} className="ms-trigger-caret" />
      </button>
      {open && (
        <div className="ms-panel" role="listbox" aria-multiselectable>
          <button
            type="button"
            className={`ms-item ms-all${selectedCount === 0 ? ' on' : ''}`}
            onClick={clearAll}
            role="option"
            aria-selected={selectedCount === 0}
          >
            <span className="ms-item-check" aria-hidden>
              {selectedCount === 0 && <Check size={12} strokeWidth={2} />}
            </span>
            <span className="ms-item-name">{allLabel}</span>
          </button>
          {options.length === 0 && (
            <div className="ms-empty">暂无选项</div>
          )}
          {options.map((opt) => {
            const checked = value.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className={`ms-item${checked ? ' on' : ''}`}
                onClick={() => toggle(opt.id)}
                role="option"
                aria-selected={checked}
              >
                <span className="ms-item-check" aria-hidden>
                  {checked && <Check size={12} strokeWidth={2} />}
                </span>
                <span className="ms-item-name ellipsis-1">{prefix}{opt.name}</span>
                {opt.hint != null && <span className="ms-item-hint mono">{opt.hint}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
