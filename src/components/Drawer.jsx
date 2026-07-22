// 抽屉组件（从左侧滑出）
import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Drawer.css';

export default function Drawer({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  return (
    <div className={`drawer-root${open ? ' open' : ''}`} aria-hidden={!open}>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer-panel" role="dialog" aria-label={title || '抽屉'}>
        <header className="drawer-head">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="关闭">
            <X size={18} strokeWidth={1.5} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
