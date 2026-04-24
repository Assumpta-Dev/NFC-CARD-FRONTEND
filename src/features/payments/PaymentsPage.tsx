import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
} from "react-icons/hi";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Alert, PageSpinner } from "../../components/ui";
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
    <DashboardLayout>
      <div className="border-b border-[#DE3A16] bg-white">
        <div className="mx-auto max-w-4xl px-4 pb-8 pt-8">
          <div className="flex items-center gap-3">
            <span className="icon-badge h-10 w-10 rounded-xl">
              <HiOutlineCurrencyDollar className="text-xl" />
            </span>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Payments & Billing
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Manage your subscriptions and view payment history
          </p>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-4xl flex-grow flex-col gap-6 px-4 pb-10 pt-8">
        {error && <Alert message={error} />}
        {success && <Alert message={success} type="success" />}

        <div className="card-soft rounded-2xl border border-[#e9d7d2] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiOutlineCreditCard className="text-2xl text-[#DE3A16]" />
              <h2 className="text-lg font-semibold text-gray-900">
                Current Subscription
              </h2>
            </div>
            {featuredPayment ? (
              <span className={getStatusClassName(featuredPayment.status)}>
                {featuredPayment.status}
              </span>
            ) : null}
          </div>

          {featuredPayment ? (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Plan
                </p>
                <p className="font-medium text-gray-900">
                  {PLAN_CONFIG[featuredPayment.plan].title}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Billing Cycle
                </p>
                <p className="font-medium text-gray-900">
                  {featuredPayment.billingCycle === "MONTHLY"
                    ? "Monthly"
                    : "Annual"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount
                </p>
                <p className="font-medium text-gray-900">
                  {formatPlanAmount(featuredPayment.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Next Billing
                </p>
                <p className="font-medium text-gray-900">
                  {formatNextBilling(featuredPayment)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              No payments yet. Choose a plan to start billing.
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <Link to="/dashboard/checkout" className="btn-primary px-4 py-2 text-sm">
              Upgrade Plan
            </Link>
          </div>
        </div>

        <div className="card-soft overflow-hidden rounded-2xl border border-[#e9d7d2] bg-white">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-900">Payment History</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#fdf8f7]"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {PLAN_CONFIG[payment.plan].title} - {formatPlanAmount(payment.amount)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()} - {payment.method}
                  </span>
                </div>
                <span className={getStatusClassName(payment.status)}>
                  {payment.status}
                </span>
              </div>
            ))}

            {payments.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No payment history found.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 p-1.5 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <HiOutlineChevronLeft className="text-gray-600" />
                </button>
                <button
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-200 p-1.5 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <HiOutlineChevronRight className="text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}

function getStatusClassName(status: Payment["status"]) {
  if (status === "SUCCESS") {
    return "rounded-full bg-[#fdf0ec] px-3 py-1 text-xs font-bold text-[#DE3A16]";
  }

  if (status === "PENDING") {
    return "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600";
  }

  return "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600";
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
