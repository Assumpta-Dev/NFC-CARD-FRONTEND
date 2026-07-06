import { useEffect, useState } from "react";
import { adminApi, getErrorMessage } from "../../services/api";
import { AdminPayment, PaymentStatus } from "../../types";
import { Alert, PageSpinner } from "../../components/ui";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCurrencyDollar,
} from "react-icons/hi";

const ITEMS_PER_PAGE = 10;

const statusFilters: { label: string; value?: PaymentStatus }[] = [
  { label: "All", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "Success", value: "SUCCESS" },
  { label: "Failed", value: "FAILED" },
];

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "RWF",
  }).format(amount);
}

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getAllPayments(page, ITEMS_PER_PAGE, statusFilter)
      .then((data) => {
        setPayments(data.payments);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      {error && <Alert message={error} />}

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              statusFilter === filter.value
                ? "bg-[#DE3A16] text-white"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-[#DE3A16] hover:bg-[#DE3A16] hover:text-white"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">All Payments</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {total} payment{total === 1 ? "" : "s"} recorded
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="p-10 text-center">
            <HiOutlineCurrencyDollar className="text-gray-300 text-6xl mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">No payments yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Payment records appear here when users subscribe to a plan.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    {[
                      "User",
                      "Plan",
                      "Amount",
                      "Status",
                      "Method",
                      "Reference",
                      "Date",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {payment.user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {payment.user.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <p>{payment.plan}</p>
                        <p className="text-xs text-gray-400">
                          {payment.billingCycle}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            payment.status === "SUCCESS"
                              ? "badge-active"
                              : "badge-inactive"
                          }
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {payment.method}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">
                        {payment.reference ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {(page - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(page * ITEMS_PER_PAGE, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                    aria-label="Previous page"
                  >
                    <HiOutlineChevronLeft className="text-gray-600 dark:text-gray-400 text-base" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                    aria-label="Next page"
                  >
                    <HiOutlineChevronRight className="text-gray-600 dark:text-gray-400 text-base" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
