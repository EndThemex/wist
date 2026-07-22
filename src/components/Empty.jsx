// 空状态
import { Inbox } from 'lucide-react';

export default function Empty({ icon: Icon = Inbox, title = '暂无数据', hint, action }) {
  return (
    <div className="empty">
      <Icon size={28} strokeWidth={1.25} />
      <h3 style={{ marginTop: 12 }}>{title}</h3>
      {hint && <p className="muted" style={{ marginTop: 4 }}>{hint}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
