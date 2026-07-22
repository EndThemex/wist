// 图片横向 carousel，序号而非渐变
// - blobId 通过父级一次 DB 事务批量查出（避免 N 次独立事务）
// - 单图懒加载由 <Thumb> 内部 IntersectionObserver 处理
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import Thumb from '@/components/Thumb.jsx';
import { getDB } from '@/lib/db';
import './Carousel.css';

export default function Carousel({ imageIds = [], height, onRemove, removable = false, compact = false }) {
  // 默认 4:3 自适应高度；如显式传 height 则按 height；compact 用于无图时缩成窄条
  const finalHeight = height ?? undefined;
  const hasImage = (imageIds || []).length > 0;
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);

  const items = imageIds || [];

  // 一次性查所有 imageId 对应的 blobId
  const blobIdMap = useImageBlobIds(items);
  // 仅 active + 邻接图：限制并发的 blob URL 加载
  const eagerIndexes = useMemo(() => {
    const set = new Set([active]);
    if (active > 0) set.add(active - 1);
    if (active < items.length - 1) set.add(active + 1);
    return set;
  }, [active, items.length]);

  useEffect(() => {
    if (active >= items.length) setActive(Math.max(0, items.length - 1));
  }, [items.length, active]);

  const onScroll = (e) => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const i = Math.round(el.scrollLeft / w);
    if (i !== active) setActive(i);
  };

  return (
    <div
      className={`carousel${compact || !hasImage ? ' compact' : ''}`}
      style={finalHeight ? { height: finalHeight } : undefined}
    >
      <div className="carousel-track" ref={trackRef} onScroll={onScroll}>
        {items.length === 0 && (
          <div className="carousel-empty">
            <span className="carousel-empty-icon" aria-hidden>
              <ImageOff size={18} strokeWidth={1.25} />
            </span>
            <span className="carousel-empty-text">NO IMAGE</span>
          </div>
        )}
        {items.map((id, i) => (
          <CarouselSlide
            key={id}
            blobId={blobIdMap[id]}
            eager={eagerIndexes.has(i)}
            removable={removable}
            onRemove={() => onRemove?.(id)}
          />
        ))}
      </div>
      {items.length > 1 && (
        <div className="carousel-indicator mono">
          {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </div>
      )}
    </div>
  );
}

function CarouselSlide({ blobId, onRemove, removable, eager }) {
  return (
    <div className="carousel-slide">
      <Thumb blobId={blobId} className="carousel-img" eager={eager} />
      {removable && (
        <button
          type="button"
          className="carousel-remove"
          aria-label="删除图片"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.();
          }}
        >
          DELETE
        </button>
      )}
    </div>
  );
}

// 把一组 imageId 映射到 blobId（一次 DB 事务 + 并行 get）
function useImageBlobIds(imageIds) {
  const [map, setMap] = useState({});
  useEffect(() => {
    let cancelled = false;
    if (!imageIds || imageIds.length === 0) {
      setMap({});
      return undefined;
    }
    (async () => {
      try {
        const db = await getDB();
        const tx = db.transaction('images', 'readonly');
        const store = tx.objectStore('images');
        const out = {};
        await Promise.all(
          imageIds.map(async (id) => {
            const row = await store.get(id);
            if (row && row.blobId) out[id] = row.blobId;
          }),
        );
        await tx.done;
        if (!cancelled) setMap(out);
      } catch (_) {
        if (!cancelled) setMap({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageIds]);
  return map;
}
