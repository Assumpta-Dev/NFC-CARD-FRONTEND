import { useEffect, useRef, useState } from "react";
import {
  HiOutlineClipboardList,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineDownload,
  HiOutlineTrash,
} from "react-icons/hi";
import { Alert, PageSpinner } from "../../components/ui";
import { getErrorMessage, orderApi } from "../../services/api";
import { Order } from "../../types";

const ORDERS_PER_PAGE = 10;

export function BusinessOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrders = async () => {
    try {
      const { orders: data } = await orderApi.getBusinessOrders();
      setOrders(data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    setIsLoading(true);
    loadOrders().finally(() => setIsLoading(false));
    intervalRef.current = setInterval(loadOrders, 10_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleConfirmOrder = async (orderId: string) => {
    setOrdersLoading(true);
    setError("");
    try {
      await orderApi.confirmOrder(orderId);
      await loadOrders();
      setSuccess("Order confirmed successfully.");
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setOrdersLoading(false); }
  };

  const handleRejectOrder = async (orderId: string) => {
    setOrdersLoading(true);
    setError("");
    try {
      await orderApi.rejectOrder(orderId);
      await loadOrders();
      setSuccess("Order rejected.");
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setOrdersLoading(false); }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Delete this order? This cannot be undone.")) return;
    setError("");
    try {
      await orderApi.deleteOrder(orderId);
      // Reload from server to confirm deletion took effect
      await loadOrders();
      setSuccess("Order deleted.");
    } catch (err) { setError(getErrorMessage(err)); }
  };

  const handleExportOrders = async () => {
    try {
      const blob = await orderApi.exportOrdersCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(getErrorMessage(err)); }
  };

  if (isLoading) return <PageSpinner />;

  const totalOrderPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const pagedOrders = orders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);
  const pendingCount = orders.filter(o => o.status === "PENDING" || o.status === "WAITING_VERIFICATION").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review and confirm customer orders. Auto-refreshes every 10 seconds.
        </p>
        {pendingCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-[#DE3A16] px-2 py-0.5 text-xs font-bold text-white">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="space-y-4">
        {error && <Alert message={error} />}
        {success && <Alert message={success} type="success" />}

        <div className="card-soft overflow-hidden rounded-2xl bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
            <HiOutlineClipboardList className="text-xl text-[#DE3A16]" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Orders</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Verify payment then confirm or reject each order.
              </p>
            </div>
            <button
              onClick={handleExportOrders}
              disabled={orders.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 transition-colors hover:border-[#DE3A16] hover:text-[#DE3A16] disabled:opacity-40"
            >
              <HiOutlineDownload className="text-sm" /> Export CSV
            </button>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {orders.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                No orders yet. They will appear here when customers order.
              </div>
            )}

            {pagedOrders.map((order) => (
              <div key={order.id} className="p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {order.customerName}
                    </p>
                    {(order.orderContext === "ROOM" && order.roomNumber) ||
                    (order.orderContext === "TABLE" && order.tableNumber) ||
                    /\(.*\)$/.test(order.customerName) ? (
                      <span className="inline-block mt-0.5 rounded-full bg-[#fdf3f0] dark:bg-brand-500/15 px-2 py-0.5 text-xs font-semibold text-[#DE3A16] dark:text-brand-400">
                        {order.orderContext === "ROOM" && order.roomNumber
                          ? `Room ${order.roomNumber}`
                          : order.orderContext === "TABLE" && order.tableNumber
                            ? `Table ${order.tableNumber}`
                            : order.customerName.match(/\((.*)\)$/)?.[1]}
                      </span>
                    ) : null}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {order.phone} &middot; {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    order.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
                    order.status === "REJECTED" ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400" :
                    order.status === "WAITING_VERIFICATION" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" :
                    "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mb-2 space-y-1">
                  {(order.items as any[]).map((item, i) => (
                    <p key={i} className="text-xs text-gray-600 dark:text-gray-400">
                      {item.name} &times; {item.qty} &mdash; RWF {(item.price * item.qty).toLocaleString()}
                    </p>
                  ))}
                </div>

                <p className="mb-3 text-sm font-bold text-[#DE3A16]">
                  Total: RWF {order.total.toLocaleString()}
                </p>

                {order.txId && (
                  <div className="mb-3 rounded-xl bg-[#fdf3f0] dark:bg-gray-800 px-4 py-2 border border-transparent dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">TxId from customer</p>
                    <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{order.txId}</p>
                  </div>
                )}

                {(order.status === "WAITING_VERIFICATION" || order.status === "PENDING") && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleConfirmOrder(order.id)}
                      disabled={ordersLoading}
                      className="flex items-center gap-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <HiOutlineCheck /> Confirm Payment
                    </button>
                    <button
                      onClick={() => handleRejectOrder(order.id)}
                      disabled={ordersLoading}
                      className="flex items-center gap-1 rounded-xl border border-red-300 dark:border-red-500/40 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 disabled:opacity-60"
                    >
                      <HiOutlineX /> Reject
                    </button>
                  </div>
                )}

                {(order.status === "PAID" || order.status === "REJECTED") && (
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:border-red-300 hover:text-red-500"
                  >
                    <HiOutlineTrash className="text-sm" /> Delete
                  </button>
                )}
              </div>
            ))}

            {totalOrderPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-5 py-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {orderPage} of {totalOrderPages} &middot; {orders.length} orders
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                    disabled={orderPage === 1}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p + 1))}
                    disabled={orderPage === totalOrderPages}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
