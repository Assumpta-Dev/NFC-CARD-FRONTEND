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
import { useNavigate } from "react-router-dom";
import { adminApi, getErrorMessage } from "../../services/api";
import type { AdminSection } from "../../components/layout/adminNav";
import {
  AdminCard,
  AdminUser,
  SystemStats,
  DailyScanCount,
  TopCard,
  TopUser,
} from "../../types";
import { Button, Alert, PageSpinner, selectControlClass, StatCard, Pagination, EmptyState } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { getChartColors } from "../../utils/chartTheme";
import {
  IconClose,
  IconNfcTap,
  IconPaid,
  IconQrCode,
  IconRadar,
  IconUsers,
} from "../../components/icons/DashboardIcons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CardQrCodePanel } from "../card/CardQrCodePanel";
import { getPublicCardPath } from "../card/publicCardUrl";

// How many items to show per page in the tables
const ITEMS_PER_PAGE = 10;

interface AdminDashboardProps {
  section?: AdminSection;
}

export function AdminDashboard({ section = "overview" }: AdminDashboardProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const chartColors = getChartColors(resolvedTheme);
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
  const [qrPreviewCardId, setQrPreviewCardId] = useState<string | null>(null);

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

  // Lazy-load cards/users/analytics only when that section is first opened
  useEffect(() => {
    if (section === "cards" && cards.length === 0) {
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
    if (section === "users" && users.length === 0) {
      adminApi
        .getAllUsers()
        .then(setUsers)
        .catch((err) => setError(getErrorMessage(err)));
    }
    if (section === "cards" && users.length === 0) {
      // Load users for card assignment functionality
      adminApi
        .getAllUsers()
        .then(setUsers)
        .catch((err) => setError(getErrorMessage(err)));
    }
    if (section === "analytics" && dailyScans.length === 0) {
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
  }, [section, cards.length, users.length, dailyScans.length]);

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
    if (section === "cards") setCardPage(1);
  }, [section, cards.length]);

  useEffect(() => {
    if (section === "users") setUserPage(1);
  }, [section, users.length]);

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
      navigate("/admin/cards");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      {error && <Alert message={error} />}
      {success && <Alert message={success} type="success" />}

      {section === "overview" && stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<IconUsers size={20} />}
            accent="sky"
          />
          <StatCard
            label="Cards"
            value={stats.totalCards.toLocaleString()}
            icon={<IconNfcTap size={20} />}
            accent="brand"
          />
          <StatCard
            label="Active Cards"
            value={stats.activeCards.toLocaleString()}
            icon={<IconPaid size={20} />}
            accent="emerald"
          />
          <StatCard
            label="Total Scans"
            value={stats.totalScans.toLocaleString()}
            icon={<IconRadar size={20} />}
            accent="violet"
          />
        </div>
      )}

        {/* ════════════════════════════════════════════════════
            SECTION: OVERVIEW
            ════════════════════════════════════════════════════ */}
        {section === "overview" && (
          <div className="space-y-6">
            {/* ── Create Cards Panel ───────────────────────────── */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Create New Cards
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Generate unique card IDs for new physical E-Card/QR cards. Print or
                program the E-Card with the URL:{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                  yourdomain.com/c/CARD_XXXXXX
                </code>
              </p>
              <div className="flex items-end gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
        {section === "analytics" && (
          <div className="space-y-6">
            {/* ── Analytics Stats Grid ───────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total Users"
                value={userCount.toLocaleString()}
                icon={<IconUsers size={20} />}
                accent="sky"
              />
              <StatCard
                label="Total Cards"
                value={cardCountTotal.toLocaleString()}
                icon={<IconNfcTap size={20} />}
                accent="brand"
              />
              <StatCard
                label="Active Users"
                value={activeUsers.toLocaleString()}
                icon={<IconPaid size={20} />}
                accent="emerald"
              />
              <StatCard
                label="Total Scans"
                value={scanCountTotal.toLocaleString()}
                icon={<IconRadar size={20} />}
                accent="violet"
              />
            </div>

            {/* ── Daily Scan Trend Chart ───────────────────────────── */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Daily Scan Activity
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyScans.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: chartColors.tick }}
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString()
                      }
                    />
                    <YAxis tick={{ fontSize: 12, fill: chartColors.tick }} />
                    <Tooltip
                      labelFormatter={(date) =>
                        new Date(date).toLocaleDateString()
                      }
                      formatter={(value) => [value, "Scans"]}
                      contentStyle={chartColors.tooltip}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={chartColors.blue}
                      strokeWidth={2}
                      dot={{ fill: chartColors.blue, strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Top Performers Grid ───────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Cards */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {card.cardId}
                          </p>
                          {card.user && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {card.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {card.scanCount}
                      </p>
                    </div>
                  ))}
                  {topCards.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No scan data available
                    </p>
                  )}
                </div>
              </div>

              {/* Top Users */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {user.scanCount}
                      </p>
                    </div>
                  ))}
                  {topUsers.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No scan data available
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Export Data ───────────────────────────── */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Export Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
        {section === "cards" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">All Cards</h2>
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
              <EmptyState
                icon={<IconNfcTap size={22} />}
                title="No cards yet"
                description="Create some cards to get started."
                accent="brand"
                action={
                  <Button onClick={handleCreateCards} isLoading={isCreating}>
                    Create First Cards
                  </Button>
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-950">
                      <tr>
                        {["Card ID", "Status", "Owner", "Scans", "Actions"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
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
                          className="hover:bg-gray-50 dark:bg-gray-950/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-gray-100">
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
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {card.user ? (
                              <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">
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
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                            {card._count.scans}
                          </td>
                          <td className="px-4 py-3">
                            {card.status === "ACTIVE" ? (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => navigate(getPublicCardPath(card.cardId))}
                                  className="text-brand-500 hover:text-brand-700 hover:underline text-xs font-medium transition-colors"
                                >
                                  View Card →
                                </button>
                                <button
                                  onClick={() => setQrPreviewCardId(card.cardId)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-brand-600"
                                >
                                  <IconQrCode size={14} />
                                  QR
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setQrPreviewCardId(card.cardId)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-brand-600"
                                >
                                  <IconQrCode size={14} />
                                  QR
                                </button>
                                {assigningCard === card.cardId ? (
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <select
                                        value={selectedUserId}
                                        onChange={(e) =>
                                          setSelectedUserId(e.target.value)
                                        }
                                        className={selectControlClass(
                                          false,
                                          "text-xs py-1.5 pl-2 min-w-[10rem]",
                                        )}
                                      >
                                        <option value="">Select User</option>
                                        {users.map((user) => (
                                          <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
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
                                      className="text-gray-400 hover:text-gray-600 dark:text-gray-400 text-xs"
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

                {totalCardPages > 1 && (
                  <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                    <Pagination
                      currentPage={cardPage}
                      totalPages={totalCardPages}
                      onPageChange={setCardPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB: USERS
            ════════════════════════════════════════════════════ */}
        {section === "users" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">All Users</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {users.length} users registered
                </p>
              </div>
            </div>

            {users.length === 0 ? (
              <EmptyState
                icon={<IconUsers size={22} />}
                title="No users yet"
                description="Users will appear here once they register."
                accent="sky"
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-950">
                      <tr>
                        {["Name", "Email", "Role", "Cards", "Joined"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
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
                          className="hover:bg-gray-50 dark:bg-gray-950/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
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
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium text-center">
                            {user._count.cards}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                  <Pagination
                    currentPage={userPage}
                    totalPages={totalUserPages}
                    onPageChange={setUserPage}
                  />
                </div>
              </>
            )}
          </div>
        )}

      {qrPreviewCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Card QR
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {qrPreviewCardId}
                </h2>
              </div>
              <button
                onClick={() => setQrPreviewCardId(null)}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:text-gray-300"
                aria-label="Close QR preview"
              >
                <IconClose size={20} />
              </button>
            </div>

            <div className="p-5">
              <CardQrCodePanel
                cardId={qrPreviewCardId}
                title="Scan Entry Point"
                description="QR and NFC should both point to this card link only. The public page then resolves activation or profile display from the card ID."
                previewInNewTab={false}
                className="border-0 p-0 shadow-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
