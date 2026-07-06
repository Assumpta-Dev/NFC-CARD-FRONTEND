export function formControlClass(error = false, extra = "") {
  return [
    "w-full px-4 py-3 rounded-xl border text-sm",
    "text-gray-900 dark:text-gray-100",
    "placeholder-gray-400 dark:placeholder-gray-500",
    "bg-gray-50 dark:bg-gray-800",
    "border-gray-200 dark:border-gray-600",
    "focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500",
    "dark:focus:ring-brand-500/25 dark:focus:border-brand-500",
    "transition-all duration-200",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    error
      ? "border-red-400 dark:border-red-500/60 focus:ring-red-400/40 dark:focus:ring-red-500/30"
      : "",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function selectControlClass(error = false, extra = "") {
  return formControlClass(error, `appearance-none cursor-pointer pr-10 ${extra}`);
}

export function textareaControlClass(error = false, extra = "") {
  return formControlClass(error, `resize-none ${extra}`);
}

export const formLabelClass =
  "block text-sm font-medium text-gray-700 dark:text-gray-300";

export const formLabelCompactClass =
  "block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300";
