// 通用仓储：CRUD + 列表
import { getDB, STORES } from './db.js';

async function listAll(storeName) {
  const db = await getDB();
  return db.getAll(storeName);
}

async function getById(storeName, id) {
  const db = await getDB();
  return db.get(storeName, id);
}

async function put(storeName, row) {
  const db = await getDB();
  await db.put(storeName, row);
  return row;
}

async function remove(storeName, id) {
  const db = await getDB();
  await db.delete(storeName, id);
}

// ============ Items ============
export const itemsRepo = {
  list: async () => {
    const items = await listAll(STORES.items);
    return items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },
  get: (id) => getById(STORES.items, id),
  create: async (data) => {
    const row = {
      id: data.id,
      name: data.name,
      model: data.model || '',
      price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
      quantity: Number.isInteger(data.quantity) ? data.quantity : parseInt(data.quantity, 10) || 0,
      groupId: data.groupId || '',
      categoryId: data.categoryId || '',
      tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
      location: data.location || '',
      note: data.note || '',
      imageIds: Array.isArray(data.imageIds) ? data.imageIds : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await put(STORES.items, row);
    return row.id;
  },
  update: async (id, patch) => {
    const cur = await getById(STORES.items, id);
    if (!cur) throw new Error('物品不存在');
    const next = { ...cur, ...patch, id, updatedAt: new Date().toISOString() };
    await put(STORES.items, next);
  },
  remove: async (id) => {
    // 级联删除图片与 blob
    const db = await getDB();
    const imgs = await db.getAllFromIndex(STORES.images, 'itemId', id);
    const tx = db.transaction([STORES.items, STORES.images, STORES.blobs], 'readwrite');
    await tx.objectStore(STORES.items).delete(id);
    for (const img of imgs) {
      await tx.objectStore(STORES.images).delete(img.id);
      if (img.blobId) await tx.objectStore(STORES.blobs).delete(img.blobId);
    }
    await tx.done;
  },
  bulkReplace: async (items) => {
    const db = await getDB();
    const tx = db.transaction(STORES.items, 'readwrite');
    await tx.objectStore(STORES.items).clear();
    for (const it of items) await tx.objectStore(STORES.items).put(it);
    await tx.done;
  },
};

// ============ Images / Blobs ============
export const imagesRepo = {
  listByItem: async (itemId) => {
    const db = await getDB();
    const imgs = await db.getAllFromIndex(STORES.images, 'itemId', itemId);
    return imgs.sort((a, b) => a.order - b.order);
  },
  add: async (itemId, blobId, order = 0) => {
    const row = { id: `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, itemId, blobId, order };
    await put(STORES.images, row);
    return row.id;
  },
  remove: async (id) => {
    const db = await getDB();
    const img = await db.get(STORES.images, id);
    if (img?.blobId) await db.delete(STORES.blobs, img.blobId);
    await db.delete(STORES.images, id);
  },
  reorder: async (orderedIds) => {
    const db = await getDB();
    const tx = db.transaction(STORES.images, 'readwrite');
    for (let i = 0; i < orderedIds.length; i++) {
      const cur = await tx.objectStore(STORES.images).get(orderedIds[i]);
      if (cur) await tx.objectStore(STORES.images).put({ ...cur, order: i });
    }
    await tx.done;
  },
};

export const blobsRepo = {
  put: async (blob) => {
    const db = await getDB();
    const id = `blob_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    await db.put(STORES.blobs, { id, mime: blob.type || 'image/jpeg', data: blob });
    return id;
  },
  getURL: async (id) => {
    const db = await getDB();
    const row = await db.get(STORES.blobs, id);
    if (!row) return null;
    return URL.createObjectURL(row.data);
  },
  remove: async (id) => {
    const db = await getDB();
    await db.delete(STORES.blobs, id);
  },
};

// ============ Groups / Categories / Tags ============
// cascadeOnRemove: 在删除分类前调用以清空 items 的引用
function makeSlugRepo(storeName, label, cascadeOnRemove) {
  return {
    list: () => listAll(storeName),
    get: (id) => getById(storeName, id),
    create: async ({ name, color = '', order = 0 }) => {
      const row = { id: `${label}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, name: String(name).trim(), color, order };
      await put(storeName, row);
      return row.id;
    },
    update: async (id, patch) => {
      const cur = await getById(storeName, id);
      if (!cur) throw new Error('不存在');
      await put(storeName, { ...cur, ...patch, id });
    },
    remove: async (id) => {
      if (cascadeOnRemove) {
        await cascadeOnRemove(id);
      }
      await remove(storeName, id);
    },
  };
}

// 删除分组/分类时把对应物品字段清空
async function clearItemsField(field, value) {
  const db = await getDB();
  const all = await db.getAll(STORES.items);
  const tx = db.transaction(STORES.items, 'readwrite');
  for (const it of all) {
    if (field === 'tagIds') {
      if (Array.isArray(it.tagIds) && it.tagIds.includes(value)) {
        await tx.store.put({ ...it, tagIds: it.tagIds.filter((t) => t !== value), updatedAt: new Date().toISOString() });
      }
    } else if (it[field] === value) {
      await tx.store.put({ ...it, [field]: '', updatedAt: new Date().toISOString() });
    }
  }
  await tx.done;
}

export const groupsRepo = makeSlugRepo(STORES.groups, 'g', (id) => clearItemsField('groupId', id));
export const categoriesRepo = makeSlugRepo(STORES.categories, 'c', (id) => clearItemsField('categoryId', id));
export const tagsRepo = makeSlugRepo(STORES.tags, 't', (id) => clearItemsField('tagIds', id));
