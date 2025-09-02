// chat-frontend/src/hooks/useChat.js

// 역할: 1:1 채팅 및 그룹 채팅과 관련된 모든 상태와 로직을 중앙에서 관리하는 커스텀 훅입니다.
// 동작 방식:
// - 모든 대화를 '채팅방(ChatRoom)' 개념으로 통일하여 관리합니다.
// - 사용자를 선택하면 백엔드 API(/api/chat/room)를 호출하여 기존 채팅방을 찾거나 새로 생성합니다.
// - 선택된 채팅 상대를 단순 username이 아닌, 참여자 정보가 담긴 '채팅방 객체'로 관리합니다.
// - 메시지를 전송할 때 항상 채팅방의 고유 ID(chatRoomId)를 포함하여 1:1 채팅과 그룹 채팅을 명확히 구분합니다.
// - 백엔드의 Message 모델과 데이터 형식을 일치시켜 유효성 검사 오류를 방지합니다.

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { API_BASE_URL } from "../constants/config"; // API 기본 URL

export const useChat = (
  currentUser,
  selectedChat, // selectedUser -> selectedChat으로 이름 변경 (채팅방 객체를 다룸)
  setSelectedChat, // setSelectedUser -> setSelectedChat으로 이름 변경
  allUsers,
  socket
) => {
  // --- 상태 관리 ---
  const [messages, setMessages] = useState({}); // { chatRoomId: [message1, message2], ... }
  const [unreadMessages, setUnreadMessages] = useState({});
  const [chatRoomList, setChatRoomList] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // 그룹 채팅 모달 관련 상태
  const [isGroupChatModalOpen, setIsGroupChatModalOpen] = useState(false);
  const [selectedUsersForGroupChat, setSelectedUsersForGroupChat] = useState(
    []
  );

  // --- 참조(Refs) 관리 ---
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserRef = useRef(currentUser);
  const selectedChatRef = useRef(selectedChat);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // 최신 상태를 참조하기 위한 Ref 업데이트
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return;

    // [핵심 디버깅 1] 초기 안 읽은 메시지 수를 서버로부터 받아 상태에 저장
    const initialUnreadListener = (unreadSummary) => {
      // --- [디버깅 로그 1] ---
      // 브라우저 콘솔에서 확인: 로그인 직후 서버로부터 받은 안 읽은 메시지 객체
      console.log(
        "%c[useChat] 1. 수신한 'initial_unread_counts':",
        "color: green; font-weight: bold;",
        unreadSummary
      );
      setUnreadMessages(unreadSummary);
    };
    socket.on("initial_unread_counts", initialUnreadListener);

    // ... (다른 리스너: messageListener, chat_room_list 등은 기존과 동일)

    return () => {
      socket.off("initial_unread_counts", initialUnreadListener);
      // ...
    };
  }, [socket]);

  // --- 데이터 가공 (useMemo) ---

  // --- [핵심] 사이드바에 표시될 채팅 목록 데이터 생성 ---
  const chatRooms = useMemo(() => {
    console.log(
      "%c[useChat] 2. chatRooms 계산 시작. 현재 unreadMessages 상태:",
      "color: blue;",
      unreadMessages
    );

    if (!currentUser || chatRoomList.length === 0) return [];

    return (
      chatRoomList
        .map((room) => {
          const messagesInRoom = messages[room._id] || [];
          const lastMessageObj = messagesInRoom[messagesInRoom.length - 1];
          const lastMessage = lastMessageObj
            ? lastMessageObj.content || lastMessageObj.message
            : "대화를 시작해보세요.";

          let displayName;
          let partnerUsername; // 1:1 채팅에서 상대방을 식별하기 위함

          if (room.isGroup) {
            // 그룹 채팅: 참여자 이름들을 콤마로 연결
            displayName = room.participants
              .filter((p) => p !== currentUser.username)
              .map(
                (pUsername) =>
                  allUsers.find((u) => u.username === pUsername)?.fullName ||
                  pUsername
              )
              .join(", ");
          } else {
            // 1:1 채팅: 상대방 이름
            partnerUsername = room.participants.find(
              (p) => p !== currentUser.username
            );
            const partnerDetails = allUsers.find(
              (u) => u.username === partnerUsername
            );
            displayName = partnerDetails?.fullName || partnerUsername;
          }

          const unreadCount = unreadMessages[room._id] || 0;

          if (unreadCount > 0) {
            console.log(
              `%c[useChat] 3. '${displayName}'(${room._id}) 방의 unreadCount: ${unreadCount}`,
              "color: purple;"
            );
          }

          // 사이드바에서 사용할 최종 데이터 객체
          return {
            ...room, // _id, participants, isGroup 등 원본 데이터 포함
            displayName: displayName,
            partnerUsername: partnerUsername,
            lastMessage: lastMessage,
            unreadCount: unreadCount,
            lastMessageTimestamp: lastMessageObj?.timestamp,
          };
        })
        // 최신 메시지를 보낸 채팅방이 위로 오도록 정렬
        .sort(
          (a, b) =>
            new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
        )
    );
  }, [chatRoomList, messages, unreadMessages, currentUser, allUsers]);

  // 현재 채팅창의 상세 정보 (이름, 소속 등)
  const partnerDetails = useMemo(() => {
    if (!selectedChat || !currentUser) return null;

    const partnerUsername = selectedChat.participants.find(
      (p) => p !== currentUser.username
    );
    return allUsers.find((u) => u.username === partnerUsername);
  }, [selectedChat, currentUser, allUsers]);

  // 현재 열려있는 채팅방의 메시지 목록
  const currentMessages = useMemo(() => {
    if (!selectedChat) return [];
    // 이제 chatId는 백엔드에서 받은 채팅방의 _id를 사용합니다.
    return messages[selectedChat._id] || [];
  }, [messages, selectedChat]);

  // --- 로직 및 핸들러 (useCallback, useEffect) ---

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return;

    // 새 메시지 수신 리스너
    const messageListener = (messageFromServer) => {
      console.log(
        "[useChat] 서버로부터 수신한 'messageFromServer':",
        messageFromServer
      );

      const me = currentUserRef.current;
      if (!me) return;

      const chatRoomId = messageFromServer.chatRoom;

      if (!chatRoomId) return;

      // 1. 받은 메시지의 발신자가 나 자신인지 확인
      if (messageFromServer.sender === me.username) {
        if (selectedChatRef.current?._id !== chatRoomId) {
          setUnreadMessages((prev) => ({
            ...prev,
            [chatRoomId]: (prev[chatRoomId] || 0) + 1,
          }));
        }
        // 2. 나 자신일 경우: 메시지를 새로 추가하는 대신, 기존의 임시 메시지를 서버 데이터로 교체
        setMessages((prev) => {
          const existingMessages = prev[chatRoomId] || [];

          // 임시 메시지(ID가 'local-'로 시작)를 찾아 서버에서 온 실제 메시지로 교체
          const updatedMessages = existingMessages.map((localMsg) =>
            localMsg._id.startsWith("local-") &&
            localMsg.message === messageFromServer.message
              ? messageFromServer
              : localMsg
          );

          // 만약 교체할 임시 메시지를 못찾았다면(다른 브라우저에서 보낸 경우 등), 그냥 추가
          const alreadyExists = updatedMessages.some(
            (msg) => msg._id === messageFromServer._id
          );
          if (!alreadyExists) {
            updatedMessages.push(messageFromServer);
          }

          return { ...prev, [chatRoomId]: updatedMessages };
        });
      } else {
        // 3. 다른 사람이 보낸 메시지일 경우: 기존처럼 새 메시지로 추가
        setMessages((prev) => ({
          ...prev,
          [chatRoomId]: [...(prev[chatRoomId] || []), messageFromServer],
        }));

        // TODO: 안읽은 메시지 카운트 로직
      }
    };

    // --- [추가] 메시지 읽음 처리 리스너 ---
    const messagesReadListener = (data) => {
      console.log("[useChat] 'messages_read' 이벤트 수신:", data);

      const { chatRoomId } = data; // readerUsername 대신 chatRoomId를 직접 사용
      const me = currentUserRef.current;
      if (!me || !chatRoomId) return;

      setMessages((prev) => {
        const chatMessages = prev[chatRoomId] || [];
        const updatedMessages = chatMessages.map((msg) => {
          // 해당 채팅방에서 내가 보낸(sender가 나 자신) 메시지들의 isRead를 true로 변경
          if (msg.sender === me.username) {
            return { ...msg, isRead: true };
          }
          return msg;
        });
        return { ...prev, [chatRoomId]: updatedMessages };
      });
    };

    const handleChatRoomList = (roomsFromServer) => {
      console.log(
        "[useChat] 서버로부터 수신한 'chat_room_list':",
        roomsFromServer
      );
      setChatRoomList(roomsFromServer);
    };

    // 전체 메시지 기록 수신 (로그인 시)
    const allMessagesListener = (messagesByChat) => {
      // messagesByChat의 key는 이제 chatRoomId 입니다.
      setMessages(messagesByChat);
    };

    // --- [추가] 특정 채팅방의 기록 수신 리스너 ---
    const historyListener = (history) => {
      const currentChat = selectedChatRef.current;
      // 현재 선택된 채팅방이 있고, 서버로부터 기록을 받았을 때
      if (currentChat && Array.isArray(history)) {
        // messages 상태 객체에서 현재 채팅방 ID를 키로 사용하여 메시지 목록을 업데이트
        setMessages((prev) => ({
          ...prev,
          [currentChat._id]: history,
        }));
      }
    };

    const typingListener = (data) => {
      const currentChat = selectedChatRef.current;
      // 현재 보고있는 채팅방에서 발생한 이벤트인지 확인
      if (currentChat && currentChat._id === data.chatRoomId) {
        setIsTyping(true);
      }
    };

    const stopTypingListener = (data) => {
      const currentChat = selectedChatRef.current;
      if (currentChat && currentChat._id === data.chatRoomId) {
        setIsTyping(false);
      }
    };

    socket.on("receive_message", messageListener);
    socket.on("all_messages_history", allMessagesListener);

    socket.on("user_typing", typingListener);
    socket.on("user_stopped_typing", stopTypingListener);
    socket.on("chat_history", historyListener);
    socket.on("messages_read", messagesReadListener);
    socket.on("chat_room_list", handleChatRoomList);
    // ... (기타 타이핑, 읽음 처리 리스너)

    return () => {
      socket.off("receive_message", messageListener);
      socket.off("all_messages_history", allMessagesListener);

      socket.off("user_typing", typingListener);
      socket.off("user_stopped_typing", stopTypingListener);
      socket.off("chat_history", historyListener);
      socket.off("messages_read", messagesReadListener);
      socket.off("chat_room_list", handleChatRoomList);
      // ...
    };
  }, [socket]);

  // [추가] 채팅방에 들어갔을 때 메시지를 '읽음'으로 처리하는 로직
  useEffect(() => {
    if (!socket || !selectedChat || !currentUser) return;

    // 현재 채팅방의 메시지 목록
    const messagesInCurrentChat = messages[selectedChat._id] || [];

    // 상대방이 보낸 안 읽은 메시지가 있는지 확인
    const hasUnread = messagesInCurrentChat.some(
      (msg) => msg.sender !== currentUser.username && !msg.isRead
    );

    if (hasUnread) {
      // 1:1 채팅의 경우에만 상대방에게 읽음 알림을 보냄
      if (!selectedChat.isGroup) {
        const partnerUsername = selectedChat.participants.find(
          (p) => p !== currentUser.username
        );
        if (partnerUsername) {
          // 상대방이 있는 경우에만 실행
          socket.emit("mark_as_read", {
            readerUsername: currentUser.username,
            senderUsername: partnerUsername,
            chatRoomId: selectedChat._id,
          });
        }
      }
    }
  }, [selectedChat, messages, currentUser, socket]);

  // 메시지 목록 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // 1:1 채팅 시작 또는 기존 채팅방 열기 (조직도에서 사용자 클릭 시)
  const handleUserSelect = useCallback(
    async (selectedUsername) => {
      if (!currentUser || !selectedUsername) return;

      const participants = [currentUser.username, selectedUsername];

      try {
        // 백엔드에 채팅방 생성을 요청합니다.
        const response = await fetch(`${API_BASE_URL}/api/chat/room`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participants: participants,
            createdBy: currentUser.username,
          }),
        });
        const chatRoom = await response.json();

        if (!response.ok)
          throw new Error(
            chatRoom.message || "채팅방 정보를 가져올 수 없습니다."
          );

        // 상태를 새로운 채팅방 객체로 업데이트합니다.
        setSelectedChat(chatRoom);
        setIsTyping(false);

        if (socket) {
          // 서버에 해당 채팅방의 메시지 기록을 요청합니다.
          socket.emit("get_chat_history", { chatRoomId: chatRoom._id });
        }

        // 안 읽은 메시지 카운트 초기화
        setUnreadMessages((prev) => {
          const newUnread = { ...prev };
          delete newUnread[selectedUsername];
          return newUnread;
        });
      } catch (error) {
        console.error("1:1 채팅방 정보를 가져오는 데 실패했습니다.", error);
        alert(error.message);
      }
    },
    [currentUser, socket, setSelectedChat]
  );

  // 메시지 전송
  const sendMessage = useCallback(() => {
    if (!socket || !newMessage.trim() || !selectedChat || !currentUser) return;

    // 백엔드 Message 모델 스키마와 일치하도록 데이터 객체 구성
    const messageDataToSend = {
      sender: currentUser.username,
      senderFullName: currentUser.fullName, // `senderFullName` 필드 추가
      message: newMessage.trim(), // `message` 필드 사용
      timestamp: new Date().toISOString(),
      chatRoomId: selectedChat._id, // 1:1, 그룹 모두 chatRoomId를 보냄
    };

    // 로컬 UI에 즉시 반영하기 위한 객체 생성
    const chatId = selectedChat._id;
    const messageForLocalUI = {
      ...messageDataToSend,
      _id: `local-${Date.now()}`, // 임시 로컬 ID
      content: messageDataToSend.message, // UI 컴포넌트 호환성을 위해 content 필드 유지
    };

    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), messageForLocalUI],
    }));

    // 서버로 메시지 데이터 전송
    socket.emit("send_message", messageDataToSend);
    setNewMessage("");

    // ... (타이핑 중지 로직)
  }, [currentUser, selectedChat, newMessage, socket]);

  // 뒤로가기 (사용자 목록으로 돌아가기)
  const handleBackToUserList = useCallback(() => {
    setSelectedChat(null);
  }, [setSelectedChat]);

  // 타이핑 이벤트 처리 (기존 로직 유지)
  const handleTyping = useCallback(() => {
    if (!socket || !currentUser || !selectedChat) return;

    // 1. "입력 시작" 이벤트를 서버로 즉시 전송
    // (백엔드에서는 이 신호를 받아 상대방/참여자들에게 알려줍니다.)
    socket.emit("typing_start", {
      sender: currentUser.username,
      chatRoomId: selectedChat._id, // 채팅방 ID 기반으로 변경
    });

    // 2. 기존에 설정된 timeout이 있다면 초기화
    // (사용자가 계속 입력 중이므로 '입력 중단' 신호를 보내지 않음)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3. 새로운 timeout 설정
    // (2초 동안 추가 입력이 없으면 '입력 중단' 신호를 보냄)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", {
        sender: currentUser.username,
        chatRoomId: selectedChat._id, // 채팅방 ID 기반으로 변경
      });
    }, 2000); // 2초
  }, [currentUser, selectedChat, socket]);

  // 그룹 채팅 모달에서 사용자 선택/해제
  const toggleUserForGroupChat = useCallback((user) => {
    setSelectedUsersForGroupChat((prev) =>
      prev.some((u) => u.username === user.username)
        ? prev.filter((u) => u.username !== user.username)
        : [...prev, user]
    );
  }, []);

  // 그룹 채팅 선택 목록 초기화
  const resetGroupChatSelection = useCallback(() => {
    setSelectedUsersForGroupChat([]);
  }, []);

  // 그룹 채팅 시작 (모달에서 '채팅 시작' 버튼 클릭 시)
  const startGroupChat = useCallback(async () => {
    const participantUsernames = [
      currentUser.username,
      ...selectedUsersForGroupChat.map((u) => u.username),
    ];

    if (participantUsernames.length < 3) {
      alert("그룹 채팅을 만들려면 자신을 제외하고 2명 이상을 선택해야 합니다.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants: participantUsernames,
          createdBy: currentUser.username,
        }),
      });
      const newChatRoom = await response.json();

      if (!response.ok)
        throw new Error(newChatRoom.message || "채팅방 생성에 실패했습니다.");

      // 새로 생성된 그룹 채팅방으로 즉시 전환합니다.
      setSelectedChat(newChatRoom);
      setIsGroupChatModalOpen(false);
      resetGroupChatSelection();
    } catch (error) {
      console.error("그룹 채팅방 생성 오류:", error);
      alert(error.message);
    }
  }, [
    currentUser,
    selectedUsersForGroupChat,
    setSelectedChat,
    resetGroupChatSelection,
  ]);

  // 훅에서 반환하는 값들
  return {
    messages,
    unreadMessages,
    isTyping,
    chatRooms,
    partnerDetails,
    currentMessages,
    messagesEndRef,
    newMessage,
    setNewMessage,
    handleUserSelect, // 이름은 handleUserSelect로 유지하여 Sidebar와 호환
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
