// 通用：根据 blobId 获取并展示图片
// - 全局共享 Blob URL 缓存（避免每个组件独立 DB 读 + createObjectURL）
// - 自动 IntersectionObserver 延迟渲染可视区内的图
// - 无图时显示一个简洁的图标占位（斜纹底 + 方框图标 + "NO IMAGE"）
import { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getBlobURL } from '@/lib/blobCache';
import './Thumb.css';

export default function Thumb({
  blobId,
  alt = '',
  className = '',
  children,
  compact = false,
  eager = false,
}) {
  const ref = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [url, setUrl] = useState(null);

  // IntersectionObserver：仅在进入视口前 200px时再加载
  useEffect(() => {
    if (eager || shouldLoad || !blobId) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldLoad(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager, blobId, shouldLoad]);

  // 真正加载：使用共享缓存
  useEffect(() => {
    if (!blobId || !shouldLoad) return undefined;
    let cancelled = false;
    (async () => {
      const u = await getBlobURL(blobId);
      if (!cancelled) setUrl(u);
    })();
    return () => {
      cancelled = true;
    };
  }, [blobId, shouldLoad]);

  if (!blobId) {
    return (
      <div ref={ref} className={`thumb-placeholder ${compact ? 'compact' : ''} ${className}`}>
        {children || (
          <>
            <span className="thumb-placeholder-icon" aria-hidden>
              <ImageOff size={14} strokeWidth={1.25} />
            </span>
            {!compact && <span className="thumb-placeholder-text">NO IMAGE</span>}
          </>
        )}
      </div>
    );
  }
  if (!url) {
    return (
      <div ref={ref} className={`thumb-placeholder ${compact ? 'compact' : ''} ${className}`}>
        <span className="thumb-placeholder-text">…</span>
      </div>
    );
  }
  return (
    <img
      ref={ref}
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
