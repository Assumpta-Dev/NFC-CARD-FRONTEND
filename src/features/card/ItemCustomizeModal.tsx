import { useMemo, useState } from "react";
import { HiOutlineX } from "react-icons/hi";
import {
  ITEM_HINT_BY_TYPE,
  SPECIAL_REQUEST_PRESETS,
  type BusinessType,
} from "../../constants/businessTypes";
import type {
  CustomizationOptions,
  MenuItem,
  OrderItem,
  SelectedModifier,
} from "../../types";

type Props = {
  item: MenuItem;
  businessType?: BusinessType | null;
  onClose: () => void;
  onAdd: (line: OrderItem) => void;
};

function parseOptions(raw: MenuItem["customizationOptions"]): CustomizationOptions | null {
  if (!raw || typeof raw !== "object") return null;
  if (!Array.isArray(raw.groups)) return null;
  return raw;
}

export function ItemCustomizeModal({ item, businessType, onClose, onAdd }: Props) {
  const type = businessType ?? "RESTAURANT";
  const options = parseOptions(item.customizationOptions);
  const groups = options?.groups ?? [];
  const presets = SPECIAL_REQUEST_PRESETS[type] ?? SPECIAL_REQUEST_PRESETS.OTHER;
  const hint =
    item.customizationHint?.trim() ||
    ITEM_HINT_BY_TYPE[type] ||
    ITEM_HINT_BY_TYPE.OTHER;
  const allowNotes = item.allowsSpecialInstructions !== false;

  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const g of groups) {
      if (g.required && g.options[0]) initial[g.id] = g.options[0].id;
    }
    return initial;
  });
  const [error, setError] = useState("");

  const selectedModifiers: SelectedModifier[] = useMemo(() => {
    const mods: SelectedModifier[] = [];
    for (const g of groups) {
      const optionId = selected[g.id];
      if (!optionId) continue;
      const opt = g.options.find((o) => o.id === optionId);
      if (!opt) continue;
      mods.push({
        groupId: g.id,
        groupName: g.name,
        optionId: opt.id,
        optionName: opt.name,
        priceDelta: Number(opt.priceDelta) || 0,
      });
    }
    return mods;
  }, [groups, selected]);

  const unitPrice =
    item.price + selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);

  const toggleChip = (chip: string) => {
    setNotes((prev) => {
      const parts = prev
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.includes(chip)) {
        return parts.filter((p) => p !== chip).join(", ");
      }
      return [...parts, chip].join(", ");
    });
  };

  const handleAdd = () => {
    for (const g of groups) {
      if (g.required && !selected[g.id]) {
        setError(`Please choose ${g.name}`);
        return;
      }
    }
    setError("");
    const specialInstructions = notes.trim() || undefined;
    const cartKey = [
      item.id,
      selectedModifiers.map((m) => m.optionId).sort().join("-"),
      specialInstructions ?? "",
    ].join("|");

    onAdd({
      cartKey,
      id: item.id,
      name: item.name,
      price: unitPrice,
      qty,
      imageUrl: item.imageUrl,
      specialInstructions,
      selectedModifiers: selectedModifiers.length ? selectedModifiers : undefined,
      unitPrice,
      station: item.station && item.station !== "ALL" ? item.station : "KITCHEN",
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-gray-900 sm:rounded-3xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.name}</h2>
            <p className="text-sm font-semibold text-[#DE3A16]">
              RWF {unitPrice.toLocaleString()}
              {unitPrice !== item.price ? (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  base {item.price.toLocaleString()}
                </span>
              ) : null}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <HiOutlineX className="text-xl text-gray-400" />
          </button>
        </div>

        {item.description && (
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
        )}

        {groups.map((group) => (
          <div key={group.id} className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {group.name}
              {group.required ? " *" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const active = selected[group.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [group.id]: opt.id }))
                    }
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-[#DE3A16] bg-[#DE3A16] text-white"
                        : "border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {opt.name}
                    {opt.priceDelta ? ` (+${opt.priceDelta.toLocaleString()})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {allowNotes && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              How do you want it?
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {presets.map((chip) => {
                const active = notes
                  .split(",")
                  .map((p) => p.trim())
                  .includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleChip(chip)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                      active
                        ? "bg-[#DE3A16]/15 text-[#DE3A16]"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={hint}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#DE3A16] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</p>
          <div className="inline-flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-1 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="text-lg font-bold text-[#DE3A16]"
            >
              −
            </button>
            <span className="min-w-[20px] text-center font-bold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="text-lg font-bold text-[#DE3A16]"
            >
              +
            </button>
          </div>
        </div>

        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-2xl bg-[#DE3A16] py-3 text-sm font-bold text-white"
        >
          Add to order · RWF {(unitPrice * qty).toLocaleString()}
        </button>
      </div>
    </div>
  );
}
