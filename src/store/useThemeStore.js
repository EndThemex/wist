// 主题 store：light / dark / system
// 注：HTML 已经在 index.html 中通过内联脚本预先设置了 data-theme，避免闪烁
import { create } from 'zustand';

const KEY = 'wii.theme';

function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(mode) {
  if (typeof document === 'undefined') return;
  const m = mode === 'system' ? (getSystemDark() ? 'dark' : 'light') : mode;
  document.documentElement.dataset.theme = m;
  document.documentElement.style.colorScheme = m;
}

export const useThemeStore = create((set, get) => ({
  mode: (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) || 'system',
  effective: () => {
    const m = get().mode;
    return m === 'system' ? (getSystemDark() ? 'dark' : 'light') : m;
  },
  set: (mode) => {
    set({ mode });
    try {
      localStorage.setItem(KEY, mode);
    } catch (_) {}
    applyTheme(mode);
  },
}));

if (typeof window !== 'undefined') {
  // 同步 system 主题变化（仅有变更的副作用）
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (useThemeStore.getState().mode === 'system') applyTheme('system');
  };
  if (mql.addEventListener) {
    mql.addEventListener('change', onChange);
  } else {
    // 兼容旧浏览器
    mql.addListener(onChange);
  }
}
