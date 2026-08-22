import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://fresh15-main.onrender.com";
export const PORTAL = "platform" as const;

const KEY_SESSION = "f15-auth-session";
const KEY_RESET = "f15-auth-reset"; // { email, resetToken? } — never a password/OTP

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  portal?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  avatar?: string;
};

type Session = { token: string; user: AuthUser };

type ApiResponse<T> = { success: boolean; message?: string; data: T };

async function api<T>(path: string, body: unknown, token?: string): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Unable to reach the server. Please check your connection and try again.");
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return json as ApiResponse<T>;
}

function normalizeUser(raw: any): AuthUser {
  return {
    id: raw?._id ?? raw?.id ?? "",
    name: raw?.name ?? "Admin",
    email: raw?.email ?? "",
    role: raw?.role ?? "",
    phone: raw?.phone,
    portal: raw?.portal,
    isEmailVerified: raw?.isEmailVerified,
    isActive: raw?.isActive,
    avatar: raw?.profileImage ?? raw?.avatar,
  };
}

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN", "SUPERADMIN", "STAFF", "PLATFORM_ADMIN"];

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  requestOtp: (email: string) => Promise<string>;
  verifyOtp: (email: string, otp: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<string>;
  resetEmail: string | null;
  resetToken: string | null;
  clearResetFlow: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readReset(): { email?: string; resetToken?: string } {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY_RESET) || "{}");
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY_SESSION);
      if (raw) {
        const s = JSON.parse(raw) as Session;
        if (s?.token && s?.user) {
          setToken(s.token);
          setUser(s.user);
        }
      }
    } catch {
      /* noop */
    }
    const r = readReset();
    if (r.email) setResetEmail(r.email);
    if (r.resetToken) setResetToken(r.resetToken);
    setReady(true);
  }, []);

  const persist = (s: Session | null) => {
    if (s) localStorage.setItem(KEY_SESSION, JSON.stringify(s));
    else localStorage.removeItem(KEY_SESSION);
    setToken(s?.token ?? null);
    setUser(s?.user ?? null);
  };

  const persistReset = (next: { email?: string | null; resetToken?: string | null }) => {
    const cur = readReset();
    const merged: Record<string, string> = {};
    const email = next.email !== undefined ? next.email : cur.email;
    const rt = next.resetToken !== undefined ? next.resetToken : cur.resetToken;
    if (email) merged.email = email;
    if (rt) merged.resetToken = rt;
    if (Object.keys(merged).length) sessionStorage.setItem(KEY_RESET, JSON.stringify(merged));
    else sessionStorage.removeItem(KEY_RESET);
    setResetEmail(merged.email ?? null);
    setResetToken(merged.resetToken ?? null);
  };

  const login: AuthContextValue["login"] = async (email, password) => {
    const res = await api<{ token: string; user: any }>("/api/auth/login", {
      email: email.trim(),
      password,
      portal: PORTAL,
    });
    const u = normalizeUser(res.data?.user);
    const role = (u.role || "").toUpperCase();
    const portalOk = !u.portal || u.portal.toLowerCase() === PORTAL;
    if (!portalOk || !ALLOWED_ROLES.includes(role)) {
      throw new Error("This account does not have access to the Fresh15 Platform Hub.");
    }
    persist({ token: res.data.token, user: u });
    return u;
  };

  const logout = () => {
    persist(null);
    persistReset({ email: null, resetToken: null });
  };

  const updateUser: AuthContextValue["updateUser"] = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        const raw = localStorage.getItem(KEY_SESSION);
        if (raw) {
          const s = JSON.parse(raw) as Session;
          localStorage.setItem(KEY_SESSION, JSON.stringify({ ...s, user: next }));
        }
      } catch {
        /* noop */
      }
      return next;
    });
  };

  const requestOtp: AuthContextValue["requestOtp"] = async (email) => {
    const res = await api<null>("/api/auth/forgot-password", { email: email.trim() });
    persistReset({ email: email.trim(), resetToken: null });
    return res.message || "OTP sent successfully";
  };

  const verifyOtp: AuthContextValue["verifyOtp"] = async (email, otp) => {
    const res = await api<{ resetToken: string }>("/api/auth/verify-otp", {
      email: email.trim(),
      otp,
      purpose: "FORGOT_PASSWORD",
    });
    persistReset({ email: email.trim(), resetToken: res.data.resetToken });
    return res.data.resetToken;
  };

  const resetPassword: AuthContextValue["resetPassword"] = async (rt, password) => {
    const res = await api<null>("/api/auth/reset-password", { token: rt, password });
    persistReset({ email: null, resetToken: null });
    return res.message || "Password reset successful";
  };

  const clearResetFlow = () => persistReset({ email: null, resetToken: null });

  useEffect(() => {
    const handleAuthExpired = () => {
      persist(null);
    };

    window.addEventListener(
      "f15-auth-expired",
      handleAuthExpired,
    );

    return () => {
      window.removeEventListener(
        "f15-auth-expired",
        handleAuthExpired,
      );
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        ready,
        login,
        logout,
        updateUser,
        requestOtp,
        verifyOtp,
        resetPassword,
        resetEmail,
        resetToken,
        clearResetFlow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
