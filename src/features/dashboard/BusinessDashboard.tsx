import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconMenuBoard,
  IconOrders,
  IconPaid,
  IconPending,
  IconReceipt,
  IconRevenueLifetime,
  IconRevenueMonth,
  IconRevenueToday,
  IconRevenueTrend,
  IconSparkline,
  IconStorefront,
  IconVerification,
} from "../../components/icons/DashboardIcons";
import { businessApi, getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getChartColors } from "../../utils/chartTheme";
import type { BusinessEarningsDashboard } from "../../types";
import { Alert, MetricTile, PageSpinner, StatCard } from "../../components/ui";

function formatRwf(amount: number) {
  return `RWF ${amount.toLocaleString()}`;
}

function formatShortDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function orderStatusClass(status: string) {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400";
    case "REJECTED":
      return "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400";
    case "WAITING_VERIFICATION":
      return "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

export function BusinessDashboard() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const chartColors = getChartColors(resolvedTheme);

  const [data, setData] = useState<BusinessEarningsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    businessApi
      .getAnalytics()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <PageSpinner />;
  if (!data) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-gradient-to-br from-gray-500/[0.06] to-transparent text-gray-400">
          <IconStorefront size={28} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Set up your business
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Create your business profile to start tracking revenue and orders.
        </p>
        <Link to="/dashboard/menu" className="btn-primary mt-6 inline-flex">
          Create Business Profile
        </Link>
      </div>
    );
  }

  const setupSteps = [
    { done: data.setup.hasProfile, label: "Business profile" },
    { done: data.setup.hasPaymentCode, label: "MoMo payment code" },
    { done: data.setup.hasMenuItems, label: "Menu items" },
    { done: data.setup.hasLinkedCard, label: "Linked NFC card" },
  ];
  const setupComplete = setupSteps.every((step) => step.done);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Business Overview
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Hi, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {data.businessName} — earnings and order performance
        </p>
      </div>

      {error && <Alert message={error} />}

      {!setupComplete && (
        <div className="card-soft rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Complete your setup
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Finish these steps to start earning through your digital card.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {setupSteps.map((step) => (
              <div
                key={step.label}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  step.done
                    ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                    : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <span>{step.done ? "✓" : "○"}</span>
                {step.label}
              </div>
            ))}
          </div>
          <Link
            to="/dashboard/menu"
            className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:underline"
          >
            Go to business setup →
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Earned Today"
          value={formatRwf(data.revenue.today)}
          icon={<IconRevenueToday size={20} />}
          accent="brand"
        />
        <StatCard
          label="Last 7 Days"
          value={formatRwf(data.revenue.week)}
          icon={<IconRevenueTrend size={20} />}
          accent="emerald"
        />
        <StatCard
          label="Last 30 Days"
          value={formatRwf(data.revenue.month)}
          icon={<IconRevenueMonth size={20} />}
          accent="sky"
        />
        <StatCard
          label="All-Time Revenue"
          value={formatRwf(data.revenue.allTime)}
          icon={<IconRevenueLifetime size={20} />}
          accent="violet"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Pending"
          value={data.orders.pending}
          icon={<IconPending size={18} />}
          accent="slate"
        />
        <MetricTile
          label="Awaiting Verification"
          value={data.orders.waitingVerification}
          icon={<IconVerification size={18} />}
          accent="amber"
          valueClassName="text-amber-600 dark:text-amber-400"
        />
        <MetricTile
          label="Paid Today"
          value={data.orders.paidToday}
          icon={<IconPaid size={18} />}
          accent="emerald"
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <MetricTile
          label="Avg. Order Value"
          value={formatRwf(data.orders.avgOrderValue)}
          icon={<IconReceipt size={18} />}
          accent="brand"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">
            Revenue Trend (30 days)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyRevenue}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.brand} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={chartColors.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 10, fill: chartColors.tick }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: chartColors.tick }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                formatter={(value) => [formatRwf(Number(value)), "Revenue"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                contentStyle={chartColors.tooltip}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={chartColors.brand}
                fill="url(#revenueFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">
            Orders (30 days)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 10, fill: chartColors.tick }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: chartColors.tick }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={chartColors.tooltip}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Bar dataKey="count" fill={chartColors.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Top Selling Items</h2>
          </div>
          {data.topItems.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">
              Paid orders will show your best-performing menu items here.
            </p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.topItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.qty} sold
                    </p>
                  </div>
                  <p className="font-semibold text-brand-600 dark:text-brand-400">
                    {formatRwf(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h2>
            <Link
              to="/dashboard/orders"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">
              No orders yet. Share your card so customers can order.
            </p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatRwf(order.total)}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${orderStatusClass(order.status)}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/dashboard/orders" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
          <IconOrders size={18} />
          Manage Orders
        </Link>
        <Link to="/dashboard/menu" className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm">
          <IconMenuBoard size={18} />
          Business Menu
        </Link>
        <Link
          to="/dashboard/card-analytics"
          className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          <IconSparkline size={18} />
          Card Analytics
        </Link>
      </div>
    </div>
  );
}
