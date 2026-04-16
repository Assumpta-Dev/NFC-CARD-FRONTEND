// ===========================================================
// PROTECTED ROUTE COMPONENT
// ===========================================================
// Wraps React Router's route system to guard protected pages.
// If the user is not authenticated, they're redirected to /login.
// If they ARE authenticated but hit a role-protected route
// (e.g. admin-only), they're redirected to /dashboard.
//
// Using a wrapper component (vs inline checks in every page)
// follows the DRY principle and makes route protection auditable.
// ===========================================================

// React import removed — react-jsx transform handles JSX without explicit React in scope
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageSpinner } from './ui';

interface ProtectedRouteProps {
  requiredRole?: 'USER' | 'ADMIN';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // While checking localStorage, show spinner — prevents flash of login page
  if (isLoading) return <PageSpinner />;

  if (!isAuthenticated) {
    // Save the attempted URL so we can redirect back after login
    // The `state` prop is read in the login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check — if a specific role is required and user doesn't have it
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render the child route — Outlet is React Router v6's way to render nested routes
  return <Outlet />;
}
