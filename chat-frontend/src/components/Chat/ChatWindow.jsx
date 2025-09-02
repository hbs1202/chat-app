// src/components/Chat/ChatWindow.jsx

import React from "react";
import { Send, MessageCircle, ArrowLeft, Plus } from "lucide-react";

const ChatWindow = ({
  currentUser,
  selectedChat, // [추가] 렌더링의 기준이 될 선택된 채팅방 객체
  partnerDetails, // 1:1 채팅 시 상세 정보를 위해 사용
  chatRoomName, // [추가] 1:1, 그룹 모두의 채팅방 이름을 받음
  isTyping,
  currentMessages,
  messagesEndRef,
  newMessage,
  setNewMessage,
  handleTyping,
  sendMessage,
  onBack,
  setIsGroupChatModalOpen,
}) => {
  if (!selectedChat) {
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

  return (
    <div className="flex-1 flex flex-col w-full bg-white h-full">
      {/* 채팅 헤더 (고정) */}
      <div className="bg-white shadow-sm p-3 md:p-4 border-b flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1 rounded-full hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          {/* 1:1, 그룹 모두 chatRoomName prop을 사용하여 헤더 제목 표시 */}
          <h2 className="text-base md:text-lg font-semibold text-gray-800">
            {chatRoomName || "채팅"}
          </h2>
          {/* 1:1 채팅일 경우(partnerDetails가 null이 아닐 경우)에만 상세 정보 표시 */}
          {partnerDetails && (
            <span className="text-xs text-gray-500 ml-2">
              ({partnerDetails.company?.name} /{" "}
              {partnerDetails.businessSite?.name} /{" "}
              {partnerDetails.department?.name} /{" "}
              {partnerDetails.position?.name})
            </span>
          )}
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
            {/* 내 메시지일 경우: 읽음 표시 + 시간 -> 말풍선 */}
            {message.sender === currentUser.username && (
              <div className="flex items-center gap-2">
                {/* flex-col 추가 */}
                <div className="text-xs text-gray-400 self-end">
                  <span className="mr-1 text-blue-500 font-semibold">
                    {message.isRead ? "읽음" : ""}
                  </span>

                  <span>
                    {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {/* --- 메시지 버블 CSS 및 내용 필드 수정 --- */}
                <div
                  className={`w-fit max-w-[70%] md:max-w-md px-4 py-2 rounded-lg shadow-sm bg-blue-500 text-white rounded-br-none`}
                >
                  <p className="text-sm break-words">
                    {message.content || message.message}{" "}
                    {/* content 또는 message 필드를 사용 */}
                  </p>
                </div>
              </div>
            )}

            {/* 상대방 메시지일 경우: 말풍선 -> 시간 */}
            {message.sender !== currentUser.username && (
              <div className="flex items-center gap-2">
                {" "}
                {/* flex-col 추가 */}
                {/* 상대방 이름 표시 (옵션) */}
                {/* <p className="text-xs text-gray-600 mb-1">{message.senderFullName}</p> */}
                {/* --- 메시지 버블 CSS 및 내용 필드 수정 --- */}
                <div
                  className={`w-fit max-w-[70%] md:max-w-md px-4 py-2 rounded-lg shadow-sm bg-white text-gray-800 rounded-bl-none`}
                >
                  <p className="text-sm break-words">
                    {message.content || message.message}{" "}
                    {/* content 또는 message 필드를 사용 */}
                  </p>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력창 (고정) */}
      <div className="bg-white border-t p-2 md:p-4 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setIsGroupChatModalOpen(true)}
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
            title="대화 상대 추가"
          >
            <Plus size={24} />
          </button>
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
