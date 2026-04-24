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
import { PageSpinner, Alert } from "../../components/ui";
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
  HiOutlineCurrencyDollar,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";
import { MdOutlineBarChart } from "react-icons/md";
import { CardQrCodePanel } from "../card/CardQrCodePanel";
import { getPublicCardPath, getPublicCardUrl } from "../card/publicCardUrl";

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
    <div className="min-h-screen bg-gray-50">
      {/* ════════════════════════════════════════════════════
          DARK HERO HEADER — OVOU-inspired analytics section
          Stats are displayed prominently inside the dark zone
          ════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-8">
          {/* Top bar: logo + actions */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <span className="icon-badge w-10 h-10 rounded-xl">
                <HiOutlineCreditCard className="text-xl" />
              </span>
              <span className="font-bold text-gray-900 tracking-tight">
                E-Card
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <HiOutlinePencil className="text-base" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Link>
              {user?.role === "ADMIN" && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <HiOutlineShieldCheck className="text-base" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              {user?.role === "BUSINESS" && (
                  <Link
                  to="/dashboard/menu"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <HiOutlineOfficeBuilding className="text-base" />
                  <span className="hidden sm:inline">Menu</span>
                </Link>
              )}
              <Link
                to="/dashboard/payments"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <HiOutlineCurrencyDollar className="text-base" />
                <span className="hidden sm:inline">Payments</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
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
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Hi, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Here's a showcase of your analytics
          </p>

          {/* ── User Summary Stats ── */}
          {userSummary && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="card-soft p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <HiOutlineCreditCard className="text-brand-400 text-lg" />
                  <span className="text-xs text-gray-400 font-medium">Today</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {userSummary.today.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Scans</p>
              </div>

              <div className="card-soft p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <MdOutlineBarChart className="text-brand-400 text-lg" />
                  <span className="text-xs text-gray-400 font-medium">This Week</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {userSummary.week.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Scans</p>
              </div>

              <div className="card-soft p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <HiOutlineCheck className="text-brand-400 text-lg" />
                  <span className="text-xs text-gray-400 font-medium">Total</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {userSummary.total.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Scans</p>
              </div>
            </div>
          )}

          {/* Business menu banner — shown only for BUSINESS role */}
          {user?.role === "BUSINESS" && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="icon-badge w-9 h-9">
                  <HiOutlineOfficeBuilding className="text-lg" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Business Account</p>
                  <p className="text-xs text-gray-500">Manage your menu and linked cards</p>
                </div>
              </div>
              <Link
                to="/dashboard/menu"
                className="btn-primary px-4 py-2 text-sm"
              >
                Manage Menu
              </Link>
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
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f === "all" ? "All-Time" : f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ── Stats Block ── */}
          {analytics && (
            <div className="mt-6 grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="px-4 py-4 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">
                  {timeFilter === "7d" ? "7-Day" : timeFilter === "30d" ? "30-Day" : "Total"} Scans
                </p>
                <p className="text-xl font-bold text-gray-900">{displayTotal.toLocaleString()}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Today</p>
                <p className="text-xl font-bold text-gray-900">{analytics.scansToday.toLocaleString()}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Device Shift</p>
                <p className="text-xl font-bold text-gray-900">
                  {analytics.deviceBreakdown.mobile > 0
                    ? `${Math.round((analytics.deviceBreakdown.mobile / (analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.desktop)) * 100)}%`
                    : "—"}
                </p>
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
                <h2 className="font-semibold text-gray-900">Scan Activity</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                  {timeFilter === "7d" ? "7 days" : timeFilter === "30d" ? "30 days" : "All time"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <HiOutlineDeviceMobile className="text-brand-400" />
                  {analytics.deviceBreakdown.mobile}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineDesktopComputer className="text-gray-400" />
                  {analytics.deviceBreakdown.desktop}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={filteredBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip 
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#f05535"
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
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Your Cards</h2>
              <span className="text-xs text-gray-400 font-medium">{cards.length} Total</span>
            </div>

            <div className="divide-y divide-gray-50">
              {pagedCards.map((card) => (
                <div
                  key={card.id}
                  className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${
                    selectedCardId === card.cardId ? "bg-brand-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCardId(card.cardId)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${card.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <p className="font-mono font-bold text-gray-900 text-sm">{card.cardId}</p>
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

            {/* ── Pagination controls ───────────────────────── */}
            {totalCardPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
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
                    className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-20 transition-all"
                    aria-label="Previous page"
                  >
                    <HiOutlineChevronLeft className="text-gray-600 text-sm" />
                  </button>

                  {/* Numbered page buttons */}
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCardPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        cardPage === page
                          ? "bg-brand-500 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-100"
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
                    className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-20 transition-all"
                    aria-label="Next page"
                  >
                    <HiOutlineChevronRight className="text-gray-600 text-sm" />
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
              <h2 className="font-semibold text-gray-900">Recent Scans</h2>
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
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
                      <HiOutlineDeviceMobile className="text-gray-400 text-lg" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-gray-900 text-sm">{scan.card.cardId}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-medium uppercase">{scan.device}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{scan.ip.replace(/\.\d+$/, ".***")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── User Trend Chart ─────────────────────────── */}
        {userTrend.length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Scan Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userTrend}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: "#9ca3af" }} 
                    tickFormatter={(date) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#f05535"
                    strokeWidth={2}
                    dot={{ fill: "#f05535", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedCard?.status === "ACTIVE" && (
          <div className="card p-2 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-gray-100/60 overflow-hidden">
            <CardQrCodePanel
              cardId={selectedCard.cardId}
              title="Card Access"
              description="This single public link is the source for your QR code, NFC tap destination, browser preview, and sharing."
            />
          </div>
        )}
      </main>

      {/* ── Inline Card Preview Modal ── */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm h-[88vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <span className="text-xs font-bold text-gray-400">Card Preview</span>
              <button
                onClick={() => setPreviewCard(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
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
