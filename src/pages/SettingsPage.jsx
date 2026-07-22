import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useCatalogStore } from '@/store/useCatalogStore';
import { clearAll, describePayload, exportDB, EXPORT_VERSION, importDB } from '@/lib/db';
import './SettingsPage.css';

export default function SettingsPage() {
  const themeMode = useThemeStore((s) => s.mode);
  const setTheme = useThemeStore((s) => s.set);
  const refresh = useCatalogStore((s) => s.refresh);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState('');

  const onExport = async () => {
    setBusy('正在导出…');
    try {
      const data = await exportDB();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `where-is-it-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy('');
    }
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let json;
    try {
      const text = await file.text();
      json = JSON.parse(text);
    } catch (_) {
      alert('导入失败：文件不是有效的 JSON');
      return;
    }

    // 解析并显示备份描述，按版本判断是否需要迁移或拒绝
    const desc = describePayload(json);
    const fmtV = typeof json?.formatVersion === 'number' ? json.formatVersion : null;
    let confirmHint = '导入将清空当前所有数据，确定继续？';
    if (desc) {
      const versionNote =
        fmtV == null
          ? '（未声明版本，将作为 v1 处理）'
          : fmtV < EXPORT_VERSION
          ? `（将自动从 v${fmtV} 迁移到 v${EXPORT_VERSION}）`
          : fmtV > EXPORT_VERSION
          ? ''
          : '';
      confirmHint = `备份来源：${desc.app} ${desc.version}${versionNote ? ' ' + versionNote : ''}\n` + confirmHint;
      if (fmtV != null && fmtV > EXPORT_VERSION) {
        alert(`无法导入：备份文件版本（v${fmtV}）高于当前应用支持版本（v${EXPORT_VERSION}）。请升级应用后重试。`);
        return;
      }
    }

    if (!window.confirm(confirmHint)) return;
    setBusy('正在导入…');
    try {
      await importDB(json);
      await refresh();
      alert('导入完成');
    } catch (err) {
      alert('导入失败：' + (err?.message || '未知错误'));
    } finally {
      setBusy('');
    }
  };

  const onClear = async () => {
    if (!window.confirm('将永久删除所有数据（物品、图片、分组等），不可恢复。继续？')) return;
    setBusy('正在清空…');
    try {
      await clearAll();
      await refresh();
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="settings">
      <header className="settings-head">
        <h2>设置</h2>
      </header>

      <section className="settings-block">
        <div className="settings-label">
          <h3>主题</h3>
          <p className="muted">切换亮色、暗色或跟随系统。</p>
        </div>
        <div className="segmented" role="radiogroup" aria-label="主题切换">
          {[
            { v: 'light', label: '亮色' },
            { v: 'dark', label: '暗色' },
            { v: 'system', label: '跟随系统' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={themeMode === o.v}
              className={`segmented-opt${themeMode === o.v ? ' on' : ''}`}
              onClick={() => setTheme(o.v)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <div className="settings-label">
          <h3>数据</h3>
          <p className="muted">导出为 JSON 文件以备份，或从备份恢复。</p>
        </div>
        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={onExport} disabled={!!busy}>
            <Download size={14} strokeWidth={1.5} /> &nbsp;导出 JSON
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={!!busy}>
            <Upload size={14} strokeWidth={1.5} /> &nbsp;导入 JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
          <button className="btn btn-danger" onClick={onClear} disabled={!!busy}>
            <Trash2 size={14} strokeWidth={1.5} /> &nbsp;清空全部
          </button>
        </div>
        {busy && <div className="muted mono" style={{ marginTop: 8 }}>{busy}</div>}
      </section>

      <section className="settings-block">
        <div className="settings-label">
          <h3>关于</h3>
        </div>
        <p className="mono subtle">Where is it · 本地优先的物品清单工具</p>
        <p className="mono subtle">数据完全保存在你的浏览器 IndexedDB 中，无云端、无追踪。</p>
      </section>
    </div>
  );
}
