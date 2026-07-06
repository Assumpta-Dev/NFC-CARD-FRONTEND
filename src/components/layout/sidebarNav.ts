import type { IconComponent } from "../icons/DashboardIcons";
import {
  IconHome,
  IconEdit,
  IconPayment,
  IconStorefront,
  IconOrders,
  IconNfcTap,
  IconSparkline,
  IconUsers,
} from "../icons/DashboardIcons";

export type UserRole = "USER" | "BUSINESS" | "ADMIN";

export type AdminSection =
  | "overview"
  | "analytics"
  | "cards"
  | "users"
  | "businesses"
  | "payments";

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: IconComponent;
  end?: boolean;
  roles: UserRole[];
}

export interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

export const sidebarNavGroups: SidebarNavGroup[] = [
  {
    label: "My Account",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: IconHome,
        end: true,
        roles: ["USER", "ADMIN"],
      },
      {
        to: "/dashboard",
        label: "Business Dashboard",
        icon: IconHome,
        end: true,
        roles: ["BUSINESS"],
      },
      {
        to: "/profile",
        label: "Edit Profile",
        icon: IconEdit,
        roles: ["USER", "BUSINESS", "ADMIN"],
      },
      {
        to: "/dashboard/payments",
        label: "My Payments",
        icon: IconPayment,
        roles: ["USER", "BUSINESS", "ADMIN"],
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        to: "/dashboard/menu",
        label: "Menu",
        icon: IconStorefront,
        roles: ["BUSINESS", "ADMIN"],
      },
      {
        to: "/dashboard/orders",
        label: "Orders",
        icon: IconOrders,
        roles: ["BUSINESS", "ADMIN"],
      },
      {
        to: "/dashboard/card-analytics",
        label: "Card Analytics",
        icon: IconNfcTap,
        roles: ["BUSINESS", "ADMIN"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        to: "/admin",
        label: "Overview",
        icon: IconHome,
        end: true,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/analytics",
        label: "Analytics",
        icon: IconSparkline,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/cards",
        label: "Cards",
        icon: IconNfcTap,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/users",
        label: "Users",
        icon: IconUsers,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/businesses",
        label: "Businesses",
        icon: IconStorefront,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/payments",
        label: "All Payments",
        icon: IconPayment,
        roles: ["ADMIN"],
      },
    ],
  },
];

export function getNavGroupsForRole(role: UserRole): SidebarNavGroup[] {
  return sidebarNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

const pageTitleEntries: [string, string][] = [
  ["/dashboard/checkout", "Checkout"],
  ["/dashboard/payments", "My Payments"],
  ["/dashboard/card-analytics", "Card Analytics"],
  ["/dashboard/menu", "Business Menu"],
  ["/dashboard/orders", "Orders"],
  ["/dashboard", "Dashboard"],
  ["/profile", "Edit Profile"],
  ["/admin/analytics", "Analytics"],
  ["/admin/cards", "Cards"],
  ["/admin/users", "Users"],
  ["/admin/businesses", "Businesses"],
  ["/admin/payments", "All Payments"],
  ["/admin", "Overview"],
];

export function getPageTitle(pathname: string): string {
  const match = pageTitleEntries.find(([path]) =>
    path === "/dashboard" || path === "/admin"
      ? pathname === path || pathname === `${path}/`
      : pathname.startsWith(path),
  );
  return match?.[1] ?? "E-Card";
}

export const adminPageTitles: Record<AdminSection, string> = {
  overview: "Overview",
  analytics: "Analytics",
  cards: "Cards",
  users: "Users",
  businesses: "Businesses",
  payments: "All Payments",
};
