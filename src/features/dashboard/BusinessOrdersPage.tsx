import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  MetricTile,
  PageSpinner,
  PanelCard,
  SectionHeader,
} from "../../components/ui";
import {
  IconDownload,
  IconOrders,
  IconPaid,
  IconPending,
} from "../../components/icons/DashboardIcons";
import { useAuth } from "../../contexts/AuthContext";
import { useOrdersSocket } from "../../hooks/useOrdersSocket";
import { businessApi, getErrorMessage, orderApi } from "../../services/api";
import {
  BusinessSettings,
  LinePrepStatus,
  Order,
  OrderItem,
  PrepStation,
  PrepStatus,
} from "../../types";
import {
  isOrderAlertSoundEnabled,
  playOrderAlertSound,
  setOrderAlertSoundEnabled,
  unlockOrderAlertSound,
} from "../../utils/orderAlertSound";
import { playReadyBumpSound } from "../../utils/readyBumpSound";

const PREP_FLOW: PrepStatus[] = ["RECEIVED", "PREPARING", "READY", "SERVED"];
const STATIONS: { value: PrepStation | "ALL"; label: string }[] = [
  { value: "ALL", label: "All stations" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "BAR", label: "Bar" },
  { value: "FLOOR", label: "Floor / room" },
];

function locationLabel(order: Order) {
  if (order.orderContext === "ROOM" && order.roomNumber) return `Room ${order.roomNumber}`;
  if (order.orderContext === "BAR_SEAT" && order.tableNumber) {
    return `Bar seat ${order.tableNumber}`;
  }
  if (order.tableNumber) return `Table ${order.tableNumber}`;
  return null;
}

function guestTimeline(order: Order) {
  const steps = [
    { key: "PLACED", label: "Placed", done: true },
    {
      key: "PAID",
      label: "Paid",
      done: order.status === "PAID" || order.status === "WAITING_VERIFICATION",
    },
    {
      key: "PREPARING",
      label: "Preparing",
      done: ["PREPARING", "READY", "SERVED"].includes(order.prepStatus ?? ""),
    },
    {
      key: "READY",
      label: order.orderContext === "ROOM" ? "On the way" : "Ready",
      done: ["READY", "SERVED"].includes(order.prepStatus ?? ""),
    },
    { key: "SERVED", label: "Served", done: order.prepStatus === "SERVED" },
  ];
  if (order.status === "REJECTED") {
    return [{ key: "REJECTED", label: "Rejected", done: true }];
  }
  return steps;
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
  const [stationFilter, setStationFilter] = useState<PrepStation | "ALL">("ALL");
  const [soundOn, setSoundOn] = useState(() => isOrderAlertSoundEnabled());
  const [rejectFor, setRejectFor] = useState<Order | null>(null);
  const [rejectCode, setRejectCode] = useState("WRONG_TXID");
  const [rejectNote, setRejectNote] = useState("");
  const [notifyGuest, setNotifyGuest] = useState(true);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  const announceNewOrder = useCallback(
    (order: Order) => {
      if (knownOrderIds.current.has(order.id)) return;
      knownOrderIds.current.add(order.id);
      setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [order, ...prev]));
      setSuccess("New order received live.");
      if (soundOn) void playOrderAlertSound();
    },
    [soundOn],
  );

  const loadOrders = useCallback(async (opts?: { detectNew?: boolean }) => {
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
  }, [soundOn]);

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

  const visibleOrders = useMemo(() => {
    if (stationFilter === "ALL") return orders;
    return orders.filter((o) =>
      (o.items as OrderItem[]).some((i) => (i.station ?? "KITCHEN") === stationFilter),
    );
  }, [orders, stationFilter]);

  const activeKds = visibleOrders.filter(
    (o) => o.status === "PAID" && o.prepStatus !== "SERVED" && o.prepStatus !== "CANCELLED",
  );
  const pendingPay = orders.filter(
    (o) => o.status === "PENDING" || o.status === "WAITING_VERIFICATION",
  );

  const handleConfirm = async (orderId: string) => {
    setOrdersLoading(true);
    setError("");
    try {
      const updated = await orderApi.confirmOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSuccess("Payment confirmed — sent to stations.");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {businessName ? `${businessName} · ` : ""}
          Live KDS{isStaff ? " (staff)" : ""}
        </p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            socketStatus === "connected"
              ? "bg-emerald-500/15 text-emerald-600"
              : "bg-amber-500/15 text-amber-700"
          }`}
        >
          {socketStatus === "connected" ? "Live" : "Connecting…"}
        </span>
        <button
          type="button"
          onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            setOrderAlertSoundEnabled(next);
            void unlockOrderAlertSound();
            if (next) void playOrderAlertSound();
          }}
          className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-600"
        >
          {soundOn ? "Sound on" : "Sound off"}
        </button>
        {!isStaff && (
          <button
            type="button"
            onClick={() => void toggleBusy()}
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              settings.busyMode
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800"
            }`}
          >
            {settings.busyMode ? "Busy mode ON" : "Busy mode"}
          </button>
        )}
      </div>

      {error && <Alert message={error} />}
      {success && <Alert message={success} type="success" />}

      {!isStaff && (
        <PanelCard>
          <SectionHeader
            title="Kitchen load & wait"
            description="Guests see this ETA when ordering and on the tracking page."
            icon={<IconOrders size={18} />}
            accent="brand"
          />
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs text-gray-500">
              Base minutes
              <input
                type="number"
                min={5}
                max={120}
                className="mt-1 block w-24 rounded-lg border px-2 py-1.5 text-sm dark:bg-gray-900"
                value={settings.estimatedWaitMinutes ?? 15}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    estimatedWaitMinutes: Number(e.target.value) || 15,
                  }))
                }
              />
            </label>
            <label className="text-xs text-gray-500">
              Load
              <select
                className="mt-1 block rounded-lg border px-2 py-1.5 text-sm dark:bg-gray-900"
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
            <label className="text-xs text-gray-500">
              Happy hour (e.g. 17:00-19:00)
              <input
                className="mt-1 block w-40 rounded-lg border px-2 py-1.5 text-sm dark:bg-gray-900"
                value={settings.happyHourWindow ?? ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, happyHourWindow: e.target.value }))
                }
              />
            </label>
            <Button onClick={() => void saveWait()} className="text-xs">
              Save
            </Button>
          </div>
        </PanelCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricTile label="Awaiting pay" value={pendingPay.length} icon={<IconPending size={18} />} accent="amber" />
        <MetricTile label="In prep" value={activeKds.length} icon={<IconOrders size={18} />} accent="brand" />
        <MetricTile
          label="Paid today-ish"
          value={orders.filter((o) => o.status === "PAID").length}
          icon={<IconPaid size={18} />}
          accent="emerald"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStationFilter(s.value)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              stationFilter === s.value
                ? "bg-[#DE3A16] text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {s.label}
          </button>
        ))}
        {!isStaff && (
          <Button
            variant="secondary"
            className="ml-auto gap-1.5 py-1.5 text-xs"
            onClick={async () => {
              const blob = await orderApi.exportOrdersCsv();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "orders.csv";
              a.click();
            }}
          >
            <IconDownload size={14} /> Export
          </Button>
        )}
      </div>

      {/* Payment queue */}
      {pendingPay.length > 0 && (
        <PanelCard>
          <SectionHeader title="Payment queue" description="Confirm or reject with a reason." icon={<IconPending size={18} />} accent="amber" />
          <div className="divide-y dark:divide-gray-800">
            {pendingPay.map((order) => (
              <div key={order.id} className="p-4">
                <div className="mb-2 flex justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {locationLabel(order)} · {order.phone}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600">{order.status.replace("_", " ")}</span>
                </div>
                {(order.items as OrderItem[]).map((item, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    <span className="font-semibold">{item.name}</span>
                    {(item.selectedModifiers ?? []).length
                      ? ` · ${(item.selectedModifiers ?? []).map((m) => m.optionName).join(", ")}`
                      : ""}
                    {item.specialInstructions ? ` — “${item.specialInstructions}”` : ""}
                  </p>
                ))}
                {order.notes && (
                  <p className="mt-1 text-xs italic text-amber-800">Note: {order.notes}</p>
                )}
                <p className="mt-2 text-sm font-bold text-[#DE3A16]">
                  RWF {order.total.toLocaleString()}
                  {order.estimatedWaitMinutes ? ` · ~${order.estimatedWaitMinutes} min` : ""}
                </p>
                {order.txId && (
                  <p className="mt-1 font-mono text-xs">TxId: {order.txId}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    disabled={ordersLoading}
                    onClick={() => void handleConfirm(order.id)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Confirm payment
                  </Button>
                  <Button
                    variant="secondary"
                    className="border-red-200 text-red-600"
                    onClick={() => {
                      setRejectFor(order);
                      setRejectCode("WRONG_TXID");
                      setRejectNote("");
                    }}
                  >
                    Reject…
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {/* KDS cards */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
          Station tickets
        </h2>
        {activeKds.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No active prep tickets for this station.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeKds.map((order) => {
              const loc = locationLabel(order);
              const lines = (order.items as OrderItem[]).filter(
                (i) =>
                  stationFilter === "ALL" ||
                  (i.station ?? "KITCHEN") === stationFilter,
              );
              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border-2 p-4 shadow-sm dark:bg-gray-900 ${
                    order.prepStatus === "READY"
                      ? "border-emerald-500 bg-emerald-50/40"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-black tracking-tight">
                        {loc ?? order.customerName}
                      </p>
                      <p className="text-xs text-gray-500">{order.customerName}</p>
                    </div>
                    <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                      {order.prepStatus}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1">
                    {guestTimeline(order).map((s) => (
                      <span
                        key={s.key}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          s.done ? "bg-[#DE3A16] text-white" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {lines.map((item) => (
                      <div
                        key={item.lineId ?? item.id}
                        className="rounded-xl bg-white/80 p-2 dark:bg-gray-950/50"
                      >
                        <p className="text-sm font-bold">
                          {item.qty}× {item.name}
                          <span className="ml-2 text-[10px] font-semibold uppercase text-gray-400">
                            {item.station ?? "KITCHEN"}
                          </span>
                        </p>
                        {(item.selectedModifiers ?? []).length > 0 && (
                          <p className="text-xs font-semibold text-[#DE3A16]">
                            {(item.selectedModifiers ?? []).map((m) => m.optionName).join(" · ")}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-xs italic text-gray-600">
                            “{item.specialInstructions}”
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {(["PREPARING", "READY", "SERVED"] as LinePrepStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() =>
                                item.lineId &&
                                void handleLinePrep(order.id, item.lineId, st)
                              }
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                item.linePrepStatus === st
                                  ? "bg-sky-600 text-white"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800"
                              }`}
                            >
                              {st === "READY" ? "BUMP READY" : st}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-2 text-right text-xs text-gray-400">
                    RWF {order.total.toLocaleString()}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {PREP_FLOW.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void handlePrep(order.id, status)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                          order.prepStatus === status
                            ? "bg-sky-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        {status === "READY" ? "CALL READY" : status}
                      </button>
                    ))}
                  </div>

                  {order.events && order.events.length > 0 && (
                    <div className="mt-3 border-t pt-2 text-[10px] text-gray-500 dark:border-gray-800">
                      <p className="mb-1 font-semibold uppercase">Audit</p>
                      {order.events.slice(0, 4).map((ev) => (
                        <p key={ev.id}>
                          {new Date(ev.createdAt).toLocaleTimeString()} · {ev.action}
                          {ev.actorName ? ` · ${ev.actorName}` : ""}
                          {ev.detail ? ` — ${ev.detail}` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-bold">Reject order</h3>
            <p className="mt-1 text-sm text-gray-500">{rejectFor.customerName}</p>
            <label className="mt-4 block text-xs font-semibold text-gray-500">
              Reason
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm dark:bg-gray-950"
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
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm dark:bg-gray-950"
              rows={2}
              placeholder="Optional extra detail for the guest"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyGuest}
                onChange={(e) => setNotifyGuest(e.target.checked)}
              />
              Open WhatsApp message to guest
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRejectFor(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                disabled={ordersLoading}
                onClick={() => void submitReject()}
              >
                Reject order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
