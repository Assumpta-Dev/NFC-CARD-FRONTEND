// ===========================================================
// FRONTEND SHARED TYPES
// ===========================================================
// Mirrors the backend's API response shapes.
// Keeping types in one file makes updates easy:
// if the backend API changes, update only this file.
// ===========================================================

// Standard API response envelope from the backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: Record<string, string[]>;
}

export interface ApiPagination {
  page: number;
  total: number;
  pages: number;
  limit?: number;
  size?: number;
}

// ===========================================================
// USER & AUTH
// ===========================================================
export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "BUSINESS";
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ===========================================================
// CARDS
// ===========================================================
export type CardStatus = "UNASSIGNED" | "ACTIVE";

export interface Card {
  id: string;
  cardId: string;
  status: CardStatus;
  userId: string | null;
  createdAt: string;
  _count?: { scans: number };
}

export interface BusinessCardLink {
  id: string;
  cardId: string;
  status: CardStatus;
  createdAt: string;
  updatedAt?: string;
  _count?: { scans: number };
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
  createdAt?: string;
}

export interface BusinessMenu {
  id: string;
  title: string;
  createdAt?: string;
  items: MenuItem[];
}

export interface PublicBusinessProfile {
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  imageUrl: string | null;
  menus?: BusinessMenu[];
}

export interface BusinessProfile extends PublicBusinessProfile {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  cards?: BusinessCardLink[];
}

// What comes back when someone scans a card (public view)
export type PublicCardResponse =
  | {
      type: "unassigned";
      cardId: string;
      message?: string;
    }
  | {
      type: "personal";
      cardId: string;
      profile: PublicProfile | null;
      message?: string;
    }
  | {
      type: "business";
      cardId: string;
      business: PublicBusinessProfile;
    };

// ===========================================================
// PROFILE
// ===========================================================
export interface Link {
  id?: string;
  type: string;
  label: string;
  url: string;
  order: number;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  jobTitle: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bio: string | null;
  imageUrl: string | null;
  whatsapp: string | null;
  links: Link[];
}

// Subset of Profile for public display (no userId/id)
export interface PublicProfile {
  fullName: string;
  jobTitle: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bio: string | null;
  imageUrl: string | null;
  whatsapp: string | null;
  links: Link[];
}

// ===========================================================
// PAYMENTS
// ===========================================================
export type PaymentPlan = "FREE" | "PLUS" | "BUSINESS";
export type BillingCycle = "MONTHLY" | "ANNUAL";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";
export type PaymentMethod = "MTN" | "AIRTEL";

export interface Payment {
  id: string;
  userId: string;
  plan: PaymentPlan;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  method: PaymentMethod;
  phone: string | null;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPayments {
  payments: Payment[];
  pagination: ApiPagination;
}

// ===========================================================
// ANALYTICS
// ===========================================================
export interface DailyScanCount {
  date: string;
  count: number;
}

export interface ScanAnalytics {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  dailyBreakdown: DailyScanCount[];
  deviceBreakdown: {
    mobile: number;
    desktop: number;
  };
}

// User analytics summary for dashboard
export interface UserAnalyticsSummary {
  today: number;
  week: number;
  total: number;
}

// Top cards/users analytics for admin
export interface TopCard {
  cardId: string;
  scanCount: number;
  user?: {
    name: string;
    email: string;
  };
}

export interface TopUser {
  id: string;
  name: string;
  email: string;
  scanCount: number;
}

// Recent scan event for user dashboard
export interface RecentScan {
  timestamp: string;
  device: string;
  ip: string;
  userAgent: string;
  card: {
    cardId: string;
  };
}

// ===========================================================
// ADMIN
// ===========================================================
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "BUSINESS";
  createdAt: string;
  _count: { cards: number };
}

export interface AdminCard extends Card {
  user: { id: string; name: string; email: string } | null;
  _count: { scans: number };
}

export interface AdminBusinessSummary {
  id: string;
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN" | "BUSINESS";
  };
  cards: {
    id: string;
    cardId: string;
    status: CardStatus;
  }[];
  _count: { menus: number };
}

export interface PaginatedBusinesses {
  businesses: AdminBusinessSummary[];
  total: number;
  page: number;
  size: number;
}

export interface AdminPayment extends Payment {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedAdminPayments {
  payments: AdminPayment[];
  total: number;
  page: number;
  size: number;
}

export interface SystemStats {
  totalUsers: number;
  totalCards: number;
  totalScans: number;
  activeCards: number;
}

// Extended admin stats with additional analytics
export interface AdminAnalyticsStats {
  userCount: number;
  cardCount: number;
  scanCount: number;
  activeUsers: number;
  activeCards: number;
  dailyScanBreakdown: DailyScanCount[];
  topCards: TopCard[];
  topUsers: TopUser[];
}

// Paginated admin users list
export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  size: number;
}
