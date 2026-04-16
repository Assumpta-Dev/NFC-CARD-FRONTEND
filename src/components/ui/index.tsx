// ===========================================================
// REUSABLE UI COMPONENTS
// ===========================================================
// Small, focused, composable components.
// Two themes supported:
//   Light — used in Dashboard and Admin pages
//   Dark  — used in Auth, ProfileEdit, and CardPublicView (OVOU style)
// ===========================================================

import React from "react";

// ===========================================================
// BUTTON
// Supports primary, secondary, danger, ghost, and dark variants.
// ===========================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "dark";
  isLoading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  isLoading = false,
  children,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm";

  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white focus:ring-brand-400",
    secondary:
      "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 focus:ring-brand-400",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-400",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300",
    // Dark variant: for use on dark-background pages
    dark: "bg-surface-700 hover:bg-surface-600 text-gray-200 border border-surface-600 focus:ring-brand-500/30 focus:ring-offset-surface-900",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// ===========================================================
// INPUT — Light theme
// ===========================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "_");
  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 bg-white
          focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200
          ${
            error
              ? "border-red-300 focus:ring-red-400 focus:border-red-400"
              : "border-gray-200 focus:ring-brand-400 focus:border-brand-400"
          }
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// ===========================================================
// DARK INPUT — For dark-background pages (auth, profile edit)
// Labels are small-caps; inputs use surface-800 background.
// ===========================================================
interface DarkInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function DarkInput({
  label,
  error,
  id,
  className = "",
  ...props
}: DarkInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "_");
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold uppercase tracking-wider text-gray-500"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl border text-white placeholder-gray-600 bg-surface-800
          focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200
          ${
            error
              ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500/60"
              : "border-surface-600 focus:ring-brand-500/40 focus:border-brand-500/60"
          }
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ===========================================================
// PAGE SPINNER — Full-screen loading indicator
// ===========================================================
export function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-surface-600 border-t-brand-500" />
        <p className="mt-3 text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// ===========================================================
// ALERT — Light theme (dashboard/admin)
// ===========================================================
interface AlertProps {
  message: string;
  type?: "error" | "success" | "warning";
  className?: string;
}

export function Alert({ message, type = "error", className = "" }: AlertProps) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
  };
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${styles[type]} ${className}`}
    >
      {message}
    </div>
  );
}

// ===========================================================
// DARK ALERT — For dark-background pages
// ===========================================================
interface DarkAlertProps {
  message: string;
  type?: "error" | "success" | "warning";
  className?: string;
}

export function DarkAlert({
  message,
  type = "error",
  className = "",
}: DarkAlertProps) {
  const styles = {
    error: "bg-red-500/10 border-red-500/30 text-red-400",
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  };
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${styles[type]} ${className}`}
    >
      {message}
    </div>
  );
}

// ===========================================================
// STAT CARD — Analytics number display (light theme dashboard)
// ===========================================================
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

export function StatCard({
  label,
  value,
  icon,
  color = "bg-brand-500",
}: StatCardProps) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl text-white flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ===========================================================
// LOADING SKELETON — Placeholder while data loads
// ===========================================================
export function StatCardSkeleton() {
  return (
    <div className="card p-5 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-6 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-100 rounded w-32" />
      </div>
    </div>
  );
}

// ===========================================================
// ERROR BOUNDARY COMPONENT — Display errors gracefully
// ===========================================================
export function ErrorBox({
  title = "Error",
  message,
  onRetry,
  className = "",
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-red-200 bg-red-50 p-4 ${className}`}
    >
      <h3 className="font-semibold text-red-900">{title}</h3>
      <p className="text-sm text-red-700 mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 underline"
          aria-label="Retry loading data"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ===========================================================
// PAGINATION CONTROLS — Navigate large lists
// ===========================================================
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  const pageNumbers = [];
  const maxVisible = 5;

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        aria-label="Previous page"
      >
        Prev
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
          >
            1
          </button>
          {start > 2 && <span className="text-gray-400">...</span>}
        </>
      )}

      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded border ${
            page === currentPage
              ? "bg-brand-500 text-white border-brand-500"
              : "border-gray-200 hover:bg-gray-50"
          }`}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}

// ===========================================================
// DATE RANGE PICKER — Select time periods
// ===========================================================
interface DateRangePickerProps {
  selectedRange: "7d" | "30d" | "90d" | "all";
  onRangeChange: (range: "7d" | "30d" | "90d" | "all") => void;
  className?: string;
}

export function DateRangePicker({
  selectedRange,
  onRangeChange,
  className = "",
}: DateRangePickerProps) {
  const ranges = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "all", label: "All time" },
  ];

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onRangeChange(range.value as any)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedRange === range.value
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          aria-label={`Show ${range.label}`}
          aria-pressed={selectedRange === range.value}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
