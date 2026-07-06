// ===========================================================
// AUTH PAGES — Login, Register, Password Reset
// ===========================================================

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authApi, getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  Alert,
  Button,
  DarkAlert,
  formControlClass,
  formLabelCompactClass,
  IconShell,
} from "../../components/ui";
import { PublicLayout } from "../../components/layout/PublicLayout";
import {
  IconEye,
  IconIdCard,
  IconLock,
  IconMail,
  IconNfcTap,
  IconUser,
} from "../../components/icons/DashboardIcons";

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
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
        <IconLock size={18} />
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
        className={formControlClass(false, "pl-11 pr-11")}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        <IconEye size={18} />
      </button>
    </div>
  );
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100/80 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <div className="mb-7 flex flex-col items-center text-center">
        <IconShell icon={<IconNfcTap size={20} />} accent="brand" size="md" className="mb-4" />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    <PublicLayout footer={false} narrow>
      <AuthCard title="Welcome back" subtitle="Sign in to manage your digital card">
        {error && <DarkAlert message={error} className="mb-5" />}
        {success && <Alert message={success} type="success" className="mb-5" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className={formLabelCompactClass}>
              Email address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconMail size={18} />
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
                className={formControlClass(false, "pl-11")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className={formLabelCompactClass}>
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

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" isLoading={isLoading} fullWidth className="py-3">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-400">
            Create one
          </Link>
        </p>
      </AuthCard>
    </PublicLayout>
  );
}

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

  return (
    <PublicLayout footer={false} narrow>
      <AuthCard
        title="Create your account"
        subtitle="Set up your digital card in seconds"
      >
        {error && <DarkAlert message={error} className="mb-5" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {(["USER", "BUSINESS"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                  role === r
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {r === "USER" ? "Individual" : "Business"}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="name" className={formLabelCompactClass}>
              {role === "BUSINESS" ? "Business name" : "Full name"}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconUser size={18} />
              </span>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "BUSINESS" ? "Mama Kitchen" : "Jane Smith"}
                autoComplete="name"
                required
                className={formControlClass(false, "pl-11")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-email" className={formLabelCompactClass}>
              Email address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconMail size={18} />
              </span>
              <input
                id="register-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className={formControlClass(false, "pl-11")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-password" className={formLabelCompactClass}>
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

          <div className="space-y-1.5">
            <label htmlFor="cardId" className={formLabelCompactClass}>
              Card ID{" "}
              <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconIdCard size={18} />
              </span>
              <input
                id="cardId"
                name="cardId"
                value={cardId}
                onChange={(e) => setCardId(e.target.value.toUpperCase())}
                placeholder="CARD_XXXXXX"
                className={formControlClass(false, "pl-11")}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Link your physical card now to activate it instantly
            </p>
          </div>

          <Button type="submit" isLoading={isLoading} fullWidth className="py-3">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </PublicLayout>
  );
}

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
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout footer={false} narrow>
      <AuthCard
        title="Forgot password?"
        subtitle="We'll send a reset link to your email"
      >
        {error && <DarkAlert message={error} className="mb-5" />}

        {success ? (
          <Alert
            type="success"
            message="If that email is registered, a reset link has been sent. Check your inbox."
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className={formLabelCompactClass}>
                Email address
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <IconMail size={18} />
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className={formControlClass(false, "pl-11")}
                />
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} fullWidth className="py-3">
              Send reset link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    </PublicLayout>
  );
}

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
    <PublicLayout footer={false} narrow>
      <AuthCard title="Set new password" subtitle="Choose a strong password for your account">
        {error && <DarkAlert message={error} className="mb-5" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className={formLabelCompactClass}>
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
            <label htmlFor="confirm-password" className={formLabelCompactClass}>
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

          <Button type="submit" isLoading={isLoading} fullWidth className="py-3">
            Reset password
          </Button>
        </form>
      </AuthCard>
    </PublicLayout>
  );
}
