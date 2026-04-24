import { BillingCycle, PaymentPlan } from "../../types";

export interface PlanConfig {
  title: string;
  description: string;
  badge?: string;
  monthlyAmount: number;
  features: string[];
}

export const PLAN_ORDER: PaymentPlan[] = ["FREE", "PLUS", "BUSINESS"];

export const PLAN_CONFIG: Record<PaymentPlan, PlanConfig> = {
  FREE: {
    title: "Free",
    description: "Basic digital identity",
    monthlyAmount: 0,
    features: ["1 Digital Card", "Basic Profile", "QR Code"],
  },
  PLUS: {
    title: "Plus",
    description: "For professionals",
    badge: "Most Popular",
    monthlyAmount: 5000,
    features: [
      "Unlimited Cards",
      "Analytics",
      "Custom Links",
      "Remove Branding",
    ],
  },
  BUSINESS: {
    title: "Business",
    description: "For restaurants and teams",
    monthlyAmount: 12000,
    features: [
      "Business Profile",
      "Menu Builder",
      "Linked Business Cards",
      "Priority Support",
    ],
  },
};

export function getPlanAmount(
  plan: PaymentPlan,
  cycle: BillingCycle,
): number {
  const monthlyAmount = PLAN_CONFIG[plan].monthlyAmount;
  if (cycle === "MONTHLY") return monthlyAmount;
  return Math.round(monthlyAmount * 12 * 0.8);
}

export function formatPlanAmount(amount: number): string {
  if (amount === 0) return "Free";
  return `RWF ${amount.toLocaleString()}`;
}
