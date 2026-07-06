// ===========================================================
// AUTH PAGES — Login & Register
// OVOU-inspired dark theme design
// ===========================================================

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authApi, getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { Button, DarkAlert, formControlClass } from "../../components/ui";
import Navbar from "../../components/layout/navbar";
import {
  HiOutlineCreditCard,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineIdentification,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";

// Reusable password input with show/hide toggle
function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <span className="icon-badge absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg pointer-events-none z-10">
        <HiOutlineLockClosed className="text-sm" />
      </span>
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={formControlClass(false, "pl-14 pr-12 cursor-text caret-brand-600")}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <HiOutlineEyeOff className="text-lg" /> : <HiOutlineEye className="text-lg" />}
      </button>
    </div>
  );
}

function IconInput({
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  required = false,
  id,
  name,
}: {
  icon: React.ElementType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  id?: string;
  name?: string;
}) {
  return (
    <div className="relative w-full">
      <span className="icon-badge absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg pointer-events-none z-10">
        <Icon className="text-sm" />
      </span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={formControlClass(false, "pl-14 pr-4 cursor-text caret-brand-600")}
      />
    </div>
  );
}

// ===========================================================
// SHARED LAYOUT — Dark full-page centered card
// ===========================================================
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md animate-fade-in">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="icon-badge w-9 h-9">
            <HiOutlineCreditCard className="text-lg" />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100 text-lg tracking-tight">
            E-Card
          </span>
        </div>

        {/* Glass-dark card */}
        <div className="card-soft p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// LOGIN PAGE
// ===========================================================
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Read success message passed from ResetPasswordPage after successful reset
  useEffect(() => {
    const msg = (location.state as { successMessage?: string } | null)?.successMessage;
    if (msg) setSuccess(msg);
  }, [location.state]);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { token, user } = await authApi.login({ email, password });
      login(token, user!);
      const redirectPath =
        from !== "/dashboard"
          ? from
          : user?.role === "BUSINESS"
            ? "/dashboard/menu"
            : from;
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
          {/* Navbar */}
            <Navbar />
    <AuthLayout>
      {/* Heading */}
      <div className="mb-7 pt-20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Sign in to manage your digital card
        </p>
      </div>

      {error && <DarkAlert message={error} className="mb-5" />}
      {success && (
        <div className="mb-5 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 text-center">
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email with icon prefix */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
          >
            Email address
          </label>
          <div className="relative">
            <span className="icon-badge absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg pointer-events-none z-10">
              <HiOutlineMail className="text-sm" />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className={formControlClass(false, "pl-14 pr-4 cursor-text caret-brand-600")}
            />
          </div>
        </div>

        {/* Password with icon prefix */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          fullWidth
          className="mt-2 py-3 text-base rounded-xl"
        >
          Sign in
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
        >
          Create one
        </Link>
      </p>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
        <Link
          to="/forgot-password"
          className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
        >
          Forgot your password?
        </Link>
      </p>
    </AuthLayout>
    </div>
  );
}

// ===========================================================
// REGISTER PAGE
// ===========================================================
export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cardId, setCardId] = useState("");
  const [role, setRole] = useState<"USER" | "BUSINESS">("USER");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefilledCardId = params.get("cardId");
    if (prefilledCardId) setCardId(prefilledCardId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/\d/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }
    setIsLoading(true);
    try {
      const result = await authApi.register({
        name,
        email,
        password,
        cardId: cardId || undefined,
        role,
      });
      login(result.token, result.user!);
      navigate(
        result.user?.role === "BUSINESS" ? "/dashboard/menu" : "/dashboard",
        { replace: true },
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for icon-prefixed inputs

  return (
     <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
          {/* Navbar */}
            <Navbar />
    <AuthLayout>
      <div className="mb-7 pt-20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create your card</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Set up your digital business card in seconds
        </p>
      </div>

      {error && <DarkAlert message={error} className="mb-5" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <button
            type="button"
            onClick={() => setRole("USER")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              role === "USER"
                ? "bg-[#DE3A16] text-white shadow-[0_2px_10px_rgba(222,58,22,0.3)]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100"
            }`}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => setRole("BUSINESS")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              role === "BUSINESS"
                ? "bg-[#DE3A16] text-white shadow-[0_2px_10px_rgba(222,58,22,0.3)]"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100"
            }`}
          >
            Business
          </button>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
          >
            {role === "BUSINESS" ? "Business name" : "Full name"}
          </label>
          <IconInput
            id="name"
            name="name"
            icon={HiOutlineUser}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "BUSINESS" ? "Mama Kitchen" : "Jane Smith"}
            autoComplete="name"
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-email"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
          >
            Email address
          </label>
          <IconInput
            id="register-email"
            name="email"
            icon={HiOutlineMail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <PasswordInput
            id="register-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, include a number"
            autoComplete="new-password"
            required
          />
        </div>

        {/* Card ID (optional) */}
        <div className="space-y-1.5">
          <label
            htmlFor="cardId"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
          >
            Card ID{" "}
            <span className="normal-case text-gray-500 dark:text-gray-400 font-normal tracking-normal">
              (optional)
            </span>
          </label>
          <IconInput
            id="cardId"
            name="cardId"
            icon={HiOutlineIdentification}
            value={cardId}
            onChange={(e) => setCardId(e.target.value.toUpperCase())}
            placeholder="CARD_XXXXXX"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
            Enter your physical card ID to activate it immediately
          </p>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          fullWidth
          className="mt-2 py-3 text-base rounded-xl"
        >
          Create account
        </Button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
    </div>
  );
}

// ===========================================================
// FORGOT PASSWORD PAGE
// ===========================================================
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      // Always show success — backend never reveals if email exists
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Navbar />
      <AuthLayout>
        <div className="mb-7 pt-20">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Forgot password?</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {error && <DarkAlert message={error} className="mb-5" />}

        {success ? (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 text-center">
            ✅ If that email is registered, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <div className="relative">
                <span className="icon-badge absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg pointer-events-none z-10">
                  <HiOutlineMail className="text-sm" />
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className={formControlClass(false, "pl-14 pr-4 cursor-text")}
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              fullWidth
              className="mt-2 py-3 text-base rounded-xl"
            >
              Send reset link
            </Button>
          </form>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </AuthLayout>
    </div>
  );
}

// ===========================================================
// RESET PASSWORD PAGE
// ===========================================================
// Reached via the link in the reset email: /reset-password?token=xxx
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/\d/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      // Redirect to login with a success message in state
      navigate("/login", {
        replace: true,
        state: { successMessage: "Password reset successfully. You can now sign in." },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Navbar />
      <AuthLayout>
        <div className="mb-7 pt-20">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Set new password</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Choose a strong password for your account
          </p>
        </div>

        {error && <DarkAlert message={error} className="mb-5" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              New password
            </label>
            <PasswordInput
              id="new-password"
              name="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, include a number"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Confirm password
            </label>
            <PasswordInput
              id="confirm-password"
              name="confirm-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              autoComplete="new-password"
              required
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            fullWidth
            className="mt-2 py-3 text-base rounded-xl"
          >
            Reset password
          </Button>
        </form>
      </AuthLayout>
    </div>
  );
}
