// 用户 UI 偏好持久化（视图、排序、抽屉状态、筛选条件）
// 统一接口：load / save

const KEY = "wii.prefs";

const DEFAULTS = {
  view: "grid", // 'grid' | 'list'
  sort: "newest",
  sortDir: "desc",
  drawerOpen: false,
  groupIds: [], // 多选：分组 id 数组
  categoryIds: [], // 多选：分类 id 数组
  tagIds: [], // 多选：标签 id 数组
  q: "",
  maxImageBytes: 1 * 1024 * 1024, // 单张图片体积上限（字节），超出自动压缩
};

function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (v === "" || v == null) return [];
  return [v];
}

function normalize(prefs) {
  return {
    view: prefs.view || DEFAULTS.view,
    sort: prefs.sort || DEFAULTS.sort,
    sortDir: prefs.sortDir || DEFAULTS.sortDir,
    drawerOpen: false, // 抽屉已移除，强制关闭
    groupIds: toArray(prefs.groupIds ?? prefs.groupId),
    categoryIds: toArray(prefs.categoryIds ?? prefs.categoryId),
    tagIds: toArray(prefs.tagIds ?? prefs.tagId),
    q: typeof prefs.q === "string" ? prefs.q : "",
    maxImageBytes: normalizeBytes(prefs.maxImageBytes),
  };
}

function normalizeBytes(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return DEFAULTS.maxImageBytes;
  return Math.max(50 * 1024, Math.min(10 * 1024 * 1024, Math.round(n)));
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return normalize({ ...DEFAULTS, ...parsed });
  } catch (_) {
    return { ...DEFAULTS };
  }
}

function write(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch (_) {
    // ignore
  }
}

export function loadPrefs() {
  return read();
}

export function savePrefs(patch) {
  const cur = read();
  const next = normalize({ ...cur, ...patch });
  write(next);
  return next;
}

export function clearPrefs() {
  try {
    localStorage.removeItem(KEY);
  } catch (_) {
    // ignore
  }
}
