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
import { ScanAnalytics, UserAnalyticsSummary, RecentScan } from "../../types";
import { PageSpinner, Alert, Button } from "../../components/ui";
import {
  HiOutlineCreditCard,
  HiOutlineClipboard,
  HiOutlineCheck,
  HiOutlineDeviceMobile,
  HiOutlineDesktopComputer,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePencil,
  HiOutlineLogout,
  HiOutlineShieldCheck,
  HiOutlineEye,
  HiOutlineX,
} from "react-icons/hi";
import { MdOutlineBarChart } from "react-icons/md";

// How many cards to show per page in the cards list
const CARDS_PER_PAGE = 5;

type TimeFilter = "7d" | "30d" | "all";

export function UserDashboard() {
  const { user, logout } = useAuth();

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
    await navigator.clipboard.writeText(
      `${window.location.origin}/card/${cardId}`,
    );
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
    <div className="min-h-screen bg-gray-50">
      {/* ════════════════════════════════════════════════════
          DARK HERO HEADER — OVOU-inspired analytics section
          Stats are displayed prominently inside the dark zone
          ════════════════════════════════════════════════════ */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-8">
          {/* Top bar: logo + actions */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2">
              <HiOutlineCreditCard className="text-brand-400 text-xl" />
              <span className="font-bold text-white tracking-tight">
                NFC Card
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
              >
                <HiOutlinePencil className="text-base" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Link>
              {user?.role === "ADMIN" && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-brand-400 hover:bg-white/10 transition-colors"
                >
                  <HiOutlineShieldCheck className="text-base" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 transition-colors"
              >
                <HiOutlineLogout className="text-base" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {/* Greeting */}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
            Analytics
          </p>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Hi, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here's a showcase of your analytics
          </p>

          {/* ── User Summary Stats ── */}
          {userSummary && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <HiOutlineCreditCard className="text-blue-400 text-lg" />
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Today
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {userSummary.today.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Scans</p>
              </div>

              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <MdOutlineBarChart className="text-green-400 text-lg" />
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    This Week
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {userSummary.week.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Scans</p>
              </div>

              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <HiOutlineCheck className="text-purple-400 text-lg" />
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Total
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {userSummary.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Scans</p>
              </div>
            </div>
          )}

          {/* Time filter pills */}
          <div className="flex gap-2 mt-5">
            {(["7d", "30d", "all"] as TimeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  timeFilter === f
                    ? "bg-white text-gray-900"
                    : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                }`}
              >
                {f === "all" ? "All-Time" : f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ── Stats Block inside dark header (OVOU-inspired) ── */}
          {analytics && (
            <div className="mt-6 grid grid-cols-3 divide-x divide-white/10 border border-white/10 rounded-2xl overflow-hidden">
              {/* Stat 1: Period Total */}
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MdOutlineBarChart className="text-brand-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    {timeFilter === "7d"
                      ? "7-Day"
                      : timeFilter === "30d"
                        ? "30-Day"
                        : "All-Time"}
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {displayTotal.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Scans</p>
              </div>

              {/* Stat 2: Scans Today */}
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <HiOutlineCreditCard className="text-green-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Today
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {analytics.scansToday.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Scans</p>
              </div>

              {/* Stat 3: Device split */}
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <HiOutlineDeviceMobile className="text-purple-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Mobile
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {analytics.deviceBreakdown.mobile > 0
                    ? `${Math.round((analytics.deviceBreakdown.mobile / (analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.desktop)) * 100)}%`
                    : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">of traffic</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 pt-5 pb-10 space-y-4">
        {error && <Alert message={error} className="mt-1" />}

        {/* ── No Cards Empty State ────────────────────────── */}
        {cards.length === 0 && (
          <div className="card p-10 text-center">
            <HiOutlineCreditCard className="text-gray-300 text-6xl mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">No cards yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Tap or scan your physical NFC card to activate it.
            </p>
            <Link to="/profile" className="btn-primary inline-flex">
              Set up your profile
            </Link>
          </div>
        )}

        {/* ── Scan Activity Chart ──────────────────────────── */}
        {analytics && filteredBreakdown.length > 0 && (
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Scan Activity</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {timeFilter === "7d"
                    ? "Last 7 days"
                    : timeFilter === "30d"
                      ? "Last 30 days"
                      : "All time"}
                </p>
              </div>
              {/* Device breakdown legend */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <HiOutlineDeviceMobile className="text-purple-400 text-base" />
                  {analytics.deviceBreakdown.mobile}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineDesktopComputer className="text-brand-400 text-base" />
                  {analytics.deviceBreakdown.desktop}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart
                data={filteredBreakdown}
                margin={{ top: 4, right: 8, left: -22, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                  formatter={(v: number) => [v, "Scans"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,.06)",
                  }}
                  cursor={{
                    stroke: "#f05535",
                    strokeWidth: 1,
                    strokeDasharray: "4 2",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#f05535"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#f05535", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Cards List with Pagination ──────────────────── */}
        {cards.length > 0 && (
          <div className="card overflow-hidden">
            {/* Card list header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Your Cards</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {cards.length} card{cards.length !== 1 ? "s" : ""} registered
                </p>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors"
              >
                <HiOutlinePencil className="text-base" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {pagedCards.map((card) => (
                <div
                  key={card.id}
                  className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50/80 ${
                    selectedCardId === card.cardId
                      ? "bg-brand-50 hover:bg-brand-50"
                      : ""
                  }`}
                  onClick={() => setSelectedCardId(card.cardId)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Active indicator dot */}
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full ${card.status === "ACTIVE" ? "bg-green-400" : "bg-gray-300"}`}
                    />
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-gray-900 text-sm truncate">
                        {card.cardId}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {card._count.scans.toLocaleString()} scans
                      </p>
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
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-brand-500"
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
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
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

            {/* ── Pagination controls ─────────────────────────
                Shown when there is more than one page of cards.
                Includes: prev arrow, page number buttons, next arrow.
                ─────────────────────────────────────────────── */}
            {totalCardPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {(cardPage - 1) * CARDS_PER_PAGE + 1}–
                  {Math.min(cardPage * CARDS_PER_PAGE, cards.length)} of{" "}
                  {cards.length}
                </span>
                <div className="flex items-center gap-1">
                  {/* Previous page */}
                  <button
                    onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                    disabled={cardPage === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    aria-label="Previous page"
                  >
                    <HiOutlineChevronLeft className="text-gray-600 text-base" />
                  </button>

                  {/* Numbered page buttons */}
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCardPage(page)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-all ${
                        cardPage === page
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                      aria-current={cardPage === page ? "page" : undefined}
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
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    aria-label="Next page"
                  >
                    <HiOutlineChevronRight className="text-gray-600 text-base" />
                  </button>
                </div>

                {/* ── Recent Scans ───────────────────────────── */}
                {recentScans.length > 0 && (
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          Recent Scans
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Your latest card interactions
                        </p>
                      </div>
                      <Button
                        variant="secondary"
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
                      >
                        Export CSV
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {recentScans.map((scan, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              {scan.device === "mobile" ? (
                                <HiOutlineDeviceMobile className="text-blue-600 text-sm" />
                              ) : (
                                <HiOutlineDesktopComputer className="text-blue-600 text-sm" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {scan.card.cardId}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(scan.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 capitalize">
                              {scan.device}
                            </p>
                            <p className="text-xs text-gray-400">
                              {scan.ip.replace(/\.\d+$/, ".***")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── User Trend Chart ───────────────────────────── */}
                {userTrend.length > 0 && (
                  <div className="card p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">
                      Your Scan Trend
                    </h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(date) =>
                              new Date(date).toLocaleDateString()
                            }
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            labelFormatter={(date) =>
                              new Date(date).toLocaleDateString()
                            }
                            formatter={(value) => [value, "Scans"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Recent Scans ───────────────────────────── */}
        {recentScans.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Recent Scans</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your latest card interactions
                </p>
              </div>
              <Button
                variant="secondary"
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
              >
                Export CSV
              </Button>
            </div>
            <div className="space-y-3">
              {recentScans.map((scan, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {scan.device === "mobile" ? (
                        <HiOutlineDeviceMobile className="text-blue-600 text-sm" />
                      ) : (
                        <HiOutlineDesktopComputer className="text-blue-600 text-sm" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {scan.card.cardId}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 capitalize">
                      {scan.device}
                    </p>
                    <p className="text-xs text-gray-400">
                      {scan.ip.replace(/\.\d+$/, ".***")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── User Trend Chart ───────────────────────────── */}
        {userTrend.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Your Scan Trend
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                    formatter={(value) => [value, "Scans"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════
          INLINE CARD PREVIEW MODAL
          Opens the card view inside an iframe overlay so the
          user never leaves the dashboard or opens a new tab.
          Navigate back with the Back button or close (×).
          ════════════════════════════════════════════════════ */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="relative w-full max-w-sm h-[88vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
              <button
                onClick={() => setPreviewCard(null)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                aria-label="Back to dashboard"
              >
                <HiOutlineChevronLeft className="text-lg" />
                <span>Back</span>
              </button>
              <span className="text-xs font-mono text-gray-400 truncate mx-2">
                {previewCard}
              </span>
              <button
                onClick={() => setPreviewCard(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close preview"
              >
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            {/* Card rendered in an iframe — isolated from dashboard state */}
            <iframe
              src={`/card/${previewCard}`}
              className="flex-1 w-full border-0"
              title={`Card Preview — ${previewCard}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
