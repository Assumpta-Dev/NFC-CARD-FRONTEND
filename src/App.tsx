// ===========================================================
// APP.TSX — Root Application Component & Router
// ===========================================================
// React Router v6 declarative routing is defined here.
// Route organization:
//   - Public routes: accessible to everyone (card view, login, register)
//   - Protected routes: require authentication (dashboard, profile)
//   - Admin routes: require ADMIN role
//
// The AuthProvider wraps everything so auth context is available
// in every component down the tree.
//
// BrowserRouter is used (not HashRouter) so URLs look clean:
//   ✅ /card/CARD_DEMO1
//   ❌ /#/card/CARD_DEMO1
// The web server must be configured to serve index.html for all
// routes (SPA fallback) — Vite's dev server does this automatically.
// ===========================================================

// React import removed — react-jsx transform (tsconfig jsx: react-jsx) handles JSX automatically
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./hooks/useQueryClient";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Page imports — each feature folder owns its pages
import { LoginPage, RegisterPage } from "./features/auth/AuthPages";
import { CardPublicView } from "./features/card/CardPublicView";
import { UserDashboard } from "./features/dashboard/UserDashboard";
import { ProfileEditPage } from "./features/dashboard/ProfileEditPage";
import { AdminDashboard } from "./features/admin/AdminDashboard";

export default function App() {
  return (
    // QueryClientProvider must wrap the app to provide React Query context
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider must wrap the router so useAuth() works in route guards */}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public Routes ─────────────────────────────────────
              These routes are accessible to everyone — no auth needed.
              ─────────────────────────────────────────────────────── */}

            {/* Root redirect — send visitors straight to login or dashboard */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Authentication pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Public card view — the main NFC/QR scan destination
              URL pattern matches the card ID embedded in the NFC chip/QR:
              yourdomain.com/card/CARD_8F3K2L */}
            <Route path="/card/:cardId" element={<CardPublicView />} />

            {/* ── Protected Routes ──────────────────────────────────
              ProtectedRoute redirects to /login if not authenticated.
              Outlet renders the matched child route.
              ─────────────────────────────────────────────────────── */}
            <Route element={<ProtectedRoute />}>
              {/* User dashboard — scan analytics, card management */}
              <Route path="/dashboard" element={<UserDashboard />} />

              {/* Profile editor — edit digital card content and links */}
              <Route path="/profile" element={<ProfileEditPage />} />
            </Route>

            {/* ── Admin-Only Routes ─────────────────────────────────
              Double protection: requireAuth + requireAdmin role check.
              Non-admin users are redirected to /dashboard.
              ─────────────────────────────────────────────────────── */}
            <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* ── 404 Fallback ──────────────────────────────────────
              Catches any URL that doesn't match the above patterns.
              Redirects to login rather than showing a blank page.
              ─────────────────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
