import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "client" | "musician";
  clientId?: number | null;
  musicianId?: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "cuartoarte_token";
const USER_KEY = "cuartoarte_user";

let _currentToken: string | null = null;

setAuthTokenGetter(() => _currentToken);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]).then(([[, savedToken], [, savedUser]]) => {
      if (savedToken && savedUser) {
        _currentToken = savedToken;
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const baseUrl = domain ? `https://${domain}` : "";
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any).error ?? "Error al iniciar sesión");
    }
    const { token: newToken, user: newUser } = await res.json();
    await AsyncStorage.multiSet([
      [TOKEN_KEY, newToken],
      [USER_KEY, JSON.stringify(newUser)],
    ]);
    _currentToken = newToken;
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    _currentToken = null;
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
