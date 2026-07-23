// 空状态
import { Inbox } from "lucide-react";
import { useT } from "@/i18n";

export default function Empty({
  icon: Icon = Inbox,
  title, // i18n key or raw string; if omitted, falls back to common.empty
  hint,
  action,
}) {
  const t = useT();
  return (
    <div className="empty">
      <Icon size={28} strokeWidth={1.25} />
      <h3 style={{ marginTop: 12 }}>{t(title || "common.empty")}</h3>
      {hint && (
        <p className="muted" style={{ marginTop: 4 }}>
          {hint}
        </p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
