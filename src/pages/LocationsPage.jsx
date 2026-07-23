import { useMemo } from "react";
import ManagePage from "@/pages/ManagePage.jsx";
import { useCatalogStore } from "@/store/useCatalogStore";

// 常用位置管理：与 items 弱关联（删除/重命名不影响物品已记录的 location 文本）。
// 列表默认按使用频次降序，使用越多的位置排在越前。
export default function LocationsPage() {
  const locations = useCatalogStore((s) => s.locations);
  const addLocation = useCatalogStore((s) => s.addLocation);
  const updateLocation = useCatalogStore((s) => s.updateLocation);
  const removeLocation = useCatalogStore((s) => s.removeLocation);

  const sorted = useMemo(
    () =>
      [...locations].sort((a, b) => {
        const ua = a.useCount || 0;
        const ub = b.useCount || 0;
        if (ub !== ua) return ub - ua;
        return (a.name || "").localeCompare(b.name || "");
      }),
    [locations],
  );

  return (
    <ManagePage
      titleKey="nav.locations"
      hintKey="manage.locations.hint"
      emptyTitleKey="manage.empty"
      typeKey="nav.locations"
      items={sorted}
      fields={["name"]}
      onAdd={(d) => addLocation(d)}
      onUpdate={(id, patch) => updateLocation(id, patch)}
      onRemove={(id) => removeLocation(id)}
      renderCount={(l) => l.useCount || 0}
    />
  );
}