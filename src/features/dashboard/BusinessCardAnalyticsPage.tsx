import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  IconDesktop,
  IconMobile,
  IconNfcTap,
  IconPulse,
  IconRadar,
} from "../../components/icons/DashboardIcons";
import { businessApi, getErrorMessage } from "../../services/api";
import { useTheme } from "../../contexts/ThemeContext";
import { getChartColors } from "../../utils/chartTheme";
import type { BusinessScanDashboard } from "../../types";
import { Alert, MetricTileCompact, PageSpinner, Pagination } from "../../components/ui";

type TimeFilter = "7d" | "30d" | "all";

const CARDS_PER_PAGE = 6;

export function BusinessCardAnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const chartColors = getChartColors(resolvedTheme);

  const [data, setData] = useState<BusinessScanDashboard | null>(null);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [cardPage, setCardPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    businessApi
      .getScanAnalytics()
      .then((result) => {
        setData(result);
        if (result.cards.length > 0) {
          setSelectedCardId(result.cards[0].cardId);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCardId) return;
    businessApi
      .getScanAnalytics(selectedCardId)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)));
  }, [selectedCardId]);

  if (isLoading) return <PageSpinner />;

  const cards = data?.cards ?? [];
  const cardTotalPages = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE));
  const safeCardPage = Math.min(cardPage, cardTotalPages);
  const pagedCards = cards.slice(
    (safeCardPage - 1) * CARDS_PER_PAGE,
    safeCardPage * CARDS_PER_PAGE,
  );

  const analytics = data?.analytics;
  const filteredBreakdown =
    analytics?.dailyBreakdown.filter((_, i, arr) => {
      if (timeFilter === "7d") return i >= arr.length - 7;
      if (timeFilter === "30d") return i >= arr.length - 30;
      return true;
    }) ?? [];

  const periodTotal = filteredBreakdown.reduce((sum, d) => sum + d.count, 0);
  const displayTotal =
    timeFilter === "all" ? (analytics?.totalScans ?? 0) : periodTotal;

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          NFC Engagement
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Card Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Track scans and device engagement on your linked business cards
        </p>
      </div>

      {error && <Alert message={error} />}

      {!data || data.cards.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-gradient-to-br from-brand-500/[0.08] to-transparent text-brand-500 dark:text-brand-400">
            <IconNfcTap size={28} />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100">No linked cards</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Link an NFC card to your business to start tracking scans.
          </p>
          <Link to="/dashboard/menu" className="btn-primary mt-6 inline-flex">
            Link a Card
          </Link>
        </div>
      ) : (
        <>
          {data.summary && (
            <div className="grid grid-cols-3 gap-3">
              <MetricTileCompact
                hint="Today"
                label="Scans"
                value={data.summary.today}
                icon={<IconNfcTap size={18} />}
                accent="brand"
              />
              <MetricTileCompact
                hint="This Week"
                label="Scans"
                value={data.summary.week}
                icon={<IconPulse size={18} />}
                accent="sky"
              />
              <MetricTileCompact
                hint="All Cards"
                label="Total Scans"
                value={data.summary.total}
                icon={<IconRadar size={18} />}
                accent="violet"
              />
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Your Cards</h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {pagedCards.map((card) => (
                <button
                  key={card.cardId}
                  type="button"
                  onClick={() => setSelectedCardId(card.cardId)}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
                    selectedCardId === card.cardId
                      ? "bg-brand-50 dark:bg-brand-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        card.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <div>
                      <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                        {card.cardId}
                      </p>
                      <p className="text-xs text-gray-400">
                        {card.totalScans} total scans
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {card.scansToday} today
                  </span>
                </button>
              ))}
            </div>
            {cards.length > CARDS_PER_PAGE && (
              <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
                <Pagination
                  currentPage={safeCardPage}
                  totalPages={cardTotalPages}
                  onPageChange={setCardPage}
                />
              </div>
            )}
          </div>

          {analytics && (
            <>
              <div className="flex gap-2">
                {(["7d", "30d", "all"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTimeFilter(f)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      timeFilter === f
                        ? "bg-brand-500 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {f === "all" ? "All-Time" : f.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="card p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                      Scan Activity — {selectedCardId}
                    </h2>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">
                      {displayTotal.toLocaleString()} scans in selected period
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <IconMobile size={14} className="text-brand-500 dark:text-brand-400" />
                      {analytics.deviceBreakdown.mobile}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconDesktop size={14} />
                      {analytics.deviceBreakdown.desktop}
                    </span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={filteredBreakdown}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={chartColors.grid}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
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
                      labelFormatter={(l) => new Date(l).toLocaleDateString()}
                      contentStyle={chartColors.tooltip}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={chartColors.brand}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MetricTileCompact
                  hint="Today"
                  label="Scans"
                  value={analytics.scansToday}
                  icon={<IconNfcTap size={18} />}
                  accent="brand"
                />
                <MetricTileCompact
                  hint="This Week"
                  label="Scans"
                  value={analytics.scansThisWeek}
                  icon={<IconPulse size={18} />}
                  accent="sky"
                />
                <MetricTileCompact
                  hint="All Time"
                  label="Scans"
                  value={analytics.totalScans}
                  icon={<IconRadar size={18} />}
                  accent="violet"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
