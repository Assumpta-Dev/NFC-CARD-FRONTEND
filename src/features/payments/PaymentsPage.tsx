import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  MetricTile,
  PageSpinner,
  Pagination,
  PanelCard,
  SectionHeader,
} from "../../components/ui";
import { IconPayment, IconPaid, IconReceipt } from "../../components/icons/DashboardIcons";
import { getErrorMessage, paymentApi } from "../../services/api";
import { Payment } from "../../types";
import { PLAN_CONFIG, formatPlanAmount } from "./plans";

const ITEMS_PER_PAGE = 5;

export function PaymentsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const successMessage = (location.state as { successMessage?: string } | null)
      ?.successMessage;

    if (successMessage) {
      setSuccess(successMessage);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    setIsLoading(true);
    paymentApi
      .getMyPayments(page, ITEMS_PER_PAGE)
      .then(({ payments, pagination }) => {
        setPayments(payments);
        setTotalPages(Math.max(pagination.pages, 1));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [page]);

  const featuredPayment =
    payments.find((payment) => payment.status === "SUCCESS") || payments[0];

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Manage your subscriptions and view payment history
      </p>

      <div className="space-y-6">
        {error && <Alert message={error} />}
        {success && <Alert message={success} type="success" />}

        <PanelCard>
          <SectionHeader
            title="Current Subscription"
            icon={<IconPayment size={18} />}
            accent="brand"
            action={
              featuredPayment ? (
                <span className={getStatusClassName(featuredPayment.status)}>
                  {featuredPayment.status}
                </span>
              ) : undefined
            }
          />

          {featuredPayment ? (
            <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
              <MetricTile
                label="Plan"
                value={PLAN_CONFIG[featuredPayment.plan].title}
                icon={<IconReceipt size={18} />}
                accent="brand"
              />
              <MetricTile
                label="Billing Cycle"
                value={
                  featuredPayment.billingCycle === "MONTHLY"
                    ? "Monthly"
                    : "Annual"
                }
                icon={<IconPayment size={18} />}
                accent="sky"
              />
              <MetricTile
                label="Amount"
                value={formatPlanAmount(featuredPayment.amount)}
                icon={<IconPaid size={18} />}
                accent="emerald"
              />
              <MetricTile
                label="Next Billing"
                value={formatNextBilling(featuredPayment)}
                icon={<IconReceipt size={18} />}
                accent="violet"
              />
            </div>
          ) : (
            <p className="px-5 pb-5 text-sm text-gray-500 dark:text-gray-400">
              No payments yet. Choose a plan to start billing.
            </p>
          )}

          <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
            <Link to="/dashboard/checkout">
              <Button>Upgrade Plan</Button>
            </Link>
          </div>
        </PanelCard>

        <PanelCard>
          <SectionHeader title="Payment History" />

          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 sm:px-6"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {PLAN_CONFIG[payment.plan].title} - {formatPlanAmount(payment.amount)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(payment.createdAt).toLocaleDateString()} - {payment.method}
                  </span>
                </div>
                <span className={getStatusClassName(payment.status)}>
                  {payment.status}
                </span>
              </div>
            ))}

            {payments.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No payment history found.
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}

function getStatusClassName(status: Payment["status"]) {
  if (status === "SUCCESS") {
    return "rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400";
  }

  if (status === "PENDING") {
    return "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400";
  }

  return "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400";
}

function formatNextBilling(payment: Payment) {
  if (payment.status !== "SUCCESS") {
    return "Awaiting confirmation";
  }

  const nextBilling = new Date(payment.createdAt);
  if (payment.billingCycle === "MONTHLY") {
    nextBilling.setMonth(nextBilling.getMonth() + 1);
  } else {
    nextBilling.setFullYear(nextBilling.getFullYear() + 1);
  }

  return nextBilling.toLocaleDateString();
}
