import React, { useState, useEffect } from "react";

import LoginScreen from "./components/Auth/LoginScreen";
import Sidebar from "./components/Layout/Sidebar";
import ChatWindow from "./components/Chat/ChatWindow";
import { useSocket } from "./hooks/useSocket";
import { useAuth } from "./hooks/useAuth";
import { useChat } from "./hooks/useChat";
import { useUsers } from "./hooks/useUsers";
import { useNotifications } from "./hooks/useNotifications";

function App() {
  // 인증 관련 상태
  const [isLoginView, setIsLoginView] = useState(true);

  // 채팅 관련 상태
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarView, setSidebarView] = useState("org");

  // 커스텀 훅들
  const { currentUser, handleLogin, handleSignup, handleLogout } = useAuth();
  const { allUsers, organizedUsers } = useUsers(currentUser);
  const { socket, onlineUsers } = useSocket(currentUser);
  const {
    unreadMessages,
    isTyping,
    chatRooms,
    currentMessages,
    selectedUserDetails,
    messagesEndRef,
    newMessage,
    setNewMessage,
    handleUserSelect,
    sendMessage,
    handleTyping,
    handleBackToUserList,
  } = useChat(currentUser, selectedUser, setSelectedUser, allUsers, socket);

  // 알림 관련
  useNotifications(socket, allUsers, handleUserSelect);

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = () => setSelectedUser(null);
    if (selectedUser) {
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handlePopState);
    }
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedUser]);

  if (!currentUser) {
    return (
      <LoginScreen
        handleLogin={handleLogin}
        handleSignup={handleSignup}
        isLoginView={isLoginView}
        setIsLoginView={setIsLoginView}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      <div
        className={`${
          selectedUser ? "hidden" : "flex"
        } w-full md:flex md:w-1/4 lg:w-1/5`}
      >
        <Sidebar
          currentUser={currentUser}
          handleLogout={handleLogout}
          organizedUsers={organizedUsers}
          chatRooms={chatRooms}
          sidebarView={sidebarView}
          setSidebarView={setSidebarView}
          handleUserSelect={handleUserSelect}
          selectedUser={selectedUser}
          onlineUsers={onlineUsers}
          unreadMessages={unreadMessages}
        />
      </div>
      <div
        className={`${
          selectedUser ? "flex" : "hidden"
        } w-full md:flex md:flex-1`}
      >
        {selectedUser && (
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
        )}
      </div>
    </div>
  );
}

export default App;
