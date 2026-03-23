import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe } from "@workspace/api-client-react";

export const TOKEN_KEYS = {
  superadmin: "sa_token",
  school: "school_token",
  student: "student_token",
} as const;

function getStorageKey(): string {
  const path = window.location.pathname;
  if (path.startsWith("/superadmin")) return TOKEN_KEYS.superadmin;
  if (path.startsWith("/student")) return TOKEN_KEYS.student;
  return TOKEN_KEYS.school;
}

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const storageKey = getStorageKey();

  const [token, setToken] = useState<string | null>(
    localStorage.getItem(storageKey)
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
    const key = getStorageKey();
    localStorage.setItem(key, newToken);
    setToken(newToken);
    if (redirectUrl) {
      setLocation(redirectUrl);
    }
  }, [setLocation]);

  const logout = useCallback((redirectUrl?: string) => {
    const key = getStorageKey();
    localStorage.removeItem(key);
    setToken(null);
    queryClient.clear();
    if (redirectUrl) {
      setLocation(redirectUrl);
    } else {
      const path = window.location.pathname;
      if (path.startsWith("/superadmin")) setLocation("/superadmin/login");
      else if (path.startsWith("/student")) setLocation("/student/login");
      else setLocation("/admin/login");
    }
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
