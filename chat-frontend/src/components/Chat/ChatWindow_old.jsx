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
  if (!selectedUser) {
    // 채팅 상대가 선택되지 않았을 때의 UI (변경 없음)
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MessageCircle className="mx-auto h-16 w-16 mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">채팅을 시작하세요</h3>
          <p>왼쪽에서 채팅하고 싶은 사용자를 선택하세요</p>
        </div>
      </div>
    );
  }

  // --- 👇 여기가 핵심 수정 사항입니다 ---
  // 채팅 상대가 선택되었을 때의 UI
  return (
    // 1. 이 최상위 div가 세로 Flexbox 컨테이너 역할을 하여,
    //    자식들을 (헤더, 메시지목록, 입력창) 수직으로 배치합니다.
    <div className="flex-1 flex flex-col w-full">
      {/* 1-A. 채팅 헤더 (자연스러운 높이를 가짐) */}
      <div className="bg-white shadow-sm p-4 border-b flex items-center gap-2">
        <button
          onClick={onBack}
          className="md:hidden p-1 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {partnerDetails?.fullName || selectedUser}와의 채팅
          </h2>
          <p
            className={`text-sm text-gray-500 animate-pulse ${
              isTyping ? "visible" : "invisible"
            }`}
          >
            입력 중...
          </p>
        </div>
      </div>

      {/* 2. 이 div가 핵심입니다. 남는 공간을 모두 차지하고(flex-1), 내용이 넘치면 스스로 스크롤됩니다. */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.map((message) => (
          <div
            key={message.id || message._id}
            className={`flex ${
              message.sender === currentUser.username
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === currentUser.username
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <p className="text-sm">{message.content}</p>

              <div className="flex items-center justify-end mt-1 text-xs">
                {/* 내가 보낸 메시지이고, 상대방이 읽었을 때만 '읽음' 표시 */}
                {message.sender === currentUser.username && message.isRead && (
                  <span className="mr-2 text-blue-200">읽음</span>
                )}

                {/* 시간을 표시하는 p 태그 */}
                <p
                  className={`${
                    message.sender === currentUser.username
                      ? "text-blue-100"
                      : "text-gray-500"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 1-C. 메시지 입력창 (자연스러운 높이를 가짐) */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
