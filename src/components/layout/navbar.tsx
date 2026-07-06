// ===========================================================
// NAVBAR — Top navigation for public / guest pages
// ===========================================================

import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { IconClose, IconMenu, IconNfcTap } from "../icons/DashboardIcons";
import { Button, IconShell, ThemeToggle } from "../ui";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/pricing", label: "Pricing" },
  { to: "/support", label: "Support" },
  { to: "/contact-sales", label: "Contact" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? "text-brand-600 dark:text-brand-400"
      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
  }`;

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-100/80 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
          <IconShell icon={<IconNfcTap size={18} />} accent="brand" size="sm" />
          <span className="font-bold tracking-tight text-gray-900 dark:text-gray-100">
            E-Card
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="hidden text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 sm:inline"
          >
            Sign in
          </Link>
          <Link to="/register" className="hidden sm:block">
            <Button className="py-2 px-4 text-sm">Get Started</Button>
          </Link>
          <button
            type="button"
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" fullWidth>
                  Sign in
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button fullWidth>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
