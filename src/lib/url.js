// 获取当前完整的 location（包括 hash、查询串），用于编辑页的回跳参数
export function currentLocation() {
  if (typeof window === 'undefined') return '/';
  // hash 由 HashRouter 管理，格式如 "#/?q=abc"，去掉开头的 #
  return window.location.hash ? window.location.hash.slice(1) : window.location.pathname + window.location.search;
}

// 拼接 "to" 链接：将当前完整 location 编码后作为 ?from= 参数
// groupId/categoryId 可选：携带后编辑页会预填该项
export function newItemLink(groupId) {
  const from = encodeURIComponent(currentLocation());
  let link = `/items/new?from=${from}`;
  if (groupId) link += `&group=${encodeURIComponent(groupId)}`;
  return link;
}

export function editItemLink(id) {
  const from = encodeURIComponent(currentLocation());
  return `/items/${id}/edit?from=${from}`;
}
