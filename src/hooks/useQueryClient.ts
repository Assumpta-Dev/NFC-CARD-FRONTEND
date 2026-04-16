// ===========================================================
// REACT QUERY SETUP — Client Configuration
// ===========================================================
// Centralized React Query (TanStack Query) client configuration.
// This sets default options for all queries and mutations.
//
// KEY BENEFITS:
//   ✓ Automatic caching — data fetched once is shared across components
//   ✓ Background refetching — keeps data fresh without blocking UI
//   ✓ Deduplication — simultaneous requests for same data return 1 request
//   ✓ Polling support — refresh data at intervals (e.g., 30s for dashboards)
//   ✓ Error handling — unified retry logic and error boundaries
// ===========================================================

import { QueryClient } from "@tanstack/react-query";

/**
 * Create and export a singleton QueryClient instance.
 * This is imported in App.tsx and passed to <QueryClientProvider>.
 *
 * DEFAULT OPTIONS:
 *   - staleTime: 30 seconds — data is fresh for 30s (no refetch)
 *   - gcTime: 5 minutes — unused data kept in memory for 5 min
 *   - retry: 1 retry on network failure, then abort
 *   - refetchOnWindowFocus: true — refetch when user returns to tab
 *   - refetchOnReconnect: true — refetch when network reconnects
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds — data is fresh for 30s
      gcTime: 5 * 60 * 1000, // 5 minutes — garbage collection time
      retry: 1, // Retry once on failure
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: false, // Don't refetch if data is fresh
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});

/**
 * Hook to access the query client from components.
 * Usage: const queryClient = useQueryClient();
 */
export { useQueryClient } from "@tanstack/react-query";
