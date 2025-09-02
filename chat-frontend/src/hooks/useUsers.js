// chat-frontend/src/hooks/useUsers.js

// 역할: 로그인한 사용자를 기반으로 전체 사용자 목록을 불러옵니다.
// 동작 방식:
// - 로딩(loading)과 오류(error) 상태를 추가하여 데이터 요청 과정을 명확하게 관리합니다.
// - API 요청이 시작되면 loading을 true로 설정합니다.
// - 요청이 성공하면 받아온 데이터가 배열인지 확인하고 allUsers 상태를 업데이트합니다.
// - 요청이 실패하거나 데이터 형식이 잘못된 경우, error 상태를 설정하고 allUsers를 빈 배열로 유지합니다.
// - 모든 과정이 끝나면 loading을 false로 설정합니다.

import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../constants/config";

export const useUsers = (currentUser) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가 (초기값 true)
  const [error, setError] = useState(null); // 오류 상태 추가

  useEffect(() => {
    const fetchUsers = async () => {
      // currentUser가 없으면 로딩을 멈추고 아무것도 하지 않음
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // 데이터 요청 시작
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/users`);
        if (!response.ok) {
          throw new Error(
            `사용자 목록을 불러오지 못했습니다: ${response.statusText}`
          );
        }
        const usersData = await response.json();

        // 서버에서 받은 데이터가 배열인지 반드시 확인
        if (Array.isArray(usersData)) {
          setAllUsers(usersData);
        } else {
          // 배열이 아니라면 오류로 처리
          console.error("API 응답이 배열이 아닙니다:", usersData);
          throw new Error("서버로부터 잘못된 형식의 응답을 받았습니다.");
        }
      } catch (err) {
        console.error("사용자 목록 불러오기 오류:", err);
        setError(err); // error 상태에 에러 객체 저장
        setAllUsers([]); // 오류 발생 시 빈 배열로 초기화
      } finally {
        // 성공하든 실패하든 로딩 상태를 false로 변경
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]); // currentUser가 변경될 때마다 실행

  const organizedUsers = useMemo(() => {
    if (!currentUser) return {};
    const otherUsers = allUsers.filter(
      (user) => user.username !== currentUser.username
    );
    const grouped = {};
    otherUsers.forEach((user) => {
      const companyName = user.company?.name || "소속 회사 없음";
      const siteName = user.businessSite?.name || "소속 사업장 없음";
      const deptName = user.department?.name || "미지정 부서";
      if (!grouped[companyName]) grouped[companyName] = {};
      if (!grouped[companyName][siteName]) grouped[companyName][siteName] = {};
      if (!grouped[companyName][siteName][deptName])
        grouped[companyName][siteName][deptName] = [];
      grouped[companyName][siteName][deptName].push(user);
    });
    return grouped;
  }, [allUsers, currentUser]);

  // 관리하는 모든 상태를 반환
  return {
    allUsers,
    organizedUsers,
    loading,
    error,
  };
};
