// src/components/Chat/ChatWindow.jsx
import React from "react";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";

const ChatWindow = ({
  selectedUser,
  partnerDetails,
  isTyping,
  currentMessages,
  messagesEndRef,
  newMessage,
  setNewMessage,
  handleTyping,
  sendMessage,
  currentUser,
  onBack,
}) => {
  // 채팅 상대가 선택되지 않았을 때 (데스크톱 기본 화면)
  if (!selectedUser) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center p-4 bg-gray-50">
        <div className="text-center text-gray-400">
          <MessageCircle className="mx-auto h-16 w-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">채팅을 시작하세요</h3>
          <p>왼쪽에서 대화하고 싶은 상대를 선택하세요</p>
        </div>
      </div>
    );
  }

  // 채팅 상대가 선택되었을 때의 UI
  return (
    <div className="flex-1 flex flex-col w-full bg-white">
      {/* 채팅 헤더 */}
      <div className="bg-white shadow-sm p-3 md:p-4 border-b flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden p-1 rounded-full hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-800">
            {partnerDetails?.fullName || selectedUser}
            <span className="text-xs text-gray-500 ml-2">
              ({partnerDetails?.company?.name} /{" "}
              {partnerDetails?.businessSite?.name} /{" "}
              {partnerDetails?.department?.name} /{" "}
              {partnerDetails?.position?.name})
            </span>
          </h2>
          <p
            className={`text-sm text-gray-500 h-5 leading-5 animate-pulse ${
              isTyping ? "visible" : "invisible"
            }`}
          >
            입력 중...
          </p>
        </div>
      </div>

      {/* 메시지 목록 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {currentMessages.map((message) => (
          <div
            key={message.id || message._id}
            className={`flex items-end gap-2 ${
              message.sender === currentUser.username
                ? "justify-end"
                : "justify-start"
            }`}
          >
            {/* 내가 보낸 메시지일 경우, 시간과 읽음 표시가 먼저 나옴 */}
            {message.sender === currentUser.username && (
              <div className="flex items-center text-xs text-gray-400 mb-1">
                {message.isRead && <span className="mr-1">읽음</span>}
                <span>
                  {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            <div
              className={`max-w-[70%] md:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                message.sender === currentUser.username
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              <p className="text-sm break-words">{message.content}</p>
            </div>
            {/* 상대가 보낸 메시지일 경우, 시간 표시가 나중에 나옴 */}
            {message.sender !== currentUser.username && (
              <div className="text-xs text-gray-400 mb-1">
                <span>
                  {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <div className="bg-white border-t p-2 md:p-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
