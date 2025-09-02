import React, { useState } from "react";
import { Users, LogOut, ChevronRight, MessageSquare } from "lucide-react";

const Sidebar = ({
  currentUser,
  handleLogout,
  organizedUsers,
  chatRooms,
  handleUserSelect,
  selectedUser,
  onlineUsers,
  unreadMessages,
  sidebarView,
  setSidebarView,
}) => {
  // --- 👇 이 상태 선언이 필요합니다. 👇 ---
  // 어떤 노드(회사/사업장/부서)가 열려있는지 상태로 관리
  const [expandedNodes, setExpandedNodes] = useState({});
  // --- 👆 --------------------------- 👆 ---

  // 고유한 노드 키를 생성 (예: "MyCompany-본사")
  const createNodeKey = (...args) => args.join("-");

  const toggleNode = (nodeKey) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };
  console.log(currentUser);

  return (
    <div className="w-full bg-white shadow-lg flex flex-col h-full">
      {/* 사이드바 헤더 */}
      <div className="p-4 bg-blue-500 text-white border-b border-blue-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <Users className="h-5 w-5 mr-3 flex-shrink-0" />
            <div className="truncate">
              <span className="font-medium block truncate">
                {currentUser?.fullName}
              </span>
              <p className="text-xs text-blue-200 opacity-90 leading-tight truncate">
                {currentUser?.company?.name} / {currentUser?.businessSite?.name}{" "}
                / {currentUser?.department?.name} /{" "}
                {currentUser?.position?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 hover:bg-blue-600 rounded flex-shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 탭 버튼 UI */}
      <div className="flex border-b">
        <button
          onClick={() => setSidebarView("org")}
          className={`flex-1 p-3 text-sm font-semibold text-center flex items-center justify-center gap-2 ${
            sidebarView === "org"
              ? "bg-gray-100 text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Users size={16} />
          조직도
        </button>
        <button
          onClick={() => setSidebarView("chat")}
          className={`flex-1 p-3 text-sm font-semibold text-center flex items-center justify-center gap-2 ${
            sidebarView === "chat"
              ? "bg-gray-100 text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <MessageSquare size={16} />
          채팅
        </button>
      </div>

      {/* 목록 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto">
        {sidebarView === "org" ? (
          // --- 조직도 뷰 ---
          <div className="p-2 space-y-1">
            {Object.keys(organizedUsers)
              .sort()
              .map((companyName) => {
                const companyKey = createNodeKey(companyName);
                return (
                  <div key={companyKey}>
                    <button
                      onClick={() => toggleNode(companyKey)}
                      className="w-full flex items-center text-left p-2 rounded-md hover:bg-gray-100 font-semibold text-gray-800"
                    >
                      <ChevronRight
                        size={16}
                        className={`mr-1 transition-transform ${
                          expandedNodes[companyKey] ? "rotate-90" : ""
                        }`}
                      />
                      {companyName}
                    </button>
                    {expandedNodes[companyKey] && (
                      <div className="pl-3">
                        {Object.keys(organizedUsers[companyName])
                          .sort()
                          .map((siteName) => {
                            const siteKey = createNodeKey(
                              companyName,
                              siteName
                            );
                            return (
                              <div key={siteKey}>
                                <button
                                  onClick={() => toggleNode(siteKey)}
                                  className="w-full flex items-center text-left p-2 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700"
                                >
                                  <ChevronRight
                                    size={16}
                                    className={`mr-1 transition-transform ${
                                      expandedNodes[siteKey] ? "rotate-90" : ""
                                    }`}
                                  />
                                  {siteName}
                                </button>
                                {expandedNodes[siteKey] && (
                                  <div className="pl-4">
                                    {Object.keys(
                                      organizedUsers[companyName][siteName]
                                    )
                                      .sort()
                                      .map((deptName) => {
                                        const deptKey = createNodeKey(
                                          companyName,
                                          siteName,
                                          deptName
                                        );
                                        const usersInDept =
                                          organizedUsers[companyName][siteName][
                                            deptName
                                          ];
                                        return (
                                          <div key={deptKey}>
                                            <button
                                              onClick={() =>
                                                toggleNode(deptKey)
                                              }
                                              className="w-full flex items-center text-left py-2 px-1 rounded-md hover:bg-gray-100 text-sm text-gray-600"
                                            >
                                              <ChevronRight
                                                size={16}
                                                className={`mr-1 transition-transform ${
                                                  expandedNodes[deptKey]
                                                    ? "rotate-90"
                                                    : ""
                                                }`}
                                              />
                                              {deptName}
                                            </button>
                                            {expandedNodes[deptKey] && (
                                              <div className="pl-4">
                                                {usersInDept.map((user) => (
                                                  <button
                                                    key={user.username}
                                                    onClick={() =>
                                                      handleUserSelect(
                                                        user.username
                                                      )
                                                    }
                                                    className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                                                      selectedUser ===
                                                      user.username
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "hover:bg-gray-100 text-gray-700"
                                                    }`}
                                                  >
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center min-w-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                                                            onlineUsers.includes(
                                                              user.username
                                                            )
                                                              ? "bg-green-400"
                                                              : "bg-gray-300"
                                                          }`}
                                                        ></div>
                                                        <div className="truncate">
                                                          <span className="font-normal block truncate">
                                                            {user.fullName}
                                                          </span>
                                                          {user.position && (
                                                            <span className="text-xs text-gray-500 block truncate">
                                                              {
                                                                user.position
                                                                  .name
                                                              }
                                                            </span>
                                                          )}
                                                        </div>
                                                      </div>
                                                      {unreadMessages[
                                                        user.username
                                                      ] > 0 && (
                                                        <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
                                                          {
                                                            unreadMessages[
                                                              user.username
                                                            ]
                                                          }
                                                        </span>
                                                      )}
                                                    </div>
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          // --- 채팅 목록 뷰 ---
          <div className="p-2 space-y-1">
            {chatRooms.length > 0 ? (
              chatRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => {
                    // 1:1 채팅일 경우 partnerUsername을 전달하여 채팅방을 엽니다.
                    // 그룹 채팅은 클릭 이벤트를 별도로 구현해야 합니다.
                    if (room.partnerUsername) {
                      handleUserSelect(room.partnerUsername);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedUser === room.username
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                          onlineUsers.includes(room.username)
                            ? "bg-green-400"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <div className="truncate">
                        <span className="font-semibold text-sm block truncate">
                          {room.displayName}
                        </span>
                        <p className="text-xs text-gray-500 truncate">
                          {room.lastMessage}
                        </p>
                      </div>
                    </div>
                    {room.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                대화 기록이 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
