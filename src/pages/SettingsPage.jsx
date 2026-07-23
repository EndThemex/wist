import { useRef, useState } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";
import { useCatalogStore } from "@/store/useCatalogStore";
import {
  clearAll,
  describePayload,
  exportDB,
  EXPORT_VERSION,
  importDB,
} from "@/lib/db";
import { useT, useLocale, setLocale, SUPPORTED_LOCALES } from "@/i18n";
import "./SettingsPage.css";

export default function SettingsPage() {
  const themeMode = useThemeStore((s) => s.mode);
  const setTheme = useThemeStore((s) => s.set);
  const refresh = useCatalogStore((s) => s.refresh);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState("");
  const t = useT();
  const lang = useLocale();

  const onExport = async () => {
    setBusy(t("settings.data.exporting"));
    try {
      const data = await exportDB();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `where-is-it-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy("");
    }
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    let json;
    try {
      const text = await file.text();
      json = JSON.parse(text);
    } catch (_) {
      alert(t("settings.data.importNotJson"));
      return;
    }

    // 解析并显示备份描述，按版本判断是否需要迁移或拒绝
    const desc = describePayload(json);
    const fmtV =
      typeof json?.formatVersion === "number" ? json.formatVersion : null;
    let confirmHint =
      t("settings.data.confirmImport", { app: "?", ver: "?" }).split("\n")[1] ||
      "";
    if (desc) {
      const versionNote =
        fmtV == null
          ? t("settings.data.unknownVersion", { to: EXPORT_VERSION })
          : fmtV < EXPORT_VERSION
            ? t("settings.data.migrateFromV", {
                from: fmtV,
                to: EXPORT_VERSION,
              })
            : fmtV > EXPORT_VERSION
              ? ""
              : "";
      confirmHint =
        t("settings.data.confirmImport", { app: desc.app, ver: desc.version }) +
        (versionNote ? "\n" + versionNote : "");
      if (fmtV === 2) {
        confirmHint += "\n" + t("settings.data.v2ImageLoss");
      }
      if (fmtV != null && fmtV > EXPORT_VERSION) {
        alert(
          t("settings.data.versionTooNew", {
            found: fmtV,
            supported: EXPORT_VERSION,
          }),
        );
        return;
      }
    }

    if (!window.confirm(confirmHint)) return;
    setBusy(t("settings.data.importing"));
    try {
      await importDB(json);
      await refresh();
      alert(t("settings.data.importOk"));
    } catch (err) {
      alert(t("settings.data.importFail", { msg: err?.message || "" }));
    } finally {
      setBusy("");
    }
  };

  const onClear = async () => {
    if (!window.confirm(t("settings.data.clearConfirm"))) return;
    setBusy(t("settings.data.clearing"));
    try {
      await clearAll();
      await refresh();
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="settings">
      <header className="settings-head">
        <h2>{t("settings.title")}</h2>
      </header>

      <section className="settings-block">
        <div className="settings-label">
          <h3>{t("settings.section.theme")}</h3>
          <p className="muted">{t("settings.theme.hint")}</p>
        </div>
        <div
          className="segmented"
          role="radiogroup"
          aria-label={t("settings.section.theme")}
        >
          {[
            { v: "light", labelKey: "settings.theme.light" },
            { v: "dark", labelKey: "settings.theme.dark" },
            { v: "system", labelKey: "settings.theme.system" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={themeMode === o.v}
              className={`segmented-opt${themeMode === o.v ? " on" : ""}`}
              onClick={() => setTheme(o.v)}
            >
              {t(o.labelKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <div className="settings-label">
          <h3>{t("settings.section.lang")}</h3>
          <p className="muted">{t("settings.lang.hint")}</p>
        </div>
        <div
          className="segmented"
          role="radiogroup"
          aria-label={t("settings.section.lang")}
        >
          {SUPPORTED_LOCALES.map((o) => (
            <button
              key={o.code}
              type="button"
              role="radio"
              aria-checked={lang === o.code}
              className={`segmented-opt${lang === o.code ? " on" : ""}`}
              onClick={() => setLocale(o.code)}
            >
              {t(o.labelKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-block">
        <div className="settings-label">
          <h3>{t("settings.section.data")}</h3>
          <p className="muted">{t("settings.data.hint")}</p>
        </div>
        <div className="settings-actions">
          <button
            className="btn btn-ghost"
            onClick={onExport}
            disabled={!!busy}
          >
            <Download size={14} strokeWidth={1.5} /> &nbsp;
            {t("settings.data.export")}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => fileRef.current?.click()}
            disabled={!!busy}
          >
            <Upload size={14} strokeWidth={1.5} /> &nbsp;
            {t("settings.data.import")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={onImport}
          />
          <button
            className="btn btn-danger"
            onClick={onClear}
            disabled={!!busy}
          >
            <Trash2 size={14} strokeWidth={1.5} /> &nbsp;
            {t("settings.data.clear")}
          </button>
        </div>
        {busy && (
          <div className="muted mono" style={{ marginTop: 8 }}>
            {busy}
          </div>
        )}
      </section>

      <section className="settings-block">
        <div className="settings-label">
          <h3>{t("settings.section.about")}</h3>
        </div>
        <p className="mono subtle">{t("settings.about.line1")}</p>
        <p className="mono subtle">{t("settings.about.line2")}</p>
      </section>
    </div>
  );
}
