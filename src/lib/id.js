// 生成唯一 ID（短随机字符串）
export function uid(prefix = '') {
  const r = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return prefix ? `${prefix}_${t}${r}` : `${t}${r}`;
}

export function nowISO() {
  return new Date().toISOString();
}
