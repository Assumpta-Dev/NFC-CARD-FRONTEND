// ===========================================================
// NAVBAR — Top navigation for public pages
// ===========================================================

import { Link } from "react-router-dom";
import { IconNfcTap } from "../icons/DashboardIcons";
import { IconShell, ThemeToggle } from "../ui";

export default function Navbar() {
  return (
    <nav className="w-full bg-white dark:bg-gray-900 px-6 py-4 fixed top-0 z-50 shadow-[0_2px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] border-b border-transparent dark:border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <IconShell icon={<IconNfcTap size={18} />} accent="brand" size="sm" />
          <span className="text-gray-900 dark:text-gray-100 font-bold tracking-tight">
            E-Card
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            Home
          </Link>
          <Link to="/pricing" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            Pricing
          </Link>
          <Link to="/support" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            Support
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/login"
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-brand-500 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
