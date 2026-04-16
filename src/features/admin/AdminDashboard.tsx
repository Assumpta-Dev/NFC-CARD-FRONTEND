// ===========================================================
// ADMIN DASHBOARD PAGE
// ===========================================================
// Only accessible to users with role === 'ADMIN'.
// Route is protected by ProtectedRoute with requiredRole="ADMIN".
//
// Features:
//   - System-wide stats overview
//   - Create new physical cards (bulk or single)
//   - View all cards with their owners and scan counts
//   - View all registered users
// ===========================================================

// React removed from import — react-jsx transform handles JSX; only named hooks needed
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi, getErrorMessage } from "../../services/api";
import {
  AdminCard,
  AdminUser,
  SystemStats,
  DailyScanCount,
  TopCard,
  TopUser,
} from "../../types";
import { Button, Alert, PageSpinner } from "../../components/ui";
import {
  HiOutlineCog,
  HiOutlineCreditCard,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { MdOutlineBarChart } from "react-icons/md";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Simple tab state to switch between Cards and Users views
type Tab = "overview" | "analytics" | "cards" | "users";

// How many items to show per page in the tables
const ITEMS_PER_PAGE = 10;

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cardCount, setCardCount] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // New state for card assignment
  const [assigningCard, setAssigningCard] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // New analytics state
  const [dailyScans, setDailyScans] = useState<DailyScanCount[]>([]);
  const [topCards, setTopCards] = useState<TopCard[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [cardCountTotal, setCardCountTotal] = useState(0);
  const [scanCountTotal, setScanCountTotal] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  // Pagination state
  const [cardPage, setCardPage] = useState(1);
  const [userPage, setUserPage] = useState(1);

  // Fetch stats on mount — always needed for overview tab
  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  // Lazy-load cards/users/analytics only when that tab is first opened
  useEffect(() => {
    if (activeTab === "cards" && cards.length === 0) {
      adminApi
        .getAllCards()
        .then((fetchedCards) => {
          const normalizedCards = fetchedCards.map((card) => ({
            ...card,
            _count: card._count || { scans: 0 },
          }));
          setCards(normalizedCards);
        })
        .catch((err) => setError(getErrorMessage(err)));
    }
    if (activeTab === "users" && users.length === 0) {
      adminApi
        .getAllUsers()
        .then(setUsers)
        .catch((err) => setError(getErrorMessage(err)));
    }
    if (activeTab === "cards" && users.length === 0) {
      // Load users for card assignment functionality
      adminApi
        .getAllUsers()
        .then(setUsers)
        .catch((err) => setError(getErrorMessage(err)));
    }
    if (activeTab === "analytics" && dailyScans.length === 0) {
      // Load all analytics data
      Promise.all([
        adminApi.getUserCount(),
        adminApi.getCardCount(),
        adminApi.getScanCount(),
        adminApi.getActiveUsers(),
        adminApi.getActiveCards(),
        adminApi.getDailyScanBreakdown(),
        adminApi.getTopCards(),
        adminApi.getTopUsers(),
      ])
        .then(
          ([
            userCount,
            cardCount,
            scanCount,
            activeUsers,
            _activeCards,
            dailyBreakdown,
            topCardsData,
            topUsersData,
          ]) => {
            setUserCount(userCount);
            setCardCountTotal(cardCount);
            setScanCountTotal(scanCount);
            setActiveUsers(activeUsers);
            setDailyScans(dailyBreakdown);
            setTopCards(topCardsData);
            setTopUsers(topUsersData);
          },
        )
        .catch((err) => setError(getErrorMessage(err)));
    }
  }, [activeTab, cards.length, users.length, dailyScans.length]);

  // Pagination logic
  const totalCardPages = Math.ceil(cards.length / ITEMS_PER_PAGE);
  const pagedCards = cards.slice(
    (cardPage - 1) * ITEMS_PER_PAGE,
    cardPage * ITEMS_PER_PAGE,
  );

  const totalUserPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const pagedUsers = users.slice(
    (userPage - 1) * ITEMS_PER_PAGE,
    userPage * ITEMS_PER_PAGE,
  );

  // Reset page when tab changes or data loads
  useEffect(() => {
    if (activeTab === "cards") setCardPage(1);
  }, [activeTab, cards.length]);

  useEffect(() => {
    if (activeTab === "users") setUserPage(1);
  }, [activeTab, users.length]);

  // ── Assign Card Handler ─────────────────────────────────
  const handleAssignCard = async (cardId: string) => {
    if (!selectedUserId) {
      setError("Please select a user to assign the card to.");
      return;
    }

    setIsAssigning(true);
    setError("");
    setSuccess("");
    try {
      await adminApi.assignCardToUser(cardId, selectedUserId);

      // Reload all cards to reflect the assignment
      const allCards = await adminApi.getAllCards();
      const normalizedAllCards = allCards.map((card) => ({
        ...card,
        _count: card._count || { scans: 0 },
      }));
      setCards(normalizedAllCards);

      setSuccess(`Card ${cardId} assigned successfully!`);
      setAssigningCard(null);
      setSelectedUserId("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAssigning(false);
    }
  };
  const handleCreateCards = async () => {
    setIsCreating(true);
    setError("");
    setSuccess("");
    try {
      await adminApi.createCards(cardCount);

      // Load all cards from backend to ensure we have the complete list
      const allCards = await adminApi.getAllCards();
      const normalizedAllCards = allCards.map((card) => ({
        ...card,
        _count: card._count || { scans: 0 },
      }));

      setCards(normalizedAllCards);
      setSuccess(`Created ${cardCount} card(s) successfully!`);
      // Auto-switch to cards tab so user sees the new cards
      setActiveTab("cards");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ════════════════════════════════════════════════════
          DARK HERO HEADER — OVOU-inspired admin section
          Stats are displayed prominently inside the dark zone
          ════════════════════════════════════════════════════ */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-8">
          {/* Top bar: logo + actions */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2">
              <HiOutlineCog className="text-brand-400 text-xl" />
              <span className="font-bold text-white tracking-tight">
                Admin Panel
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
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 transition-colors"
              >
                <HiOutlineEye className="text-base" />
                <span className="hidden sm:inline">User Dashboard</span>
              </Link>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 transition-colors"
              >
                <HiOutlineLogout className="text-base" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {/* Greeting */}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
            System Overview
          </p>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Welcome back, Admin
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your NFC card system - Admin Panel
          </p>

          {/* Tab navigation pills */}
          <div className="flex gap-2 mt-5">
            {(["overview", "analytics", "cards", "users"] as Tab[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all capitalize ${
                    activeTab === tab
                      ? "bg-white text-gray-900"
                      : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          {/* ── Stats Block inside dark header (OVOU-inspired) ── */}
          {activeTab === "overview" && stats && (
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10 border border-white/10 rounded-2xl overflow-hidden">
              {/* Stat 1: Total Users */}
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <HiOutlineUserGroup className="text-blue-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Users
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Registered</p>
              </div>

              {/* Stat 2: Total Cards */}
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <HiOutlineCreditCard className="text-brand-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Cards
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {stats.totalCards.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Total</p>
              </div>

              {/* Stat 3: Active Cards */}
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <HiOutlineCheckCircle className="text-green-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Active
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {stats.activeCards.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Cards</p>
              </div>

              {/* Stat 4: Total Scans */}
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MdOutlineBarChart className="text-purple-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Scans
                  </p>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {stats.totalScans.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">All time</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 pt-5 pb-10 space-y-4">
        {error && <Alert message={error} className="mt-1" />}
        {success && <Alert message={success} type="success" className="mt-1" />}

        {/* ════════════════════════════════════════════════════
            TAB: OVERVIEW
            ════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* ── Create Cards Panel ───────────────────────────── */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-1">
                Create New Cards
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Generate unique card IDs for new physical NFC/QR cards. Print or
                program the NFC chip with the URL:{" "}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                  yourdomain.com/card/CARD_XXXXXX
                </code>
              </p>
              <div className="flex items-end gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Number of cards
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={cardCount}
                    onChange={(e) =>
                      setCardCount(
                        Math.max(
                          1,
                          Math.min(100, parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    className="input-field w-28"
                  />
                </div>
                <Button
                  onClick={handleCreateCards}
                  isLoading={isCreating}
                  className="py-3"
                >
                  Generate Cards
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: ANALYTICS
            ════════════════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* ── Analytics Stats Grid ───────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineUserGroup className="text-blue-500 text-lg" />
                  <p className="text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {userCount.toLocaleString()}
                </p>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineCreditCard className="text-green-500 text-lg" />
                  <p className="text-sm font-medium text-gray-600">
                    Total Cards
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {cardCountTotal.toLocaleString()}
                </p>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HiOutlineCheckCircle className="text-purple-500 text-lg" />
                  <p className="text-sm font-medium text-gray-600">
                    Active Users
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {activeUsers.toLocaleString()}
                </p>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MdOutlineBarChart className="text-orange-500 text-lg" />
                  <p className="text-sm font-medium text-gray-600">
                    Total Scans
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {scanCountTotal.toLocaleString()}
                </p>
              </div>
            </div>

            {/* ── Daily Scan Trend Chart ───────────────────────────── */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Daily Scan Activity
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyScans.slice(-30)}>
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
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Top Performers Grid ───────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Cards */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Top Cards by Scans
                </h3>
                <div className="space-y-3">
                  {topCards.slice(0, 5).map((card, index) => (
                    <div
                      key={card.cardId}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {card.cardId}
                          </p>
                          {card.user && (
                            <p className="text-sm text-gray-500">
                              {card.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {card.scanCount}
                      </p>
                    </div>
                  ))}
                  {topCards.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No scan data available
                    </p>
                  )}
                </div>
              </div>

              {/* Top Users */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Top Users by Scans
                </h3>
                <div className="space-y-3">
                  {topUsers.slice(0, 5).map((user, index) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-semibold text-green-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {user.scanCount}
                      </p>
                    </div>
                  ))}
                  {topUsers.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No scan data available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Export Data ───────────────────────────── */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Export Data</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download all scan data as CSV for detailed analysis.
              </p>
              <Button
                onClick={async () => {
                  try {
                    const blob = await adminApi.exportScansCsv();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `scans-${new Date().toISOString().split("T")[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (err) {
                    setError(getErrorMessage(err));
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Download Scans CSV
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: CARDS
            ════════════════════════════════════════════════════ */}
        {activeTab === "cards" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">All Cards</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {cards.length} cards in system
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleCreateCards}
                isLoading={isCreating}
                className="text-sm py-2"
              >
                + New Card
              </Button>
            </div>

            {cards.length === 0 ? (
              <div className="p-10 text-center">
                <HiOutlineCreditCard className="text-gray-300 text-6xl mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">No cards yet</h3>
                <p className="text-gray-500 text-sm mb-6">
                  Create some cards to get started.
                </p>
                <Button onClick={handleCreateCards} isLoading={isCreating}>
                  Create First Cards
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Card ID", "Status", "Owner", "Scans", "Actions"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pagedCards.map((card) => (
                        <tr
                          key={card.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                            {card.cardId}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                card.status === "ACTIVE"
                                  ? "badge-active"
                                  : "badge-inactive"
                              }
                            >
                              {card.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {card.user ? (
                              <div>
                                <p className="font-medium text-gray-800">
                                  {card.user.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {card.user.email}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium">
                            {card._count.scans}
                          </td>
                          <td className="px-4 py-3">
                            {card.status === "ACTIVE" ? (
                              <button
                                onClick={() => navigate(`/card/${card.cardId}`)}
                                className="text-brand-500 hover:text-brand-700 hover:underline text-xs font-medium transition-colors"
                              >
                                View Card →
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                {assigningCard === card.cardId ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={selectedUserId}
                                      onChange={(e) =>
                                        setSelectedUserId(e.target.value)
                                      }
                                      className="text-xs border border-gray-300 rounded px-2 py-1"
                                    >
                                      <option value="">Select User</option>
                                      {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                          {user.name} ({user.email})
                                        </option>
                                      ))}
                                    </select>
                                    <Button
                                      onClick={() =>
                                        handleAssignCard(card.cardId)
                                      }
                                      isLoading={isAssigning}
                                      className="text-xs py-1 px-2"
                                    >
                                      Assign
                                    </Button>
                                    <button
                                      onClick={() => {
                                        setAssigningCard(null);
                                        setSelectedUserId("");
                                      }}
                                      className="text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setAssigningCard(card.cardId)
                                    }
                                    className="text-blue-500 hover:text-blue-700 hover:underline text-xs font-medium transition-colors"
                                  >
                                    Assign →
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for cards */}
                {totalCardPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {(cardPage - 1) * ITEMS_PER_PAGE + 1}–
                      {Math.min(cardPage * ITEMS_PER_PAGE, cards.length)} of{" "}
                      {cards.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                        disabled={cardPage === 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                        aria-label="Previous page"
                      >
                        <HiOutlineChevronLeft className="text-gray-600 text-base" />
                      </button>
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
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: USERS
            ════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">All Users</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {users.length} users registered
                </p>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="p-10 text-center">
                <HiOutlineUserGroup className="text-gray-300 text-6xl mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">No users yet</h3>
                <p className="text-gray-500 text-sm">
                  Users will appear here once they register.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Name", "Email", "Role", "Cards", "Joined"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pagedUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                user.role === "ADMIN"
                                  ? "badge-active"
                                  : "badge-inactive"
                              }
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium text-center">
                            {user._count.cards}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for users */}
                {totalUserPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {(userPage - 1) * ITEMS_PER_PAGE + 1}–
                      {Math.min(userPage * ITEMS_PER_PAGE, users.length)} of{" "}
                      {users.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        disabled={userPage === 1}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                        aria-label="Previous page"
                      >
                        <HiOutlineChevronLeft className="text-gray-600 text-base" />
                      </button>
                      <button
                        onClick={() =>
                          setUserPage((p) => Math.min(totalUserPages, p + 1))
                        }
                        disabled={userPage === totalUserPages}
                        className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                        aria-label="Next page"
                      >
                        <HiOutlineChevronRight className="text-gray-600 text-base" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
