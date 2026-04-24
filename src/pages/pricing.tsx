import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/navbar";
import {
  PLAN_CONFIG,
  PLAN_ORDER,
  formatPlanAmount,
  getPlanAmount,
} from "../features/payments/plans";
import { BillingCycle, PaymentPlan } from "../types";

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <div className="px-6 pb-12 pt-24">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-center text-3xl font-bold">
            Subscription Prices
          </h1>
          <p className="mb-8 text-center text-gray-600">
            Choose the plan that fits your needs
          </p>

          <div className="mb-12 flex justify-center">
            <div className="card-soft flex rounded-full border-[#DE3A16] p-1">
              <button
                onClick={() => setCycle("MONTHLY")}
                className={`rounded-full px-6 py-2 text-sm font-medium transition ${
                  cycle === "MONTHLY"
                    ? "bg-[#DE3A16] text-white"
                    : "text-gray-600"
                }`}
              >
                Monthly
              </button>

              <button
                onClick={() => setCycle("ANNUAL")}
                className={`rounded-full px-6 py-2 text-sm font-medium transition ${
                  cycle === "ANNUAL"
                    ? "bg-[#DE3A16] text-white"
                    : "text-gray-600"
                }`}
              >
                Annual
              </button>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {PLAN_ORDER.map((plan) => {
              const config = PLAN_CONFIG[plan];
              const amount = getPlanAmount(plan, cycle);
              const cta =
                plan === "FREE"
                  ? "/register"
                  : `/dashboard/checkout?plan=${plan}&cycle=${cycle}`;

              return (
                <div
                  key={plan}
                  className={`card-soft-hover relative border-[#DE3A16] p-6 ${
                    plan === "PLUS" ? "scale-105" : ""
                  }`}
                >
                  {config.badge && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#DE3A16] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                      {config.badge}
                    </span>
                  )}

                  <h2 className="text-xl font-semibold">{config.title}</h2>
                  <p className="mb-4 text-gray-600">{config.description}</p>

                  <div className="mb-2 text-3xl font-bold">
                    {formatPlanAmount(amount)}
                    {amount > 0 && (
                      <span className="ml-1 text-sm font-medium text-gray-500">
                        /{cycle === "MONTHLY" ? "mo" : "yr"}
                      </span>
                    )}
                  </div>

                  {cycle === "ANNUAL" && plan !== "FREE" && (
                    <p className="mb-4 text-sm font-medium text-[#DE3A16]">
                      Save 20% with annual billing
                    </p>
                  )}

                  <ul className="mb-6 space-y-2 text-sm text-gray-700">
                    {config.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#DE3A16] flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={cta}
                    className="mt-2 inline-block w-full rounded-xl bg-[#DE3A16] py-2.5 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-700 hover:shadow-[0_4px_14px_rgba(222,58,22,0.3)]"
                  >
                    {getCtaLabel(plan)}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCtaLabel(plan: PaymentPlan) {
  if (plan === "FREE") return "Get Started";
  if (plan === "BUSINESS") return "Choose Business";
  return "Upgrade";
}
