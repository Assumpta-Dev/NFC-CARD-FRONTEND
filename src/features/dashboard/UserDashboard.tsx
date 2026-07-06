import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cardApi, userApi, getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getChartColors } from "../../utils/chartTheme";
import { ScanAnalytics, UserAnalyticsSummary, RecentScan } from "../../types";
import { PageSpinner, Alert, MetricTileCompact } from "../../components/ui";
import {
  IconNfcTap,
  IconPulse,
  IconRadar,
  IconDesktop,
  IconMobile,
} from "../../components/icons/DashboardIcons";
import {
  HiOutlineClipboard,
  HiOutlineCheck,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineX,
} from "react-icons/hi";
import { CardQrCodePanel } from "../card/CardQrCodePanel";
import { getPublicCardPath, getPublicCardUrl } from "../card/publicCardUrl";

// How many cards to show per page in the cards list
const CARDS_PER_PAGE = 5;

type TimeFilter = "7d" | "30d" | "all";

export function UserDashboard() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const chartColors = getChartColors(resolvedTheme);

  const [cards, setCards] = useState<
    { id: string; cardId: string; status: string; _count: { scans: number } }[]
  >([]);
  const [analytics, setAnalytics] = useState<ScanAnalytics | null>(null);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  // Inline card preview — shown inside the page instead of a new tab
  const [previewCard, setPreviewCard] = useState<string | null>(null);
  // Pagination state for the cards list
  const [cardPage, setCardPage] = useState(1);
  // Pagination state for recent scans
  const [scanPage, setScanPage] = useState(1);
  const SCANS_PER_PAGE = 5;

  // New user analytics state
  const [userSummary, setUserSummary] = useState<UserAnalyticsSummary | null>(
    null,
  );
  const [userTrend, setUserTrend] = useState<{ date: string; count: number }[]>(
    [],
  );
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  useEffect(() => {
    cardApi
      .getMyCards()
      .then((data) => {
        setCards(data);
        const firstActive = data.find((c) => c.status === "ACTIVE");
        if (firstActive) setSelectedCardId(firstActive.cardId);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));

    // Load user analytics
    userApi
      .getAnalyticsSummary()
      .then(setUserSummary)
      .catch((err) => setError(getErrorMessage(err)));

    userApi
      .getDailyTrend("30d")
      .then(setUserTrend)
      .catch((err) => setError(getErrorMessage(err)));

    userApi
      .getRecentScans(10)
      .then(setRecentScans)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!selectedCardId) return;
    cardApi
      .getAnalytics(selectedCardId)
      .then(setAnalytics)
      .catch((err) => setError(getErrorMessage(err)));
  }, [selectedCardId]);

  const copyCardLink = async (cardId: string) => {
    await navigator.clipboard.writeText(getPublicCardUrl(cardId));
    setCopied(true);
    setCopiedId(cardId);
    setTimeout(() => {
      setCopied(false);
      setCopiedId("");
    }, 2000);
  };

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  };

  // Filter chart data based on selected time range
  const filteredBreakdown =
    analytics?.dailyBreakdown.filter((_, i, arr) => {
      if (timeFilter === "7d") return i >= arr.length - 7;
      if (timeFilter === "30d") return i >= arr.length - 30;
      return true;
    }) ?? [];

  // Compute period-specific stats from filtered breakdown
  const periodTotal = filteredBreakdown.reduce((sum, d) => sum + d.count, 0);
  const displayTotal =
    timeFilter === "all" ? (analytics?.totalScans ?? 0) : periodTotal;
  const selectedCard = cards.find((card) => card.cardId === selectedCardId);

  // Pagination
  const totalCardPages = Math.ceil(cards.length / CARDS_PER_PAGE);
  const pagedCards = cards.slice(
    (cardPage - 1) * CARDS_PER_PAGE,
    cardPage * CARDS_PER_PAGE,
  );

  // Compute visible page number buttons (max 5 around current page)
  const getPageNumbers = (): number[] => {
    const maxVisible = 5;
    let start = Math.max(1, cardPage - 2);
    let end = Math.min(totalCardPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="border-b border-gray-100 dark:border-gray-800 pb-8 mb-6">
          {/* Greeting */}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
            Analytics
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Hi, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Here's a showcase of your analytics
          </p>

          {/* ── User Summary Stats ── */}
          {userSummary && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <MetricTileCompact
                hint="Today"
                label="Scans"
                value={userSummary.today.toLocaleString()}
                icon={<IconNfcTap size={18} />}
                accent="brand"
              />
              <MetricTileCompact
                hint="This Week"
                label="Scans"
                value={userSummary.week.toLocaleString()}
                icon={<IconPulse size={18} />}
                accent="sky"
              />
              <MetricTileCompact
                hint="Total"
                label="Scans"
                value={userSummary.total.toLocaleString()}
                icon={<IconRadar size={18} />}
                accent="violet"
              />
            </div>
          )}

          {/* Time filter pills */}
          <div className="flex gap-2 mt-4">
            {(["7d", "30d", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  timeFilter === f
                    ? "bg-brand-500 text-white shadow-sm dark:shadow-none"
                    : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {f === "all" ? "All-Time" : f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ── Stats Block ── */}
          {analytics && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <MetricTileCompact
                hint={timeFilter === "7d" ? "7-Day" : timeFilter === "30d" ? "30-Day" : "Total"}
                label="Scans"
                value={displayTotal.toLocaleString()}
                icon={<IconPulse size={18} />}
                accent="brand"
              />
              <MetricTileCompact
                hint="Today"
                label="Scans"
                value={analytics.scansToday.toLocaleString()}
                icon={<IconNfcTap size={18} />}
                accent="sky"
              />
              <MetricTileCompact
                hint="Mobile"
                label="Device Share"
                value={
                  analytics.deviceBreakdown.mobile > 0
                    ? `${Math.round((analytics.deviceBreakdown.mobile / (analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.desktop)) * 100)}%`
                    : "—"
                }
                icon={<IconMobile size={18} />}
                accent="violet"
              />
            </div>
          )}
      </div>

      <div className="space-y-4">
        {error && <Alert message={error} className="mt-1" />}

        {/* ── No Cards Empty State ────────────────────────── */}
        {cards.length === 0 && (
          <div className="card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-gradient-to-br from-brand-500/[0.08] to-transparent text-brand-500 dark:text-brand-400">
              <IconNfcTap size={28} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">No cards yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Tap or scan your physical E-Card to activate it.
            </p>
            <Link to="/profile" className="btn-primary inline-flex">
              Set up your profile
            </Link>
          </div>
        )}

        {/* ── Scan Activity Chart ────────────────────────── */}
        {analytics && filteredBreakdown.length > 0 && (
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Scan Activity</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                  {timeFilter === "7d" ? "7 days" : timeFilter === "30d" ? "30 days" : "All time"}
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
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={filteredBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
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
        )}

        {/* ── Cards List ─────────────────────────────────── */}
        {cards.length > 0 && (
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Your Cards</h2>
              <span className="text-xs text-gray-400 font-medium">{cards.length} Total</span>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {pagedCards.map((card) => (
                <div
                  key={card.id}
                  className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${
                    selectedCardId === card.cardId
                      ? "bg-brand-50 dark:bg-brand-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedCardId(card.cardId)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${card.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">{card.cardId}</p>
                      <p className="text-xs text-gray-400">{card._count.scans} Scans</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                    <span
                      className={
                        card.status === "ACTIVE"
                          ? "badge-active"
                          : "badge-inactive"
                      }
                    >
                      {card.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                    {/* Inline preview — opens card in a modal, not a new tab */}
                    {card.status === "ACTIVE" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewCard(card.cardId);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-brand-500"
                        title="Preview card (inline)"
                        aria-label={`Preview card ${card.cardId}`}
                      >
                        <HiOutlineEye className="text-lg" />
                      </button>
                    )}
                    {/* Copy link button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCardLink(card.cardId);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
                      title="Copy card link"
                      aria-label={`Copy link for ${card.cardId}`}
                    >
                      {copied && copiedId === card.cardId ? (
                        <HiOutlineCheck className="text-green-500 text-lg" />
                      ) : (
                        <HiOutlineClipboard className="text-lg" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination controls ───────────────────────── */}
            {totalCardPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {(cardPage - 1) * CARDS_PER_PAGE + 1}–
                  {Math.min(cardPage * CARDS_PER_PAGE, cards.length)} of{" "}
                  {cards.length}
                </span>
                <div className="flex items-center gap-1">
                  {/* Previous page */}
                  <button
                    onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                    disabled={cardPage === 1}
                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm dark:shadow-none disabled:opacity-20 transition-all"
                    aria-label="Previous page"
                  >
                    <HiOutlineChevronLeft className="text-gray-600 dark:text-gray-400 text-sm" />
                  </button>

                  {/* Numbered page buttons */}
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCardPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        cardPage === page
                          ? "bg-brand-500 text-white shadow-sm dark:shadow-none"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next page */}
                  <button
                    onClick={() =>
                      setCardPage((p) => Math.min(totalCardPages, p + 1))
                    }
                    disabled={cardPage === totalCardPages}
                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm dark:shadow-none disabled:opacity-20 transition-all"
                    aria-label="Next page"
                  >
                    <HiOutlineChevronRight className="text-gray-600 dark:text-gray-400 text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Recent Scans ───────────────────────────────── */}
        {recentScans.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Scans</h2>
              <button
                onClick={async () => {
                  try {
                    const blob = await userApi.exportScansCsv();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `my-scans-${new Date().toISOString().split("T")[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (err) {
                    setError(getErrorMessage(err));
                  }
                }}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-4">
              {recentScans.slice((scanPage - 1) * SCANS_PER_PAGE, scanPage * SCANS_PER_PAGE).map((scan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-gradient-to-br from-gray-500/[0.06] to-transparent flex items-center justify-center text-gray-400">
                      <IconMobile size={16} />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">{scan.card.cardId}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase">{scan.device}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{scan.ip.replace(/\.\d+$/, ".***")}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination for recent scans */}
            {recentScans.length > SCANS_PER_PAGE && (
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {(scanPage - 1) * SCANS_PER_PAGE + 1}–{Math.min(scanPage * SCANS_PER_PAGE, recentScans.length)} of {recentScans.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setScanPage((p) => Math.max(1, p - 1))}
                    disabled={scanPage === 1}
                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm dark:shadow-none disabled:opacity-20 transition-all"
                    aria-label="Previous page"
                  >
                    <HiOutlineChevronLeft className="text-gray-600 dark:text-gray-400 text-sm" />
                  </button>
                  <button
                    onClick={() => setScanPage((p) => Math.min(Math.ceil(recentScans.length / SCANS_PER_PAGE), p + 1))}
                    disabled={scanPage === Math.ceil(recentScans.length / SCANS_PER_PAGE)}
                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm dark:shadow-none disabled:opacity-20 transition-all"
                    aria-label="Next page"
                  >
                    <HiOutlineChevronRight className="text-gray-600 dark:text-gray-400 text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── User Trend Chart ─────────────────────────── */}
        {userTrend.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Scan Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userTrend}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: chartColors.tick }} 
                    tickFormatter={(date) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 10, fill: chartColors.tick }} />
                  <Tooltip contentStyle={chartColors.tooltip} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={chartColors.brand}
                    strokeWidth={2}
                    dot={{ fill: chartColors.brand, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedCard?.status === "ACTIVE" && (
          <div className="card p-2 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-gray-100 dark:border-gray-800/60 overflow-hidden">
            <CardQrCodePanel
              cardId={selectedCard.cardId}
              title="Card Access"
              description="This single public link is the source for your QR code, NFC tap destination, browser preview, and sharing."
            />
          </div>
        )}
      </div>

      {/* ── Inline Card Preview Modal ── */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm h-[88vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <span className="text-xs font-bold text-gray-400">Card Preview</span>
              <button
                onClick={() => setPreviewCard(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
              >
                <HiOutlineX className="text-lg" />
              </button>
            </div>
            <iframe
              src={getPublicCardPath(previewCard)}
              className="flex-1 w-full border-0"
              title="Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
