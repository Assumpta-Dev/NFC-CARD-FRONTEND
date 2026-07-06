import type { IconType } from "react-icons";
import {
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlinePencil,
  HiOutlineUserGroup,
} from "react-icons/hi";

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
  icon: IconType;
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
        icon: HiOutlineHome,
        end: true,
        roles: ["USER", "BUSINESS", "ADMIN"],
      },
      {
        to: "/profile",
        label: "Edit Profile",
        icon: HiOutlinePencil,
        roles: ["USER", "BUSINESS", "ADMIN"],
      },
      {
        to: "/dashboard/payments",
        label: "My Payments",
        icon: HiOutlineCurrencyDollar,
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
        icon: HiOutlineOfficeBuilding,
        roles: ["BUSINESS", "ADMIN"],
      },
      {
        to: "/dashboard/orders",
        label: "Orders",
        icon: HiOutlineClipboardList,
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
        icon: HiOutlineHome,
        end: true,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/analytics",
        label: "Analytics",
        icon: HiOutlineChartBar,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/cards",
        label: "Cards",
        icon: HiOutlineCreditCard,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/users",
        label: "Users",
        icon: HiOutlineUserGroup,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/businesses",
        label: "Businesses",
        icon: HiOutlineOfficeBuilding,
        roles: ["ADMIN"],
      },
      {
        to: "/admin/payments",
        label: "All Payments",
        icon: HiOutlineCurrencyDollar,
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
