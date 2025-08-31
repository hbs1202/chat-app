// utils/chatUtils.js

/**
 * 두 사용자 간의 채팅 ID를 생성합니다.
 * @param {string} user1 - 첫 번째 사용자명
 * @param {string} user2 - 두 번째 사용자명
 * @returns {string} 정렬된 채팅 ID
 */
export const getChatId = (user1, user2) => {
  if (!user1 || !user2) return "";
  return [user1, user2].sort().join("-");
};

/**
 * 메시지 시간을 포맷팅합니다.
 * @param {string} timestamp - ISO 시간 문자열
 * @returns {string} 포맷된 시간 문자열
 */
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // 1분 미만
  if (diff < 60000) {
    return "방금 전";
  }

  // 1시간 미만
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}분 전`;
  }

  // 24시간 미만
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}시간 전`;
  }

  // 그 이후
  return date.toLocaleDateString("ko-KR");
};

/**
 * 메시지 내용을 미리보기용으로 자릅니다.
 * @param {string} content - 메시지 내용
 * @param {number} maxLength - 최대 길이 (기본값: 30)
 * @returns {string} 잘린 메시지 내용
 */
export const truncateMessage = (content, maxLength = 30) => {
  if (!content) return "";
  return content.length > maxLength
    ? `${content.substring(0, maxLength)}...`
    : content;
};

/**
 * 사용자가 온라인인지 확인합니다.
 * @param {string} username - 사용자명
 * @param {Array} onlineUsers - 온라인 사용자 목록
 * @returns {boolean} 온라인 여부
 */
export const isUserOnline = (username, onlineUsers) => {
  return onlineUsers.includes(username);
};

/**
 * 읽지 않은 메시지 총 개수를 계산합니다.
 * @param {Object} unreadMessages - 읽지 않은 메시지 객체
 * @returns {number} 총 읽지 않은 메시지 개수
 */
export const getTotalUnreadCount = (unreadMessages) => {
  return Object.values(unreadMessages).reduce(
    (total, count) => total + count,
    0
  );
};
