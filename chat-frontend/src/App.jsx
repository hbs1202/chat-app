// src/App.jsx

// 역할: 애플리케이션의 최상위 컴포넌트로서, 전체적인 렌더링 흐름을 제어합니다.
// 동작 방식: currentUser 상태가 유효한 객체인지 명확히 확인하여
//           로그인 화면 또는 메인 채팅 화면을 렌더링합니다.

// --- 기존 주석 ---
// ...

// --- 수정된 내용 ---
// 변경 사항 (렌더링 조건 강화):
// - 기존 `if (!currentUser)` 조건만으로는 localStorage에 빈 객체 '{}'가 저장된 경우
//   로그인된 것으로 잘못 판단하여 흰 화면이 나올 수 있습니다.
// - `if (!currentUser || !currentUser.username)`으로 조건을 변경하여,
//   currentUser 객체가 존재하더라도 필수 속성인 `username`이 없으면
//   로그인 화면을 표시하도록 수정했습니다. 이것이 흰 화면 문제를 근본적으로 방지합니다.

import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

// 컴포넌트 import
import LoginScreen from "./components/Auth/LoginScreen";
import Sidebar from "./components/Layout/Sidebar";
import ChatWindow from "./components/Chat/ChatWindow";
import AddGroupChatModal from "./components/Modals/AddGroupChatModal";

// 커스텀 훅 import
import { useSocket } from "./hooks/useSocket";
import { useAuth } from "./hooks/useAuth";
import { useChat } from "./hooks/useChat";
import { useUsers } from "./hooks/useUsers";
import { useNotifications } from "./hooks/useNotifications";

function App() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [sidebarView, setSidebarView] = useState("org");

  const { currentUser, handleLogin, handleSignup, handleLogout } = useAuth();

  const {
    allUsers,
    organizedUsers,
    loading: usersLoading,
    error: usersError,
  } = useUsers(currentUser);
  const { socket, onlineUsers } = useSocket(currentUser);

  const {
    chatRooms,
    handleSelectChat,
    chatRoomName,
    unreadMessages,
    isTyping,
    currentMessages,
    partnerDetails,
    messagesEndRef,
    newMessage,
    setNewMessage,
    handleUserSelect,
    sendMessage,
    handleTyping,
    handleBackToUserList,
    isGroupChatModalOpen,
    setIsGroupChatModalOpen,
    selectedUsersForGroupChat,
    toggleUserForGroupChat,
    startGroupChat,
    resetGroupChatSelection,
  } = useChat(currentUser, selectedChat, setSelectedChat, allUsers, socket);

  console.log(
    "%c[App.jsx] 1. 컴포넌트 렌더링. 현재 selectedChat:",
    "color: green; font-weight: bold;",
    selectedChat
  );

  useNotifications(socket, allUsers, handleUserSelect);

  useEffect(() => {
    const handlePopState = () => setSelectedChat(null);
    if (selectedChat) {
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handlePopState);
    }
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedChat]);

  // --- 렌더링 조건 수정 ---
  // currentUser가 없거나, 있더라도 username이 없는 비정상적인 데이터일 경우 로그인 화면을 보여줍니다.
  if (!currentUser || !currentUser.username) {
    return (
      <LoginScreen
        handleLogin={handleLogin}
        handleSignup={handleSignup}
        isLoginView={isLoginView}
        setIsLoginView={setIsLoginView}
      />
    );
  }

  if (allUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center text-gray-500">
          <p>데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인된 경우: 메인 채팅 UI 표시
  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      <div
        className={`${
          selectedChat ? "hidden md:flex" : "flex"
        } w-full md:w-1/4 lg:w-1/5 flex-col bg-white`}
      >
        <Sidebar
          currentUser={currentUser}
          handleLogout={handleLogout}
          organizedUsers={organizedUsers}
          chatRooms={chatRooms}
          sidebarView={sidebarView}
          setSidebarView={setSidebarView}
          handleSelectChat={handleSelectChat}
          selectedChat={selectedChat}
          onlineUsers={onlineUsers}
          unreadMessages={unreadMessages}
          setIsGroupChatModalOpen={setIsGroupChatModalOpen}
        />
      </div>

      <div
        className={`${
          selectedChat ? "flex" : "hidden md:flex"
        } w-full md:flex-1 flex-col`}
      >
        {selectedChat ? (
          <ChatWindow
            partnerDetails={partnerDetails}
            onBack={handleBackToUserList}
            selectedChat={selectedChat}
            chatRoomName={chatRoomName}
            isTyping={isTyping}
            currentMessages={currentMessages}
            messagesEndRef={messagesEndRef}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleTyping={handleTyping}
            sendMessage={sendMessage}
            currentUser={currentUser}
            setIsGroupChatModalOpen={setIsGroupChatModalOpen}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center p-4 bg-gray-50">
            <div className="text-center text-gray-400">
              <MessageCircle className="mx-auto h-16 w-16 mb-4" />
              <h3 className="text-lg font-medium mb-2">채팅을 시작하세요</h3>
              <p>왼쪽에서 대화하고 싶은 상대를 선택하세요.</p>
            </div>
          </div>
        )}
      </div>

      {isGroupChatModalOpen && (
        <AddGroupChatModal
          isOpen={isGroupChatModalOpen}
          onClose={() => {
            setIsGroupChatModalOpen(false);
            resetGroupChatSelection();
          }}
          allUsers={allUsers}
          currentUser={currentUser}
          selectedUsersForGroupChat={selectedUsersForGroupChat}
          toggleUserForGroupChat={toggleUserForGroupChat}
          startGroupChat={startGroupChat}
        />
      )}
    </div>
  );
}

export default App;
