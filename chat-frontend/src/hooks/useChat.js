import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { API_BASE_URL } from "../constants/config";

/**
 * 채팅 기능을 관리하는 커스텀 훅
 * - 1:1 채팅과 그룹 채팅을 통합 관리
 * - 실시간 메시지 송수신, 읽음 처리, 타이핑 상태 관리
 * - 소켓 이벤트 리스너 및 API 통신 담당
 */
export const useChat = (
  currentUser, // 현재 로그인한 사용자 정보
  selectedChat, // 현재 선택된 채팅방 객체
  setSelectedChat, // 선택된 채팅방 설정 함수
  allUsers, // 전체 사용자 목록
  socket // 소켓 연결 객체
) => {
  // ========================================
  // 상태 관리
  // ========================================

  // 채팅방별 메시지 저장 { chatRoomId: [메시지배열] }
  const [messages, setMessages] = useState({});

  // 채팅방별 읽지 않은 메시지 수 { chatRoomId: 숫자 }
  const [unreadMessages, setUnreadMessages] = useState({});

  // 사용자가 참여중인 전체 채팅방 목록
  const [chatRoomList, setChatRoomList] = useState([]);

  // 상대방의 타이핑 상태 (현재 선택된 채팅방에서)
  const [isTyping, setIsTyping] = useState(false);

  // 현재 입력중인 메시지 내용
  const [newMessage, setNewMessage] = useState("");

  // 그룹 채팅 생성 모달 표시 여부
  const [isGroupChatModalOpen, setIsGroupChatModalOpen] = useState(false);

  // 그룹 채팅에 초대할 사용자 목록
  const [selectedUsersForGroupChat, setSelectedUsersForGroupChat] = useState(
    []
  );

  // ========================================
  // 참조 객체 (Refs)
  // ========================================

  // 메시지 목록 하단으로 자동 스크롤을 위한 참조
  const messagesEndRef = useRef(null);

  // 타이핑 상태 타임아웃 관리
  const typingTimeoutRef = useRef(null);

  // 최신 상태를 소켓 이벤트 리스너에서 참조하기 위한 ref
  const currentUserRef = useRef(currentUser);
  const selectedChatRef = useRef(selectedChat);

  // 최신 상태로 ref 업데이트
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // ========================================
  // 소켓 이벤트 리스너 설정
  // ========================================

  useEffect(() => {
    if (!socket) return;

    /**
     * 초기 읽지 않은 메시지 수 수신
     * 로그인 시 서버에서 전송하는 각 채팅방별 읽지 않은 메시지 수
     */
    const handleInitialUnreadCounts = (unreadSummary) => {
      console.log("[채팅] 초기 읽지 않은 메시지 수신:", unreadSummary);
      setUnreadMessages(unreadSummary);
    };

    /**
     * 새 메시지 수신 처리
     * 실시간으로 다른 사용자가 보낸 메시지 수신
     */
    const handleReceiveMessage = (messageFromServer) => {
      console.log("[채팅] 새 메시지 수신:", messageFromServer);

      const currentUserData = currentUserRef.current;
      if (!currentUserData) return;

      const chatRoomId = messageFromServer.chatRoom;
      if (!chatRoomId) return;

      // 내가 보낸 메시지인 경우 (다른 기기에서 보낸 경우)
      if (messageFromServer.sender === currentUserData.username) {
        // 현재 보고있지 않은 채팅방이면 읽지 않음 수 증가
        if (selectedChatRef.current?._id !== chatRoomId) {
          setUnreadMessages((prev) => ({
            ...prev,
            [chatRoomId]: (prev[chatRoomId] || 0) + 1,
          }));
        }

        // 임시 메시지를 서버 응답으로 교체
        setMessages((prev) => {
          const existingMessages = prev[chatRoomId] || [];
          const updatedMessages = existingMessages.map((localMsg) =>
            localMsg._id?.startsWith("local-") &&
            localMsg.message === messageFromServer.message
              ? messageFromServer
              : localMsg
          );

          // 교체할 임시 메시지를 찾지 못한 경우 새로 추가
          const alreadyExists = updatedMessages.some(
            (msg) => msg._id === messageFromServer._id
          );
          if (!alreadyExists) {
            updatedMessages.push(messageFromServer);
          }

          return { ...prev, [chatRoomId]: updatedMessages };
        });
      } else {
        // 다른 사용자가 보낸 메시지인 경우
        setMessages((prev) => ({
          ...prev,
          [chatRoomId]: [...(prev[chatRoomId] || []), messageFromServer],
        }));

        // 현재 보고있지 않은 채팅방이면 읽지 않음 수 증가
        if (selectedChatRef.current?._id !== chatRoomId) {
          setUnreadMessages((prev) => ({
            ...prev,
            [chatRoomId]: (prev[chatRoomId] || 0) + 1,
          }));
        }
      }
    };

    /**
     * 메시지 읽음 처리 수신
     * 상대방이 내 메시지를 읽었을 때의 처리
     */
    const handleMessagesRead = (data) => {
      console.log("[채팅] 메시지 읽음 처리:", data);

      const { chatRoomId } = data;
      const currentUserData = currentUserRef.current;
      if (!currentUserData || !chatRoomId) return;

      // 해당 채팅방에서 내가 보낸 메시지들을 읽음 상태로 변경
      setMessages((prev) => {
        const chatMessages = prev[chatRoomId] || [];
        const updatedMessages = chatMessages.map((msg) => {
          if (msg.sender === currentUserData.username) {
            return { ...msg, isRead: true };
          }
          return msg;
        });
        return { ...prev, [chatRoomId]: updatedMessages };
      });
    };

    /**
     * 채팅방 목록 수신
     * 사용자가 참여중인 모든 채팅방 목록
     */
    const handleChatRoomList = (roomsFromServer) => {
      console.log("[채팅] 채팅방 목록 수신:", roomsFromServer);
      setChatRoomList(roomsFromServer);
    };

    /**
     * 전체 메시지 히스토리 수신
     * 로그인 시 모든 채팅방의 메시지 기록을 받음
     */
    const handleAllMessagesHistory = (messagesByChat) => {
      console.log("[채팅] 전체 메시지 히스토리 수신");
      setMessages(messagesByChat);
    };

    /**
     * 특정 채팅방 메시지 히스토리 수신
     * 채팅방 선택 시 해당 채팅방의 메시지 기록
     */
    const handleChatHistory = (history) => {
      const currentChat = selectedChatRef.current;
      if (currentChat && Array.isArray(history)) {
        setMessages((prev) => ({
          ...prev,
          [currentChat._id]: history,
        }));
      }
    };

    /**
     * 타이핑 시작 알림 수신
     */
    const handleUserTyping = (data) => {
      const currentChat = selectedChatRef.current;
      if (currentChat && currentChat._id === data.chatRoomId) {
        setIsTyping(true);
      }
    };

    /**
     * 타이핑 중단 알림 수신
     */
    const handleUserStoppedTyping = (data) => {
      const currentChat = selectedChatRef.current;
      if (currentChat && currentChat._id === data.chatRoomId) {
        setIsTyping(false);
      }
    };

    // 이벤트 리스너 등록
    socket.on("initial_unread_counts", handleInitialUnreadCounts);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("chat_room_list", handleChatRoomList);
    socket.on("all_messages_history", handleAllMessagesHistory);
    socket.on("chat_history", handleChatHistory);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);

    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return () => {
      socket.off("initial_unread_counts", handleInitialUnreadCounts);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("chat_room_list", handleChatRoomList);
      socket.off("all_messages_history", handleAllMessagesHistory);
      socket.off("chat_history", handleChatHistory);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [socket]);

  // ========================================
  // 읽음 처리 로직
  // ========================================

  /**
   * 채팅방 입장 시 읽지 않은 메시지를 읽음으로 처리
   */
  useEffect(() => {
    if (!socket || !selectedChat || !currentUser) return;

    const messagesInCurrentChat = messages[selectedChat._id] || [];

    // 상대방이 보낸 읽지 않은 메시지가 있는지 확인
    const hasUnreadMessages = messagesInCurrentChat.some(
      (msg) => msg.sender !== currentUser.username && !msg.isRead
    );

    if (hasUnreadMessages) {
      // 1:1 채팅의 경우에만 읽음 처리 신호 전송
      if (!selectedChat.isGroup) {
        const partnerUsername = selectedChat.participants.find(
          (participant) => participant !== currentUser.username
        );

        if (partnerUsername) {
          socket.emit("mark_as_read", {
            readerUsername: currentUser.username,
            senderUsername: partnerUsername,
            chatRoomId: selectedChat._id,
          });
        }
      }

      // 읽지 않은 메시지 수 초기화
      setUnreadMessages((prev) => ({
        ...prev,
        [selectedChat._id]: 0,
      }));
    }
  }, [selectedChat, messages, currentUser, socket]);

  // ========================================
  // 메시지 목록 자동 스크롤
  // ========================================

  /**
   * 새 메시지 도착 시 스크롤을 맨 아래로 이동
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedChat]);

  // ========================================
  // 계산된 값들 (useMemo)
  // ========================================

  /**
   * 사이드바에 표시할 채팅방 목록 데이터 생성
   * - 각 채팅방의 표시명, 마지막 메시지, 읽지 않은 메시지 수 계산
   * - 최신 메시지 순으로 정렬
   */
  const chatRooms = useMemo(() => {
    if (!currentUser || chatRoomList.length === 0) return [];

    return chatRoomList
      .map((room) => {
        const messagesInRoom = messages[room._id] || [];
        const lastMessageObj = messagesInRoom[messagesInRoom.length - 1];
        const lastMessage =
          lastMessageObj?.content ||
          lastMessageObj?.message ||
          "대화를 시작해보세요.";

        let displayName;
        let partnerUsername;

        if (room.isGroup) {
          // 그룹 채팅: 참여자들의 이름을 콤마로 연결
          displayName = room.participants
            .filter((participant) => participant !== currentUser.username)
            .map((participantUsername) => {
              const user = allUsers.find(
                (u) => u.username === participantUsername
              );
              return user?.fullName || participantUsername;
            })
            .join(", ");
        } else {
          // 1:1 채팅: 상대방의 이름
          partnerUsername = room.participants.find(
            (participant) => participant !== currentUser.username
          );
          const partnerDetails = allUsers.find(
            (user) => user.username === partnerUsername
          );
          displayName = partnerDetails?.fullName || partnerUsername;
        }

        return {
          ...room,
          displayName,
          partnerUsername,
          lastMessage,
          unreadCount: unreadMessages[room._id] || 0,
          lastMessageTimestamp: lastMessageObj?.timestamp,
        };
      })
      .sort((a, b) => {
        // 최신 메시지가 있는 채팅방을 위로 정렬
        const aTime = new Date(a.lastMessageTimestamp || 0);
        const bTime = new Date(b.lastMessageTimestamp || 0);
        return bTime - aTime;
      });
  }, [chatRoomList, messages, unreadMessages, currentUser, allUsers]);

  // --- [핵심 추가] 채팅창 헤더에 표시될 이름 생성 ---
  const chatRoomName = useMemo(() => {
    if (!selectedChat || !currentUser) return "대화 상대를 선택하세요";

    // 그룹 채팅방의 경우
    if (selectedChat.isGroup || selectedChat.participants.length > 2) {
      const partnerNames = selectedChat.participants
        .filter((p) => p !== currentUser.username)
        .map(
          (username) =>
            allUsers.find((u) => u.username === username)?.fullName || username
        );
      // 그룹 채팅 이름에 나 자신도 포함하여 명확하게 표시
      return [currentUser.fullName, ...partnerNames].join(", ");
    }

    // 1:1 채팅방의 경우
    const partnerUsername = selectedChat.participants.find(
      (p) => p !== currentUser.username
    );
    const partnerDetails = allUsers.find((u) => u.username === partnerUsername);
    return partnerDetails?.fullName || partnerUsername || "알 수 없는 사용자";
  }, [selectedChat, currentUser, allUsers]);

  /**
   * 현재 선택된 채팅방의 상대방 정보
   * 1:1 채팅에서 상대방의 상세 정보를 반환
   */
  const partnerDetails = useMemo(() => {
    if (!selectedChat || !currentUser || selectedChat.isGroup) return null;

    const partnerUsername = selectedChat.participants.find(
      (participant) => participant !== currentUser.username
    );
    return allUsers.find((user) => user.username === partnerUsername);
  }, [selectedChat, currentUser, allUsers]);

  /**
   * 현재 선택된 채팅방의 메시지 목록
   */
  const currentMessages = useMemo(() => {
    if (!selectedChat) return [];
    return messages[selectedChat._id] || [];
  }, [messages, selectedChat]);

  // ========================================
  // 이벤트 핸들러들 (useCallback)
  // ========================================

  /**
   * 사용자 선택 시 1:1 채팅방 생성 또는 기존 채팅방 열기
   */
  const handleSelectChat = useCallback(
    async (selectedUsername) => {
      console.log(
        "%c[useChat] 2. handleSelectChat 실행됨. 선택된 항목:",
        "color: orange; font-weight: bold;",
        selectedUsername
      );

      if (!currentUser || !selectedUsername) return;

      let chatRoomToSelect = null;

      // Case 1: 조직도에서 사용자를 선택한 경우 (selection은 username 문자열)
      if (typeof selectedUsername === "string") {
        const participants = [currentUser.username, selectedUsername];
        try {
          const response = await fetch(`${API_BASE_URL}/api/chat/room`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participants,
              createdBy: currentUser.username,
            }),
          });
          const chatRoom = await response.json();
          if (!response.ok)
            throw new Error(
              chatRoom.message || "채팅방 정보를 가져올 수 없습니다."
            );
          chatRoomToSelect = chatRoom;
        } catch (error) {
          console.error("1:1 채팅방 정보를 가져오는 데 실패했습니다.", error);
          alert(error.message);
          return;
        }
      }
      // Case 2: 채팅 목록에서 기존 채팅방을 선택한 경우 (selection은 room 객체)
      else if (typeof selectedUsername === "object" && selectedUsername._id) {
        console.log(
          "[useChat] DEBUG: '_id'를 가진 'object' 타입으로 처리합니다 (채팅방 선택)."
        );
        chatRoomToSelect = selectedUsername;
      } else {
        // --- [추가 디버깅 로그] ---
        // 위 두 조건에 모두 해당하지 않을 경우, 어떤 데이터가 들어왔는지 확인합니다.
        console.error(
          "[useChat] DEBUG: selection이 예상된 타입(string 또는 _id를 가진 객체)이 아닙니다.",
          {
            type: typeof selectedUsername,
            has_id_property: selectedUsername ? selectedUsername._id : "N/A",
            selection_value: selectedUsername,
          }
        );
      }

      // 선택된 채팅방이 결정되면, 상태를 업데이트하고 메시지 기록을 요청합니다.
      if (chatRoomToSelect) {
        console.log(
          "%c[useChat] 3. 상태를 변경할 채팅방:",
          "color: orange; font-weight: bold;",
          chatRoomToSelect
        );

        setSelectedChat(chatRoomToSelect);
        // setIsTyping(false); // 필요 시 타이핑 상태 초기화

        if (socket) {
          socket.emit("get_chat_history", { chatRoomId: chatRoomToSelect._id });
        }

        // 해당 채팅방의 안 읽은 메시지 카운트 초기화
        setUnreadMessages((prev) => {
          const newUnread = { ...prev };
          delete newUnread[chatRoomToSelect._id];
          return newUnread;
        });
      }
    },
    [currentUser, socket, setSelectedChat]
  );

  /**
   * 메시지 전송 처리
   */
  const sendMessage = useCallback(() => {
    if (!socket || !newMessage.trim() || !selectedChat || !currentUser) {
      return;
    }

    // 서버로 전송할 메시지 데이터 구성
    const messageData = {
      sender: currentUser.username,
      senderFullName: currentUser.fullName,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      chatRoomId: selectedChat._id,
    };

    // UI에 즉시 반영할 임시 메시지 생성
    const temporaryMessage = {
      ...messageData,
      _id: `local-${Date.now()}`,
      content: messageData.message,
    };

    // 로컬 상태에 임시 메시지 추가
    setMessages((prev) => ({
      ...prev,
      [selectedChat._id]: [...(prev[selectedChat._id] || []), temporaryMessage],
    }));

    // 서버로 메시지 전송
    socket.emit("send_message", messageData);

    // 입력창 초기화
    setNewMessage("");

    // 타이핑 상태 정리
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [currentUser, selectedChat, newMessage, socket]);

  /**
   * 타이핑 상태 처리
   * 사용자가 입력을 시작할 때 상대방에게 타이핑 중임을 알림
   */
  const handleTyping = useCallback(() => {
    if (!socket || !currentUser || !selectedChat) return;

    // 타이핑 시작 신호 전송
    socket.emit("typing_start", {
      sender: currentUser.username,
      chatRoomId: selectedChat._id,
    });

    // 기존 타이머 정리
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 2초 후 타이핑 중단 신호 전송
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", {
        sender: currentUser.username,
        chatRoomId: selectedChat._id,
      });
    }, 2000);
  }, [currentUser, selectedChat, socket]);

  /**
   * 채팅방에서 사용자 목록으로 돌아가기
   */
  const handleBackToUserList = useCallback(() => {
    setSelectedChat(null);
    setIsTyping(false);
  }, [setSelectedChat]);

  /**
   * 그룹 채팅용 사용자 선택/해제 토글
   */
  const toggleUserForGroupChat = useCallback((user) => {
    setSelectedUsersForGroupChat((prev) => {
      const isSelected = prev.some(
        (selectedUser) => selectedUser.username === user.username
      );

      if (isSelected) {
        return prev.filter(
          (selectedUser) => selectedUser.username !== user.username
        );
      } else {
        return [...prev, user];
      }
    });
  }, []);

  /**
   * 그룹 채팅 선택 목록 초기화
   */
  const resetGroupChatSelection = useCallback(() => {
    setSelectedUsersForGroupChat([]);
  }, []);

  /**
   * 그룹 채팅 생성 및 시작
   */
  const startGroupChat = useCallback(async () => {
    if (selectedUsersForGroupChat.length < 2) {
      alert("그룹 채팅을 만들려면 2명 이상을 선택해야 합니다.");
      return;
    }

    const participantUsernames = [
      currentUser.username,
      ...selectedUsersForGroupChat.map((user) => user.username),
    ];

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants: participantUsernames,
          createdBy: currentUser.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "그룹 채팅방 생성에 실패했습니다."
        );
      }

      const newGroupChatRoom = await response.json();

      // 새로 생성된 그룹 채팅방으로 전환
      setSelectedChat(newGroupChatRoom);
      setIsGroupChatModalOpen(false);
      resetGroupChatSelection();
    } catch (error) {
      console.error("그룹 채팅방 생성 실패:", error);
      alert(error.message);
    }
  }, [
    currentUser,
    selectedUsersForGroupChat,
    setSelectedChat,
    resetGroupChatSelection,
  ]);

  // ========================================
  // 반환값
  // ========================================

  return {
    // 상태값들
    messages,
    unreadMessages,
    isTyping,
    newMessage,
    setNewMessage,

    // 계산된 데이터
    chatRooms,
    partnerDetails,
    currentMessages,
    chatRoomName,

    // 참조 객체
    messagesEndRef,

    // 이벤트 핸들러들
    handleSelectChat,
    sendMessage,
    handleTyping,
    handleBackToUserList,

    // 그룹 채팅 관련
    isGroupChatModalOpen,
    setIsGroupChatModalOpen,
    selectedUsersForGroupChat,
    toggleUserForGroupChat,
    startGroupChat,
    resetGroupChatSelection,
  };
};
