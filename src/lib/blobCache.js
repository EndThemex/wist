// Blob URL 共享缓存：
// 1) 相同 blobId 一次 DB 读 + 一次 createObjectURL，所有页面/组件共用
// 2) LRU 上限避免内存膨胀；自动 revoke 被淘汰的 URL
import { blobsRepo } from "@/lib/repos";

const MAX = 64; // 最多缓存 64 个 blob URL
const cache = new Map(); // blobId -> url (Map 保持插入顺序，可用作 LRU)

const inflight = new Map(); // blobId -> Promise<string|null>

export async function getBlobURL(blobId) {
  if (!blobId) return null;
  const cached = cache.get(blobId);
  if (cached) {
    // 命中：刷新 LRU 顺序
    cache.delete(blobId);
    cache.set(blobId, cached);
    return cached;
  }
  if (inflight.has(blobId)) return inflight.get(blobId);

  const p = (async () => {
    const url = await blobsRepo.getURL(blobId);
    if (url) {
      cache.set(blobId, url);
      evictIfNeeded();
    }
    return url;
  })().finally(() => {
    inflight.delete(blobId);
  });
  inflight.set(blobId, p);
  return p;
}

function evictIfNeeded() {
  while (cache.size > MAX) {
    const oldestKey = cache.keys().next().value;
    const oldestUrl = cache.get(oldestKey);
    cache.delete(oldestKey);
    if (oldestUrl) URL.revokeObjectURL(oldestUrl);
  }
}

export function clearBlobCache() {
  for (const url of cache.values()) URL.revokeObjectURL(url);
  cache.clear();
}

// 失效指定 blobId 的缓存：用于删除图片 / 删除物品后及时回收 ObjectURL
export function invalidateBlobURL(blobId) {
  const url = cache.get(blobId);
  if (url) URL.revokeObjectURL(url);
  cache.delete(blobId);
}
