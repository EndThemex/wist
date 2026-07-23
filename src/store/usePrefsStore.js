// 用户 UI 偏好 store（持久化到 localStorage）
import { create } from "zustand";
import { loadPrefs, savePrefs } from "@/lib/prefs";

const initial = loadPrefs();

function toArr(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (v === "" || v == null) return [];
  return [v];
}

export const usePrefsStore = create((set) => ({
  ...initial,
  setView: (view) => {
    set({ view });
    savePrefs({ view });
  },
  setSort: (sort) => {
    set({ sort });
    savePrefs({ sort });
  },
  setSortDir: (sortDir) => {
    set({ sortDir });
    savePrefs({ sortDir });
  },
  setDrawerOpen: () => {
    // 抽屉已移除，保留 setter 以便兼容旧数据
  },
  setGroupIds: (groupIds) => {
    const arr = toArr(groupIds);
    set({ groupIds: arr });
    savePrefs({ groupIds: arr });
  },
  setCategoryIds: (categoryIds) => {
    const arr = toArr(categoryIds);
    set({ categoryIds: arr });
    savePrefs({ categoryIds: arr });
  },
  setTagIds: (tagIds) => {
    const arr = toArr(tagIds);
    set({ tagIds: arr });
    savePrefs({ tagIds: arr });
  },
  setQ: (q) => {
    set({ q });
    // 输入过程中频繁 setItem/JSON.stringify 会有可见卡顿；搜索词延后 200ms 落盘
    if (usePrefsStore._qTimer) clearTimeout(usePrefsStore._qTimer);
    usePrefsStore._qTimer = setTimeout(() => savePrefs({ q }), 200);
  },
  setMaxImageBytes: (bytes) => {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return;
    set({ maxImageBytes: n });
    savePrefs({ maxImageBytes: n });
  },
  reset: () => {
    const cleared = savePrefs({
      view: "grid",
      sort: "newest",
      sortDir: "desc",
      drawerOpen: false,
      groupIds: [],
      categoryIds: [],
      tagIds: [],
      q: "",
    });
    set(cleared);
  },
}));
