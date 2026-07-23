// 分组管理（增强版）：CRUD 分组、查看分组内物品、从分组移除物品、添加物品到分组
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  PackagePlus,
  X,
} from "lucide-react";
import { useCatalogStore } from "@/store/useCatalogStore";
import Empty from "@/components/Empty.jsx";
import { newItemLink } from "@/lib/url";
import { useT } from "@/i18n";
import "./ManagePage.css";
import "./GroupManagePage.css";

export default function GroupManagePage() {
  const groups = useCatalogStore((s) => s.groups);
  const items = useCatalogStore((s) => s.items);
  const categories = useCatalogStore((s) => s.categories);
  const tags = useCatalogStore((s) => s.tags);
  const addGroup = useCatalogStore((s) => s.addGroup);
  const updateGroup = useCatalogStore((s) => s.updateGroup);
  const removeGroup = useCatalogStore((s) => s.removeGroup);
  const updateItem = useCatalogStore((s) => s.updateItem);

  const t = useT();
  const [name, setName] = useState("");
  const [openId, setOpenId] = useState(null);
  const [pickerFor, setPickerFor] = useState(null); // { groupId, q: '' }
  const navigate = useNavigate();

  const itemsByGroup = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      if (!it.groupId) continue;
      if (!map.has(it.groupId)) map.set(it.groupId, []);
      map.get(it.groupId).push(it);
    }
    return map;
  }, [items]);

  const submitAdd = async () => {
    const n = name.trim();
    if (!n) return;
    await addGroup({ name: n });
    setName("");
  };

  const removeItemFromGroup = async (item) => {
    await updateItem(item.id, { groupId: "" });
  };

  const onRemoveGroup = async (group) => {
    const count = (itemsByGroup.get(group.id) || []).length;
    const tip =
      count > 0
        ? t("manage.groups.deleteConfirmWithItems", {
            name: group.name,
            n: count,
          })
        : t("manage.groups.deleteConfirmEmpty", { name: group.name });
    if (!window.confirm(tip)) return;
    await removeGroup(group.id);
    if (openId === group.id) setOpenId(null);
    if (pickerFor?.groupId === group.id) setPickerFor(null);
  };

  const openPicker = (group) => {
    setPickerFor({ groupId: group.id, q: "" });
    setOpenId(group.id);
  };

  const pickerCandidates = useMemo(() => {
    if (!pickerFor) return [];
    const q = pickerFor.q.trim().toLowerCase();
    return items
      .filter((it) => it.groupId !== pickerFor.groupId)
      .filter((it) => {
        if (!q) return true;
        return [it.name, it.model, it.location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .slice(0, 20);
  }, [items, pickerFor]);

  const addExistingToGroup = async (item) => {
    await updateItem(item.id, { groupId: pickerFor.groupId });
  };

  const createNewInGroup = () => {
    if (!pickerFor) return;
    // 跳到编辑页，携带 from + 预填的 groupId
    const link = newItemLink(pickerFor.groupId);
    setPickerFor(null);
    navigate(link);
  };

  return (
    <div className="manage group-manage">
      <header className="manage-head">
        <div>
          <h2 className="manage-title">{t("nav.groups")}</h2>
          <div className="muted" style={{ fontSize: 13 }}>
            {t("manage.groups.hint")}
          </div>
        </div>
      </header>

      <div className="manage-add-row">
        <input
          className="input"
          placeholder={t("manage.groups.addPlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitAdd()}
        />
        <button
          type="button"
          className="icon-btn icon-btn-primary"
          onClick={submitAdd}
          aria-label={t("manage.add")}
          disabled={!name.trim()}
        >
          <Plus size={16} strokeWidth={1.75} />
          <span className="icon-btn-label">{t("manage.add")}</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <Empty title={t("manage.empty", { type: t("nav.groups") })} />
      ) : (
        <ul className="manage-list">
          {groups.map((g) => {
            const inGroup = itemsByGroup.get(g.id) || [];
            const open = openId === g.id;
            return (
              <li key={g.id} className="group-manage-row">
                <div className="manage-row manage-row-head">
                  <button
                    type="button"
                    className="caret"
                    onClick={() => setOpenId(open ? null : g.id)}
                    aria-label={open ? t("common.cancel") : t("common.search")}
                  >
                    {open ? (
                      <ChevronDown size={16} strokeWidth={1.5} />
                    ) : (
                      <ChevronRight size={16} strokeWidth={1.5} />
                    )}
                  </button>
                  <span className="manage-name ellipsis-1">{g.name}</span>
                  <span className="mono subtle">
                    {t("manage.count", { n: inGroup.length })}
                  </span>
                  <div className="row">
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label={t("manage.groups.addItem")}
                      title={t("manage.groups.addItem")}
                      onClick={() => openPicker(g)}
                    >
                      <PackagePlus size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-danger-icon"
                      aria-label={t("manage.groups.deleteGroup")}
                      onClick={() => onRemoveGroup(g)}
                      title={t("manage.groups.deleteGroup")}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="group-manage-body">
                    {inGroup.length === 0 ? (
                      <div
                        className="muted"
                        style={{ fontSize: 13, padding: "12px 0" }}
                      >
                        {t("manage.groups.emptyBody")}
                      </div>
                    ) : (
                      <ul className="group-item-list">
                        {inGroup.map((it) => {
                          const cat = categories.find(
                            (c) => c.id === it.categoryId,
                          );
                          return (
                            <li key={it.id} className="group-item-row">
                              <button
                                type="button"
                                className="group-item-name ellipsis-1"
                                onClick={() => navigate(`/items/${it.id}`)}
                              >
                                {it.name}
                              </button>
                              <span className="mono subtle ellipsis-1">
                                {[cat?.name, it.location]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </span>
                              <button
                                type="button"
                                className="btn-icon btn-danger-icon"
                                onClick={() => removeItemFromGroup(it)}
                                aria-label={t("manage.groups.removeFromGroup")}
                                title={t("manage.groups.removeFromGroup")}
                              >
                                <X size={14} strokeWidth={1.5} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {pickerFor?.groupId === g.id ? (
                      <div className="picker">
                        <div className="picker-head">
                          <h4>
                            {t("manage.groups.pickerTitle", { name: g.name })}
                          </h4>
                          <button
                            className="btn-icon"
                            onClick={() => setPickerFor(null)}
                            aria-label={t("common.cancel")}
                          >
                            <X size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                        <input
                          className="input"
                          placeholder={t(
                            "manage.groups.pickerSearchPlaceholder",
                          )}
                          value={pickerFor.q}
                          onChange={(e) =>
                            setPickerFor({ ...pickerFor, q: e.target.value })
                          }
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-ghost picker-new"
                          onClick={createNewInGroup}
                        >
                          <Plus size={14} strokeWidth={1.75} /> &nbsp;
                          {t("manage.groups.pickerNewHere")}
                        </button>
                        {pickerCandidates.length === 0 ? (
                          <div
                            className="muted"
                            style={{ fontSize: 13, padding: "8px 0" }}
                          >
                            {t("manage.groups.pickerEmpty")}
                          </div>
                        ) : (
                          <ul className="picker-list">
                            {pickerCandidates.map((it) => {
                              const tagNames = (it.tagIds || [])
                                .map(
                                  (tid) => tags.find((t) => t.id === tid)?.name,
                                )
                                .filter(Boolean)
                                .slice(0, 3)
                                .map((n) => `#${n}`)
                                .join(" ");
                              return (
                                <li key={it.id} className="picker-row">
                                  <span className="ellipsis-1">{it.name}</span>
                                  <span className="mono subtle ellipsis-1">
                                    {tagNames || " "}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn-icon"
                                    onClick={() => addExistingToGroup(it)}
                                    aria-label={t("manage.groups.pickerAdd")}
                                    title={t("manage.groups.pickerAdd")}
                                  >
                                    <Plus size={14} strokeWidth={1.75} />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
