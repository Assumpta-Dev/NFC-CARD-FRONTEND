import { Link } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { Button, IconShell } from "../components/ui";
import {
  IconNfcTap,
  IconOrders,
  IconPulse,
  IconQrCode,
  IconRadar,
  IconSparkline,
  IconStorefront,
  IconUsers,
} from "../components/icons/DashboardIcons";

const FEATURES = [
  {
    title: "Tap to share",
    description:
      "One NFC tap or QR scan opens your digital profile — no app download required.",
    icon: <IconNfcTap size={20} />,
    accent: "brand" as const,
  },
  {
    title: "Smart analytics",
    description:
      "Track scans, devices, and engagement so you know what's working.",
    icon: <IconRadar size={20} />,
    accent: "violet" as const,
  },
  {
    title: "Digital menus",
    description:
      "Restaurants and cafes can showcase menus and take orders from the card.",
    icon: <IconOrders size={20} />,
    accent: "emerald" as const,
  },
  {
    title: "Business ready",
    description:
      "Hotels, motels, and shops get guest info panels and room or table orders.",
    icon: <IconStorefront size={20} />,
    accent: "sky" as const,
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up as an individual or business in under a minute.",
  },
  {
    step: "02",
    title: "Build your profile",
    description: "Add links, photos, menu items, and your business details.",
  },
  {
    step: "03",
    title: "Program your card",
    description: "Write your unique URL to an NFC tag or print the QR code.",
  },
  {
    step: "04",
    title: "Tap and grow",
    description: "Every scan connects you to customers, leads, and orders.",
  },
];

const AUDIENCES = [
  { label: "Professionals", desc: "Share contact details at networking events" },
  { label: "Restaurants", desc: "Digital menus and table-side ordering" },
  { label: "Hotels & motels", desc: "Guest info, WiFi, and room service" },
  { label: "Cafes & retail", desc: "Quick ordering and brand presence" },
];

function CardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-500/20 via-violet-500/10 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white">
              E
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Jane Smith</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Product Designer</p>
            </div>
          </div>
          <IconQrCode size={22} className="text-gray-400" />
        </div>
        <div className="space-y-2">
          {["LinkedIn", "Portfolio", "Book a call"].map((link) => (
            <div
              key={link}
              className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
            >
              {link}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-brand-500/10 px-4 py-3">
          <IconPulse size={18} className="text-brand-600 dark:text-brand-400" />
          <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
            128 scans this month
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,85,53,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,85,53,0.08),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-slide-up">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
              NFC Digital Cards
            </p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-[3.25rem]">
              Your business card,
              <span className="text-brand-600 dark:text-brand-400"> reimagined</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-gray-600 dark:text-gray-400 sm:text-lg">
              E-Card turns a single tap into a living profile — share contacts,
              showcase your brand, accept orders, and track every interaction.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button className="px-7 py-3">Get started free</Button>
              </Link>
              <Link to="/pricing">
                <Button variant="secondary" className="px-7 py-3">
                  View pricing
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <IconUsers size={16} className="text-brand-500" />
                For professionals
              </span>
              <span className="flex items-center gap-2">
                <IconStorefront size={16} className="text-brand-500" />
                For businesses
              </span>
            </div>
          </div>
          <div className="animate-slide-up-2 lg:justify-self-end">
            <CardPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50/50 py-20 dark:border-gray-800 dark:bg-gray-900/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Features
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Everything you need in one smart card
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-100/80 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
              >
                <IconShell icon={feature.icon} accent={feature.accent} size="sm" className="mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Live in four simple steps
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-gray-100/80 p-5 dark:border-gray-800"
              >
                <span className="text-3xl font-bold text-brand-500/30 dark:text-brand-500/20">
                  {item.step}
                </span>
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-20 dark:border-gray-800 dark:bg-gray-900/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Built for everyone
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                From freelancers to full-service hotels
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Whether you need a sleek networking card or a complete hospitality
                ordering experience, E-Card adapts to your business type.
              </p>
              <Link to="/register" className="mt-6 inline-block">
                <Button>Start for free</Button>
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {AUDIENCES.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-gray-100/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Analytics teaser */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-3xl border border-gray-100/80 bg-gradient-to-br from-gray-900 to-gray-950 p-8 text-white dark:border-gray-800 sm:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <IconShell
                  icon={<IconSparkline size={20} />}
                  accent="brand"
                  size="sm"
                  className="mb-5"
                />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Know who&apos;s engaging with your card
                </h2>
                <p className="mt-4 text-gray-400">
                  Dashboard analytics show scan trends, device breakdowns, and
                  business earnings — so you can measure real ROI from every tap.
                </p>
                <Link to="/register" className="mt-6 inline-block">
                  <Button className="bg-white text-gray-900 hover:bg-gray-100">
                    Explore dashboard
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total scans", value: "2.4k" },
                  { label: "This week", value: "+18%" },
                  { label: "Orders", value: "156" },
                  { label: "Conversion", value: "12%" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Ready to upgrade how you connect?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-600 dark:text-gray-400">
            Join professionals and businesses using E-Card to make every
            interaction count.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button className="px-8 py-3">Create free account</Button>
            </Link>
            <Link to="/contact-sales">
              <Button variant="secondary" className="px-8 py-3">
                Talk to sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
