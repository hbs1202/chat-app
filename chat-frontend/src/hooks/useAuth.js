// chat-frontend/src/hooks/useAuth.js

// 역할: 사용자 인증(로그인, 로그아웃, 회원가입)과 관련된 상태 및 로직을 관리하는 커스텀 훅입니다.
// 동작 방식:
// - 앱이 시작될 때 localStorage에서 이전에 저장된 사용자 정보를 읽어와 로그인 상태를 복원합니다.
// - 로그인 성공 시, 백엔드로부터 받은 사용자 정보와 인증 토큰을 localStorage에 저장합니다.
// - 로그아웃 시, 앱의 상태를 초기화하고 localStorage에서 관련 정보만 안전하게 제거합니다.

import { useState, useCallback } from "react";
import { API_BASE_URL, STORAGE_KEYS } from "../constants/config"; // 설정 파일에서 API 주소와 스토리지 키를 가져옵니다.

export const useAuth = () => {
  // --- 상태 관리 ---
  // useState의 초기값으로 함수를 전달하여, 컴포넌트가 처음 렌더링될 때 한 번만 실행되도록 합니다.
  const [currentUser, setCurrentUser] = useState(() => {
    // 1. localStorage에서 'chat-user' 키로 저장된 사용자 정보를 가져옵니다.
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (!savedUser) {
      return null;
    }
    try {
      // 2. 가져온 데이터(문자열)를 JSON 객체로 파싱하여 반환합니다.
      //    이 값이 currentUser 상태의 초기값이 됩니다.
      return JSON.parse(savedUser);
    } catch (error) {
      // 3. 만약 파싱 중 오류가 발생하면 (예: 데이터 손상), 콘솔에 에러를 기록하고 null을 반환합니다.
      console.error(
        "localStorage에서 사용자 정보를 파싱하는 데 실패했습니다:",
        error
      );
      return null;
    }
  });

  // --- 핸들러 함수 ---

  // 로그인 처리 함수
  const handleLogin = useCallback(async (loginData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }

      // 로그인 성공 시, 토큰과 사용자 정보를 localStorage에 저장합니다.
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

      // 앱의 현재 사용자 상태를 업데이트하여 리렌더링을 유발합니다.
      setCurrentUser(data.user);

      return data.user;
    } catch (error) {
      console.error("로그인 오류:", error);
      throw error; // 오류를 다시 던져서 LoginScreen 컴포넌트에서 처리할 수 있도록 합니다.
    }
  }, []);

  // 회원가입 처리 함수
  const handleSignup = useCallback(async (signupData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "회원가입에 실패했습니다.");
      }

      return data;
    } catch (error) {
      console.error("회원가입 오류:", error);
      throw error;
    }
  }, []);

  // 로그아웃 처리 함수
  const handleLogout = useCallback(() => {
    // 앱의 현재 사용자 상태를 null로 설정합니다.
    setCurrentUser(null);

    // localStorage에서 이 앱과 관련된 키만 명확하게 제거합니다.
    // (localStorage.clear()는 다른 웹사이트 데이터까지 지울 수 있어 사용하지 않는 것이 안전합니다.)
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  // 훅에서 관리하는 상태와 함수들을 객체 형태로 반환합니다.
  return {
    currentUser,
    handleLogin,
    handleSignup,
    handleLogout,
  };
};
