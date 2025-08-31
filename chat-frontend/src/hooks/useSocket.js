// hooks/useSocket.js
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../constants/config";

export const useSocket = (currentUser) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    // 온라인 사용자 업데이트 리스너 먼저 등록
    socket.on("online_users_update", setOnlineUsers);

    // 그다음에 로그인 이벤트 전송
    socket.emit("login", currentUser.username);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser]);

  return {
    socket: socketRef.current,
    onlineUsers,
  };
};
