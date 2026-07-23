import ManagePage from "@/pages/ManagePage.jsx";
import { useCatalogStore } from "@/store/useCatalogStore";

export default function TagsPage() {
  const tags = useCatalogStore((s) => s.tags);
  const items = useCatalogStore((s) => s.items);
  const addTag = useCatalogStore((s) => s.addTag);
  const updateTag = useCatalogStore((s) => s.updateTag);
  const removeTag = useCatalogStore((s) => s.removeTag);

  return (
    <ManagePage
      titleKey="nav.tags"
      hintKey="manage.tags.hint"
      emptyTitleKey="manage.empty"
      typeKey="nav.tags"
      items={tags}
      fields={["name"]}
      onAdd={(d) => addTag(d)}
      onUpdate={(id, patch) => updateTag(id, patch)}
      onRemove={(id) => removeTag(id)}
      renderCount={(tg) =>
        items.filter((it) => (it.tagIds || []).includes(tg.id)).length
      }
    />
  );
}
