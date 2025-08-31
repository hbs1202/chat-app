// hooks/useNotifications.js
import { useEffect } from "react";

export const useNotifications = (socket, allUsers, handleUserSelect) => {
  // 알림 권한 요청
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("알림 권한이 허용되었습니다.");
        } else {
          console.log("알림 권한이 거부되었습니다.");
        }
      });
    }
  }, []);

  // 메시지 알림 처리
  useEffect(() => {
    if (!socket) return;

    const handleMessageNotification = (message) => {
      // 현재 페이지가 비활성화되어 있고 알림 권한이 허용된 경우에만 알림 생성
      if (document.hidden && Notification.permission === "granted") {
        const senderDetails = allUsers.find(
          (u) => u.username === message.sender
        );
        const senderName = senderDetails?.fullName || message.sender;

        const notification = new Notification(`새 메시지: ${senderName}`, {
          body: message.content,
          icon: "/favicon.ico",
        });

        // 알림 클릭 시 해당 채팅방으로 이동
        notification.onclick = () => {
          window.focus();
          handleUserSelect(message.sender);
        };

        // 5초 후 자동으로 알림 닫기
        setTimeout(() => notification.close(), 5000);
      }
    };

    socket.on("receive_message", handleMessageNotification);

    return () => {
      socket.off("receive_message", handleMessageNotification);
    };
  }, [socket, allUsers, handleUserSelect]);
};
