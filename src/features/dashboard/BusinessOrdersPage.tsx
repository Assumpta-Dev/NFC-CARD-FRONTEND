import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  PageSpinner,
  Pagination,
} from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useOrdersSocket } from "../../hooks/useOrdersSocket";
import { businessApi, getErrorMessage, orderApi } from "../../services/api";
import {
  BusinessSettings,
  LinePrepStatus,
  Order,
  OrderItem,
  PrepStatus,
} from "../../types";
import {
  isOrderAlertSoundEnabled,
  playOrderAlertSound,
  setOrderAlertSoundEnabled,
  unlockOrderAlertSound,
} from "../../utils/orderAlertSound";
import { playReadyBumpSound } from "../../utils/readyBumpSound";

type OrdersView = "list" | "grid" | "board" | "bars";

const VIEW_STORAGE_KEY = "nfc-orders-view";
const ORDERS_PER_PAGE = 10;

const VIEW_OPTIONS: { id: OrdersView; label: string; hint: string }[] = [
  { id: "list", label: "List", hint: "Compact rows" },
  { id: "grid", label: "Grid", hint: "Card tiles" },
  { id: "board", label: "Board", hint: "By status" },
  { id: "bars", label: "Bars", hint: "Progress strips" },
];

const PREP_ACTIONS: { status: PrepStatus; label: string }[] = [
  { status: "PREPARING", label: "Start" },
  { status: "READY", label: "Ready" },
  { status: "SERVED", label: "Done" },
];

const LINE_ACTIONS: { status: LinePrepStatus; label: string }[] = [
  { status: "PREPARING", label: "Start" },
  { status: "READY", label: "Ready" },
  { status: "SERVED", label: "Done" },
];

function readStoredView(): OrdersView {
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY);
    if (v === "list" || v === "grid" || v === "board" || v === "bars") return v;
  } catch {
    /* ignore */
  }
  return "list";
}

function locationLabel(order: Order) {
  if (order.orderContext === "ROOM" && order.roomNumber) return `Room ${order.roomNumber}`;
  if (order.orderContext === "BAR_SEAT" && order.tableNumber) {
    return `Bar seat ${order.tableNumber}`;
  }
  if (order.tableNumber) return `Table ${order.tableNumber}`;
  return null;
}

function prepLabel(status?: PrepStatus | null) {
  switch (status) {
    case "RECEIVED":
      return "New";
    case "PREPARING":
      return "In progress";
    case "READY":
      return "Ready";
    case "SERVED":
      return "Done";
    default:
      return status ?? "";
  }
}

function lineStatusLabel(status?: LinePrepStatus) {
  if (status === "PREPARING") return "Cooking";
  if (status === "READY") return "Ready";
  if (status === "SERVED") return "Done";
  return "Queued";
}

function itemCount(order: Order) {
  return (order.items as OrderItem[]).reduce((sum, item) => sum + item.qty, 0);
}

function itemSummary(order: Order, max = 3) {
  const names = (order.items as OrderItem[]).map((i) => `${i.qty}× ${i.name}`);
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} +${names.length - max} more`;
}

function isPendingPay(order: Order) {
  return order.status === "PENDING" || order.status === "WAITING_VERIFICATION";
}

function isActivePrep(order: Order) {
  return (
    order.status === "PAID" &&
    order.prepStatus !== "SERVED" &&
    order.prepStatus !== "CANCELLED"
  );
}

function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "warn" | "progress" | "ready" | "done";
}) {
  const tones = {
    neutral:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    warn:
      "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/25",
    progress:
      "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200/80 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/25",
    ready:
      "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/25",
    done: "bg-gray-100 text-gray-500 dark:bg-gray-800/80 dark:text-gray-500",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

/** Elevated card surface — readable over dashboard dark:bg-gray-950 */
const surface =
  "border border-gray-200 bg-white shadow-sm dark:border-gray-700/70 dark:bg-gray-900 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]";
const surfaceMuted =
  "border border-gray-200 bg-gray-50/80 dark:border-gray-700/60 dark:bg-gray-900/50";
const hoverRow =
  "hover:bg-gray-50 dark:hover:bg-gray-800/70";
const muted = "text-gray-500 dark:text-gray-400";
const mutedFaint = "text-gray-400 dark:text-gray-500";

function prepTone(status?: PrepStatus | null): "neutral" | "progress" | "ready" | "done" {
  if (status === "PREPARING") return "progress";
  if (status === "READY") return "ready";
  if (status === "SERVED") return "done";
  return "neutral";
}

function orderTone(order: Order): "neutral" | "warn" | "progress" | "ready" | "done" {
  if (isPendingPay(order)) return "warn";
  return prepTone(order.prepStatus);
}

function orderStatusLabel(order: Order) {
  if (isPendingPay(order)) return "Awaiting confirm";
  return prepLabel(order.prepStatus) || order.status;
}

function nextPrepAction(status?: PrepStatus | null): PrepStatus | null {
  if (!status || status === "RECEIVED") return "PREPARING";
  if (status === "PREPARING") return "READY";
  if (status === "READY") return "SERVED";
  return null;
}

function railClass(order: Order) {
  if (isPendingPay(order)) return "border-l-amber-400 dark:border-l-amber-400/90";
  if (order.prepStatus === "PREPARING") return "border-l-sky-400 dark:border-l-sky-400/90";
  if (order.prepStatus === "READY") return "border-l-emerald-400 dark:border-l-emerald-400/90";
  return "border-l-gray-300 dark:border-l-gray-600";
}

function barFillClass(order: Order) {
  if (isPendingPay(order)) return "bg-amber-400 dark:bg-amber-400/90";
  if (order.prepStatus === "PREPARING") return "bg-sky-400 dark:bg-sky-400/90";
  if (order.prepStatus === "READY") return "bg-emerald-400 dark:bg-emerald-400/90";
  if (order.prepStatus === "RECEIVED") return "bg-gray-300 dark:bg-gray-500";
  return "bg-gray-200 dark:bg-gray-600";
}

function barFillWidth(order: Order) {
  if (isPendingPay(order)) return "35%";
  if (order.prepStatus === "RECEIVED") return "40%";
  if (order.prepStatus === "PREPARING") return "70%";
  if (order.prepStatus === "READY") return "92%";
  if (order.prepStatus === "SERVED") return "100%";
  return "20%";
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

/** Mount + fade/scale enter+exit for overlays */
function useOverlayAnim(open: boolean, durationMs = 280) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setShown(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), durationMs);
    return () => window.clearTimeout(t);
  }, [open, durationMs]);

  return { mounted, shown };
}

function ViewSwitcher({
  value,
  onChange,
}: {
  value: OrdersView;
  onChange: (v: OrdersView) => void;
}) {
  return (
    <div
      className="inline-flex rounded-xl border border-gray-200 bg-gray-100/80 p-1 dark:border-gray-700/80 dark:bg-gray-950/80"
      role="group"
      aria-label="Order view"
    >
      {VIEW_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          title={opt.hint}
          onClick={() => onChange(opt.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            value === opt.id
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white dark:shadow-none dark:ring-1 dark:ring-white/10"
              : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function OrderDetailModal({
  order,
  open,
  onClose,
  ordersLoading,
  onConfirm,
  onReject,
  onPrep,
  onLinePrep,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  ordersLoading: boolean;
  onConfirm: (id: string) => void;
  onReject: (order: Order) => void;
  onPrep: (id: string, status: PrepStatus) => void;
  onLinePrep: (orderId: string, lineId: string, status: LinePrepStatus) => void;
}) {
  const { mounted, shown } = useOverlayAnim(open);
  const loc = order ? locationLabel(order) : null;
  const pending = order ? isPendingPay(order) : false;
  const next = order ? nextPrepAction(order.prepStatus) : null;
  const nextMeta = PREP_ACTIONS.find((a) => a.status === next);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        className={`relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-transparent bg-white shadow-2xl transition-all duration-300 ease-out dark:border-gray-700/80 dark:bg-gray-900 dark:shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:rounded-3xl ${
          shown
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-[0.97] opacity-0 sm:translate-y-4"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Order detail
            </p>
            <h2
              id="order-detail-title"
              className="mt-0.5 text-xl font-semibold text-gray-900 dark:text-gray-50"
            >
              {loc ?? order.customerName}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {loc ? `${order.customerName} · ` : ""}
              {order.phone} · {timeAgo(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge label={orderStatusLabel(order)} tone={orderTone(order)} />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <span className="sr-only">Close</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {itemCount(order)} item{itemCount(order) === 1 ? "" : "s"}
              {order.estimatedWaitMinutes
                ? ` · guest wait ~${order.estimatedWaitMinutes} min`
                : ""}
            </p>
            <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-50">
              RWF {order.total.toLocaleString()}
            </p>
          </div>

          <ul className="space-y-3">
            {(order.items as OrderItem[]).map((item) => {
              const lineDone =
                item.linePrepStatus === "READY" || item.linePrepStatus === "SERVED";
              const lineNext =
                !item.linePrepStatus || item.linePrepStatus === "QUEUED"
                  ? "PREPARING"
                  : item.linePrepStatus === "PREPARING"
                    ? "READY"
                    : item.linePrepStatus === "READY"
                      ? "SERVED"
                      : null;
              return (
                <li
                  key={item.lineId ?? item.id}
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-700/60 dark:bg-gray-950/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                      {item.qty}
                    </span>
                    <div>
                      <p
                        className={`font-medium ${
                          lineDone
                            ? "text-gray-400 line-through dark:text-gray-600"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {item.name}
                      </p>
                      {(item.selectedModifiers ?? []).length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(item.selectedModifiers ?? [])
                            .map((m) => m.optionName)
                            .join(" · ")}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-sm italic text-gray-500 dark:text-gray-400">
                          “{item.specialInstructions}”
                        </p>
                      )}
                      {!pending && (
                        <div className="mt-1.5">
                          <StatusBadge
                            label={lineStatusLabel(item.linePrepStatus)}
                            tone={
                              item.linePrepStatus === "PREPARING"
                                ? "progress"
                                : item.linePrepStatus === "READY"
                                  ? "ready"
                                  : item.linePrepStatus === "SERVED"
                                    ? "done"
                                    : "neutral"
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {!pending && lineNext && item.lineId && (
                    <button
                      type="button"
                      onClick={() =>
                        onLinePrep(order.id, item.lineId!, lineNext as LinePrepStatus)
                      }
                      className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Mark{" "}
                      {LINE_ACTIONS.find((a) => a.status === lineNext)?.label.toLowerCase()}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {(order.notes || order.txId) && (
            <div className="mt-4 space-y-1 rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600 dark:bg-gray-950/70 dark:text-gray-400 dark:ring-1 dark:ring-gray-800">
              {order.notes && <p>Note: {order.notes}</p>}
              {order.txId && <p className="font-mono text-xs">TxId {order.txId}</p>}
            </div>
          )}

          {order.events && order.events.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                History
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                {order.events.slice(0, 8).map((ev) => (
                  <li key={ev.id}>
                    {new Date(ev.createdAt).toLocaleTimeString()} — {ev.action}
                    {ev.actorName ? ` (${ev.actorName})` : ""}
                    {ev.detail ? `: ${ev.detail}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/90 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/80">
          {pending ? (
            <>
              <Button
                disabled={ordersLoading}
                onClick={() => onConfirm(order.id)}
                className="min-w-[9rem]"
              >
                Confirm payment
              </Button>
              <Button variant="secondary" onClick={() => onReject(order)}>
                Reject
              </Button>
            </>
          ) : (
            <>
              {nextMeta && (
                <Button onClick={() => onPrep(order.id, nextMeta.status)}>
                  {nextMeta.status === "PREPARING" && "Start cooking"}
                  {nextMeta.status === "READY" && "Mark ready"}
                  {nextMeta.status === "SERVED" && "Mark served"}
                </Button>
              )}
              {PREP_ACTIONS.filter((a) => a.status !== next).map((action) => (
                <button
                  key={action.status}
                  type="button"
                  onClick={() => onPrep(order.id, action.status)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    order.prepStatus === action.status
                      ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                      : "text-gray-500 hover:bg-white dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </>
          )}
          <Button variant="ghost" className="ml-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BusinessOrdersPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [rejectReasons, setRejectReasons] = useState<{ code: string; label: string }[]>([]);
  const [soundOn, setSoundOn] = useState(() => isOrderAlertSoundEnabled());
  const [view, setView] = useState<OrdersView>(() => readStoredView());
  const [listPage, setListPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectFor, setRejectFor] = useState<Order | null>(null);
  const [rejectCode, setRejectCode] = useState("WRONG_TXID");
  const [rejectNote, setRejectNote] = useState("");
  const [notifyGuest, setNotifyGuest] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const rejectAnim = useOverlayAnim(Boolean(rejectFor));

  const announceNewOrder = useCallback(
    (order: Order) => {
      if (knownOrderIds.current.has(order.id)) return;
      knownOrderIds.current.add(order.id);
      setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [order, ...prev]));
      setListPage(1);
      setSuccess("New order received live.");
      if (soundOn) void playOrderAlertSound();
    },
    [soundOn],
  );

  const loadOrders = useCallback(
    async (opts?: { detectNew?: boolean }) => {
      try {
        const { orders: data, meta } = await orderApi.getBusinessOrders(1, 100);
        if (meta?.businessName) setBusinessName(meta.businessName);
        if (meta?.settings) setSettings(meta.settings);
        if (meta?.rejectReasons) setRejectReasons(meta.rejectReasons);

        if (opts?.detectNew && primed.current && soundOn) {
          for (const order of data) {
            if (!knownOrderIds.current.has(order.id)) {
              knownOrderIds.current.add(order.id);
              void playOrderAlertSound();
              setSuccess("New order received.");
              break;
            }
          }
        }
        for (const order of data) knownOrderIds.current.add(order.id);
        primed.current = true;
        setOrders(data);
      } catch {
        /* silent */
      }
    },
    [soundOn],
  );

  useEffect(() => {
    setIsLoading(true);
    loadOrders()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [loadOrders]);

  useEffect(() => {
    const unlock = () => void unlockOrderAlertSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const { status: socketStatus } = useOrdersSocket({
    enabled: Boolean(token),
    token,
    onOrderCreated: (order) => announceNewOrder(order),
    onOrderUpdated: (order) => {
      if ("deleted" in order && order.deleted) {
        knownOrderIds.current.delete(order.id);
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
        return;
      }
      const next = order as Order;
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === next.id);
        if (idx === -1) return prev;
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      });
      if (!knownOrderIds.current.has(next.id)) announceNewOrder(next);
    },
  });

  useEffect(() => {
    if (socketStatus === "connected") return;
    const id = setInterval(() => void loadOrders({ detectNew: true }), 8_000);
    return () => clearInterval(id);
  }, [socketStatus, loadOrders]);

  const changeView = (next: OrdersView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const openOrder = (order: Order) => {
    setSelectedId(order.id);
    setDetailOpen(true);
  };

  const closeDetail = useCallback(() => setDetailOpen(false), []);

  const activeOrders = useMemo(
    () => orders.filter((o) => isPendingPay(o) || isActivePrep(o)),
    [orders],
  );

  const listTotalPages = Math.max(1, Math.ceil(activeOrders.length / ORDERS_PER_PAGE));

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages]);

  const pagedOrders = useMemo(() => {
    const start = (listPage - 1) * ORDERS_PER_PAGE;
    return activeOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [activeOrders, listPage]);

  const pendingPay = useMemo(() => pagedOrders.filter(isPendingPay), [pagedOrders]);
  const cooking = useMemo(
    () =>
      activeOrders.filter(
        (o) =>
          o.status === "PAID" &&
          (o.prepStatus === "RECEIVED" || o.prepStatus === "PREPARING" || !o.prepStatus),
      ),
    [activeOrders],
  );
  const newPaid = useMemo(
    () =>
      pagedOrders.filter(
        (o) => o.status === "PAID" && (o.prepStatus === "RECEIVED" || !o.prepStatus),
      ),
    [pagedOrders],
  );
  const preparing = useMemo(
    () => pagedOrders.filter((o) => o.status === "PAID" && o.prepStatus === "PREPARING"),
    [pagedOrders],
  );
  const ready = useMemo(
    () => pagedOrders.filter((o) => o.status === "PAID" && o.prepStatus === "READY"),
    [pagedOrders],
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  const handleConfirm = async (orderId: string) => {
    setOrdersLoading(true);
    setError("");
    try {
      const updated = await orderApi.confirmOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSuccess("Payment confirmed — order is on the prep board.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOrdersLoading(false);
    }
  };

  const submitReject = async () => {
    if (!rejectFor) return;
    setOrdersLoading(true);
    setError("");
    try {
      const { order, notify } = await orderApi.rejectOrder(rejectFor.id, {
        reasonCode: rejectCode,
        reason: rejectNote || undefined,
        notifyGuest,
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      setRejectFor(null);
      setSuccess("Order rejected.");
      if (notifyGuest && notify?.whatsappUrl) {
        window.open(notify.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOrdersLoading(false);
    }
  };

  const handlePrep = async (orderId: string, prepStatus: PrepStatus) => {
    try {
      const updated = await orderApi.updatePrepStatus(orderId, prepStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (prepStatus === "READY") void playReadyBumpSound();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleLinePrep = async (
    orderId: string,
    lineId: string,
    linePrepStatus: LinePrepStatus,
  ) => {
    try {
      const updated = await orderApi.updateLinePrep(orderId, lineId, linePrepStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (linePrepStatus === "READY") void playReadyBumpSound();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleBusy = async () => {
    try {
      const profile = await businessApi.getMyBusiness();
      const nextBusy = !settings.busyMode;
      const nextSettings = {
        ...(profile.settings ?? {}),
        ...settings,
        busyMode: nextBusy,
      };
      await businessApi.upsertBusinessProfile({
        name: profile.name,
        businessType: profile.businessType ?? "RESTAURANT",
        category: profile.category,
        description: profile.description ?? undefined,
        location: profile.location ?? undefined,
        phone: profile.phone ?? undefined,
        email: profile.email ?? undefined,
        website: profile.website ?? undefined,
        paymentCode: profile.paymentCode ?? undefined,
        settings: nextSettings,
      });
      setSettings(nextSettings);
      setSuccess(nextBusy ? "Busy mode ON — guests cannot order." : "Busy mode OFF.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const saveWait = async () => {
    try {
      const profile = await businessApi.getMyBusiness();
      const nextSettings = {
        ...(profile.settings ?? {}),
        ...settings,
      };
      await businessApi.upsertBusinessProfile({
        name: profile.name,
        businessType: profile.businessType ?? "RESTAURANT",
        category: profile.category,
        description: profile.description ?? undefined,
        location: profile.location ?? undefined,
        phone: profile.phone ?? undefined,
        email: profile.email ?? undefined,
        website: profile.website ?? undefined,
        paymentCode: profile.paymentCode ?? undefined,
        settings: nextSettings,
      });
      setSettings(nextSettings);
      setSuccess("Kitchen wait settings saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) return <PageSpinner />;

  const isStaff = user?.role === "STAFF";

  const renderEmpty = () => (
    <div className={`rounded-2xl border-dashed py-14 text-center ${surfaceMuted}`}>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">No active orders</p>
      <p className={`mt-1 text-sm ${muted}`}>New guest orders will appear here live.</p>
    </div>
  );

  const listView = (
    <ul
      className={`divide-y divide-gray-100 overflow-hidden rounded-2xl dark:divide-gray-800 ${surface}`}
    >
      {pagedOrders.map((order) => {
        const loc = locationLabel(order);
        return (
          <li key={order.id}>
            <button
              type="button"
              onClick={() => openOrder(order)}
              className={`flex w-full items-center gap-3 border-l-4 px-4 py-3.5 text-left transition ${hoverRow} ${railClass(order)}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-gray-900 dark:text-gray-50">
                    {loc ?? order.customerName}
                  </p>
                  <StatusBadge label={orderStatusLabel(order)} tone={orderTone(order)} />
                </div>
                <p className={`mt-0.5 truncate text-sm ${muted}`}>
                  {itemSummary(order)} · {timeAgo(order.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                  RWF {order.total.toLocaleString()}
                </p>
                <p className={`text-xs ${mutedFaint}`}>{itemCount(order)} items</p>
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const gridView = (
    <ul className="grid gap-3 sm:grid-cols-2">
      {pagedOrders.map((order) => {
        const loc = locationLabel(order);
        return (
          <li key={order.id}>
            <button
              type="button"
              onClick={() => openOrder(order)}
              className={`flex h-full w-full flex-col rounded-2xl border-l-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] ${surface} ${railClass(order)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {loc ?? order.customerName}
                </p>
                <StatusBadge label={orderStatusLabel(order)} tone={orderTone(order)} />
              </div>
              <p className={`mt-1 text-sm ${muted}`}>
                {loc ? order.customerName : order.phone}
              </p>
              <p className="mt-3 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                {itemSummary(order, 4)}
              </p>
              <div className="mt-auto flex items-end justify-between pt-4">
                <span className={`text-xs ${mutedFaint}`}>{timeAgo(order.createdAt)}</span>
                <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                  RWF {order.total.toLocaleString()}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const boardColumn = (title: string, list: Order[], empty: string) => (
    <div className={`min-w-[220px] flex-1 rounded-2xl p-3 ${surfaceMuted}`}>
      <div className="mb-3 flex items-center gap-2 px-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:shadow-none dark:ring-1 dark:ring-white/10">
          {list.length}
        </span>
      </div>
      <ul className="space-y-2">
        {list.length === 0 && (
          <li className="rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
            {empty}
          </li>
        )}
        {list.map((order) => {
          const loc = locationLabel(order);
          return (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => openOrder(order)}
                className={`w-full rounded-xl p-3 text-left transition hover:border-gray-300 hover:shadow dark:hover:border-gray-600 dark:hover:bg-gray-800 ${surface}`}
              >
                <p className="font-semibold text-gray-900 dark:text-gray-50">
                  {loc ?? order.customerName}
                </p>
                <p className={`mt-1 line-clamp-2 text-xs ${muted}`}>
                  {itemSummary(order, 2)}
                </p>
                <div className="mt-2 flex justify-between text-xs">
                  <span className={mutedFaint}>{timeAgo(order.createdAt)}</span>
                  <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                    RWF {order.total.toLocaleString()}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const boardView = (
    <div className="-mx-1 flex gap-3 overflow-x-auto pb-2">
      {boardColumn("Payment", pendingPay, "None waiting")}
      {boardColumn("New", newPaid, "None new")}
      {boardColumn("Cooking", preparing, "None cooking")}
      {boardColumn("Ready", ready, "None ready")}
    </div>
  );

  const barsView = (
    <ul className="space-y-2">
      {pagedOrders.map((order) => {
        const loc = locationLabel(order);
        return (
          <li key={order.id}>
            <button
              type="button"
              onClick={() => openOrder(order)}
              className={`group w-full overflow-hidden rounded-xl text-left transition hover:border-gray-300 dark:hover:border-gray-600 ${surface}`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-50">
                      {loc ?? order.customerName}
                    </p>
                    <StatusBadge label={orderStatusLabel(order)} tone={orderTone(order)} />
                  </div>
                  <p className={`mt-0.5 truncate text-xs ${muted}`}>{itemSummary(order)}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-50">
                  RWF {order.total.toLocaleString()}
                </p>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-r-full transition-all duration-500 ${barFillClass(order)}`}
                  style={{ width: barFillWidth(order) }}
                />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="w-full space-y-4 pb-6">
      <header className={`rounded-2xl px-5 py-4 ${surface}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
              {businessName || "Orders"}
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              Live orders
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge
                label={`${pendingPay.length} to confirm`}
                tone={pendingPay.length ? "warn" : "neutral"}
              />
              <StatusBadge
                label={`${cooking.length + ready.length} in prep`}
                tone={cooking.length + ready.length ? "progress" : "neutral"}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                socketStatus === "connected"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-400/25"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  socketStatus === "connected" ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              {socketStatus === "connected" ? "Live" : "Connecting"}
            </span>
            <Button
              variant="secondary"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setOrderAlertSoundEnabled(next);
                void unlockOrderAlertSound();
                if (next) void playOrderAlertSound();
              }}
            >
              {soundOn ? "Sound on" : "Sound off"}
            </Button>
            {!isStaff && (
              <>
                <Button
                  variant="secondary"
                  className="!px-3 !py-1.5 text-xs"
                  onClick={() => void toggleBusy()}
                >
                  {settings.busyMode ? "Resume" : "Pause"}
                </Button>
                <Button
                  variant="secondary"
                  className="!px-3 !py-1.5 text-xs"
                  onClick={() => setSettingsOpen((v) => !v)}
                >
                  Settings
                </Button>
                <Button
                  variant="secondary"
                  className="!px-3 !py-1.5 text-xs"
                  onClick={async () => {
                    const blob = await orderApi.exportOrdersCsv();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "orders.csv";
                    a.click();
                  }}
                >
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {error && <Alert message={error} />}
      {success && <Alert message={success} type="success" />}

      {settings.busyMode && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100">
          Orders are paused — guests cannot place new orders until you resume.
        </p>
      )}

      {!isStaff && settingsOpen && (
        <section className={`rounded-2xl p-5 ${surface}`}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Guest wait estimate
          </h2>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className={`text-xs font-medium ${muted}`}>
              Minutes
              <input
                type="number"
                min={5}
                max={120}
                className="mt-1 block w-24 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                value={settings.estimatedWaitMinutes ?? 15}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    estimatedWaitMinutes: Number(e.target.value) || 15,
                  }))
                }
              />
            </label>
            <label className={`text-xs font-medium ${muted}`}>
              Kitchen load
              <select
                className="mt-1 block rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                value={settings.kitchenLoad ?? "NORMAL"}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    kitchenLoad: e.target.value as BusinessSettings["kitchenLoad"],
                  }))
                }
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <label className={`text-xs font-medium ${muted}`}>
              Happy hour
              <input
                className="mt-1 block w-36 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                placeholder="17:00-19:00"
                value={settings.happyHourWindow ?? ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, happyHourWindow: e.target.value }))
                }
              />
            </label>
            <Button onClick={() => void saveWait()} variant="secondary">
              Save
            </Button>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Active orders
          </h2>
          <p className={`text-xs ${muted}`}>
            Click an order to see items and take action
          </p>
        </div>
        <ViewSwitcher value={view} onChange={changeView} />
      </div>

      {activeOrders.length === 0
        ? renderEmpty()
        : view === "list"
          ? listView
          : view === "grid"
            ? gridView
            : view === "board"
              ? boardView
              : barsView}

      {activeOrders.length > 0 && listTotalPages > 1 && (
        <div className={`rounded-2xl px-4 py-3 ${surface}`}>
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing {(listPage - 1) * ORDERS_PER_PAGE + 1}–
              {Math.min(listPage * ORDERS_PER_PAGE, activeOrders.length)} of{" "}
              {activeOrders.length}
            </span>
            <span>
              Page {listPage} of {listTotalPages}
            </span>
          </div>
          <Pagination
            currentPage={listPage}
            totalPages={listTotalPages}
            onPageChange={setListPage}
          />
        </div>
      )}

      <OrderDetailModal
        order={selectedOrder}
        open={detailOpen && Boolean(selectedOrder)}
        onClose={closeDetail}
        ordersLoading={ordersLoading}
        onConfirm={(id) => void handleConfirm(id)}
        onReject={(order) => {
          setRejectFor(order);
          setRejectCode("WRONG_TXID");
          setRejectNote("");
        }}
        onPrep={(id, status) => void handlePrep(id, status)}
        onLinePrep={(orderId, lineId, status) =>
          void handleLinePrep(orderId, lineId, status)
        }
      />

      {rejectAnim.mounted && rejectFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              rejectAnim.shown ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setRejectFor(null)}
          />
          <div
            className={`relative z-10 w-full max-w-md rounded-2xl border border-transparent bg-white p-6 shadow-xl transition-all duration-300 ease-out dark:border-gray-700/80 dark:bg-gray-900 dark:shadow-[0_24px_64px_rgba(0,0,0,0.55)] ${
              rejectAnim.shown
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-3 scale-95 opacity-0"
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Reject order
            </h3>
            <p className={`mt-1 text-sm ${muted}`}>{rejectFor.customerName}</p>
            <label className={`mt-4 block text-xs font-medium ${muted}`}>
              Reason
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                value={rejectCode}
                onChange={(e) => setRejectCode(e.target.value)}
              >
                {(rejectReasons.length
                  ? rejectReasons
                  : [
                      { code: "WRONG_TXID", label: "Wrong TxId" },
                      { code: "OUT_OF_STOCK", label: "Out of stock" },
                      { code: "KITCHEN_CLOSED", label: "Kitchen closed" },
                      { code: "OTHER", label: "Other" },
                    ]
                ).map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
              rows={2}
              placeholder="Optional detail for the guest"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={notifyGuest}
                onChange={(e) => setNotifyGuest(e.target.checked)}
              />
              Open WhatsApp message to guest
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejectFor(null)}>
                Cancel
              </Button>
              <Button disabled={ordersLoading} onClick={() => void submitReject()}>
                Reject order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
