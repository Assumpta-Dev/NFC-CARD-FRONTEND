import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  HiOutlineCreditCard,
  HiOutlinePencil,
  HiOutlineShieldCheck,
  HiOutlineOfficeBuilding,
  HiOutlineCurrencyDollar,
  HiOutlineLogout,
  HiOutlineChevronLeft,
} from "react-icons/hi";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-[#DE3A16] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-[#DE3A16] hover:text-white transition-colors"
              aria-label="Back to dashboard"
            >
              <HiOutlineChevronLeft className="text-base" />
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="icon-badge w-8 h-8 rounded-lg">
                <HiOutlineCreditCard className="text-lg" />
              </span>
              <span className="font-bold text-gray-900 tracking-tight text-sm">
                E-Card
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-0.5">
            <Link
              to="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-[#DE3A16] hover:text-white transition-colors"
            >
              <HiOutlinePencil className="text-base" />
              <span className="hidden sm:inline">Edit Profile</span>
            </Link>

            {user?.role === "ADMIN" && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-[#DE3A16] hover:text-white transition-colors"
              >
                <HiOutlineShieldCheck className="text-base" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {user?.role === "BUSINESS" && (
              <Link
                to="/dashboard/menu"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-[#DE3A16] hover:text-white transition-colors"
              >
                <HiOutlineOfficeBuilding className="text-base" />
                <span className="hidden sm:inline">Menu</span>
              </Link>
            )}

            <Link
              to="/dashboard/payments"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#DE3A16] hover:bg-[#DE3A16] hover:text-white transition-colors"
            >
              <HiOutlineCurrencyDollar className="text-base" />
              <span className="hidden sm:inline">Payments</span>
            </Link>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-[#DE3A16] hover:text-white transition-colors"
            >
              <HiOutlineLogout className="text-base" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
