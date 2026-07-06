import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";
import {
  HiOutlineCreditCard,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";
import { getNavGroupsForRole, getPageTitle } from "./sidebarNav";
import type { UserRole } from "./sidebarNav";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? "bg-brand-600 text-white"
      : "text-gray-600 dark:text-gray-400 hover:bg-brand-600/10 hover:text-brand-600 dark:hover:text-brand-400"
  }`;

const roleLabels: Record<UserRole, string> = {
  USER: "User",
  BUSINESS: "Business",
  ADMIN: "Administrator",
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = (user?.role ?? "USER") as UserRole;
  const navGroups = getNavGroupsForRole(role);
  const pageTitle = getPageTitle(location.pathname);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-3"
            onClick={closeSidebar}
          >
            <span className="icon-badge w-10 h-10 rounded-xl">
              <HiOutlineCreditCard className="text-xl" />
            </span>
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100 tracking-tight text-sm">
                E-Card
              </p>
              <p className="text-xs text-gray-400">{roleLabels[role]}</p>
            </div>
          </Link>
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <HiOutlineX className="text-lg" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.to + item.label}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={navLinkClass}
                      onClick={closeSidebar}
                    >
                      <item.icon className="text-lg shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="mb-3 px-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.name ?? "User"}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-brand-600 hover:text-white transition-colors"
          >
            <HiOutlineLogout className="text-lg" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <HiOutlineMenu className="text-xl" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {roleLabels[role]}
                </p>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {pageTitle}
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
