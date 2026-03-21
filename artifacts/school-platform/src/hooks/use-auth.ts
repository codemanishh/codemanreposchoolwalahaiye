import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe } from "@workspace/api-client-react";

export const AUTH_TOKEN_KEY = "school_token";

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(AUTH_TOKEN_KEY)
  );

  const { data: user, isLoading, error } = useGetMe({
    request: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (error) {
      logout();
    }
  }, [error]);

  const login = useCallback((newToken: string, redirectUrl?: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
    if (redirectUrl) {
      setLocation(redirectUrl);
    }
  }, [setLocation]);

  const logout = useCallback((redirectUrl: string = "/") => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    queryClient.clear();
    setLocation(redirectUrl);
  }, [setLocation, queryClient]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  return {
    user,
    token,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    authHeaders,
  };
}
