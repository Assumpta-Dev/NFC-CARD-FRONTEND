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
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Feature صفحات
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "./features/auth/AuthPages";
import { CardPublicView } from "./features/card/CardPublicView";
import { OrderTrackingPage } from "./features/card/OrderTrackingPage";
import { UserDashboard } from "./features/dashboard/UserDashboard";
import { ProfileEditPage } from "./features/dashboard/ProfileEditPage";
import { AdminDashboard } from "./features/admin/AdminDashboard";
import { AdminBusinessesPage } from "./features/admin/AdminBusinessesPage";
import { AdminPaymentsPage } from "./features/admin/AdminPaymentsPage";
import { AppLayout } from "./components/layout/AppLayout";

// New feature pages
import { PaymentsPage } from "./features/payments/PaymentsPage";
import { CheckoutPage } from "./features/payments/CheckoutPage";
import { BusinessMenuPage } from "./features/dashboard/BusinessMenuPage";
import { BusinessOrdersPage } from "./features/dashboard/BusinessOrdersPage";

// New landing pages
import HomePage from "./pages/home";
import PricingPage from "./pages/pricing";
import SupportPage from "./pages/support";
import ContactSalesPage from "./pages/contact-sales";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
            {/* Password reset flow — public, no auth required */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Pricing & Support */}
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/contact-sales" element={<ContactSalesPage />} />

            {/* Public Card View (NFC / QR destination) */}
            <Route path="/c/:cardId" element={<CardPublicView />} />
            <Route path="/card/:cardId" element={<CardPublicView />} />
            {/* Order tracking — public, customer uses this to track their order */}
            <Route path="/order/:orderId" element={<OrderTrackingPage />} />

            {/* ===================================================== */}
            {/* PROTECTED ROUTES (AUTH REQUIRED) */}
            {/* ===================================================== */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/profile" element={<ProfileEditPage />} />
                <Route path="/dashboard/payments" element={<PaymentsPage />} />
                <Route path="/dashboard/checkout" element={<CheckoutPage />} />

                <Route element={<ProtectedRoute requiredRole="BUSINESS" />}>
                  <Route path="/dashboard/menu" element={<BusinessMenuPage />} />
                  <Route path="/dashboard/orders" element={<BusinessOrdersPage />} />
                </Route>

                <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                  <Route path="/admin" element={<AdminDashboard section="overview" />} />
                  <Route path="/admin/analytics" element={<AdminDashboard section="analytics" />} />
                  <Route path="/admin/cards" element={<AdminDashboard section="cards" />} />
                  <Route path="/admin/users" element={<AdminDashboard section="users" />} />
                  <Route path="/admin/businesses" element={<AdminBusinessesPage />} />
                  <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                </Route>
              </Route>
            </Route>

            {/* ===================================================== */}
            {/* 404 FALLBACK */}
            {/* ===================================================== */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
