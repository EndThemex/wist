// 语言偏好 store：持久化到 localStorage（key: wii.locale）
// 沿用项目既有 wii.* 命名（wii.theme / wii.prefs / wii.locale）
import { create } from 'zustand';

const KEY = 'wii.locale';
const SUPPORTED = ['zh', 'en'];

function detectInitial() {
  if (typeof window === 'undefined') return 'zh';
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || '').toLowerCase();
    return nav.startsWith('zh') ? 'zh' : 'en';
  } catch (_) {
    return 'zh';
  }
}

export const useLocaleStore = create((set) => ({
  lang: detectInitial(),
  set: (lang) => {
    if (!SUPPORTED.includes(lang)) return;
    try {
      localStorage.setItem(KEY, lang);
    } catch (_) {}
    // 同步到 <html lang>，便于屏幕阅读器与浏览器原生 UI
    if (typeof document !== 'undefined') document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    set({ lang });
  },
}));

// 首次加载时同步一次 lang 属性（避免首屏 SSR/水合期间不一致）
if (typeof document !== 'undefined') {
  const cur = useLocaleStore.getState().lang;
  document.documentElement.lang = cur === 'zh' ? 'zh-CN' : 'en';
}