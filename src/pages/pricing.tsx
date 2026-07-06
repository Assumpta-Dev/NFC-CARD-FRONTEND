import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { Button, IconShell } from "../components/ui";
import {
  PLAN_CONFIG,
  PLAN_ORDER,
  formatPlanAmount,
  getPlanAmount,
} from "../features/payments/plans";
import { BillingCycle, PaymentPlan } from "../types";
import { IconPaid, IconPayment } from "../components/icons/DashboardIcons";

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Pricing
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            Simple, transparent plans
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-gray-600 dark:text-gray-400">
            Start free and upgrade when you need analytics, multiple cards, or
            full business features.
          </p>

          <div className="mt-8 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setCycle("MONTHLY")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                cycle === "MONTHLY"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle("ANNUAL")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                cycle === "ANNUAL"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs opacity-80">−20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const config = PLAN_CONFIG[plan];
            const amount = getPlanAmount(plan, cycle);
            const cta =
              plan === "FREE"
                ? "/register"
                : `/dashboard/checkout?plan=${plan}&cycle=${cycle}`;
            const isPopular = plan === "PLUS";

            return (
              <div
                key={plan}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 dark:bg-gray-900 ${
                  isPopular
                    ? "border-brand-500/40 shadow-[0_8px_30px_rgba(240,85,53,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] lg:scale-[1.02]"
                    : "border-gray-100/80 dark:border-gray-800"
                }`}
              >
                {config.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    {config.badge}
                  </span>
                )}

                <div className="mb-4">
                  <IconShell
                    icon={<IconPayment size={18} />}
                    accent={isPopular ? "brand" : "slate"}
                    size="sm"
                  />
                </div>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {config.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {config.description}
                </p>

                <div className="mt-5">
                  <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    {formatPlanAmount(amount)}
                  </span>
                  {amount > 0 && (
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                      /{cycle === "MONTHLY" ? "mo" : "yr"}
                    </span>
                  )}
                </div>

                {cycle === "ANNUAL" && plan !== "FREE" && (
                  <p className="mt-2 text-sm font-medium text-brand-600 dark:text-brand-400">
                    Save 20% with annual billing
                  </p>
                )}

                <ul className="mt-6 flex-1 space-y-3">
                  {config.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <IconPaid size={16} className="mt-0.5 shrink-0 text-brand-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={cta} className="mt-8 block">
                  <Button
                    variant={isPopular ? "primary" : "secondary"}
                    fullWidth
                  >
                    {getCtaLabel(plan)}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Need a custom setup for your team?{" "}
          <Link
            to="/contact-sales"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Contact sales
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}

function getCtaLabel(plan: PaymentPlan) {
  if (plan === "FREE") return "Get started free";
  if (plan === "BUSINESS") return "Choose Business";
  return "Upgrade to Plus";
}
