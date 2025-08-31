// hooks/useUsers.js
import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "../constants/config";

export const useUsers = (currentUser) => {
  const [allUsers, setAllUsers] = useState([]);

  // 전체 사용자 목록 불러오기
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/users`);
        const usersData = await response.json();
        setAllUsers(usersData);
      } catch (error) {
        console.error("사용자 목록 불러오기 오류:", error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // 조직도 형태로 사용자들 분류
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

  return {
    allUsers,
    organizedUsers,
  };
};
