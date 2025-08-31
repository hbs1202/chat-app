// src/components/Layout/Sidebar.jsx
import React, { useState } from "react";
import { Users, LogOut, ChevronRight } from "lucide-react";

const Sidebar = ({
  currentUser,
  handleLogout,
  // users,
  organizedUsers,
  handleUserSelect, // App.jsx로부터 이 함수를 전달받습니다.
  selectedUser,
  onlineUsers,
  unreadMessages,
}) => {
  // 어떤 노드(사업장/부서)가 열려있는지 상태로 관리
  const [expandedNodes, setExpandedNodes] = useState({});

  // 고유한 노드 키를 생성 (예: "MyCompany-본사")
  const createNodeKey = (...args) => args.join("-");

  const toggleNode = (nodeKey) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  return (
    <div className="w-full bg-white shadow-lg flex flex-col">
      {/* 사이드바 헤더 */}
      <div className="p-4 bg-blue-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            {/* --- 👇 여기가 핵심 수정 사항입니다 --- */}
            <div>
              <span className="font-medium">{currentUser?.fullName}</span>
              <p className="text-xs text-blue-200 opacity-90 leading-tight">
                {currentUser?.companyName} / {currentUser?.siteName} /{" "}
                {currentUser?.deptName} / {currentUser?.positionName}
              </p>
            </div>
            {/* --- 👆 여기까지 수정 👆 --- */}
          </div>
          <button
            onClick={handleLogout}
            className="p-1 hover:bg-blue-600 rounded"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 사용자 목록 (스크롤 영역) */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {Object.keys(organizedUsers)
            .sort()
            .map((companyName) => {
              const companyKey = createNodeKey(companyName);
              return (
                <div key={companyKey}>
                  {/* 1. 회사 레벨 */}
                  <button
                    onClick={() => toggleNode(companyKey)}
                    className="w-full flex items-center text-left p-2 rounded-md hover:bg-gray-100 font-semibold"
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
                    <div className="pl-4">
                      {Object.keys(organizedUsers[companyName])
                        .sort()
                        .map((siteName) => {
                          const siteKey = createNodeKey(companyName, siteName);
                          return (
                            <div key={siteKey}>
                              {/* 2. 사업장 레벨 */}
                              <button
                                onClick={() => toggleNode(siteKey)}
                                className="w-full flex items-center text-left p-2 rounded-md hover:bg-gray-100 text-sm font-medium"
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
                                <div className="pl-6">
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
                                          {/* 3. 부서 레벨 */}
                                          <button
                                            onClick={() => toggleNode(deptKey)}
                                            className="w-full flex items-center text-left p-2 rounded-md hover:bg-gray-100 text-sm text-gray-700"
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
                                              {/* 4. 사용자 레벨 */}
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
                                                    <div className="flex items-center">
                                                      <div
                                                        className={`w-2 h-2 rounded-full mr-2 ${
                                                          onlineUsers.includes(
                                                            user.username
                                                          )
                                                            ? "bg-green-400"
                                                            : "bg-gray-300"
                                                        }`}
                                                      ></div>
                                                      <span className="font-normal">
                                                        {user.fullName}
                                                      </span>
                                                      {user.position && (
                                                        <span className="text-xs text-gray-500 ml-2">
                                                          {user.position.name}
                                                        </span>
                                                      )}
                                                    </div>
                                                    {unreadMessages[
                                                      user.username
                                                    ] > 0 && (
                                                      <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
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
      </div>
    </div>
  );
};

export default Sidebar;
