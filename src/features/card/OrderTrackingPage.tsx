// ===========================================================
// ORDER TRACKING PAGE
// ===========================================================
// Public page — no auth required.
// Customer lands here after placing an order.
// URL: /order/:orderId
//
// States:
//   PENDING             — show USSD code to pay
//   WAITING_VERIFICATION — polite waiting message + spinner
//   PAID                — inline receipt preview + print/download
//   REJECTED            — rejection message
//
// Auto-polls every 5s until PAID or REJECTED.
// ===========================================================

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  HiOutlineCreditCard,
  HiOutlineClipboardList,
  HiOutlinePrinter,
  HiOutlinePhone,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
} from "react-icons/hi";
import { orderApi, getErrorMessage } from "../../services/api";
import { Order, OrderItem } from "../../types";
import { PageSpinner } from "../../components/ui";
import { useGuestOrderSocket } from "../../hooks/useGuestOrderSocket";

function guestSteps(order: Order) {
  if (order.status === "REJECTED") {
    return [
      { label: "Placed", done: true },
      { label: "Rejected", done: true, bad: true },
    ];
  }
  const paid = order.status === "PAID" || order.status === "WAITING_VERIFICATION";
  const prep = order.prepStatus ?? "NONE";
  const preparing = ["PREPARING", "READY", "SERVED"].includes(prep);
  const ready = ["READY", "SERVED"].includes(prep);
  const served = prep === "SERVED";
  const readyLabel = order.orderContext === "ROOM" ? "On the way" : "Ready";
  return [
    { label: "Placed", done: true },
    { label: "Paid", done: paid && order.status === "PAID" },
    { label: "Preparing", done: preparing },
    { label: readyLabel, done: ready },
    { label: "Served", done: served },
  ];
}

// ===========================================================
// RECEIPT PREVIEW — shown inline on the page before printing
// ===========================================================
function ReceiptPreview({ order, businessName }: { order: Order; businessName: string }) {
  const items = order.items as any[];
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-5">
      {/* Receipt header */}
      <div className="mb-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="icon-badge h-10 w-10 rounded-xl">
          <HiOutlineCreditCard className="text-lg" />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-gray-100">E-Card</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{businessName}</p>
        </div>
        <span className="ml-auto rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
          Confirmed
        </span>
      </div>

      {/* Order meta */}
      <div className="mb-4 space-y-1 text-xs text-gray-500 dark:text-gray-400">
        <p><span className="font-semibold text-gray-700 dark:text-gray-300">Order:</span> #{order.id.slice(-6).toUpperCase()}</p>
        <p><span className="font-semibold text-gray-700 dark:text-gray-300">Customer:</span> {order.customerName}</p>
        <p><span className="font-semibold text-gray-700 dark:text-gray-300">Phone:</span> {order.phone}</p>
        <p><span className="font-semibold text-gray-700 dark:text-gray-300">Date:</span> {new Date(order.createdAt).toLocaleString()}</p>
        {order.txId && <p><span className="font-semibold text-gray-700 dark:text-gray-300">TxId:</span> {order.txId}</p>}
      </div>

      {/* Items */}
      <div className="mb-3 space-y-2">
        {items.map((item, i) => {
          const mods = (item.selectedModifiers ?? [])
            .map((m: { optionName: string }) => m.optionName)
            .join(", ");
          return (
            <div key={i} className="flex items-start gap-3">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="h-9 w-9 rounded-lg object-cover" />
              )}
              <div className="flex-grow">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                {mods && <p className="text-[11px] text-gray-500">{mods}</p>}
                {item.specialInstructions && (
                  <p className="text-[11px] italic text-[#DE3A16]">“{item.specialInstructions}”</p>
                )}
                <p className="text-xs text-gray-400">x{item.qty}</p>
              </div>
              <p className="text-sm font-bold text-[#DE3A16]">RWF {(item.price * item.qty).toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {order.notes && (
        <p className="mb-3 text-xs text-amber-800 dark:text-amber-200">
          <span className="font-semibold">Note: </span>
          {order.notes}
        </p>
      )}

      {/* Total */}
      <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3 text-sm font-bold">
        <span className="text-gray-700 dark:text-gray-300">Total</span>
        <span className="text-[#DE3A16]">RWF {order.total.toLocaleString()}</span>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        Thank you for your order · Powered by E-Card Platform
      </p>
    </div>
  );
}

// ===========================================================
// PRINT RECEIPT — opens a clean printable window
// ===========================================================
function printReceipt(order: Order, businessName: string) {
  const items = (order.items as any[])
    .map(
      (i) =>
        `<tr>
          <td>${i.name}</td>
          <td style="text-align:center">x${i.qty}</td>
          <td style="text-align:right">RWF ${(i.price * i.qty).toLocaleString()}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <title>Receipt #${order.id.slice(-6).toUpperCase()}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 420px; margin: 40px auto; color: #1a1a1a; padding: 0 16px; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .brand-icon { width: 36px; height: 36px; background: #fdf3f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .brand-name { font-size: 18px; font-weight: 700; color: #DE3A16; }
        .business { color: #888; font-size: 13px; margin-bottom: 20px; }
        .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; font-weight: 700; padding: 4px 14px; border-radius: 20px; font-size: 12px; margin-bottom: 16px; }
        .meta { font-size: 13px; color: #555; margin-bottom: 20px; line-height: 1.8; }
        .meta strong { color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; color: #aaa; padding: 6px 0; border-bottom: 1px solid #eee; }
        th:last-child { text-align: right; }
        th:nth-child(2) { text-align: center; }
        td { padding: 9px 0; font-size: 14px; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
        .total-row { font-size: 15px; font-weight: 700; }
        .total-row td { border-bottom: none; padding-top: 12px; }
        .total-amount { color: #DE3A16; text-align: right; }
        .footer { margin-top: 28px; font-size: 11px; color: #bbb; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="brand">
        <div class="brand-icon">
          <svg width="18" height="18" fill="none" stroke="#DE3A16" stroke-width="2" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M2 10h20"/>
          </svg>
        </div>
        <span class="brand-name">E-Card</span>
      </div>
      <p class="business">${businessName}</p>
      <span class="badge">Payment Confirmed</span>
      <div class="meta">
        <strong>Order:</strong> #${order.id.slice(-6).toUpperCase()}<br/>
        <strong>Customer:</strong> ${order.customerName}<br/>
        <strong>Phone:</strong> ${order.phone}<br/>
        <strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}<br/>
        ${order.txId ? `<strong>TxId:</strong> ${order.txId}` : ""}
      </div>
      <table>
        <thead>
          <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr>
        </thead>
        <tbody>
          ${items}
          <tr class="total-row">
            <td colspan="2"><strong>Total</strong></td>
            <td class="total-amount"><strong>RWF ${order.total.toLocaleString()}</strong></td>
          </tr>
        </tbody>
      </table>
      <p class="footer">Thank you for your order &middot; Powered by E-Card Platform</p>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }
}

// ===========================================================
// STATUS BADGE
// ===========================================================
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING:              { label: "Pending Payment",       className: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
    WAITING_VERIFICATION: { label: "Awaiting Confirmation", className: "bg-amber-50 text-amber-600" },
    PAID:                 { label: "Payment Confirmed",     className: "bg-green-100 text-green-700" },
    REJECTED:             { label: "Payment Rejected",      className: "bg-red-100 text-red-600" },
  };
  const { label, className } = map[status] ?? { label: status, className: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

// ===========================================================
// MAIN PAGE
// ===========================================================
export function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive business name from order once loaded
  const businessName = order?.business?.name ?? "E-Card Business";

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const result = await orderApi.getOrderStatus(orderId);
      setOrder(result);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!orderId) { setError("Order ID is missing."); setIsLoading(false); return; }
    orderApi.getOrderStatus(orderId)
      .then((result) => setOrder(result))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  useGuestOrderSocket({
    orderId,
    enabled: Boolean(orderId),
    onUpdate: (updated) => setOrder(updated),
  });

  // Poll fallback while payment / prep not finished
  useEffect(() => {
    if (!order) return;
    const done =
      order.status === "REJECTED" ||
      (order.status === "PAID" && order.prepStatus === "SERVED");
    if (done) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(fetchOrder, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [order?.status, order?.prepStatus]);

  if (isLoading) return <PageSpinner />;

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 p-6">
        <div className="card-soft w-full max-w-sm rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8 text-center">
          <div className="icon-badge mx-auto mb-4 h-16 w-16 rounded-3xl">
            <HiOutlineExclamationCircle className="text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Order Not Found</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error || "This order does not exist."}</p>
        </div>
      </div>
    );
  }

  const items = order.items as OrderItem[];
  const steps = guestSteps(order);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-16">
      <div className="mx-auto w-full max-w-sm animate-slide-up px-4 pt-8">

        {/* Brand header */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="icon-badge h-9 w-9 rounded-xl">
            <HiOutlineCreditCard className="text-lg" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">E-Card</span>
        </div>

        {/* Order header card */}
        <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6 text-center">
          <div className="icon-badge mx-auto mb-4 h-14 w-14 rounded-2xl">
            <HiOutlineClipboardList className="text-2xl" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Order Tracking</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">#{order.id.slice(-6).toUpperCase()}</p>
          <div className="mt-3">
            <StatusBadge status={order.status} />
          </div>
          {order.estimatedWaitMinutes && order.status !== "REJECTED" && order.prepStatus !== "SERVED" && (
            <p className="mt-2 text-sm font-semibold text-[#DE3A16]">
              Est. wait ~{order.estimatedWaitMinutes} min
            </p>
          )}
        </div>

        {/* Live status timeline */}
        <div className="card-soft mb-4 rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <p className="section-label mb-3">Status</p>
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.done
                      ? (step as { bad?: boolean }).bad
                        ? "bg-red-500 text-white"
                        : "bg-[#DE3A16] text-white"
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                  }`}
                >
                  {step.done ? "✓" : idx + 1}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    step.done ? "text-gray-900 dark:text-gray-100" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          {order.status === "REJECTED" && (order.rejectReason || order.rejectReasonCode) && (
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {order.rejectReason ?? order.rejectReasonCode}
            </p>
          )}
        </div>

        {/* Customer info */}
        <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-5">
          <p className="section-label mb-3">Customer</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {order.customerName.replace(/\s*\(.*\)$/, "")}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <HiOutlinePhone className="text-sm" /> {order.phone}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Placed: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Order items */}
        <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-5">
          <p className="section-label mb-3">Items Ordered</p>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                )}
                <div className="flex-grow">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                  {(item.selectedModifiers ?? []).length > 0 && (
                    <p className="text-[11px] text-gray-500">
                      {(item.selectedModifiers ?? []).map((m) => m.optionName).join(", ")}
                    </p>
                  )}
                  {item.specialInstructions && (
                    <p className="text-[11px] italic text-[#DE3A16]">“{item.specialInstructions}”</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    x{item.qty}
                    {item.linePrepStatus ? ` · ${item.linePrepStatus}` : ""}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#DE3A16]">RWF {(item.price * item.qty).toLocaleString()}</p>
              </div>
            ))}
          </div>
          {order.notes && (
            <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Note: </span>
              {order.notes}
            </p>
          )}
          <div className="mt-4 flex justify-between border-t pt-3 text-sm font-bold">
            <span>Total</span>
            <span className="text-[#DE3A16]">RWF {order.total.toLocaleString()}</span>
          </div>
        </div>

        {/* PENDING — USSD code */}
        {order.status === "PENDING" && (
          <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-5 text-center">
            <p className="section-label mb-3">Pay Now</p>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Dial this USSD code on your phone</p>
            <p className="break-all text-lg font-bold text-[#DE3A16]">
              *182*8*1*XXXXXXX*{order.total}#
            </p>
            <p className="mt-3 text-xs text-gray-400">
              After paying, go back to the menu and submit your TxId.
            </p>
          </div>
        )}

        {/* WAITING_VERIFICATION — polite spinner */}
        {order.status === "WAITING_VERIFICATION" && (
          <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#DE3A16] border-t-transparent" />
            <p className="font-semibold text-gray-900 dark:text-gray-100">Please wait</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              We are reviewing your order for confirmation. This usually takes just a moment — thank you for your patience.
            </p>
            {order.txId && (
              <div className="mt-4 rounded-xl bg-[#fdf3f0] px-4 py-2 text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400">Your Transaction ID</p>
                <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{order.txId}</p>
              </div>
            )}
          </div>
        )}

        {/* PAID — inline receipt preview + print button */}
        {order.status === "PAID" && (
          <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-5">
            {/* Confirmed banner */}
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-green-50 p-3">
              <HiOutlineCheckCircle className="flex-shrink-0 text-2xl text-green-600" />
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">Payment Confirmed!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your order has been verified successfully.</p>
              </div>
            </div>

            {/* Inline receipt preview */}
            <p className="section-label mb-3">Your Receipt</p>
            <ReceiptPreview order={order} businessName={businessName} />

            {/* Print / download button */}
            <button
              onClick={() => printReceipt(order, businessName)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#DE3A16] py-3 text-sm font-bold text-white shadow-lg shadow-[#DE3A16]/20 transition-all hover:bg-[#c43312]"
            >
              <HiOutlinePrinter className="text-lg" />
              Print / Download Receipt
            </button>
          </div>
        )}

        {/* REJECTED */}
        {order.status === "REJECTED" && (
          <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <HiOutlineXCircle className="text-3xl text-red-500" />
            </div>
            <p className="font-bold text-gray-900 dark:text-gray-100">Payment Rejected</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              We could not verify your payment. Please contact the business directly for assistance.
            </p>
          </div>
        )}

        {/* Auto-refresh notice */}
        {(order.status === "PENDING" || order.status === "WAITING_VERIFICATION") && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <HiOutlineRefresh className="text-sm" />
            This page updates automatically every 5 seconds
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">Powered by E-Card Platform</p>
      </div>
    </div>
  );
}
