// ===========================================================
// REUSABLE UI COMPONENTS
// ===========================================================

import React from "react";
import {
  formControlClass,
  formLabelClass,
  formLabelCompactClass,
  selectControlClass,
  textareaControlClass,
} from "./formStyles";

export {
  formControlClass,
  formLabelClass,
  formLabelCompactClass,
  selectControlClass,
  textareaControlClass,
} from "./formStyles";

// ===========================================================
// BUTTON
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
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm";

  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white focus:ring-brand-400",
    secondary:
      "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 focus:ring-brand-400 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-400",
    ghost:
      "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300 dark:hover:bg-gray-800 dark:text-gray-200",
    dark: "bg-white hover:bg-gray-50 text-gray-800 border border-brand-600 focus:ring-brand-500/30 focus:ring-offset-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100 dark:border-brand-500 dark:focus:ring-offset-gray-950",
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
        className={formLabelClass}
      >
        {label}
      </label>
      <input
        id={inputId}
        className={formControlClass(!!error, className)}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ===========================================================
// Warm surface input for auth and profile edit pages.
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
        className={formLabelCompactClass}
      >
        {label}
      </label>
      <input
        id={inputId}
        className={formControlClass(!!error, className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// ===========================================================
// SELECT
// ===========================================================
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  compactLabel?: boolean;
  placeholder?: string;
}

export function Select({
  label,
  options,
  error,
  compactLabel = false,
  placeholder,
  className = "",
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, "_");
  return (
    <div className="space-y-1">
      <label
        htmlFor={selectId}
        className={compactLabel ? formLabelCompactClass : formLabelClass}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={selectControlClass(!!error, className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <IconChevronDown
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}

// ===========================================================
// TEXTAREA
// ===========================================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  compactLabel?: boolean;
  hint?: string;
}

export function Textarea({
  label,
  error,
  compactLabel = false,
  hint,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label.toLowerCase().replace(/\s+/g, "_");
  return (
    <div className="space-y-1">
      <label
        htmlFor={textareaId}
        className={compactLabel ? formLabelCompactClass : formLabelClass}
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        className={textareaControlClass(!!error, className)}
        {...props}
      />
      {props.maxLength != null && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {(props.value?.toString() ?? "").length}/{props.maxLength}
        </p>
      )}
      {hint && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}

// ===========================================================
// PAGE SPINNER
// ===========================================================
export function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-surface-600 dark:border-gray-700 border-t-brand-500" />
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// ===========================================================
// ALERT
// ===========================================================
interface AlertProps {
  message: string;
  type?: "error" | "success" | "warning";
  className?: string;
}

export function Alert({ message, type = "error", className = "" }: AlertProps) {
  const styles = {
    error:
      "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400",
    success:
      "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400",
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
// DARK ALERT — translucent variant for warm-surface pages
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
// STAT CARD — minimal metric tile
// ===========================================================
import type { MetricAccent } from "../icons/DashboardIcons";
import {
  IconChevronDown,
  metricAccentStyles,
} from "../icons/DashboardIcons";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: MetricAccent;
  /** @deprecated use accent instead */
  color?: string;
}

export function StatCard({
  label,
  value,
  icon,
  accent = "brand",
}: StatCardProps) {
  const styles = metricAccentStyles[accent];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all duration-300 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${styles.shell}`}
      >
        <span className={styles.icon}>{icon}</span>
      </div>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accent?: MetricAccent;
  valueClassName?: string;
}

export function MetricTile({
  label,
  value,
  icon,
  accent = "slate",
  valueClassName = "",
}: MetricTileProps) {
  const styles = metricAccentStyles[accent];

  return (
    <div className="rounded-2xl border border-gray-100/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 transition-colors hover:border-gray-200 dark:hover:border-gray-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            {label}
          </p>
          <p
            className={`mt-1.5 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 ${valueClassName}`}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.shell}`}
          >
            <span className={styles.icon}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricTileCompactProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: MetricAccent;
  hint?: string;
}

export function MetricTileCompact({
  label,
  value,
  icon,
  accent = "brand",
  hint,
}: MetricTileCompactProps) {
  const styles = metricAccentStyles[accent];

  return (
    <div className="rounded-2xl border border-gray-100/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center transition-colors hover:border-gray-200 dark:hover:border-gray-700">
      <div
        className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${styles.shell}`}
      >
        <span className={styles.icon}>{icon}</span>
      </div>
      {hint && (
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
          {hint}
        </p>
      )}
      <p className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-gray-400">
        {label}
      </p>
    </div>
  );
}

// ===========================================================
// ICON SHELL — accent icon container
// ===========================================================
interface IconShellProps {
  icon: React.ReactNode;
  accent?: MetricAccent;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IconShell({
  icon,
  accent = "brand",
  size = "md",
  className = "",
}: IconShellProps) {
  const styles = metricAccentStyles[accent];
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 rounded-lg"
      : size === "lg"
        ? "h-12 w-12 rounded-2xl"
        : "h-10 w-10 rounded-xl";

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center border ${sizeClass} ${styles.shell} ${className}`}
    >
      <span className={styles.icon}>{icon}</span>
    </div>
  );
}

// ===========================================================
// PANEL CARD — consistent bordered section
// ===========================================================
interface PanelCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function PanelCard({
  children,
  className = "",
  padding = false,
}: PanelCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-100/80 bg-white dark:border-gray-800 dark:bg-gray-900 ${
        padding ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ===========================================================
// SECTION HEADER — title row with optional icon
// ===========================================================
interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  accent?: MetricAccent;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  icon,
  accent = "brand",
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6 ${className}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && <IconShell icon={icon} accent={accent} size="sm" />}
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

// ===========================================================
// EMPTY STATE
// ===========================================================
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  accent?: MetricAccent;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  accent = "slate",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`px-6 py-14 text-center ${className}`}>
      <div className="mx-auto mb-4">
        <IconShell icon={icon} accent={accent} size="lg" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ===========================================================
// FILTER PILLS
// ===========================================================
interface FilterPillOption<T extends string> {
  label: string;
  value: T;
}

interface FilterPillsProps<T extends string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: FilterPillsProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            value === option.value
              ? "bg-brand-500 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ===========================================================
// LOADING SKELETON
// ===========================================================
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 animate-pulse">
      <div className="mb-4 h-11 w-11 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-24 mb-3" />
      <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded w-20" />
    </div>
  );
}

// ===========================================================
// ERROR BOX
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
      className={`rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10 ${className}`}
    >
      <h3 className="font-semibold text-red-900 dark:text-red-300">{title}</h3>
      <p className="text-sm text-red-700 dark:text-red-400 mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
          aria-label="Retry loading data"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ===========================================================
// PAGINATION
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

  const pageBtn =
    "px-3 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300";

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${pageBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Previous page"
      >
        Prev
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className={pageBtn}>
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
              : pageBtn
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
          <button onClick={() => onPageChange(totalPages)} className={pageBtn}>
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${pageBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}

// ===========================================================
// DATE RANGE PICKER
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
          onClick={() => onRangeChange(range.value as "7d" | "30d" | "90d" | "all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedRange === range.value
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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

export { ThemeToggle } from "./ThemeToggle";
