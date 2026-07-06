import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { Button, IconShell } from "../components/ui";
import {
  IconChevronDown,
  IconMail,
  IconNfcTap,
  IconPayment,
  IconQrCode,
} from "../components/icons/DashboardIcons";

const FAQS = [
  {
    q: "How do I create my digital card?",
    answer:
      "Sign up for a free account, complete your profile in the dashboard, and optionally link a physical card ID. Your public URL and QR code are generated automatically.",
  },
  {
    q: "How do NFC cards work?",
    answer:
      "Program your NFC tag with your unique E-Card URL (e.g. yourdomain.com/c/CARD_XXXXXX). When someone taps their phone, your profile opens instantly — no app required.",
  },
  {
    q: "Can I accept orders from my card?",
    answer:
      "Yes. Business accounts can build a digital menu and accept table or room orders directly from the public card page. Orders appear in your business dashboard.",
  },
  {
    q: "What payment methods do you support?",
    answer:
      "Subscription payments use MTN MoMo and Airtel Money via Paypack. Customer orders use mobile money — customers submit their transaction ID for verification.",
  },
  {
    q: "How do I upgrade my plan?",
    answer:
      "Visit the Pricing page or go to Dashboard → My Payments → Upgrade Plan. Choose Plus or Business and complete checkout with mobile money.",
  },
  {
    q: "I lost access to my account. What should I do?",
    answer:
      "Use the Forgot Password link on the sign-in page. If you still need help, email our support team and we'll assist you.",
  },
];

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Help center
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            How can we help?
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Find answers to common questions or reach out to our team.
          </p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: <IconNfcTap size={18} />,
              title: "Getting started",
              desc: "Setup guides",
              accent: "brand" as const,
            },
            {
              icon: <IconQrCode size={18} />,
              title: "NFC & QR",
              desc: "Programming tips",
              accent: "violet" as const,
            },
            {
              icon: <IconPayment size={18} />,
              title: "Billing",
              desc: "Plans & payments",
              accent: "emerald" as const,
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-gray-100/80 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900"
            >
              <IconShell icon={card.icon} accent={card.accent} size="sm" className="mx-auto mb-3" />
              <p className="font-semibold text-gray-900 dark:text-gray-100">{card.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {faq.q}
                  </span>
                  <IconChevronDown
                    size={18}
                    className={`shrink-0 text-gray-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
                    <p className="text-sm leading-7 text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-gray-100/80 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/50">
          <IconShell
            icon={<IconMail size={20} />}
            accent="brand"
            size="sm"
            className="mx-auto mb-4"
          />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Still need help?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Email us at{" "}
            <a
              href="mailto:icumutechltd@gmail.com"
              className="font-medium text-brand-600 dark:text-brand-400"
            >
              icumutechltd@gmail.com
            </a>
          </p>
          <Link to="/contact-sales" className="mt-5 inline-block">
            <Button variant="secondary">Contact sales</Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
