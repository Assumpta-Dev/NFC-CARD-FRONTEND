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
//   ✅ /c/CARD_DEMO1
//   ❌ /#/c/CARD_DEMO1
// The web server must be configured to serve index.html for all
// routes (SPA fallback) — Vite's dev server does this automatically.
// ===========================================================

// React import removed — react-jsx transform (tsconfig jsx: react-jsx) handles JSX automatically
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./hooks/useQueryClient";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Feature صفحات
import { LoginPage, RegisterPage } from "./features/auth/AuthPages";
import { CardPublicView } from "./features/card/CardPublicView";
import { UserDashboard } from "./features/dashboard/UserDashboard";
import { ProfileEditPage } from "./features/dashboard/ProfileEditPage";
import { AdminDashboard } from "./features/admin/AdminDashboard";

// New landing صفحات
import HomePage from "./pages/home";
import PricingPage from "./pages/pricing";
import SupportPage from "./pages/support";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ===================================================== */}
            {/* PUBLIC ROUTES (NO AUTH REQUIRED) */}
            {/* ===================================================== */}

            {/* Landing Page (FIRST PAGE USERS SEE) */}
            <Route path="/" element={<HomePage />} />

            {/* Auth صفحات */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Pricing & Support */}
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/support" element={<SupportPage />} />

            {/* Public Card View (NFC / QR destination) */}
            <Route path="/c/:cardId" element={<CardPublicView />} />
            <Route path="/card/:cardId" element={<CardPublicView />} />

            {/* ===================================================== */}
            {/* PROTECTED ROUTES (AUTH REQUIRED) */}
            {/* ===================================================== */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/profile" element={<ProfileEditPage />} />
            </Route>

            {/* ===================================================== */}
            {/* ADMIN ROUTES */}
            {/* ===================================================== */}
            <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* ===================================================== */}
            {/* 404 FALLBACK */}
            {/* ===================================================== */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
