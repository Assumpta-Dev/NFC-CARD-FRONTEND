import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IconPaid } from "../../components/icons/DashboardIcons";
import { Alert, Button, Input } from "../../components/ui";
import { getErrorMessage, paymentApi } from "../../services/api";
import {
  PLAN_CONFIG,
  PLAN_ORDER,
  formatPlanAmount,
  getPlanAmount,
} from "./plans";
import { BillingCycle, PaymentMethod, PaymentPlan } from "../../types";

const PAYMENT_METHODS: PaymentMethod[] = ["MTN", "AIRTEL"];

function isPlan(value: string | null): value is PaymentPlan {
  return value === "FREE" || value === "PLUS" || value === "BUSINESS";
}

function isBillingCycle(value: string | null): value is BillingCycle {
  return value === "MONTHLY" || value === "ANNUAL";
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>("PLUS");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MTN");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const planFromUrl = searchParams.get("plan");
    const cycleFromUrl = searchParams.get("cycle");

    if (isPlan(planFromUrl)) {
      setSelectedPlan(planFromUrl);
    }

    if (isBillingCycle(cycleFromUrl)) {
      setCycle(cycleFromUrl);
    }
  }, [searchParams]);

  const amount = getPlanAmount(selectedPlan, cycle);

  const handleCheckout = async () => {
    setError("");

    if (selectedPlan === "FREE") {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required for mobile money checkout.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await paymentApi.initiatePayment({
        plan: selectedPlan,
        billingCycle: cycle,
        amount,
        phone: phone.trim(),
        provider: paymentMethod,
        method: paymentMethod,
      });

      navigate("/dashboard/payments", {
        replace: true,
        state: {
          successMessage: `${result.message}. Reference: ${result.paymentId}`,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="pb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Upgrade your Account
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-gray-500 dark:text-gray-400">
            Choose a plan that fits your networking and business needs.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setCycle("MONTHLY")}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                cycle === "MONTHLY"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("ANNUAL")}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                cycle === "ANNUAL"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm dark:shadow-none"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100"
              }`}
            >
              Annual <span className="ml-1 text-xs font-bold text-brand-500">-20%</span>
            </button>
          </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-20 pt-4">
        {error && <Alert message={error} />}

        <div className="grid gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const config = PLAN_CONFIG[plan];
            const isSelected = selectedPlan === plan;
            const planAmount = getPlanAmount(plan, cycle);

            return (
              <button
                key={plan}
                type="button"
                onClick={() => setSelectedPlan(plan)}
                className={`card-soft relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all duration-200 ${
                  isSelected
                    ? "z-10 scale-[1.03] border-brand-500 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
                    : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 hover:border-brand-500/40 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                }`}
              >
                {config.badge && (
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-3 transform">
                    <span className="rounded-full bg-brand-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                      {config.badge}
                    </span>
                  </div>
                )}

                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {config.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {config.description}
                  </p>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {formatPlanAmount(planAmount)}
                    </span>
                    {planAmount > 0 && (
                      <span className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                        /{cycle === "MONTHLY" ? "mo" : "yr"}
                      </span>
                    )}
                  </div>

                  <ul className="mt-8 space-y-3">
                    {config.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <IconPaid size={18} className="flex-shrink-0 text-brand-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>

        <div className="card-soft rounded-2xl bg-white dark:bg-gray-900 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Checkout Summary
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {PLAN_CONFIG[selectedPlan].title}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {cycle === "MONTHLY" ? "Monthly billing" : "Annual billing"}
              </p>
              <p className="mt-4 text-3xl font-bold text-brand-600 dark:text-brand-400">
                {formatPlanAmount(amount)}
              </p>
            </div>

            <div className="w-full max-w-md space-y-5">
              {selectedPlan !== "FREE" && (
                <>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Payment Method
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                            paymentMethod === method
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300 hover:border-brand-500/40 hover:bg-brand-500/5"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Phone Number"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0788123456"
                    type="tel"
                  />

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Payments are initiated as pending and move to success when
                    the provider callback confirms them.
                  </p>
                </>
              )}

              <Button
                onClick={handleCheckout}
                isLoading={isLoading}
                fullWidth
                className="py-3"
              >
                {selectedPlan === "FREE"
                  ? "Continue with Free"
                  : `Pay ${formatPlanAmount(amount)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
