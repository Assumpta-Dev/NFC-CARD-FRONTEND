import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  MetricTile,
  PageSpinner,
  Pagination,
  PanelCard,
  SectionHeader,
} from "../../components/ui";
import {
  IconDownload,
  IconOrders,
  IconPaid,
  IconPending,
  IconTrash,
} from "../../components/icons/DashboardIcons";
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
  const paidCount = orders.filter(o => o.status === "PAID").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review and confirm customer orders. Auto-refreshes every 10 seconds.
        </p>
        {pendingCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            {pendingCount} pending
          </span>
        )}
      </div>

      {error && <Alert message={error} />}
      {success && <Alert message={success} type="success" />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricTile
          label="Pending"
          value={pendingCount}
          icon={<IconPending size={18} />}
          accent="amber"
        />
        <MetricTile
          label="Paid"
          value={paidCount}
          icon={<IconPaid size={18} />}
          accent="emerald"
        />
        <MetricTile
          label="Total Orders"
          value={orders.length}
          icon={<IconOrders size={18} />}
          accent="brand"
        />
      </div>

      <PanelCard>
        <SectionHeader
          title="Orders"
          description="Verify payment then confirm or reject each order."
          icon={<IconOrders size={18} />}
          accent="brand"
          action={
            <Button
              variant="secondary"
              onClick={handleExportOrders}
              disabled={orders.length === 0}
              className="gap-1.5 py-2 text-xs"
            >
              <IconDownload size={16} />
              Export CSV
            </Button>
          }
        />

        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {orders.length === 0 && (
            <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
              No orders yet. They will appear here when customers order.
            </p>
          )}

          {pagedOrders.map((order) => (
            <div key={order.id} className="p-5 sm:px-6">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {order.customerName}
                  </p>
                  {(order.orderContext === "ROOM" && order.roomNumber) ||
                  (order.orderContext === "TABLE" && order.tableNumber) ||
                  /\(.*\)$/.test(order.customerName) ? (
                    <span className="mt-0.5 inline-block rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
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
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  order.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" :
                  order.status === "REJECTED" ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400" :
                  order.status === "WAITING_VERIFICATION" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" :
                  "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {order.status.replace("_", " ")}
                </span>
              </div>

              <div className="mb-2 space-y-1">
                {(order.items as { name: string; qty: number; price: number }[]).map((item, i) => (
                  <p key={i} className="text-xs text-gray-600 dark:text-gray-400">
                    {item.name} &times; {item.qty} &mdash; RWF {(item.price * item.qty).toLocaleString()}
                  </p>
                ))}
              </div>

              <p className="mb-3 text-sm font-semibold text-brand-600 dark:text-brand-400">
                Total: RWF {order.total.toLocaleString()}
              </p>

              {order.txId && (
                <div className="mb-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">TxId from customer</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{order.txId}</p>
                </div>
              )}

              {(order.status === "WAITING_VERIFICATION" || order.status === "PENDING") && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleConfirmOrder(order.id)}
                    disabled={ordersLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-400"
                  >
                    Confirm Payment
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleRejectOrder(order.id)}
                    disabled={ordersLoading}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Reject
                  </Button>
                </div>
              )}

              {(order.status === "PAID" || order.status === "REJECTED") && (
                <Button
                  variant="ghost"
                  onClick={() => handleDeleteOrder(order.id)}
                  className="gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-red-500"
                >
                  <IconTrash size={14} />
                  Delete
                </Button>
              )}
            </div>
          ))}

          {totalOrderPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
              <Pagination
                currentPage={orderPage}
                totalPages={totalOrderPages}
                onPageChange={setOrderPage}
              />
            </div>
          )}
        </div>
      </PanelCard>
    </div>
  );
}
