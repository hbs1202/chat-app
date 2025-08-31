// hooks/useChat.js
// 테스트2
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { getChatId } from "../utils/chatUtils";

export const useChat = (
  currentUser,
  selectedUser,
  setSelectedUser,
  allUsers,
  socket
) => {
  // 채팅 관련 상태
  const [messages, setMessages] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // 참조 및 타이머
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserRef = useRef(currentUser);
  const selectedUserRef = useRef(selectedUser);

  // 최신 상태 참조 업데이트
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // 채팅방 목록 생성
  const chatRooms = useMemo(() => {
    if (!currentUser) return [];

    const roomMap = new Map();

    Object.entries(messages).forEach(([chatId, chatMessages]) => {
      const participants = chatId.split("-");
      const partnerUsername = participants.find(
        (p) => p !== currentUser.username
      );

      if (!partnerUsername) return;

      const partnerDetails = allUsers.find(
        (u) => u.username === partnerUsername
      );

      const lastMessage =
        chatMessages.length > 0
          ? chatMessages[chatMessages.length - 1].content
          : "대화를 시작해보세요.";

      roomMap.set(partnerUsername, {
        username: partnerUsername,
        fullName: partnerDetails?.fullName || partnerUsername,
        lastMessage: lastMessage,
      });
    });

    return Array.from(roomMap.values());
  }, [messages, allUsers, currentUser]);

  // 현재 선택된 사용자 상세 정보
  const selectedUserDetails = useMemo(
    () => allUsers.find((u) => u.username === selectedUser),
    [allUsers, selectedUser]
  );

  // 현재 채팅 메시지들
  const currentMessages = useMemo(() => {
    if (!currentUser || !selectedUser) return [];
    const chatId = getChatId(currentUser.username, selectedUser);
    return messages[chatId] || [];
  }, [messages, currentUser, selectedUser]);

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return;

    // 초기 읽지 않은 메시지 수
    socket.on("initial_unread_counts", setUnreadMessages);

    // 새 메시지 수신
    const messageListener = (message) => {
      const me = currentUserRef.current;
      if (!me) return;

      const chatId = getChatId(message.sender, me.username);
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message],
      }));

      // 선택되지 않은 사용자의 메시지인 경우 읽지 않은 메시지 수 증가
      if (message.sender !== selectedUserRef.current) {
        setUnreadMessages((prev) => ({
          ...prev,
          [message.sender]: (prev[message.sender] || 0) + 1,
        }));
      }
    };

    // 채팅 기록 수신
    const historyListener = (history) => {
      const me = currentUserRef.current;
      const sel = selectedUserRef.current;
      if (!me || !sel || !history) return;

      const chatId = getChatId(me.username, sel);
      setMessages((prev) => ({ ...prev, [chatId]: history }));
    };

    // 전체 메시지 기록 수신
    const allMessagesListener = (messagesByChat) => {
      setMessages(messagesByChat);
    };

    // 타이핑 상태 리스너
    const typingListener = ({ sender }) => {
      if (sender === selectedUserRef.current) setIsTyping(true);
    };

    const stopTypingListener = ({ sender }) => {
      if (sender === selectedUserRef.current) setIsTyping(false);
    };

    // 메시지 읽음 상태 업데이트
    const messagesReadListener = ({ readerUsername }) => {
      const me = currentUserRef.current;
      if (!me) return;

      const chatId = getChatId(me.username, readerUsername);
      setMessages((prev) => {
        const chatMessages = prev[chatId] || [];
        const updatedMessages = chatMessages.map((msg) =>
          msg.sender === me.username ? { ...msg, isRead: true } : msg
        );
        return { ...prev, [chatId]: updatedMessages };
      });
    };

    // 이벤트 리스너 등록
    socket.on("receive_message", messageListener);
    socket.on("chat_history", historyListener);
    socket.on("all_messages_history", allMessagesListener);
    socket.on("user_typing", typingListener);
    socket.on("user_stopped_typing", stopTypingListener);
    socket.on("messages_read", messagesReadListener);

    return () => {
      socket.off("receive_message", messageListener);
      socket.off("chat_history", historyListener);
      socket.off("all_messages_history", allMessagesListener);
      socket.off("user_typing", typingListener);
      socket.off("user_stopped_typing", stopTypingListener);
      socket.off("messages_read", messagesReadListener);
    };
  }, [socket]);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // 메시지 읽음 처리
  useEffect(() => {
    if (selectedUser && currentMessages.length > 0 && socket && currentUser) {
      const hasUnread = currentMessages.some(
        (msg) => msg.sender === selectedUser && !msg.isRead
      );

      if (hasUnread) {
        socket.emit("mark_as_read", {
          readerUsername: currentUser.username,
          senderUsername: selectedUser,
        });
      }
    }
  }, [currentMessages, selectedUser, currentUser, socket]);

  // 사용자 선택 핸들러
  const handleUserSelect = useCallback(
    (selectedUsername) => {
      if (!socket || !currentUser) return;

      setSelectedUser(selectedUsername);
      setIsTyping(false);

      socket.emit("get_chat_history", {
        user1: currentUser.username,
        user2: selectedUsername,
      });

      setUnreadMessages((prev) => {
        const newUnread = { ...prev };
        delete newUnread[selectedUsername];
        return newUnread;
      });
    },
    [currentUser, socket, setSelectedUser]
  );

  // 메시지 전송
  const sendMessage = useCallback(() => {
    if (!socket || !newMessage.trim() || !selectedUser || !currentUser) return;

    const message = {
      id: `local-${Date.now()}`,
      sender: currentUser.username,
      receiver: selectedUser,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const chatId = getChatId(currentUser.username, selectedUser);
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message],
    }));

    socket.emit("send_message", message);
    setNewMessage("");

    // 타이핑 상태 중지
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing_stop", {
      sender: currentUser.username,
      receiver: selectedUser,
    });
  }, [currentUser, selectedUser, newMessage, socket]);

  // 타이핑 처리
  const handleTyping = useCallback(() => {
    if (!socket || !currentUser || !selectedUser) return;

    socket.emit("typing_start", {
      sender: currentUser.username,
      receiver: selectedUser,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing_stop", {
        sender: currentUser.username,
        receiver: selectedUser,
      });
    }, 2000);
  }, [currentUser, selectedUser, socket]);

  // 뒤로가기
  const handleBackToUserList = useCallback(() => {
    setSelectedUser(null);
  }, [setSelectedUser]);

  return {
    messages,
    unreadMessages,
    isTyping,
    chatRooms,
    selectedUserDetails,
    currentMessages,
    messagesEndRef,
    newMessage,
    setNewMessage,
    handleUserSelect,
    sendMessage,
    handleTyping,
    handleBackToUserList,
  };
};
