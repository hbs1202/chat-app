// App.jsx
import { Users, Send, LogOut, MessageCircle, ArrowLeft } from "lucide-react";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";

// 분리된 UI 컴포넌트들을 불러옵니다.
import LoginScreen from "./components/Auth/LoginScreen";
import Sidebar from "./components/Layout/Sidebar";
import ChatWindow from "./components/Chat/ChatWindow";

function App() {
  // --------------------------------------------------
  // 1. 모든 상태(State)와 참조(Ref)는 App.jsx에서 중앙 관리합니다.
  // --------------------------------------------------
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [loginName, setLoginName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [isLoginView, setIsLoginView] = useState(true); // 1. 화면 전환용 상태 추가

  // 리스너 내부에서 최신 상태를 참조하기 위한 Ref
  const currentUserRef = useRef(currentUser);
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // --- 👇 여기에 조직도 데이터 가공 로직을 추가합니다. 👇 ---

  const organizedUsers = useMemo(() => {
    // 최종 목표 데이터 구조: { "회사명": { "사업장명": { "부서명": [사용자...] } } }
    // currentUser가 아직 없으면(로그인 전) 빈 객체를 반환합니다.
    if (!currentUser) return {};

    // --- 👇 여기가 핵심 수정 사항입니다 👇 ---
    // 1. 전체 사용자 목록에서 현재 로그인한 사용자를 먼저 제외합니다.
    const otherUsers = allUsers.filter(
      (user) => user.username !== currentUser.username
    );
    // --- 👆 여기까지 수정 👆 ---

    const grouped = {};

    // 2. 자신을 제외한 'otherUsers' 배열을 순회하며 그룹화합니다.
    otherUsers.forEach((user) => {
      const companyName = user.company?.name || "소속 회사 없음";
      const siteName = user.businessSite?.name || "소속 사업장 없음";
      const deptName = user.department?.name || "미지정 부서";

      // 1단계: 회사 레벨
      if (!grouped[companyName]) {
        grouped[companyName] = {};
      }
      // 2단계: 사업장 레벨
      if (!grouped[companyName][siteName]) {
        grouped[companyName][siteName] = {};
      }
      // 3단계: 부서 레벨
      if (!grouped[companyName][siteName][deptName]) {
        grouped[companyName][siteName][deptName] = [];
      }

      grouped[companyName][siteName][deptName].push(user);
    });
    return grouped;
  }, [allUsers, currentUser]); // allUsers 배열이 변경될 때만 이 함수를 다시 실행

  // --------------------------------------------------
  // 2. 모든 데이터 통신 로직(useEffect)은 App.jsx에 위치합니다.
  // --------------------------------------------------

  // 소켓 연결 및 모든 이벤트 리스너 통합 관리
  useEffect(() => {
    const newSocket = io("http://192.168.0.3:3001");
    socketRef.current = newSocket;

    // --- 👇👇 'online_users_update' 리스너 내부에 로그를 추가합니다. 👇👇 ---
    newSocket.on("online_users_update", (users) => {
      console.log(
        "--- ✅ [Frontend] Received 'online_users_update'. Online users:",
        users
      );
      setOnlineUsers(users);
    });

    newSocket.on("initial_unread_counts", (unreadSummary) => {
      // --- 👇 여기에 디버깅용 로그를 추가합니다. 👇 ---
      console.log(
        "--- ✅ [Frontend] 'initial_unread_counts' 이벤트를 받았습니다. 데이터:",
        unreadSummary
      );
      setUnreadMessages(unreadSummary);
    });

    const messageListener = (message) => {
      const me = currentUserRef.current;
      const sel = selectedUserRef.current;
      if (!me) return;

      const chatId = getChatId(message.sender, me);
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), message],
      }));

      if (message.sender !== sel) {
        setUnreadMessages((prev) => ({
          ...prev,
          [message.sender]: (prev[message.sender] || 0) + 1,
        }));
      }
    };

    const historyListener = (history) => {
      console.log("✅ [App.jsx] 'chat_history' 이벤트를 받았습니다!", history);

      const me = currentUserRef.current;
      const sel = selectedUserRef.current;

      console.log("현재 사용자(me):", me?.username);
      console.log("선택된 사용자(sel):", sel);

      if (!me || !sel || !history) return;

      const chatId = getChatId(me.username, sel);
      console.log(`생성된 Chat ID: ${chatId}`);

      setMessages((prev) => ({ ...prev, [chatId]: history }));
    };

    const typingListener = ({ sender }) => {
      if (sender === selectedUserRef.current) setIsTyping(true);
    };

    const stopTypingListener = ({ sender }) => {
      if (sender === selectedUserRef.current) setIsTyping(false);
    };

    const messagesReadListener = ({ readerUsername }) => {
      const me = currentUserRef.current;
      const chatId = getChatId(me.username, readerUsername);

      setMessages((prev) => {
        const chatMessages = prev[chatId] || [];
        // 해당 채팅방의 모든 메시지를 순회하며, 내가 보낸 메시지들의 isRead를 true로 변경
        const updatedMessages = chatMessages.map((msg) => {
          if (msg.sender === me.username) {
            return { ...msg, isRead: true };
          }
          return msg;
        });
        return { ...prev, [chatId]: updatedMessages };
      });
    };

    newSocket.on("receive_message", messageListener);
    newSocket.on("chat_history", historyListener);
    newSocket.on("user_typing", typingListener);
    newSocket.on("user_stopped_typing", stopTypingListener);
    newSocket.on("messages_read", messagesReadListener);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 자동 스크롤 Effect
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

  // 브라우저/모바일 뒤로가기 버튼 제어
  useEffect(() => {
    // 뒤로가기 이벤트가 발생했을 때 실행될 함수
    const handlePopState = () => {
      // 앱 내 뒤로가기 동작 실행 (사용자 목록으로 돌아가기)
      setSelectedUser(null);
    };

    // 사용자가 채팅방에 들어갔을 때(selectedUser 값이 있을 때)
    if (selectedUser) {
      // 1. 브라우저 히스토리 스택에 현재 상태를 하나 더 추가합니다.
      //    이렇게 해서 '뒤로 갈 곳'을 인위적으로 만듭니다.
      window.history.pushState(null, "", window.location.href);

      // 2. 뒤로가기 버튼 이벤트를 감지하는 리스너를 추가합니다.
      window.addEventListener("popstate", handlePopState);
    }

    // 3. 클린업 함수: selectedUser가 바뀌거나(null이 되거나) 컴포넌트가 사라질 때 리스너를 제거합니다.
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [selectedUser]); // selectedUser 상태가 바뀔 때마다 이 로직을 재실행합니다.

  // (선택 사항) 앱 종료 방지 확인 창
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // 표준에 따라 기본 동작을 막기 위해 호출
      event.preventDefault();
      // Chrome에서는 returnValue를 설정해야 확인 창이 뜸
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []); // 앱이 실행되는 동안 항상 활성화

  // 현재 채팅방의 메시지를 '읽음'으로 처리하는 Effect
  useEffect(() => {
    const socket = socketRef.current;
    // 채팅 상대가 선택되었고, 메시지 목록이 있으며, 소켓이 연결된 경우에만 실행
    if (selectedUser && currentMessages.length > 0 && socket) {
      // 현재 메시지 목록에서 상대방이 보낸 안 읽은 메시지가 있는지 확인
      const hasUnreadMessages = currentMessages.some(
        (msg) => msg.sender === selectedUser && !msg.isRead
      );

      if (hasUnreadMessages) {
        // 서버에 '읽음' 처리 요청을 보냄
        socket.emit("mark_as_read", {
          readerUsername: currentUser.username, // 읽은 사람: 나
          senderUsername: selectedUser, // 보낸 사람: 상대방
        });
      }
    }
  }, [currentMessages, selectedUser, currentUser, socketRef]); // currentMessages가 바뀔 때마다 실행

  // --------------------------------------------------
  // 3. 모든 핸들러 함수와 유틸리티 함수는 App.jsx에 위치합니다.
  // --------------------------------------------------
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSignup = async (signupData) => {
    try {
      const response = await fetch("http://192.168.0.3:3001/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "회원가입에 실패했습니다.");
      }

      alert("회원가입 성공! 이제 로그인해주세요.");
      setIsLoginView(true); // 회원가입 성공 후 로그인 화면으로 전환
    } catch (error) {
      console.error("회원가입 오류:", error);
      alert(error.message);
    }
  };

  const handleLogin = async (loginData) => {
    const { username, password } = loginData; // LoginScreen으로부터 username과 password를 받음
    try {
      // 1. 백엔드 로그인 API 호출
      const response = await fetch("http://192.168.0.3:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }

      // 2. 성공 시 받은 토큰(JWT)과 사용자 정보를 브라우저에 저장
      // localStorage는 브라우저를 껐다 켜도 데이터가 유지되는 저장 공간입니다.
      localStorage.setItem("chat-token", data.token);
      localStorage.setItem("chat-user", JSON.stringify(data.user));

      // 3. 앱의 상태를 로그인 상태로 변경
      // setCurrentUser(data.user.username); // 이전: 사용자 이름(문자열) 저장
      setCurrentUser(data.user); // 수정: 사용자 객체 전체를 저장

      // 4. 소켓 서버에 로그인 이벤트 전송 (온라인 상태 표시용)
      const socket = socketRef.current;
      if (socket) {
        socket.emit("login", data.user.username);
      }

      // 5. 자신을 제외한 전체 사용자 목록을 DB에서 다시 불러오기
      const usersResponse = await fetch("http://192.168.0.3:3001/api/users");
      const allUsersData = await usersResponse.json();
      // const otherUsers = allUsersData.filter(
      //   (u) => u.username !== data.user.username
      // );
      setAllUsers(allUsersData);

      //setUsers(otherUsers);
    } catch (error) {
      console.error("로그인 오류:", error);
      alert(error.message); // 서버가 보낸 오류 메시지를 사용자에게 보여줌
    }
  };

  const handleLogout = () => {
    // 실제 앱에서는 서버에 로그아웃 이벤트를 보내 onlineUsers를 갱신해야 합니다.
    setCurrentUser(null);
    setSelectedUser(null);
  };

  const handleUserSelect = (selectedUsername) => {
    const socket = socketRef.current;
    if (!socket) return;

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
  };

  const handleTyping = () => {
    const socket = socketRef.current;
    if (!socket || !currentUser || !selectedUser) return;
    socket.emit("typing_start", {
      sender: currentUser,
      receiver: selectedUser,
    });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.emit("typing_stop", {
          sender: currentUser,
          receiver: selectedUser,
        });
      }
    }, 2000);
  };

  const sendMessage = () => {
    const socket = socketRef.current;
    if (!socket || !newMessage.trim() || !selectedUser) return;

    // --- 👇 여기가 핵심 수정 사항입니다 👇 ---
    const message = {
      id: `local-${Date.now()}`,
      sender: currentUser.username, // 객체 대신 username 문자열 사용
      receiver: selectedUser,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // chatId를 만들 때도 username 문자열을 사용
    const chatId = getChatId(currentUser.username, selectedUser);
    // --- 👆 여기까지 수정 👆 ---

    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message],
    }));

    socket.emit("send_message", message);
    setNewMessage("");
  };

  const getChatId = (user1, user2) => {
    if (!user1 || !user2) return "";
    return [user1, user2].sort().join("-");
  };

  // --- 👇 여기가 핵심 수정 사항입니다 👇 ---

  // 2. 선택된 사용자의 상세 정보 (전체 목록에서 찾기)
  const selectedUserDetails = allUsers.find((u) => u.username === selectedUser);

  const currentMessages = useMemo(() => {
    // currentUser나 selectedUser가 없으면 빈 배열 반환
    if (!currentUser || !selectedUser) {
      return [];
    }
    // chatId를 계산하고, 해당하는 메시지 목록을 반환
    const chatId = getChatId(currentUser.username, selectedUser);
    return messages[chatId] || [];
  }, [messages, currentUser, selectedUser]); // messages, currentUser, selectedUser가 바뀔 때만 재계산

  // 뒤로가기 버튼을 위한 핸들러 함수 추가
  const handleBackToUserList = () => {
    setSelectedUser(null);
  };

  // --------------------------------------------------
  // 4. 렌더링(JSX) 부분은 분리된 컴포넌트들을 조립하고 props를 전달하는 역할만 합니다.
  // --------------------------------------------------
  // users 배열에서 현재 선택된 사용자(selectedUser)의 전체 정보를 찾습니다.
  if (!currentUser) {
    return (
      <LoginScreen
        partnerDetails={selectedUserDetails}
        loginName={loginName}
        setLoginName={setLoginName}
        setIsLoginView={setIsLoginView}
        isLoginView={isLoginView}
        handleLogin={handleLogin}
        handleSignup={handleSignup}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      <div
        className={`
        ${selectedUser ? "hidden" : "flex"} 
        w-full md:flex md:w-1/4
      `}
      >
        <Sidebar
          currentUser={currentUser}
          handleLogout={handleLogout}
          //users={sidebarUsers}
          organizedUsers={organizedUsers}
          handleUserSelect={handleUserSelect}
          selectedUser={selectedUser}
          onlineUsers={onlineUsers}
          unreadMessages={unreadMessages}
        />
      </div>
      {/* 채팅창 영역 */}
      <div
        className={`
        ${selectedUser ? "flex" : "hidden"} 
        w-full md:flex md:flex-1
      `}
      >
        <ChatWindow
          partnerDetails={selectedUserDetails}
          onBack={handleBackToUserList}
          selectedUser={selectedUser}
          isTyping={isTyping}
          currentMessages={currentMessages}
          messagesEndRef={messagesEndRef}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleTyping={handleTyping}
          sendMessage={sendMessage}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}

export default App;
