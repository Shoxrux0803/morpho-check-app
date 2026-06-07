import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { set, del } from "idb-keyval";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    del("auth_token").catch(console.error);
    setUser(null);
  }, []);

  const login = async (credentials) => {
    try {
      const data = await api.login(credentials);
      if (data.requires_verification) {
        return data;
      }
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        await set("auth_token", data.access_token);
        // User profile fetch qilish orqali rolni aniqlaymiz
        const profile = await api.getUserProfile();
        localStorage.setItem("user_role", profile.role);
        setUser(profile);
        return profile;
      }
      throw new Error("Token topilmadi. Backend javobi noto'g'ri formatda.");
    } catch (err) {
      // Network xatosi yoki proxy xatosini aniqroq ko'rsatish
      if (err.message && err.message.includes("Failed to fetch")) {
        throw new Error(
          "Backend serverga ulanib bo'lmadi. Backend ishlaayotganini tekshiring (port 8000).",
        );
      }
      throw err;
    }
  };

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const profile = await api.getUserProfile();
      setUser(profile);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Stored auth token is invalid or expired; logging out.");
      }
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
