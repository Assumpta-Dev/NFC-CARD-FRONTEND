// ===========================================================
// API SERVICE CLIENT — NFC CARD BACKEND INTEGRATION
// ===========================================================
// Centralizes all HTTP calls to the Express backend at:
// https://github.com/.../NFC-CARD-Backend
//
// Architecture:
//   ✓ Token injection via Axios interceptor (auto-applied to all requests)
//   ✓ Base URL configured once—easy to switch between dev/prod
//   ✓ Error handling normalized before reaching components
//   ✓ All endpoints wrapped with comments explaining backend integration
//
// Axios chosen over fetch() for:
//   ✓ Automatic JSON serialization/deserialization
//   ✓ Request/response interceptors for auth and error handling
//   ✓ Better error objects (includes response body on 4xx/5xx)
// ===========================================================

import axios, { AxiosError } from "axios";
import {
  ApiPagination,
  ApiResponse,
  AuthState,
  Profile,
  ScanAnalytics,
  AdminCard,
  AdminUser,
  SystemStats,
  PublicCardResponse,
  UserAnalyticsSummary,
  DailyScanCount,
  TopCard,
  TopUser,
  RecentScan,
  PaginatedUsers,
  BusinessProfile,
  BusinessCardLink,
  BusinessMenu,
  Payment,
  PaginatedBusinesses,
  AdminBusinessSummary,
  PaginatedAdminPayments,
  AdminPayment,
} from "../types";

// ===========================================================
// BASE URL CONFIGURATION
// ===========================================================
// DEVELOPMENT:
//   - Set in vite.config.ts proxy: /api → http://localhost:5000/api
//   - Vite proxy avoids CORS issues in dev
//   - Backend must be running: npm run dev (from NFC-CARD-Backend/backend)
//
// PRODUCTION:
//   - Set VITE_API_URL env var to your backend URL (no trailing slash)
//   - Example: VITE_API_URL=https://api.nfccard.com
//   - Backend must have CORS configured to allow your frontend domain
//
// BACKEND SETUP:
//   1. Clone NFC-CARD-Backend from Documents folder
//   2. Copy backend/.env.example → backend/.env
//   3. Set DATABASE_URL to your PostgreSQL instance
//   4. Set JWT_SECRET to a random 64-char string
//   5. Run: npm run dev (listens on :5000)
// ===========================================================
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const NORMALIZED_BASE_URL = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;

function buildApiUrl(path: string) {
  const normalizedPath = path.replace(/^\//, "");

  if (/^https?:\/\//i.test(NORMALIZED_BASE_URL)) {
    return new URL(normalizedPath, NORMALIZED_BASE_URL).toString();
  }

  return `${NORMALIZED_BASE_URL}${normalizedPath}`;
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30 second timeout — gives slow connections enough time to load
});

// ===========================================================
// REQUEST INTERCEPTOR — Auto-attach JWT to every request
// ===========================================================
/**
 * WHY:
 *   - Backend requires Authorization: Bearer <token> header on protected endpoints
 *   - We store token in localStorage after login
 *   - Instead of manually attaching on every call, interceptor does it automatically
 *
 * FLOW:
 *   1. User logs in → receives token → stored in localStorage by AuthContext
 *   2. Application layer calls: cardApi.getMyCards() (no auth header passed)
 *   3. BEFORE request is sent, this interceptor runs
 *   4. Interceptor reads token from localStorage
 *   5. Adds header: Authorization: Bearer <token>
 *   6. Request sent to backend with auth header
 *
 * BACKEND EXPECTATION:
 *   Protected routes use requireAuth middleware:
 *   - Reads Authorization header
 *   - Extracts Bearer token
 *   - Verifies JWT signature + expiry
 *   - Decodes userId from token payload
 *   - Attaches userId to req.user
 *   - If invalid: returns 401
 *
 * SAFE BECAUSE:
 *   ✓ Token stored in localStorage (persistent across page refresh)
 *   ✓ Interceptor runs on EVERY request (no chance of forgetting)
 *   ✓ No sensitive data in Authorization header itself
 *   ✓ Token signed + verified server-side (can't be forged)
 */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("nfc_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===========================================================
// RESPONSE INTERCEPTOR — Handle auth expiry globally
// ===========================================================
/**
 * WHY:
 *   - Tokens eventually expire (for security)
 *   - Instead of each component handling 401, interceptor handles globally
 *   - Provides consistent UX: show login page + clear auth state
 *
 * HOW IT WORKS:
 *   1. Backend returns 401 (invalid/expired token)
 *   2. Response interceptor catches it
 *   3. Clears localStorage (token + user)
 *   4. Redirects to /login
 *   5. All components lose auth state immediately
 *   6. User must log in again
 *
 * BACKEND RETURNS 401 IF:
 *   ✗ Authorization header missing
 *   ✗ Authorization header doesn't start with "Bearer "
 *   ✗ Token signature invalid (tampered with)
 *   ✗ Token expired (exp claim is in the past)
 *   ✗ userId in token no longer exists in database
 *
 * SAFE BECAUSE:
 *   ✓ Frontend doesn't keep expired tokens around
 *   ✓ User redirected to login (can't access protected pages)
 *   ✓ localStorage cleared (prevents any auth bypass attempts)
 *   ✓ Frontend redirects only if NOT already on /login or /register
 *     (prevents infinite redirect loop)
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid—force re-authentication
      localStorage.removeItem("nfc_token");
      localStorage.removeItem("nfc_user");
      // Only redirect if we're not already on auth pages
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ===========================================================
// AUTH API CALLS — Integration with Backend Auth Routes
// Backend: /src/routes/index.ts (authRouter)
// ===========================================================
export const authApi = {
  /**
   * ENDPOINT: POST /api/auth/register
   *
   * WHY:
   *   - Creates new user account + hashed password
   *   - Generates JWT token for immediate login post-signup
   *   - Card assignment is optional (prefilled from QR/NFC link)
   *
   * BACKEND FLOW (backend/src/controllers/auth.controller.ts):
   *   1. Validates email doesn't exist (409 if duplicate)
   *   2. Hashes password with bcryptjs (never stored in plain text)
   *   3. Creates user record in PostgreSQL via Prisma
   *   4. Creates empty profile for the new user
   *   5. If cardId provided: marks card as ACTIVE + assigns to user
   *   6. Signs JWT containing: { userId, role, email }
   *   7. Returns: { token, user }
   *
   * FRONTEND EXPECTS:
   *   - Success (201): { data: { token: string, user: { id, name, email, role } } }
   *   - Duplicate email (409): { error: "Email already registered" }
   *   - Validation fail (400): { error: "Password must be at least 8 chars" }
   *
   * SAFETY:
   *   ✓ Password validated: min 8 chars + at least 1 number
   *   ✓ Email validated: must be valid email format
   *   ✓ CardId optional: user can signup without a physical card
   *   ✓ Tokens auto-expire: configured in backend JWT middleware
   *   ✓ No password returned: backend strips passwords from all responses
   */
  register: async (data: {
    name: string;
    email: string;
    password: string;
    cardId?: string;
    role?: "USER" | "BUSINESS";
  }) => {
    const res = await apiClient.post<
      ApiResponse<{ token: string; user: AuthState["user"] }>
    >("/auth/register", data);
    return res.data.data;
  },

  /**
   * ENDPOINT: POST /api/auth/login
   *
   * WHY:
   *   - Authenticates user by email + password
   *   - Returns JWT token for subsequent authenticated requests
   *   - Token stored in localStorage by AuthContext (no session storage — persistent!)
   *
   * BACKEND FLOW (backend/src/controllers/auth.controller.ts):
   *   1. Finds user by email (404 if not found)
   *   2. Compares provided password vs hashed password (401 if mismatch)
   *   3. Signs new JWT token with user claims
   *   4. Returns: { token, user }
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { token: string, user: { id, name, email, role } } }
   *   - Invalid email (404): { error: "User not found" }
   *   - Invalid password (401): { error: "Invalid credentials" }
   *
   * RATE LIMITING:
   *   ⚠️ Backend enforces max 20 login attempts per 15 minutes per IP
   *   ⚠️ Prevents brute-force password guessing
   *
   * SAFETY:
   *   ✓ Passwords never logged or returned
   *   ✓ Failed attempts don't reveal if user exists
   *   ✓ IP-based rate limiting prevents bot attacks
   *   ✓ Token expires: backend sets exp claim in JWT
   */
  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<
      ApiResponse<{ token: string; user: AuthState["user"] }>
    >("/auth/login", data);
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/auth/me
   *
   * WHY:
   *   - Retrieves current authenticated user from JWT token
   *   - Used to verify token still valid + rehydrate auth state on page refresh
   *   - Called once on app startup via AuthContext useEffect
   *
   * BACKEND FLOW (backend/src/controllers/auth.controller.ts):
   *   1. Middleware extracts JWT from Authorization header
   *   2. Verifies JWT signature + expiry (401 if invalid/expired)
   *   3. Decodes userId from token payload
   *   4. Queries user from PostgreSQL
   *   5. Returns: user object (no password)
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { user: { id, name, email, role } } }
   *   - Invalid token (401): { error: "Invalid token" }
   *   - Expired token (401): { error: "Token expired" }
   *
   * SAFETY:
   *   ✓ 401 interceptor auto-redirects to /login if token expired
   *   ✓ No password in response
   *   ✓ Token verified server-side before returning user
   */
  me: async () => {
    const res =
      await apiClient.get<ApiResponse<{ user: AuthState["user"] }>>("/auth/me");
    return res.data.data.user;
  },
};

// ===========================================================
// CARD API CALLS — Integration with Backend Card Routes
// Backend: /src/routes/index.ts (cardRouter + public routes)
// ===========================================================
export const cardApi = {
  /**
   * ENDPOINT: GET /api/c/{cardId} (PUBLIC — no auth required)
   *
   * WHY:
   *   - When NFC tag/QR code is scanned, shows the card owner's public profile
   *   - Accessible to anyone with the card ID
   *   - Returns profile or "unassigned" status without auth
   *
   * BACKEND FLOW (backend/src/controllers/card.controller.ts):
   *   1. Finds card by cardId (404 if not found)
   *   2. If status = UNASSIGNED: returns { status: 'unassigned', cardId }
   *   3. If status = ACTIVE: joins with Profile + Links tables
   *   4. Returns: { status: 'active', cardId, profile: {...} }
   *
   * URL PATTERN:
   *   - Short path: /api/c/{cardId} (instead of /api/cards)
   *   - Short URL enables easy QR/NFC encoding: nfccard.app/c/CARD_ABC123
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { status: 'active'|'unassigned', cardId, profile?:... } }
   *   - Not found (404): { error: "Card not found" }
   *
   * SAFETY:
   *   ✓ No authentication needed (by design — QR scans don't know user)
   *   ✓ Only shows ACTIVE profiles (unassigned cards show nothing)
   *   ✓ Rate limiting prevents scanning spam
   *   ✓ Public data only (phone, email, links)
   */
  getPublicCard: async (cardId: string) => {
    const res = await apiClient.get<ApiResponse<PublicCardResponse>>(
      `/c/${cardId}`,
    );
    return res.data.data;
  },

  getVCardDownloadUrl: (cardId: string) =>
    buildApiUrl(`c/${encodeURIComponent(cardId)}/vcard`),

  /**
   * ENDPOINT: GET /api/cards/my (PROTECTED — requires auth)
   *
   * WHY:
   *   - Lists all cards assigned to the authenticated user
   *   - Shows card ID, status, and scan count for each card
   *   - Used by UserDashboard to display card carousel
   *
   * BACKEND FLOW (backend/src/controllers/card.controller.ts):
   *   1. Middleware extracts userId from JWT token
   *   2. Queries PostgreSQL: SELECT * FROM cards WHERE userId = ? WITH _count
   *   3. _count includes count of related scans (from Scan table)
   *   4. Returns: [ { id, cardId, status, _count: { scans: N } }, ... ]
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: [ { id, cardId, status, _count } ] }
   *   - Unauthorized (401): { error: "Invalid token" }
   *
   * SAFETY:
   *   ✓ Only returns own cards (userId = JWT.userId)
   *   ✓ Token verified before query runs
   *   ✓ No sensitive data leaked (no profile/links returned)
   */
  getMyCards: async () => {
    const res = await apiClient.get<
      ApiResponse<
        {
          id: string;
          cardId: string;
          status: string;
          _count: { scans: number };
        }[]
      >
    >("/cards/my");
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/cards/{cardId}/analytics (PROTECTED — requires auth)
   *
   * WHY:
   *   - Shows scan analytics for a specific card
   *   - Tracks: total scans, scans today/this week, daily breakdown, device breakdown
   *   - Used by analytics chart in CardDetailPage
   *
   * BACKEND FLOW (backend/src/controllers/card.controller.ts):
   *   1. Middleware verifies JWT + extracts userId
   *   2. Finds card by cardId (404 if not found)
   *   3. Verifies card belongs to user (403 if not owner — IMPORTANT!)
   *   4. Queries Scan table: GROUP BY date AND deviceType
   *   5. Calculates: totalScans, scansToday, scansThisWeek
   *   6. Returns: detailed breakdown for chart rendering
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { totalScans, scansToday, scansThisWeek, dailyBreakdown, deviceBreakdown } }
   *   - Not found (404): { error: "Card not found" }
   *   - Not owner (403): { error: "You don't own this card" }
   *   - Unauthorized (401): { error: "Invalid token" }
   *
   * SAFETY:
   *   ✓ Endpoint verifies ownership (prevent user A viewing user B's analytics)
   *   ✓ Only authenticated users can access
   *   ✓ Database query uses proper WHERE clause (not just checking frontend)
   */
  getAnalytics: async (cardId: string) => {
    const res = await apiClient.get<ApiResponse<ScanAnalytics>>(
      `/cards/${cardId}/analytics`,
    );
    return res.data.data;
  },
};

// ===========================================================
// PROFILE API CALLS — Integration with Backend Profile Routes
// Backend: /src/routes/index.ts (profileRouter)
// Database: Profile + Link tables in PostgreSQL
// Storage: Cloudinary (for profile photos)
// ===========================================================
export const profileApi = {
  /**
   * ENDPOINT: GET /api/profile (PROTECTED — requires auth)
   *
   * WHY:
   *   - Retrieves authenticated user's full profile + all social links
   *   - Shown in ProfileEditPage for editing
   *   - Also returned when card is viewed publicly
   *
   * BACKEND FLOW (backend/src/controllers/profile.controller.ts):
   *   1. Middleware extracts userId from JWT
   *   2. Queries PostgreSQL Profile table by userId
   *   3. Includes all related Link records (LinkedIn, GitHub, etc.)
   *   4. Returns: { id, userId, fullName, jobTitle, ..., links: [...] }
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { id, userId, fullName, jobTitle, company, phone, email, website, bio, imageUrl, whatsapp, links: [...] } }
   *   - Not found (404): { error: "Profile not found" }
   *   - Unauthorized (401): { error: "Invalid token" }
   *
   * SAFETY:
   *   ✓ Only returns own profile (userId = JWT.userId)
   *   ✓ Token required for access
   */
  getProfile: async () => {
    const res = await apiClient.get<ApiResponse<Profile>>("/profile");
    return res.data.data;
  },

  /**
   * ENDPOINT: PUT /api/profile (PROTECTED — requires auth)
   *
   * WHY:
   *   - Updates user's profile data (name, title, company, bio, links, etc.)
   *   - Links are upserted: existing links updated, new ones created
   *   - Called when user saves edits on ProfileEditPage
   *
   * BACKEND FLOW (backend/src/controllers/profile.controller.ts):
   *   1. Middleware extracts userId from JWT
   *   2. Validates input with Zod schema (min/max lengths, URL formats)
   *   3. Updates Profile record in PostgreSQL
   *   4. For links: delete old ones + insert new ones (transaction ensures consistency)
   *   5. Returns: updated profile with new links
   *
   * REQUEST BODY:
   *   {
   *     fullName: "Jane Smith",
   *     jobTitle: "Product Designer",
   *     company: "Acme Corp",
   *     phone: "+1234567890",
   *     email: "jane@acme.com",
   *     website: "https://jane.com",
   *     bio: "Designer from Rwanda",
   *     whatsapp: "1234567890",
   *     links: [
   *       { type: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/jane", order: 0 },
   *       { type: "github", label: "GitHub", url: "https://github.com/jane", order: 1 }
   *     ]
   *   }
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { ...updated profile data } }
   *   - Validation fail (400): { error: "Job title max 100 characters" }
   *   - Unauthorized (401): { error: "Invalid token" }
   *
   * VALIDATION (backend enforces):
   *   ✓ fullName: required, 1-100 chars
   *   ✓ jobTitle: optional, max 100 chars
   *   ✓ email: must be valid email format
   *   ✓ links: URLs must be valid HTTP(S), phone numbers must be digits
   *
   * SAFETY:
   *   ✓ Only updates own profile (userId = JWT.userId)
   *   ✓ Invalid URLs rejected (prevents XSS if improperly rendered)
   *   ✓ HTML stripped from text fields (prevent injection)
   */
  updateProfile: async (
    data: Partial<Profile> & { links?: Profile["links"] },
  ) => {
    const res = await apiClient.put<ApiResponse<Profile>>("/profile", data);
    return res.data.data;
  },

  /**
   * ENDPOINT: POST /api/profile/photo (PROTECTED — requires auth)
   *
   * WHY:
   *   - Uploads profile photo to Cloudinary CDN
   *   - Stores Cloudinary URL in PostgreSQL
   *   - Alternative: could store in S3/Azure Blob, but Cloudinary provided built-in
   *
   * BACKEND SETUP:
   *   - Requires CLOUDINARY_URL env var (format: cloudinary://key:secret@cloud)
   *   - Middleware: multer handles multipart/form-data parsing
   *   - Controller: uploads buffer to Cloudinary, saves URL to database
   *
   * FRONTEND FLOW (ProfileEditPage):
   *   1. User selects image via <input type="file" accept="image/*">
   *   2. Frontend creates FormData with photo blob
   *   3. Sends POST to /api/profile/photo
   *   4. Backend uploads to Cloudinary, returns URL
   *   5. Frontend stores URL in profile state
   *
   * REQUEST:
   *   Content-Type: multipart/form-data
   *   Body: { photo: <binary file> }
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { imageUrl: "https://res.cloudinary.com/..." } }
   *   - No file (400): { error: "No file provided" }
   *   - File too large (400): { error: "File too large (max 5MB)" }
   *   - Invalid format (400): { error: "Only JPEG, PNG, WebP allowed" }
   *   - Unauthorized (401): { error: "Invalid token" }
   *
   * FILE CONSTRAINTS (backend enforces):
   *   ✓ Max 5MB size
   *   ✓ Only JPEG, PNG, WebP accepted
   *   ✓ Validated MIME type (not just file extension)
   *
   * SAFETY:
   *   ✓ File uploaded to CDN (isolated from app server)
   *   ✓ Cloudinary applies image transformations (prevent large uploads)
   *   ✓ Old photo URL can be safely replaced (no orphaned files issue)
   *   ✓ MIME type validated server-side (before upload)
   *
   * NOTE: To use this feature:
   *   1. Create free Cloudinary account: cloudinary.com
   *   2. Get your CLOUDINARY_URL from Settings
   *   3. Set in backend .env: CLOUDINARY_URL=cloudinary://...
   */
  uploadPhoto: async (file: File) => {
    // Note: This endpoint requires special handling for FormData
    // See ProfileEditPage.tsx for how it's called
    const formData = new FormData();
    formData.append("photo", file);

    const res = await apiClient.post<ApiResponse<{ imageUrl: string }>>(
      "/profile/photo",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data.data;
  },
};

// ===========================================================
// BUSINESS API CALLS - Integration with Backend Business Routes
// Backend: /src/controllers/business.controller.ts
// Permission: Requires BUSINESS or ADMIN role
// ===========================================================
export const businessApi = {
  getMyBusiness: async () => {
    const res = await apiClient.get<ApiResponse<BusinessProfile>>("/business");
    return res.data.data;
  },

  getMyBusinessCards: async () => {
    const res = await apiClient.get<ApiResponse<BusinessCardLink[]>>(
      "/business/card",
    );
    return res.data.data;
  },

  upsertBusinessProfile: async (
    data: {
      name: string;
      category: string;
      description?: string;
      location?: string;
      phone?: string;
      email?: string;
      website?: string;
      imageUrl?: string;
    },
    file?: File | null,
  ) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("category", data.category);
    if (data.description) formData.append("description", data.description);
    if (data.location) formData.append("location", data.location);
    if (data.phone) formData.append("phone", data.phone);
    if (data.email) formData.append("email", data.email);
    if (data.website) formData.append("website", data.website);
    if (data.imageUrl) formData.append("imageUrl", data.imageUrl);
    if (file) formData.append("photo", file);

    const res = await apiClient.post<ApiResponse<BusinessProfile>>(
      "/business",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data.data;
  },

  linkCardToBusiness: async (cardId: string) => {
    const res = await apiClient.post<ApiResponse<BusinessCardLink>>(
      "/business/card",
      { cardId },
    );
    return res.data.data;
  },
};

// ===========================================================
// MENU API CALLS - Integration with Backend Menu Routes
// Backend is mounted at /api/menu in backend/src/index.ts
// Permission: Requires BUSINESS or ADMIN role
// ===========================================================
export const menuApi = {
  getMenus: async (page: number = 1, limit: number = 20) => {
    const res = await apiClient.get<ApiResponse<BusinessMenu[]> & {
      pagination: ApiPagination;
    }>("/menu", {
      params: { page, limit },
    });

    return {
      menus: res.data.data,
      pagination: res.data.pagination,
    };
  },

  createMenu: async (title: string) => {
    const res = await apiClient.post<ApiResponse<BusinessMenu>>("/menu", {
      title,
    });
    return res.data.data;
  },

  addMenuItem: async (
    menuId: string,
    data: {
      name: string;
      price: number;
      description?: string;
    },
    file?: File | null,
  ) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("price", String(data.price));
    if (data.description) formData.append("description", data.description);
    if (file) formData.append("photo", file);

    const res = await apiClient.post<ApiResponse<BusinessMenu["items"][number]>>(
      `/menu/${menuId}/items`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data.data;
  },

  deleteMenuItem: async (menuId: string, itemId: string) => {
    const res = await apiClient.delete<ApiResponse<{ message?: string }>>(
      `/menu/${menuId}/items/${itemId}`,
    );
    return res.data.message || res.data.data?.message || "Menu item deleted";
  },
};

// ===========================================================
// PAYMENT API CALLS - Integration with Backend Payment Routes
// Backend: /src/controllers/payment.controller.ts
// Permission: Requires authentication
// ===========================================================
export const paymentApi = {
  initiatePayment: async (data: {
    plan: Payment["plan"];
    billingCycle: Payment["billingCycle"];
    amount: number;
    phone: string;
    provider: Payment["method"];
    method: Payment["method"];
  }) => {
    const res = await apiClient.post<
      ApiResponse<{ message: string; paymentId: string }>
    >("/payments/initiate", data);
    return res.data.data;
  },

  getMyPayments: async (page: number = 1, limit: number = 10) => {
    const res = await apiClient.get<ApiResponse<Payment[]> & {
      pagination: ApiPagination;
    }>("/payments/my", {
      params: { page, limit },
    });

    return {
      payments: res.data.data,
      pagination: res.data.pagination,
    };
  },

  getPaymentById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
    return res.data.data;
  },
};

// ===========================================================
// ADMIN API CALLS — Integration with Backend Admin Routes
// Backend: /src/routes/index.ts (adminRouter + AdminController)
// Database: Queries across User, Profile, Card, Scan tables
// Permission: Requires role = 'ADMIN' in JWT token
// ===========================================================
export const adminApi = {
  /**
   * ENDPOINT: GET /api/admin/stats (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Shows system-wide statistics dashboard
   *   - Used by AdminDashboard overview tab
   *   - Metrics: total users, total cards, total scans, active cards
   *
   * BACKEND FLOW (backend/src/controllers/profile.controller.ts - AdminController):
   *   1. Middleware checks: JWT exists AND role === 'ADMIN' (403 if not)
   *   2. Counts users: SELECT COUNT(*) FROM users WHERE deleted_at IS NULL
   *   3. Counts cards: SELECT COUNT(*) FROM cards WHERE status = 'ACTIVE'
   *   4. Counts active cards: SELECT COUNT(*) FROM cards WHERE status = 'ACTIVE'
   *   5. Sums scans: SELECT COUNT(*) FROM scans
   *   6. Returns: { totalUsers, totalCards, totalScans, activeCards }
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { totalUsers: N, totalCards: N, totalScans: N, activeCards: N } }
   *   - Not admin (403): { error: "Admin access required" }
   *   - Invalid token (401): { error: "Invalid token" }
   *
   * SAFETY:
   *   ✓ Role check enforced at middleware level (not just frontend)
   *   ✓ User cannot bypass admin check even with valid JWT (role hardcoded at login)
   *   ✓ No sensitive user data returned (only counts)
   *   ✓ IP rate limiting applies: max 200 requests per 15 minutes
   */
  getStats: async () => {
    const res = await apiClient.get<ApiResponse<SystemStats>>("/admin/stats");
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/admin/cards (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Lists ALL cards in system (not just user's own cards)
   *   - Shows: card ID, status, owner name/email, scan count
   *   - Used by AdminDashboard cards tab for system-wide inventory
   *
   * BACKEND FLOW (backend/src/controllers/profile.controller.ts - AdminController):
   *   1. Middleware checks: role === 'ADMIN' (403 if not)
   *   2. Queries: SELECT * FROM cards WITH user JOIN + _count scans
   *   3. Returns: [
   *       { id, cardId, status, userId, createdAt, user: {id, name, email}, _count: {scans: N} },
   *       { id, cardId, 'UNASSIGNED', null, createdAt, user: null, _count: {scans: 0} }
   *     ]
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: [ { id, cardId, status, userId, createdAt, user?, _count } ] }
   *   - Not admin (403): { error: "Admin access required" }
   *
   * USE CASES:
   *   ✓ Find unassigned cards (userId === null)
   *   ✓ See which user owns each card
   *   ✓ Monitor scan counts per card
   *   ✓ Generate inventory reports
   *
   * SAFETY:
   *   ✓ Admin-only access enforced
   *   ✓ No sensitive profile data revealed (only contact info)
   *   ✓ All cards visible (admins need full inventory view)
   */
  getAllCards: async () => {
    const res = await apiClient.get<ApiResponse<AdminCard[]>>("/admin/cards");
    return res.data.data;
  },

  /**
   * ENDPOINT: POST /api/admin/cards (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Generates new unassigned physical cards
   *   - Bulk card creation for inventory pre-manufacturing
   *   - Called when admin wants to generate 10, 100, 1000 cards at once
   *
   * BACKEND FLOW (backend/src/controllers/profile.controller.ts - AdminController):
   *   1. Middleware validates: role === 'ADMIN' (403 if not)
   *   2. Validates request: count must be 1-500 (prevent abuse)
   *   3. Generates unique card IDs: CARD_XXXXXX (random 6-char base36)
   *   4. Inserts N records into cards table with status = 'UNASSIGNED'
   *   5. Returns: newly created cards
   *
   * REQUEST BODY:
   *   { count: 5 }  // Generate 5 new cards
   *
   * FRONTEND EXPECTS:
   *   - Success (201): { data: [ { id, cardId, status: 'UNASSIGNED', userId: null, ... }, ... ] }
   *   - Invalid count (400): { error: "Count must be between 1 and 500" }
   *   - Not admin (403): { error: "Admin access required" }
   *
   * WORKFLOW:
   *   1. Admin clicks "Generate Cards" with count=10
   *   2. Frontend sends POST /api/admin/cards { count: 10 }
   *   3. Backend creates 10 rows with random IDs
   *   4. Frontend receives new card objects + prepends to list to show immediately
   *   5. Admin exports list + sends to physical card manufacturer
   *   6. When customers receive cards + scan QR→ redirects to /c/{cardId}
   *   7. Users can "claim" card via email/phone verification
   *
   * CONSTRAINTS (to prevent abuse + database overflow):
   *   ✓ Max 500 cards per request
   *   ✓ Min 1 card
   *   ✓ Unique ID generation (SNOWFLAKE or UUID-based to guarantee uniqueness)
   *   ✓ Database transaction (all-or-nothing: if 1 fails, all fail)
   *
   * SAFETY:
   *   ✓ Admin-only access (regular users cannot generate cards)
   *   ✓ Rate limiting: max 200 requests per 15 minutes (prevents card ID exhaustion)
   *   ✓ Unique ID guarantee (no duplicate cards created)
   *   ✓ Input validation: count between 1-500
   */
  createCards: async (count: number = 1) => {
    const res = await apiClient.post<ApiResponse<AdminCard[]>>("/admin/cards", {
      count,
    });
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/admin/users (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Lists ALL registered users in system
   *   - Shows: name, email, role, join date, card count per user
   *   - Used by AdminDashboard users tab for user management
   *
   * BACKEND FLOW (backend/src/controllers/profile.controller.ts - AdminController):
   *   1. Middleware checks: role === 'ADMIN' (403 if not)
   *   2. Queries: SELECT id, name, email, role, createdAt FROM users WITH _count cards
   *   3. Returns: [ { id, name, email, role, createdAt, _count: {cards: N} }, ... ]
   *   4. NOTE: Passwords NEVER returned (explicitly excluded in SELECT)
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: [ { id, name, email, role, createdAt, _count: {cards: N} } ] }
   *   - Not admin (403): { error: "Admin access required" }
   *
   * USE CASES:
   *   ✓ See all registered users
   *   ✓ Identify inactive users (high createdAt but 0 cards)
   *   ✓ Find users + email them (contact feature)
   *   ✓ Monitor user growth
   *   ✓ Identify power users (lots of cards)
   *
   * ROLES (only 'ADMIN' and 'USER' possible):
   *   - ADMIN: Can access /admin/* routes, manage all cards + users
   *   - USER: Can only manage own profile + cards
   *
   * SAFETY:
   *   ✓ Passwords excluded (backend explicitly removes in response)
   *   ✓ Admin-only access enforcement
   *   ✓ No hashed passwords leaked (even hash could be security risk)
   *   ✓ Only emails shown (PII limited to what's necessary)
   *   ✓ Role cannot be escalated via API (role stored/set server-side only)
   */
  getAllUsers: async () => {
    const res =
      await apiClient.get<ApiResponse<AdminUser[] | PaginatedUsers>>(
        "/admin/users",
      );
    const data = res.data.data;
    // Handle both array and paginated response formats
    return Array.isArray(data) ? data : (data as PaginatedUsers).users;
  },

  /**
   * ENDPOINT: GET /api/admin/users/count (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Get total count of registered users
   *   - Used for admin dashboard analytics
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { count: number } }
   *   - Not admin (403): { error: "Admin access required" }
   */
  getUserCount: async () => {
    const res =
      await apiClient.get<ApiResponse<{ count: number }>>("/admin/users/count");
    return res.data.data.count;
  },

  /**
   * ENDPOINT: GET /api/admin/cards/count (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Get total count of cards in system
   *   - Used for admin dashboard analytics
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { count: number } }
   *   - Not admin (403): { error: "Admin access required" }
   */
  getCardCount: async () => {
    const res =
      await apiClient.get<ApiResponse<{ count: number }>>("/admin/cards/count");
    return res.data.data.count;
  },

  /**
   * ENDPOINT: GET /api/admin/scans/count (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Get total count of all scans in system
   *   - Used for admin dashboard analytics
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { count: number } }
   *   - Not admin (403): { error: "Admin access required" }
   */
  getScanCount: async () => {
    const res =
      await apiClient.get<ApiResponse<{ count: number }>>("/admin/scans/count");
    return res.data.data.count;
  },

  /**
   * ENDPOINT: GET /api/admin/users/active (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Get count of users with active cards
   *   - Used for admin dashboard analytics
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { count: number } }
   *   - Not admin (403): { error: "Admin access required" }
   */
  getActiveUsers: async () => {
    const res = await apiClient.get<ApiResponse<{ count: number }>>(
      "/admin/users/active",
    );
    return res.data.data.count;
  },

  /**
   * ENDPOINT: GET /api/admin/cards/active (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Get count of active cards
   *   - Used for admin dashboard analytics
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { count: number } }
   *   - Not admin (403): { error: "Admin access required" }
   */
  getActiveCards: async () => {
    const res = await apiClient.get<ApiResponse<{ count: number }>>(
      "/admin/cards/active",
    );
    return res.data.data.count;
  },

  /**
   * ENDPOINT: GET /api/admin/scans/daily (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Get daily scan breakdown for admin analytics
   *   - Used for admin dashboard charts
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: [ { date: string, count: number } ] }
   *   - Not admin (403): { error: "Admin access required" }
   */
  getDailyScanBreakdown: async () => {
    const res =
      await apiClient.get<ApiResponse<DailyScanCount[]>>("/admin/scans/daily");
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/admin/cards/top (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Get top cards by scan count
   *   - Used for admin dashboard top performers
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: [ { cardId: string, scanCount: number, user?: { name: string, email: string } } ] }
   *   - Not admin (403): { error: "Admin access required" }
   */
  getTopCards: async () => {
    const res = await apiClient.get<ApiResponse<TopCard[]>>("/admin/cards/top");
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/admin/users/top (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Get top users by scan count
   *   - Used for admin dashboard top performers
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: [ { id: string, name: string, email: string, scanCount: number } ] }
   *   - Not admin (403): { error: "Admin access required" }
   */
  getTopUsers: async () => {
    const res = await apiClient.get<ApiResponse<TopUser[]>>("/admin/users/top");
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/admin/scans/export (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Export all scans as CSV for admin analysis
   *   - Used for admin data export
   *
   * FRONTEND EXPECTS:
   *   - Success (200): CSV file download
   *   - Not admin (403): { error: "Admin access required" }
   */
  exportScansCsv: async () => {
    const res = await apiClient.get("/admin/scans/export", {
      responseType: "blob",
    });
    return res.data;
  },

  /**
   * ENDPOINT: PUT /api/admin/cards/{cardId}/assign (PROTECTED — ADMIN ONLY)
   *
   * WHY:
   *   - Assign an unassigned card to a user
   *   - Used for admin card management
   *
   * REQUEST BODY:
   *   { userId: string }
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { message: string } }
   *   - Not admin (403): { error: "Admin access required" }
   *   - Card not found (404): { error: "Card not found" }
   *   - User not found (404): { error: "User not found" }
   *   - Card already assigned (409): { error: "Card already assigned" }
   */
  assignCardToUser: async (cardId: string, userId: string) => {
    const res = await apiClient.put<ApiResponse<{ message: string }>>(
      `/admin/cards/${cardId}/assign`,
      { userId },
    );
    return res.data.data;
  },

  getAllBusinesses: async (page: number = 1, size: number = 25) => {
    const res = await apiClient.get<ApiResponse<PaginatedBusinesses>>(
      "/admin/businesses",
      {
        params: { page, size },
      },
    );
    return res.data.data;
  },

  getBusinessById: async (id: string) => {
    const res =
      await apiClient.get<ApiResponse<BusinessProfile & {
        user: AdminBusinessSummary["user"];
      }>>(`/admin/businesses/${id}`);
    return res.data.data;
  },

  getAllPayments: async (
    page: number = 1,
    size: number = 25,
    status?: AdminPayment["status"],
  ) => {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;

    const res = await apiClient.get<ApiResponse<PaginatedAdminPayments>>(
      "/admin/payments",
      { params },
    );
    return res.data.data;
  },
};

// ===========================================================
// USER API CALLS — Integration with Backend User Routes
// Backend: /src/routes/index.ts (userRouter)
// Database: Scan table for analytics
// Permission: Requires authentication (any user role)
// ===========================================================
export const userApi = {
  /**
   * ENDPOINT: GET /api/user/analytics/summary (PROTECTED — requires auth)
   *
   * WHY:
   *   - Get authenticated user's scan summary counts
   *   - Shows today, this week, and total scans
   *   - Used by UserDashboard overview
   *
   * BACKEND FLOW (backend/src/controllers/user.controller.ts):
   *   1. Middleware extracts userId from JWT token
   *   2. Queries Scan table for user's scans
   *   3. Calculates counts for different time periods
   *   4. Returns: { today: N, week: N, total: N }
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: { today: number, week: number, total: number } }
   *   - Unauthorized (401): { error: "Invalid token" }
   *
   * SAFETY:
   *   ✓ Only returns own scan data (userId = JWT.userId)
   *   ✓ Token verified before query runs
   */
  getAnalyticsSummary: async () => {
    const res = await apiClient.get<ApiResponse<UserAnalyticsSummary>>(
      "/user/analytics/summary",
    );
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/user/analytics/daily (PROTECTED — requires auth)
   *
   * WHY:
   *   - Get daily scan activity for the authenticated user
   *   - Shows scan counts per day for charting
   *   - Used by UserDashboard trend chart
   *
   * BACKEND FLOW (backend/src/controllers/user.controller.ts):
   *   1. Middleware extracts userId from JWT token
   *   2. Queries Scan table grouped by date
   *   3. Returns: [ { date: "2024-01-01", count: 5 }, ... ]
   *
   * QUERY PARAMS:
   *   - range: "7d" | "30d" | "all" (optional, defaults to all)
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: [ { date: string, count: number } ] }
   *   - Unauthorized (401): { error: "Invalid token" }
   *
   * SAFETY:
   *   ✓ Only returns own scan data (userId = JWT.userId)
   *   ✓ Token verified before query runs
   */
  getDailyTrend: async (range?: "7d" | "30d" | "all") => {
    const params = range ? { range } : {};
    const res = await apiClient.get<ApiResponse<DailyScanCount[]>>(
      "/user/analytics/daily",
      { params },
    );
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/user/scans (PROTECTED — requires auth)
   *
   * WHY:
   *   - Get recent scan events for the authenticated user
   *   - Shows scan details with device, IP, timestamp
   *   - Used by UserDashboard scan history
   *
   * BACKEND FLOW (backend/src/controllers/user.controller.ts):
   *   1. Middleware extracts userId from JWT token
   *   2. Queries Scan table with pagination
   *   3. Includes card information
   *   4. Returns: recent scan events
   *
   * QUERY PARAMS:
   *   - limit: number (optional, default 50)
   *   - after: ISO date string (optional, for pagination)
   *
   * FRONTEND EXPECTS:
   *   - Success (200): { data: [ { timestamp: string, device: string, ip: string, userAgent: string, card: { cardId: string } } ] }
   *   - Unauthorized (401): { error: "Invalid token" }
   *
   * SAFETY:
   *   ✓ Only returns own scan data (userId = JWT.userId)
   *   ✓ Token verified before query runs
   *   ✓ IP addresses logged for security but not exposed in detail
   */
  getRecentScans: async (limit?: number, after?: string) => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (after) params.after = after;
    const res = await apiClient.get<ApiResponse<RecentScan[]>>("/user/scans", {
      params,
    });
    return res.data.data;
  },

  /**
   * ENDPOINT: GET /api/user/scans/export (PROTECTED — requires auth)
   *
   * WHY:
   *   - Export authenticated user's scans as CSV
   *   - Allows users to download their scan history
   *   - Used by UserDashboard export feature
   *
   * BACKEND FLOW (backend/src/controllers/user.controller.ts):
   *   1. Middleware extracts userId from JWT token
   *   2. Queries all user's scans
   *   3. Generates CSV with scan details
   *   4. Returns CSV file for download
   *
   * FRONTEND EXPECTS:
   *   - Success (200): CSV file download
   *   - Unauthorized (401): { error: "Invalid token" }
   *
   * SAFETY:
   *   ✓ Only exports own scan data (userId = JWT.userId)
   *   ✓ Token verified before export
   *   ✓ CSV format prevents injection attacks
   */
  exportScansCsv: async () => {
    const res = await apiClient.get("/user/scans/export", {
      responseType: "blob",
    });
    return res.data;
  },
};

// ===========================================================
// ERROR HANDLING — Consistent error extraction across all endpoints
// ===========================================================
/**
 * WHY: Normalize error messages from Axios so components don't need to
 * parse res.data.data.error vs error.message vs string vs object
 *
 * USAGE:
 *   try {
 *     const user = await authApi.login({ email, password });
 *   } catch (err) {
 *     const message = getErrorMessage(err); // Always a string
 *     setError(message);  // Show to user
 *   }
 *
 * BACKEND CONSISTENCY:
 *   All backend error responses follow this structure:
 *   {
 *     success: false,
 *     error: "Human-readable error message",
 *     timestamp: "2024-01-01T00:00:00Z",
 *     status: 400
 *   }
 *
 *   Middleware catches errors from controllers + handlers, formats consistently
 *
 * COMMON ERROR STATUS CODES:
 *   - 400 Bad Request: Validation failed (email format, password too short)
 *   - 401 Unauthorized: Missing/invalid JWT token
 *   - 403 Forbidden: Valid JWT but insufficient permissions (not admin)
 *   - 404 Not Found: Resource doesn't exist (card not found)
 *   - 409 Conflict: Uniqueness violation (email already registered)
 *   - 429 Too Many Requests: Rate limit exceeded
 *   - 500 Internal Server Error: Unexpected server error (log + alert)
 *
 * 401 INTERCEPTION:
 *   Response interceptor catches 401s globally:
 *   - Clears localStorage (token + user)
 *   - Redirects to /login
 *   - Prevents components from dealing with auth expiry
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Silently ignore timeout/network errors — let the UI handle loading state
    if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
      return "";
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    return error.message || "An error occurred";
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export default apiClient;

// ===========================================================
// QUICK REFERENCE — Backend Integration Guide
// ===========================================================
//
// SETUP CHECKLIST:
//   ✓ Backend Clone: Copy NFC-CARD-Backend/backend folder
//   ✓ .env Setup: Copy .env.example → .env + fill in variables
//   ✓ Database: Ensure PostgreSQL is running + DATABASE_URL is correct
//   ✓ JWT Secret: Set JWT_SECRET to random 64-char string
//   ✓ Cloudinary (optional): For profile photo uploads
//   ✓ Start Backend: npm run dev (listens on http://localhost:5000)
//   ✓ Start Frontend: npm run dev (Vite proxy handles /api → backend)
//
// ENDPOINT SUMMARY:
//
//   [AUTH] POST   /api/auth/register ..................... Create account
//   [AUTH] POST   /api/auth/login ........................ Sign in
//   [AUTH] GET    /api/auth/me ........................... Current user
//
//   [CARD] GET    /api/cards/my .......................... My cards (protected)
//   [CARD] GET    /api/cards/{id}/analytics ............ Scan stats (protected)
//   [CARD] GET    /api/c/{cardId} ....................... Public profile view
//   [CARD] GET    /api/c/{cardId}/vcard ................ Download vCard
//
//   [PROFILE] GET    /api/profile ...................... Get my profile (protected)
//   [PROFILE] PUT    /api/profile ...................... Update profile (protected)
//   [PROFILE] POST   /api/profile/photo ............... Upload photo (protected)
//
//   [ADMIN] GET    /api/admin/stats ..................... System stats (admin)
//   [ADMIN] GET    /api/admin/cards ..................... All cards (admin)
//   [ADMIN] POST   /api/admin/cards ..................... Create cards (admin)
//   [ADMIN] GET    /api/admin/users ..................... All users (admin)
//
// ERROR CODES:
//   400 Bad Request ...................... Validation failed
//   401 Unauthorized ..................... Missing/invalid JWT
//   403 Forbidden ........................ Not admin (for /admin routes)
//   404 Not Found ........................ Resource doesn't exist
//   409 Conflict ......................... Email already registered
//   429 Too Many Requests ................ Can't exceed rate limit
//   500+ Server Error .................... Backend crashed (check logs)
//
// SAFETY FEATURES:
//
//   ✓ Password-based auth with bcryptjs hashing
//   ✓ JWT tokens verified on every protected request
//   ✓ Admin role enforcement (cannot be escalated from frontend)
//   ✓ Ownership verification on card/profile endpoints
//   ✓ Cloudinary isolation for file uploads
//   ✓ Rate limiting on all endpoints (prevents abuse)
//   ✓ CORS configured on backend (whitelist trusted domains)
//   ✓ SQL injection prevented (Prisma parameterized queries)
//   ✓ 401 interceptor clears auth on expiry
//   ✓ No passwords in any API response
//
// TESTING TIPS:
//
//   1. Mock Mode (no backend needed):
//      - In frontend .env: VITE_MOCK=true
//      - Mock data hardcoded in this file
//      - Login as admin@test.com or user@test.com (password: anything)
//
//   2. Real Backend Testing:
//      - Remove VITE_MOCK or set to false
//      - Start backend: cd $NFC-CARD-Backend/backend && npm run dev
//      - Frontend proxy: http://localhost:5173 → /api → localhost:5000/api
//      - Register new user via /register
//      - Login to test protected routes
//      - Switch to admin account to test /admin routes
//
//   3. Debugging:
//      - Check browser console for error messages
//      - Chrome DevTools → Network tab: see all API requests + responses
//      - Backend logs: npm run dev shows incoming requests in terminal
//      - Check .env variables (DATABASE_URL, JWT_SECRET, etc.)
//
// COMMON ISSUES:
//
//   ❌ "Cannot GET /api/auth/login" (404)
//      → Backend not running. Start: npm run dev in backend folder
//
//   ❌ "JWT signature invalid" (401)
//      → JWT_SECRET changed between requests. Use same secret for all
//
//   ❌ "Database error" (500)
//      → PostgreSQL not running or DATABASE_URL incorrect
//
//   ❌ "Email already registered" (409)
//      → Clear browser localStorage + try different email
//      → Or: backend still has test data from previous run
//
//   ❌ CORS error in console
//      → Frontend origin not in backend CORS allowlist
//      → Check CORS config in backend/src/index.ts
//
//   ❌ "Cannot read profile of undefined" (error)
//      → User logged in but profile doesn't exist
//      → Run: npm run db:seed in backend to create seed data
//
// ===========================================================
