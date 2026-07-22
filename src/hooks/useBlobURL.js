// useBlobURL：根据 blobId 获取 ObjectURL（自动共享缓存 + LRU 淘汰）
import { useEffect, useState } from 'react';
import { getBlobURL } from '@/lib/blobCache';

export function useBlobURL(blobId) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blobId) {
      setUrl(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const u = await getBlobURL(blobId);
      if (!cancelled) setUrl(u);
    })();
    return () => {
      cancelled = true;
    };
  }, [blobId]);
  return url;
}
