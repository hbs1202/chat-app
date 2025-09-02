// constants/config.js

// API 기본 URL
export const API_BASE_URL = "";

// 소켓 연결 설정
export const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
};

// 채팅 관련 설정
export const CHAT_CONFIG = {
  TYPING_TIMEOUT: 2000, // 타이핑 상태 유지 시간 (ms)
  MESSAGE_MAX_LENGTH: 1000, // 메시지 최대 길이
  NOTIFICATION_DURATION: 5000, // 알림 표시 시간 (ms)
};

// UI 관련 설정
export const UI_CONFIG = {
  SIDEBAR_VIEWS: {
    ORG: "org",
    CHAT: "chat",
  },
  MESSAGE_PREVIEW_LENGTH: 30, // 메시지 미리보기 길이
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  TOKEN: "chat-token",
  USER: "chat-user",
};
