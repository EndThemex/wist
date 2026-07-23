import ManagePage from "@/pages/ManagePage.jsx";
import { useCatalogStore } from "@/store/useCatalogStore";

export default function CategoriesPage() {
  const categories = useCatalogStore((s) => s.categories);
  const items = useCatalogStore((s) => s.items);
  const addCategory = useCatalogStore((s) => s.addCategory);
  const updateCategory = useCatalogStore((s) => s.updateCategory);
  const removeCategory = useCatalogStore((s) => s.removeCategory);

  return (
    <ManagePage
      titleKey="nav.categories"
      hintKey="manage.categories.hint"
      emptyTitleKey="manage.empty"
      typeKey="nav.categories"
      items={categories}
      fields={["name"]}
      onAdd={(d) => addCategory(d)}
      onUpdate={(id, patch) => updateCategory(id, patch)}
      onRemove={(id) => removeCategory(id)}
      renderCount={(c) => items.filter((it) => it.categoryId === c.id).length}
    />
  );
}
