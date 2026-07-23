// 图片压缩工具
// 1) compressImage：Canvas 限制最长边 + 质量
// 2) compressImageToSize：超过 maxSizeBytes 时自动迭代降质量/降尺寸，直到 ≤ 限额
import imageCompression from "browser-image-compression";

// 超过此体积则使用「按目标字节数」压缩；默认 1 MB
export const DEFAULT_MAX_BYTES = 1 * 1024 * 1024;

/**
 * Canvas 一次性压缩（保留作为兼容/快速通道）
 * @param {File|Blob} file
 * @param {{maxDim?:number, quality?:number, mime?:string}} opts
 */
export async function compressImage(
  file,
  { maxDim = 1600, quality = 0.82, mime = "image/jpeg" } = {},
) {
  const img = await loadImage(file);
  const { width, height } = scaleToFit(img.width, img.height, maxDim);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || file), mime, quality);
  });
}

/**
 * 按目标体积压缩：自动迭代降尺寸/质量，直到 ≤ maxSizeBytes
 * - 原图就小于限额：原样返回（保留原 mime，避免被无意义转码）
 * - 否则委托 browser-image-compression 处理
 * @param {File|Blob} file
 * @param {{
 *   maxSizeBytes?: number,   // 单张体积上限，默认 1 MB
 *   maxWidthOrHeight?: number, // 最长边，默认 1600
 *   useWebWorker?: boolean,  // 默认 true
 * }} opts
 */
export async function compressImageToSize(file, opts = {}) {
  const {
    maxSizeBytes = DEFAULT_MAX_BYTES,
    maxWidthOrHeight = 1600,
    useWebWorker = true,
  } = opts;

  if (!file || typeof file.size !== "number") return file;
  if (file.size <= maxSizeBytes) return file;

  try {
    const blob = await imageCompression(file, {
      maxSizeMB: maxSizeBytes / (1024 * 1024),
      maxWidthOrHeight,
      useWebWorker,
      // 初次尝试用较高质量；若仍超限由库内部继续迭代
      initialQuality: 0.82,
      fileType: "image/jpeg",
    });
    return blob;
  } catch (err) {
    console.error("按目标体积压缩失败，回退到 Canvas 压缩", err);
    return compressImage(file, { maxDim: maxWidthOrHeight });
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function scaleToFit(w, h, maxDim) {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h };
  const ratio = w > h ? maxDim / w : maxDim / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

export function formatBytes(n) {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}
