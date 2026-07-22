// 数据 store：缓存 items / groups / categories / tags
// 变更采用「部分更新」：写入 DB 后只刷新受影响切片，避免每次操作都全量 refresh()
import { create } from 'zustand';
import { itemsRepo, groupsRepo, categoriesRepo, tagsRepo } from '@/lib/repos';

export const useCatalogStore = create((set) => ({
  items: [],
  groups: [],
  categories: [],
  tags: [],
  loaded: false,
  loading: false,

  refresh: async () => {
    set({ loading: true });
    const [items, groups, categories, tags] = await Promise.all([
      itemsRepo.list(),
      groupsRepo.list(),
      categoriesRepo.list(),
      tagsRepo.list(),
    ]);
    set({ items, groups, categories, tags, loaded: true, loading: false });
  },

  // 单切片刷新
  refreshSlice: async (slice) => {
    if (slice === 'items') {
      const items = await itemsRepo.list();
      set({ items, loaded: true });
    } else if (slice === 'groups') {
      const groups = await groupsRepo.list();
      set({ groups });
    } else if (slice === 'categories') {
      const categories = await categoriesRepo.list();
      set({ categories });
    } else if (slice === 'tags') {
      const tags = await tagsRepo.list();
      set({ tags });
    }
  },

  // Items
  addItem: async (data) => {
    const id = await itemsRepo.create(data);
    const items = await itemsRepo.list();
    set({ items, loaded: true });
    return id;
  },
  updateItem: async (id, patch) => {
    await itemsRepo.update(id, patch);
    // 单条 in-place 更新：避免全量 DB 读
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it,
      ),
    }));
  },
  removeItem: async (id) => {
    await itemsRepo.remove(id);
    set((s) => ({ items: s.items.filter((it) => it.id !== id) }));
  },

  // Groups
  addGroup: async (data) => {
    const id = await groupsRepo.create(data);
    set((s) => ({ groups: [...s.groups, { id, name: data.name, color: data.color || '', order: data.order || 0 }] }));
    return id;
  },
  updateGroup: async (id, patch) => {
    await groupsRepo.update(id, patch);
    set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  },
  removeGroup: async (id) => {
    await groupsRepo.remove(id);
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== id),
      items: s.items.map((it) => (it.groupId === id ? { ...it, groupId: '' } : it)),
    }));
  },

  // Categories
  addCategory: async (data) => {
    const id = await categoriesRepo.create(data);
    set((s) => ({ categories: [...s.categories, { id, name: data.name, color: data.color || '', order: data.order || 0 }] }));
    return id;
  },
  updateCategory: async (id, patch) => {
    await categoriesRepo.update(id, patch);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  },
  removeCategory: async (id) => {
    await categoriesRepo.remove(id);
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      items: s.items.map((it) => (it.categoryId === id ? { ...it, categoryId: '' } : it)),
    }));
  },

  // Tags
  addTag: async (data) => {
    const id = await tagsRepo.create(data);
    set((s) => ({ tags: [...s.tags, { id, name: data.name, color: data.color || '', order: data.order || 0 }] }));
    return id;
  },
  updateTag: async (id, patch) => {
    await tagsRepo.update(id, patch);
    set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  },
  removeTag: async (id) => {
    await tagsRepo.remove(id);
    set((s) => ({
      tags: s.tags.filter((t) => t.id !== id),
      items: s.items.map((it) =>
        Array.isArray(it.tagIds) && it.tagIds.includes(id)
          ? { ...it, tagIds: it.tagIds.filter((t) => t !== id) }
          : it,
      ),
    }));
  },
}));
