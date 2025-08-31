// hooks/useAuth.js
import { useState, useCallback } from "react";
import { API_BASE_URL } from "../constants/config";

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("chat-user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = useCallback(async (loginData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "로그인 실패");

      localStorage.setItem("chat-token", data.token);
      localStorage.setItem("chat-user", JSON.stringify(data.user));
      setCurrentUser(data.user);

      return data.user;
    } catch (error) {
      console.error("로그인 오류:", error);
      throw error;
    }
  }, []);

  const handleSignup = useCallback(async (signupData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "회원가입 실패");

      return data;
    } catch (error) {
      console.error("회원가입 오류:", error);
      throw error;
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem("chat-token");
    localStorage.removeItem("chat-user");
  }, []);

  return {
    currentUser,
    handleLogin,
    handleSignup,
    handleLogout,
  };
};
