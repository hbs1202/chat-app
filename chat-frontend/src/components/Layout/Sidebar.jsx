import React, { useState, useMemo, useCallback } from "react";
import {
  Users,
  LogOut,
  ChevronRight,
  MessageSquare,
  PlusCircle,
} from "lucide-react";

/**
 * 사이드바 탭 타입 정의
 */
const SIDEBAR_VIEWS = {
  ORGANIZATION: "org",
  CHAT: "chat",
  GROUP_CHAT: "group_chat",
};

/**
 * 온라인 상태 표시 컴포넌트
 */
const OnlineStatusIndicator = ({ isOnline }) => (
  <div
    className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
      isOnline ? "bg-green-400" : "bg-gray-300"
    }`}
  />
);

/**
 * 읽지 않은 메시지 개수 표시 컴포넌트
 */
const UnreadBadge = ({ count }) => {
  if (count <= 0) return null;
  return (
    <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
      {count > 99 ? "99+" : count}
    </span>
  );
};

/**
 * 조직도 트리 노드의 토글 버튼 컴포넌트
 */
const TreeToggleButton = ({
  isExpanded,
  onClick,
  children,
  className = "",
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center text-left p-2 rounded-md hover:bg-gray-100 transition-colors ${className}`}
  >
    <ChevronRight
      size={16}
      className={`mr-1 transition-transform duration-200 ${
        isExpanded ? "rotate-90" : ""
      }`}
    />
    {children}
  </button>
);

/**
 * 개별 사용자 항목 컴포넌트
 */
const UserItem = ({
  user,
  isSelected,
  isOnline,
  unreadCount,
  onSelectChat,
}) => (
  <button
    onClick={() => onSelectChat(user.username)}
    className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
      isSelected
        ? "bg-blue-100 text-blue-700"
        : "hover:bg-gray-100 text-gray-700"
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center min-w-0">
        <OnlineStatusIndicator isOnline={isOnline} />
        <div className="truncate">
          <span className="font-normal block truncate">{user.fullName}</span>
          {user.position && (
            <span className="text-xs text-gray-500 block truncate">
              {user.position.name}
            </span>
          )}
        </div>
      </div>
      <UnreadBadge count={unreadCount} />
    </div>
  </button>
);

/**
 * 부서별 사용자 목록 컴포넌트
 */
const DepartmentSection = ({
  departmentName,
  users,
  deptKey,
  isExpanded,
  onToggle,
  selectedUser,
  onlineUsers,
  unreadMessages,
  onSelectChat,
}) => (
  <div>
    <TreeToggleButton
      isExpanded={isExpanded}
      onClick={() => onToggle(deptKey)}
      className="text-sm text-gray-600"
    >
      {departmentName} ({users.length}명)
    </TreeToggleButton>
    {isExpanded && (
      <div className="pl-4 space-y-1">
        {users.map((user) => (
          <UserItem
            key={user.username}
            user={user}
            isSelected={selectedUser === user.username}
            isOnline={onlineUsers.includes(user.username)}
            unreadCount={unreadMessages[user.username] || 0}
            onSelectChat={onSelectChat}
          />
        ))}
      </div>
    )}
  </div>
);

/**
 * 사업장별 부서 목록 컴포넌트
 */
const BusinessSiteSection = ({
  siteName,
  departments,
  siteKey,
  isExpanded,
  onToggle,
  expandedNodes,
  onNodeToggle,
  selectedUser,
  onlineUsers,
  unreadMessages,
  onSelectChat,
  companyName,
}) => {
  // 해당 사업장의 총 사용자 수 계산
  const totalUsers = useMemo(() => {
    return Object.values(departments).reduce(
      (sum, users) => sum + users.length,
      0
    );
  }, [departments]);

  return (
    <div>
      <TreeToggleButton
        isExpanded={isExpanded}
        onClick={() => onToggle(siteKey)}
        className="text-sm font-medium text-gray-700"
      >
        {siteName} ({totalUsers}명)
      </TreeToggleButton>
      {isExpanded && (
        <div className="pl-4 space-y-1">
          {Object.entries(departments)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([deptName, users]) => {
              const deptKey = `${companyName}-${siteName}-${deptName}`;
              return (
                <DepartmentSection
                  key={deptKey}
                  departmentName={deptName}
                  users={users}
                  deptKey={deptKey}
                  isExpanded={expandedNodes[deptKey] || false}
                  onToggle={onNodeToggle}
                  selectedUser={selectedUser}
                  onlineUsers={onlineUsers}
                  unreadMessages={unreadMessages}
                  onSelectChat={onSelectChat}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

/**
 * 회사별 조직도 컴포넌트
 */
const CompanySection = ({
  companyName,
  businessSites,
  companyKey,
  isExpanded,
  onToggle,
  expandedNodes,
  onNodeToggle,
  selectedUser,
  onlineUsers,
  unreadMessages,
  onSelectChat,
}) => {
  // 해당 회사의 총 사용자 수 계산
  const totalUsers = useMemo(() => {
    return Object.values(businessSites).reduce((sum, departments) => {
      return (
        sum +
        Object.values(departments).reduce(
          (deptSum, users) => deptSum + users.length,
          0
        )
      );
    }, 0);
  }, [businessSites]);

  return (
    <div>
      <TreeToggleButton
        isExpanded={isExpanded}
        onClick={() => onToggle(companyKey)}
        className="font-semibold text-gray-800"
      >
        {companyName} ({totalUsers}명)
      </TreeToggleButton>
      {isExpanded && (
        <div className="pl-3 space-y-1">
          {Object.entries(businessSites)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([siteName, departments]) => {
              const siteKey = `${companyName}-${siteName}`;
              return (
                <BusinessSiteSection
                  key={siteKey}
                  siteName={siteName}
                  departments={departments}
                  siteKey={siteKey}
                  isExpanded={expandedNodes[siteKey] || false}
                  onToggle={onNodeToggle}
                  expandedNodes={expandedNodes}
                  onNodeToggle={onNodeToggle}
                  selectedUser={selectedUser}
                  onlineUsers={onlineUsers}
                  unreadMessages={unreadMessages}
                  onSelectChat={onSelectChat}
                  companyName={companyName}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

/**
 * 조직도 뷰 컴포넌트
 */
const OrganizationView = ({
  organizedUsers,
  expandedNodes,
  onNodeToggle,
  selectedUser,
  onlineUsers,
  unreadMessages,
  onSelectChat,
}) => (
  <div className="p-2 space-y-1">
    {Object.keys(organizedUsers)
      .sort()
      .map((companyName) => {
        const companyKey = companyName;
        return (
          <CompanySection
            key={companyKey}
            companyName={companyName}
            businessSites={organizedUsers[companyName]}
            companyKey={companyKey}
            isExpanded={expandedNodes[companyKey] || false}
            onToggle={onNodeToggle}
            expandedNodes={expandedNodes}
            onNodeToggle={onNodeToggle}
            selectedUser={selectedUser}
            onlineUsers={onlineUsers}
            unreadMessages={unreadMessages}
            onSelectChat={onSelectChat}
          />
        );
      })}
  </div>
);

/**
 * 채팅방 항목 컴포넌트
 */
const ChatRoomItem = ({ room, isSelected, isOnline, onSelectChat }) => (
  <button
    onClick={() => onSelectChat(room)}
    className={`w-full text-left p-3 rounded-lg transition-colors ${
      isSelected ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center min-w-0 flex-1">
        <OnlineStatusIndicator isOnline={isOnline} />
        <div className="truncate flex-1">
          <span className="font-semibold text-sm block truncate">
            {room.displayName}
          </span>
          {room.lastMessage && (
            <p className="text-xs text-gray-500 truncate mt-1">
              {room.lastMessage}
            </p>
          )}
        </div>
      </div>
      <UnreadBadge count={room.unreadCount || 0} />
    </div>
  </button>
);

/**
 * 채팅 목록 뷰 컴포넌트
 */
const ChatListView = ({
  chatRooms,
  selectedChat,
  onlineUsers,
  onSelectChat,
}) => (
  <div className="p-2 space-y-1">
    {chatRooms.length > 0 ? (
      chatRooms.map((room) => (
        <ChatRoomItem
          key={room._id}
          room={room}
          isSelected={selectedChat === room.partnerUsername}
          isOnline={
            room.partnerUsername && onlineUsers.includes(room.partnerUsername)
          }
          onSelectChat={onSelectChat}
        />
      ))
    ) : (
      <div className="p-8 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">아직 대화한 채팅이 없습니다</p>
        <p className="text-xs text-gray-400 mt-1">
          조직도에서 동료를 선택하여 채팅을 시작해보세요
        </p>
      </div>
    )}
  </div>
);

/**
 * 사이드바 헤더 컴포넌트
 */
const SidebarHeader = ({ currentUser, onLogout }) => (
  <div className="p-4 bg-blue-500 text-white border-b border-blue-600">
    <div className="flex items-center justify-between">
      <div className="flex items-center min-w-0 flex-1">
        <Users className="h-5 w-5 mr-3 flex-shrink-0" />
        <div className="truncate flex-1">
          <span className="font-medium block truncate">
            {currentUser?.fullName || "사용자"}
          </span>
          {currentUser && (
            <p className="text-xs text-blue-200 opacity-90 leading-tight truncate">
              {[
                currentUser.company?.name,
                currentUser.businessSite?.name,
                currentUser.department?.name,
                currentUser.position?.name,
              ]
                .filter(Boolean)
                .join(" / ")}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onLogout}
        className="p-1 hover:bg-blue-600 rounded flex-shrink-0 transition-colors"
        title="로그아웃"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  </div>
);

/**
 * 탭 네비게이션 컴포넌트
 */
const TabNavigation = ({ activeView, onViewChange }) => {
  // --- [수정] 탭 목록에 '그룹채팅' 추가 ---
  const tabs = [
    {
      key: SIDEBAR_VIEWS.ORGANIZATION,
      icon: Users,
      label: "조직도",
    },
    {
      key: SIDEBAR_VIEWS.CHAT,
      icon: MessageSquare,
      label: "채팅",
    },
    {
      key: SIDEBAR_VIEWS.GROUP_CHAT,
      icon: Users,
      label: "그룹채팅",
    },
  ];

  return (
    <div className="flex border-b bg-white">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onViewChange(tab.key)}
            className={`flex-1 p-3 text-sm font-semibold text-center flex items-center justify-center gap-2 transition-colors ${
              activeView === tab.key
                ? "bg-gray-100 text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <IconComponent size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
/**
 * 메인 사이드바 컴포넌트
 *
 * @param {Object} props - 컴포넌트 props
 * @param {Object} props.currentUser - 현재 로그인한 사용자 정보
 * @param {Function} props.handleLogout - 로그아웃 처리 함수
 * @param {Object} props.organizedUsers - 조직별로 구성된 사용자 데이터
 * @param {Array} props.chatRooms - 채팅방 목록
 * @param {Function} props.handleUserSelect - 사용자 선택 처리 함수
 * @param {string} props.selectedUser - 현재 선택된 사용자 ID
 * @param {Array} props.onlineUsers - 온라인 사용자 목록
 * @param {Object} props.unreadMessages - 읽지 않은 메시지 개수 정보
 * @param {string} props.sidebarView - 현재 활성화된 사이드바 뷰
 * @param {Function} props.setSidebarView - 사이드바 뷰 변경 함수
 */
const Sidebar = ({
  currentUser,
  handleLogout,
  organizedUsers = {},
  chatRooms = [],
  handleSelectChat,
  selectedChat,
  onlineUsers = [],
  unreadMessages = {},
  sidebarView = SIDEBAR_VIEWS.ORGANIZATION,
  setSidebarView,
  setIsGroupChatModalOpen,
}) => {
  // 조직도 트리 노드의 확장/축소 상태 관리
  const [expandedNodes, setExpandedNodes] = useState({});

  // 노드 확장/축소 토글 함수
  const handleNodeToggle = useCallback((nodeKey) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  }, []);

  // 사이드바 뷰 변경 함수
  const handleViewChange = useCallback(
    (view) => {
      setSidebarView(view);
    },
    [setSidebarView]
  );

  // --- [추가] 전체 채팅 목록을 1:1 채팅과 그룹 채팅으로 분리 ---
  const { oneToOneChats, groupChats } = useMemo(() => {
    const oneToOne = [];
    const groups = [];
    chatRooms.forEach((room) => {
      // isGroup이 true이거나 참여자가 3명 이상이면 그룹 채팅으로 간주
      if (room.isGroup || room.participants.length > 2) {
        groups.push(room);
      } else {
        // 그 외에는 모두 1:1 채팅으로 간주
        oneToOne.push(room);
      }
    });
    return { oneToOneChats: oneToOne, groupChats: groups };
  }, [chatRooms]);

  console.log(
    "Sidebar component received handleSelectChat:",
    typeof handleSelectChat
  );

  return (
    <div className="w-full bg-white shadow-lg flex flex-col h-full">
      {/* 사이드바 헤더 영역 */}
      <SidebarHeader currentUser={currentUser} onLogout={handleLogout} />

      {/* 탭 네비게이션 영역 */}
      <TabNavigation activeView={sidebarView} onViewChange={handleViewChange} />

      {/* 메인 콘텐츠 영역 (스크롤 가능) */}
      <div className="flex-1 overflow-y-auto">
        {(() => {
          // sidebarView 값에 따라 정확히 하나의 뷰만 렌더링하도록 수정합니다.
          switch (sidebarView) {
            case SIDEBAR_VIEWS.ORGANIZATION:
              return (
                <OrganizationView
                  organizedUsers={organizedUsers}
                  expandedNodes={expandedNodes}
                  onNodeToggle={handleNodeToggle}
                  selectedUser={selectedChat?.participants.find(
                    (p) => p !== currentUser.username
                  )}
                  onlineUsers={onlineUsers}
                  unreadMessages={unreadMessages}
                  onSelectChat={handleSelectChat}
                />
              );
            case SIDEBAR_VIEWS.CHAT:
              return (
                <ChatListView
                  chatRooms={oneToOneChats}
                  selectedChat={selectedChat}
                  onlineUsers={onlineUsers}
                  onSelectChat={handleSelectChat}
                  emptyMessage={{
                    title: "아직 대화한 채팅이 없습니다",
                    subtitle: "조직도에서 동료를 선택하여 채팅을 시작해보세요.",
                  }}
                />
              );
            case SIDEBAR_VIEWS.GROUP_CHAT:
              return (
                <div>
                  <div className="p-2 border-b">
                    <button
                      onClick={() => setIsGroupChatModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 p-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <PlusCircle size={16} />
                      대화방 만들기
                    </button>
                  </div>
                  <ChatListView
                    chatRooms={groupChats}
                    selectedChat={selectedChat}
                    onlineUsers={onlineUsers}
                    onSelectChat={handleSelectChat}
                    emptyMessage={{
                      title: "참여 중인 그룹 채팅이 없습니다",
                      subtitle: "위 버튼을 눌러 새로운 그룹을 만들어보세요.",
                    }}
                  />
                </div>
              );
            default:
              return null; // 기본값으로 아무것도 렌더링하지 않음
          }
        })()}
      </div>
    </div>
  );
};

export default Sidebar;
