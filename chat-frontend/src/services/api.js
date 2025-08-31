// services/api.js
import { API_BASE_URL, STORAGE_KEYS } from "../constants/config";
import { handleApiError } from "../utils/errorHandler";

// HTTP 요청 기본 설정
const defaultHeaders = {
  "Content-Type": "application/json",
};

// 인증 토큰이 필요한 요청을 위한 헤더
const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  return {
    ...defaultHeaders,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// 기본 fetch wrapper
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: defaultHeaders,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(handleApiError(error, "API 요청"));
  }
};

// 인증이 필요한 요청을 위한 fetch wrapper
const authenticatedRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: getAuthHeaders(),
      ...options,
    });

    if (response.status === 401) {
      // 토큰이 만료되었거나 유효하지 않음
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.reload(); // 로그인 페이지로 리다이렉트
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(handleApiError(error, "인증된 API 요청"));
  }
};

// 인증 관련 API
export const authAPI = {
  /**
   * 로그인
   * @param {Object} credentials - { username, password }
   * @returns {Promise<Object>} 사용자 정보와 토큰
   */
  login: async (credentials) => {
    return apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  /**
   * 회원가입
   * @param {Object} userData - 회원가입 데이터
   * @returns {Promise<Object>} 가입 결과
   */
  signup: async (userData) => {
    return apiRequest("/api/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  /**
   * 로그아웃
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      await authenticatedRequest("/api/logout", {
        method: "POST",
      });
    } catch (error) {
      console.warn("로그아웃 API 호출 실패, 로컬에서 처리:", error);
    } finally {
      // API 실패 여부와 관계없이 로컬 토큰 정리
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },
};

// 사용자 관련 API
export const usersAPI = {
  /**
   * 전체 사용자 목록 조회
   * @returns {Promise<Array>} 사용자 목록
   */
  getAllUsers: async () => {
    return authenticatedRequest("/api/users");
  },

  /**
   * 특정 사용자 정보 조회
   * @param {string} username - 사용자명
   * @returns {Promise<Object>} 사용자 정보
   */
  getUserInfo: async (username) => {
    return authenticatedRequest(`/api/users/${username}`);
  },

  /**
   * 사용자 프로필 업데이트
   * @param {Object} profileData - 업데이트할 프로필 정보
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  updateProfile: async (profileData) => {
    return authenticatedRequest("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },
};

// 채팅 관련 API
export const chatAPI = {
  /**
   * 채팅 기록 조회
   * @param {string} user1 - 첫 번째 사용자
   * @param {string} user2 - 두 번째 사용자
   * @returns {Promise<Array>} 채팅 메시지 목록
   */
  getChatHistory: async (user1, user2) => {
    return authenticatedRequest(
      `/api/chat/history?user1=${user1}&user2=${user2}`
    );
  },

  /**
   * 전체 채팅방 목록 조회
   * @returns {Promise<Object>} 채팅방별 메시지 목록
   */
  getAllChats: async () => {
    return authenticatedRequest("/api/chat/all");
  },

  /**
   * 메시지 검색
   * @param {string} query - 검색어
   * @param {Object} options - 검색 옵션
   * @returns {Promise<Array>} 검색 결과
   */
  searchMessages: async (query, options = {}) => {
    const searchParams = new URLSearchParams({
      q: query,
      ...options,
    });
    return authenticatedRequest(`/api/chat/search?${searchParams}`);
  },
};

// 파일 업로드 관련 API
export const fileAPI = {
  /**
   * 파일 업로드
   * @param {File} file - 업로드할 파일
   * @param {Object} options - 업로드 옵션
   * @returns {Promise<Object>} 업로드 결과
   */
  uploadFile: async (file, options = {}) => {
    const formData = new FormData();
    formData.append("file", file);

    // 추가 옵션이 있다면 FormData에 추가
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          // Content-Type을 명시하지 않음 (FormData 사용 시)
          Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`업로드 실패: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(handleApiError(error, "파일 업로드"));
    }
  },

  /**
   * 파일 다운로드 URL 생성
   * @param {string} fileId - 파일 ID
   * @returns {string} 다운로드 URL
   */
  getDownloadUrl: (fileId) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return `${API_BASE_URL}/api/files/${fileId}/download?token=${token}`;
  },
};

// 알림 관련 API
export const notificationAPI = {
  /**
   * 읽지 않은 알림 개수 조회
   * @returns {Promise<number>} 읽지 않은 알림 개수
   */
  getUnreadCount: async () => {
    const result = await authenticatedRequest(
      "/api/notifications/unread-count"
    );
    return result.count;
  },

  /**
   * 알림 목록 조회
   * @param {Object} options - 페이징 및 필터 옵션
   * @returns {Promise<Object>} 알림 목록과 페이징 정보
   */
  getNotifications: async (options = {}) => {
    const searchParams = new URLSearchParams(options);
    return authenticatedRequest(`/api/notifications?${searchParams}`);
  },

  /**
   * 알림 읽음 처리
   * @param {string} notificationId - 알림 ID
   * @returns {Promise<void>}
   */
  markAsRead: async (notificationId) => {
    return authenticatedRequest(`/api/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  },
};
