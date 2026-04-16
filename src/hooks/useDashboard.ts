// ===========================================================
// DASHBOARD HOOKS — Custom React Query Hooks
// ===========================================================
// These hooks encapsulate all data fetching logic for the dashboard.
// They handle:
//   ✓ Query caching (avoid redundant API calls)
//   ✓ Polling (refetch at intervals for real-time feel)
//   ✓ Error handling (pass through to component)
//   ✓ Loading states (isPending, isLoading, isRefetching)
//   ✓ Automatic retry (1 retry on network failure)
//
// Each hook returns: { data, isPending, error, isRefetching, refetch }
//
// USAGE:
//   const { data: cards, isPending, error } = useMyCards();
//   const { data: analytics, isRefetching } = useCardAnalytics(cardId);
// ===========================================================

import { useQuery } from "@tanstack/react-query";
import { cardApi, profileApi, adminApi } from "../services/api";

/**
 * Fetch user's own cards.
 * Cache key: ['myCards']
 * Refetch on window focus, but don't refetch if fresh (staleTime: 30s)
 */
export function useMyCards() {
  return useQuery({
    queryKey: ["myCards"],
    queryFn: () => cardApi.getMyCards(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch analytics for a specific card.
 * Cache key includes cardId to differentiate between cards.
 * Polls every 60 seconds (if enabled via refetchInterval).
 *
 * @param cardId - The card ID to fetch analytics for
 * @param pollInterval - Optional polling interval in ms (default: no polling)
 */
export function useCardAnalytics(cardId: string, pollInterval?: number) {
  return useQuery({
    queryKey: ["cardAnalytics", cardId],
    queryFn: () => cardApi.getAnalytics(cardId),
    enabled: !!cardId, // Don't fetch if cardId is empty
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: pollInterval, // Optional polling
  });
}

/**
 * Fetch all users (admin only).
 * Cache key: ['adminUsers']
 *
 * @param enabled - Whether to fetch (can be disabled if not admin)
 */
export function useAdminUsers(enabled = true) {
  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => adminApi.getAllUsers(),
    enabled,
    staleTime: 60 * 1000, // 60 seconds for admin data
  });
}

/**
 * Fetch all cards in system (admin only).
 * Cache key: ['adminCards']
 *
 * @param enabled - Whether to fetch (can be disabled if not admin)
 */
export function useAdminCards(enabled = true) {
  return useQuery({
    queryKey: ["adminCards"],
    queryFn: () => adminApi.getAllCards(),
    enabled,
    staleTime: 60 * 1000, // 60 seconds for admin data
  });
}

/**
 * Fetch system-wide statistics (admin only).
 * Cache key: ['adminStats']
 * Optional polling for real-time feel.
 *
 * @param pollInterval - Optional polling interval in ms
 * @param enabled - Whether to fetch
 */
export function useAdminStats(pollInterval?: number, enabled = true) {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: () => adminApi.getStats(),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: pollInterval, // Optional polling
  });
}

/**
 * Fetch user's profile.
 * Cache key: ['profile']
 */
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getProfile(),
    staleTime: 60 * 1000, // 60 seconds
  });
}
