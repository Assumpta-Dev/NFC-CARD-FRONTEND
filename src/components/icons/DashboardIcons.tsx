import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function BaseIcon({
  size = 22,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Coin with subtle rays — earned today */
export function IconRevenueToday(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8.5v7M9.5 10.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />
      <path d="M12 3v1M12 20v1M5.6 5.6l.7.7M17.7 17.7l.7.7M3 12h1M20 12h1" opacity="0.45" />
    </BaseIcon>
  );
}

/** Rising trend line */
export function IconRevenueTrend(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 17l5.5-5.5 3 3L20 7" />
      <path d="M15 7h5v5" />
      <path d="M4 20h16" opacity="0.35" />
    </BaseIcon>
  );
}

/** Bar chart — monthly view */
export function IconRevenueMonth(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 18V11M10 18V7M14 18v-4M18 18V9" />
      <path d="M4 20h16" opacity="0.35" />
    </BaseIcon>
  );
}

/** Stacked layers — all-time */
export function IconRevenueLifetime(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4l7 4-7 4-7-4 7-4z" />
      <path d="M5 12l7 4 7-4" opacity="0.7" />
      <path d="M5 16l7 4 7-4" opacity="0.45" />
    </BaseIcon>
  );
}

/** Hourglass / pending */
export function IconPending(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 4h8M8 20h8" />
      <path d="M9 4c0 2.5 1.8 4.2 3 6-1.2 1.8-3 3.5-3 6M15 4c0 2.5-1.8 4.2-3 6 1.2 1.8 3 3.5 3 6" />
    </BaseIcon>
  );
}

/** Shield with check — verification */
export function IconVerification(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.5l7 3v5c0 4.2-2.8 7.4-7 8.5-4.2-1.1-7-4.3-7-8.5v-5l7-3z" />
      <path d="M9.2 12.2l1.8 1.8 3.8-3.8" />
    </BaseIcon>
  );
}

/** Check in circle — paid */
export function IconPaid(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12.2l2.2 2.2 4.8-4.8" />
    </BaseIcon>
  );
}

/** Receipt — average order */
export function IconReceipt(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 4h8l1 2 2 .5v13l-2-.8-2 .8-2-.8-2 .8-2-.8-2 .8V6.5L8 6l1-2z" />
      <path d="M10 10h4M10 14h4" opacity="0.7" />
    </BaseIcon>
  );
}

/** Tap / NFC waves */
export function IconNfcTap(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="7" y="4" width="10" height="16" rx="2.5" />
      <path d="M10 16h4" opacity="0.5" />
      <path d="M4 10c1.2-2 3.4-3 5-3M4 14c2.2 2.2 5 3.2 8 3.2" opacity="0.55" />
      <path d="M20 10c-1.2-2-3.4-3-5-3M20 14c-2.2 2.2-5 3.2-8 3.2" opacity="0.55" />
    </BaseIcon>
  );
}

/** Pulse activity */
export function IconPulse(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 12h3l2.5-5 3 10 2.5-5H20" />
    </BaseIcon>
  );
}

/** Radar / total reach */
export function IconRadar(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" opacity="0.35" />
      <circle cx="12" cy="12" r="4.5" opacity="0.55" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 12L17 7" />
    </BaseIcon>
  );
}

/** Minimal storefront */
export function IconStorefront(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10h16v9H4z" />
      <path d="M6 10V7l2-2h8l2 2v3" />
      <path d="M10 14h4v5h-4z" opacity="0.6" />
      <path d="M4 10l2-4h12l2 4" opacity="0.45" />
    </BaseIcon>
  );
}

/** Clipboard list */
export function IconOrders(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 4h6l1 2h3v14H5V6h3l1-2z" />
      <path d="M9 12h6M9 16h4" opacity="0.7" />
    </BaseIcon>
  );
}

/** Grid menu */
export function IconMenuBoard(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" opacity="0.7" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" opacity="0.7" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" opacity="0.45" />
    </BaseIcon>
  );
}

/** Line chart spark */
export function IconSparkline(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 18V6M20 18H4" opacity="0.35" />
      <path d="M7 14l3-4 3 2 4-6" />
    </BaseIcon>
  );
}

/** Mobile device */
export function IconMobile(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="8" y="3" width="8" height="18" rx="2" />
      <path d="M11 17h2" opacity="0.5" />
    </BaseIcon>
  );
}

/** Desktop */
export function IconDesktop(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="18" height="11" rx="1.5" />
      <path d="M8 19h8M12 16v3" opacity="0.6" />
    </BaseIcon>
  );
}

export type MetricAccent =
  | "brand"
  | "emerald"
  | "sky"
  | "violet"
  | "amber"
  | "rose"
  | "slate";

export const metricAccentStyles: Record<
  MetricAccent,
  { shell: string; icon: string }
> = {
  brand: {
    shell:
      "border-brand-500/15 bg-gradient-to-br from-brand-500/[0.08] to-transparent",
    icon: "text-brand-600 dark:text-brand-400",
  },
  emerald: {
    shell:
      "border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.08] to-transparent",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  sky: {
    shell:
      "border-sky-500/15 bg-gradient-to-br from-sky-500/[0.08] to-transparent",
    icon: "text-sky-600 dark:text-sky-400",
  },
  violet: {
    shell:
      "border-violet-500/15 bg-gradient-to-br from-violet-500/[0.08] to-transparent",
    icon: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    shell:
      "border-amber-500/15 bg-gradient-to-br from-amber-500/[0.08] to-transparent",
    icon: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    shell:
      "border-rose-500/15 bg-gradient-to-br from-rose-500/[0.08] to-transparent",
    icon: "text-rose-600 dark:text-rose-400",
  },
  slate: {
    shell:
      "border-gray-200/80 dark:border-gray-700 bg-gradient-to-br from-gray-500/[0.06] to-transparent",
    icon: "text-gray-600 dark:text-gray-400",
  },
};
