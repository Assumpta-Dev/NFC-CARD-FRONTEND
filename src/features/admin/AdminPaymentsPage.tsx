import { useEffect, useState } from "react";
import { adminApi, getErrorMessage } from "../../services/api";
import { AdminPayment, PaymentStatus } from "../../types";
import {
  Alert,
  EmptyState,
  FilterPills,
  PageSpinner,
  Pagination,
  PanelCard,
  SectionHeader,
} from "../../components/ui";
import { IconPayment } from "../../components/icons/DashboardIcons";

const ITEMS_PER_PAGE = 10;

type StatusFilter = "ALL" | PaymentStatus;

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const apiStatus = statusFilter === "ALL" ? undefined : statusFilter;

  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getAllPayments(page, ITEMS_PER_PAGE, apiStatus)
      .then((data) => {
        setPayments(data.payments);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [page, apiStatus]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      {error && <Alert message={error} />}

      <FilterPills
        options={statusFilters}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <PanelCard>
        <SectionHeader
          title="All Payments"
          description={`${total} payment${total === 1 ? "" : "s"} recorded`}
          icon={<IconPayment size={18} />}
          accent="brand"
        />

        {payments.length === 0 ? (
          <EmptyState
            icon={<IconPayment size={22} />}
            title="No payments yet"
            description="Payment records appear here when users subscribe to a plan."
            accent="slate"
          />
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
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
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
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {payment.reference ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </PanelCard>
    </div>
  );
}
