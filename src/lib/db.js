// IndexedDB 数据库初始化 + 导出/导入（带数据格式版本号）
import { openDB } from 'idb';

const DB_NAME = 'where-is-it-db';
const DB_VERSION = 1;

// 导出文件的数据格式版本（与 DB schema 版本解耦，专门用于迁移）
// 当数据结构发生变化（字段名/字段含义/必需字段）时递增此号
// 并在下面提供对应 migrateXxx 函数把旧版本 payload 升到新版本
export const EXPORT_VERSION = 1;

export const STORES = {
  items: 'items',
  images: 'images',
  blobs: 'blobs',
  groups: 'groups',
  categories: 'categories',
  tags: 'tags',
};

let _dbPromise = null;

export function getDB() {
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.items)) {
          const s = db.createObjectStore(STORES.items, { keyPath: 'id' });
          s.createIndex('name', 'name');
          s.createIndex('groupId', 'groupId');
          s.createIndex('categoryId', 'categoryId');
          s.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(STORES.images)) {
          const s = db.createObjectStore(STORES.images, { keyPath: 'id' });
          s.createIndex('itemId', 'itemId');
        }
        if (!db.objectStoreNames.contains(STORES.blobs)) {
          db.createObjectStore(STORES.blobs, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.groups)) {
          const s = db.createObjectStore(STORES.groups, { keyPath: 'id' });
          s.createIndex('name', 'name');
        }
        if (!db.objectStoreNames.contains(STORES.categories)) {
          const s = db.createObjectStore(STORES.categories, { keyPath: 'id' });
          s.createIndex('name', 'name');
        }
        if (!db.objectStoreNames.contains(STORES.tags)) {
          const s = db.createObjectStore(STORES.tags, { keyPath: 'id' });
          s.createIndex('name', 'name');
        }
      },
    });
  }
  return _dbPromise;
}

export async function clearAll() {
  const db = await getDB();
  const tx = db.transaction(Object.values(STORES), 'readwrite');
  await Promise.all(Object.values(STORES).map((n) => tx.objectStore(n).clear()));
  await tx.done;
}

/* ========== 导出 / 导入 ========== */

export async function exportDB() {
  const db = await getDB();
  const data = {};
  for (const name of Object.values(STORES)) {
    data[name] = await db.getAll(name);
  }
  return {
    formatVersion: EXPORT_VERSION, // 导出文件数据格式版本（用于跨版本迁移）
    schemaVersion: DB_VERSION, // IndexedDB 表结构版本（参考用）
    app: 'where-is-it',
    exportedAt: new Date().toISOString(),
    data,
  };
}

/**
 * 把旧版本 payload 升级到当前 EXPORT_VERSION。
 * 传入原始 payload（已被 verifyPayload 校验过是 dict 含 data），
 * 原地修改 data，必要时调整 formatVersion，最终保证返回对象的 formatVersion === EXPORT_VERSION。
 */
export function migratePayload(payload) {
  // 兼容缺失 formatVersion 的旧备份（按 1 处理）
  if (typeof payload.formatVersion !== 'number') payload.formatVersion = 1;

  if (payload.formatVersion > EXPORT_VERSION) {
    throw new Error(
      `备份文件版本（v${payload.formatVersion}）高于当前应用支持版本（v${EXPORT_VERSION}），请升级应用后再导入`
    );
  }

  // 链式迁移：每当 EXPORT_VERSION 升一个号时，在这里加一条 case
  // 例如 EXPORT_VERSION 升到 2 时，新增 if (payload.formatVersion === 1) { ... payload.formatVersion = 2 }
  // 当前 EXPORT_VERSION = 1：无需任何迁移

  return payload;
}

/**
 * 校验 payload 合法性（顶层结构 + data 必须是 dict + data 内 store 是 array）
 */
function verifyPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('文件格式不正确（顶层不是对象）');
  }
  if (!payload.data || typeof payload.data !== 'object') {
    throw new Error('文件格式不正确（缺少 data 字段）');
  }
  for (const k of Object.keys(payload.data)) {
    if (!Array.isArray(payload.data[k])) {
      throw new Error(`文件格式不正确（data.${k} 不是数组）`);
    }
  }
}

export async function importDB(payload) {
  if (!payload || typeof payload !== 'object' || !payload.data) {
    throw new Error('文件格式不正确');
  }
  // 先迁移到当前版本
  migratePayload(payload);
  // 再校验
  verifyPayload(payload);

  await clearAll();
  const db = await getDB();
  const stores = Object.keys(payload.data).filter((n) => Object.values(STORES).includes(n));
  const tx = db.transaction(stores, 'readwrite');
  for (const name of stores) {
    const store = tx.objectStore(name);
    for (const row of payload.data[name] || []) {
      await store.put(row);
    }
  }
  await tx.done;
}

/**
 * 返回一个简短描述（用于 UI 显示备份/兼容性信息）
 */
export function describePayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const v = typeof payload.formatVersion === 'number' ? `v${payload.formatVersion}` : '未知版本';
  const t = payload.exportedAt ? new Date(payload.exportedAt).toLocaleString('zh-CN') : '';
  const app = payload.app || 'where-is-it';
  return { app, version: v, exportedAt: t };
}
