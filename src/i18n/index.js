// i18n 入口 —— 极简方案：自管字典 + zustand 订阅
//
// 用法：
//   import { useT, useLocale, setLocale } from '@/i18n';
//   const t = useT();           // 订阅语言，触发重渲染
//   const lang = useLocale();   // 当前语言代码 'zh' | 'en'
//   t('common.save')            // -> "保存" / "Save"
//   t('items.result', { count: 12, total: 30 })
//
// 设计要点：
// - 字典静态导入（仅 zh/en 两个，体量小，无需异步）
// - 占位符语法：{name}，缺失变量原样保留
// - 缺失 key 回退到 fallback（zh），再缺失返回 key 本身（便于发现未翻译项）
// - 不翻译用户数据（物品名/标签/分组/分类），那是用户录入
import { useLocaleStore } from '@/store/useLocaleStore';
import zh from './zh';
import en from './en';

const DICTS = { zh, en };
const FALLBACK = 'zh';

function format(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : `{${k}}`,
  );
}

// 非订阅版本：在 store 外部或一次性读取时使用
export function translate(key, params, lang) {
  const l = lang || (useLocaleStore.getState && useLocaleStore.getState().lang) || FALLBACK;
  const s = DICTS[l]?.[key] ?? DICTS[FALLBACK][key] ?? key;
  return format(s, params);
}

// 订阅版本：在组件中使用，会随语言变化自动重渲染
export function useT() {
  const lang = useLocaleStore((s) => s.lang);
  return (key, params) => translate(key, params, lang);
}

export function useLocale() {
  return useLocaleStore((s) => s.lang);
}

export function setLocale(lang) {
  useLocaleStore.getState().set(lang);
}

export const SUPPORTED_LOCALES = [
  { code: 'zh', labelKey: 'settings.lang.zh' },
  { code: 'en', labelKey: 'settings.lang.en' },
];