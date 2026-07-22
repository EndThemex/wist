import ManagePage from '@/pages/ManagePage.jsx';
import { useCatalogStore } from '@/store/useCatalogStore';

export default function TagsPage() {
  const tags = useCatalogStore((s) => s.tags);
  const items = useCatalogStore((s) => s.items);
  const addTag = useCatalogStore((s) => s.addTag);
  const updateTag = useCatalogStore((s) => s.updateTag);
  const removeTag = useCatalogStore((s) => s.removeTag);

  return (
    <ManagePage
      title="标签"
      hint="标签是细粒度的标记，多个物品可共用，例如「易碎」「借出中」。"
      items={tags}
      fields={['name']}
      onAdd={(d) => addTag(d)}
      onUpdate={(id, patch) => updateTag(id, patch)}
      onRemove={(id) => removeTag(id)}
      renderCount={(t) => items.filter((it) => (it.tagIds || []).includes(t.id)).length}
    />
  );
}
