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
  details?: Record<string, string[]>;
}

// ===========================================================
// USER & AUTH
// ===========================================================
export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
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
  cardId: string; // Public ID embedded in NFC/QR
  status: CardStatus;
  userId: string | null;
  createdAt: string;
  _count?: { scans: number };
}

// What comes back when someone scans a card (public view)
export interface PublicCardResponse {
  status: "active" | "unassigned";
  cardId: string;
  profile?: PublicProfile;
  message?: string;
}

// ===========================================================
// PROFILE
// ===========================================================
export interface Link {
  id?: string;
  type: string; // 'instagram', 'linkedin', etc.
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
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: { cards: number };
}

export interface AdminCard extends Card {
  user: { id: string; name: string; email: string } | null;
  _count: { scans: number };
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
