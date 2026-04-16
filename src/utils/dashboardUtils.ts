// ===========================================================
// ENHANCED DASHBOARD UTILITIES — CSV Export & Date Filters
// ===========================================================
// Helper functions for dashboard features like CSV export and date range filtering.
// ===========================================================

import { ScanAnalytics } from "../types";

/**
 * Export scan data to CSV format.
 * Creates a downloadable CSV file with scan analytics.
 *
 * @param data - Array of scan data to export
 * @param fileName - Name of the CSV file (default: scans.csv)
 */
export function exportScansToCSV(data: any[], fileName = "scans.csv") {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Prepare CSV headers
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    ),
  ].join("\n");

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Filter analytics data by date range.
 * Useful for "Last 7 days", "Last 30 days", or custom ranges.
 *
 * @param analytics - The analytics object with dailyBreakdown
 * @param days - Number of days to include (0 = all time)
 * @returns Array of daily breakdown data filtered to the range
 */
export function filterAnalyticsByDateRange(
  analytics: ScanAnalytics | null,
  days: number,
) {
  if (!analytics) return []; // Handle null case

  if (days === 0) return analytics.dailyBreakdown; // All time

  const { dailyBreakdown } = analytics;
  const filtered = dailyBreakdown.slice(-days);
  return filtered;
}

/**
 * Calculate summary stats from breakdown data.
 *
 * @param breakdown - Array of daily breakdown data
 * @returns Object with total, average, min, max scans for the period
 */
export function calculatePeriodStats(breakdown: any[]) {
  if (!breakdown || breakdown.length === 0) {
    return { total: 0, average: 0, min: 0, max: 0 };
  }

  const counts = breakdown.map((d) => d.count);
  const total = counts.reduce((sum, c) => sum + c, 0);
  const average = Math.round(total / breakdown.length);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  return { total, average, min, max };
}

/**
 * Format a date for display.
 *
 * @param dateString - ISO date string
 * @param format - 'd/m' for short format, 'long' for long format
 * @returns Formatted date string
 */
export function formatAnalyticsDate(
  dateString: string,
  format: "short" | "long" = "short",
): string {
  const dt = new Date(dateString);
  if (format === "long") {
    return dt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}
