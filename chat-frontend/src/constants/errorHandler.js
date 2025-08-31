// utils/errorHandler.js

/**
 * API 에러를 처리하고 사용자 친화적인 메시지를 반환합니다.
 * @param {Error} error - 발생한 에러
 * @param {string} context - 에러가 발생한 컨텍스트
 * @returns {string} 사용자에게 표시할 에러 메시지
 */
export const handleApiError = (error, context = "작업") => {
  console.error(`${context} 중 오류 발생:`, error);

  // 네트워크 에러
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return "네트워크 연결을 확인해주세요.";
  }

  // 인증 에러
  if (error.message?.includes("401") || error.message?.includes("인증")) {
    return "로그인이 필요합니다. 다시 로그인해주세요.";
  }

  // 권한 에러
  if (error.message?.includes("403") || error.message?.includes("권한")) {
    return "접근 권한이 없습니다.";
  }

  // 서버 에러
  if (error.message?.includes("500")) {
    return "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  // 기타 에러
  return error.message || `${context} 중 오류가 발생했습니다.`;
};

/**
 * 소켓 연결 에러를 처리합니다.
 * @param {Error} error - 소켓 에러
 */
export const handleSocketError = (error) => {
  console.error("소켓 연결 오류:", error);

  // 연결 실패 시 사용자에게 알림
  if (error.type === "TransportError") {
    console.warn("서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요.");
  }
};

/**
 * 파일 업로드 에러를 처리합니다.
 * @param {Error} error - 파일 업로드 에러
 * @param {string} fileName - 업로드하려던 파일명
 * @returns {string} 에러 메시지
 */
export const handleFileUploadError = (error, fileName) => {
  console.error(`파일 업로드 오류 (${fileName}):`, error);

  if (error.message?.includes("size")) {
    return "파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.";
  }

  if (error.message?.includes("type")) {
    return "지원하지 않는 파일 형식입니다.";
  }

  return "파일 업로드에 실패했습니다. 다시 시도해주세요.";
};

/**
 * 폼 검증 에러를 처리합니다.
 * @param {Object} errors - 검증 에러 객체
 * @returns {string} 첫 번째 에러 메시지
 */
export const getFirstValidationError = (errors) => {
  const errorKeys = Object.keys(errors);
  if (errorKeys.length === 0) return "";

  const firstErrorKey = errorKeys[0];
  return errors[firstErrorKey];
};
