import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, setAuthToken, clearAuthToken, getAuthToken } from '../lib/api';

export interface AppUser {
  uid: string;
  id: string;
  email: string;
  displayName: string;
  name: string;
  role: 'admin' | 'user';
  currency: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, pass: string, captchaToken: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, captchaToken: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (code: string) => Promise<void>;
  loginWithGithub: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string, captchaToken: string) => Promise<{ message: string }>;
  verifyResetCode: (email: string, code: string) => Promise<void>;
  confirmPasswordReset: (email: string, newPassword: string, code: string) => Promise<void>;
}

const STORAGE_KEY = 'monevra_user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  loginWithEmail: async () => {},
  registerWithEmail: async () => ({ success: false, message: '' }),
  loginWithGoogle: async () => {},
  loginWithGithub: async () => {},
  logout: async () => {},
  resetPassword: async () => ({ message: '' }),
  verifyResetCode: async () => {},
  confirmPasswordReset: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // On mount: validate existing token via /api/auth/me
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      apiRequest<{ user: AppUser }>('/auth/me')
        .then((data) => {
          setUser(data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        })
        .catch((err) => {
          console.error("Auth validation failed:", err);
          // Do not clear tokens on generic network error, api.ts handles 401s
        })
        .finally(() => setLoading(false));
    } else {
      // No token — clear any stale user data
      localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
    }
  }, []);

  const persistUser = (nextUser: AppUser, token: string) => {
    setAuthToken(token);
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  };

  const loginWithEmail = async (email: string, pass: string, captchaToken: string) => {
    const data = await apiRequest<{ token: string; user: AppUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, captchaToken }),
    });
    persistUser(data.user, data.token);
  };

  // Register does NOT auto-login — returns success message only
  const registerWithEmail = async (email: string, pass: string, name: string, captchaToken: string) => {
    const data = await apiRequest<{ success: boolean; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: pass, captchaToken }),
    });
    return data;
  };

  const loginWithGoogle = async (code: string) => {
    const data = await apiRequest<{ token: string; user: AppUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    persistUser(data.user, data.token);
  };

  const loginWithGithub = async (code: string) => {
    const data = await apiRequest<{ token: string; user: AppUser }>('/auth/github', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    persistUser(data.user, data.token);
  };

  const logout = async () => {
    clearAuthToken();
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const resetPassword = async (email: string, captchaToken: string) => {
    return await apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, captchaToken }),
    });
  };

  const verifyResetCode = async (email: string, code: string) => {
    await apiRequest('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  };

  const confirmPasswordReset = async (email: string, newPassword: string, code: string) => {
    await apiRequest('/auth/reset-password-confirm', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword, code }),
    });
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin: user?.role === 'admin',
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithGithub,
    logout,
    resetPassword,
    verifyResetCode,
    confirmPasswordReset,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
