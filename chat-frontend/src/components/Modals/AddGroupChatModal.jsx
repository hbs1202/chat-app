// src/components/Modals/AddGroupChatModal.jsx

import React, { useState, useEffect } from "react";
import { X, Search, CheckCircle2 } from "lucide-react";

const AddGroupChatModal = ({
  isOpen,
  onClose,
  allUsers, // 모든 사용자 목록
  currentUser, // 현재 로그인 사용자
  selectedUsersForGroupChat, // 그룹 채팅에 선택된 사용자 목록
  toggleUserForGroupChat, // 사용자 선택/해제 함수
  startGroupChat, // 그룹 채팅 시작 함수
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    if (isOpen && allUsers) {
      // 현재 사용자를 제외한 사용자들만 필터링
      const usersExcludingSelf = allUsers.filter(
        (user) => user.username !== currentUser.username
      );

      setFilteredUsers(
        usersExcludingSelf.filter(
          (user) =>
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers([]);
      setSearchTerm(""); // 모달 닫힐 때 검색어 초기화
    }
  }, [searchTerm, allUsers, isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 md:w-1/2 lg:w-1/3 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
          <h2 className="text-xl font-semibold">대화 상대 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="이름, 아이디, 사번으로 검색"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        {/* Selected Users Display */}
        {selectedUsersForGroupChat.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap gap-2 items-center">
            <span className="font-medium text-blue-700">
              선택됨 ({selectedUsersForGroupChat.length}):
            </span>
            {selectedUsersForGroupChat.map((user) => (
              <span
                key={user.username}
                className="inline-flex items-center bg-blue-200 text-blue-800 text-sm px-3 py-1 rounded-full"
              >
                {user.fullName}
                <button
                  onClick={() => toggleUserForGroupChat(user)}
                  className="ml-2 text-blue-600 hover:text-blue-900"
                >
                  <X size={16} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {filteredUsers.length === 0 && searchTerm !== "" ? (
            <p className="text-center text-gray-500">검색 결과가 없습니다.</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500">모든 직원을 조회합니다.</p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.username}
                className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                onClick={() => toggleUserForGroupChat(user)}
              >
                <div className="flex-1">
                  <p className="font-semibold">
                    {user.fullName}{" "}
                    <span className="text-gray-500 text-sm">({user.code})</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {user.department?.name}
                  </p>
                </div>
                {selectedUsersForGroupChat.find(
                  (u) => u.username === user.username
                ) && <CheckCircle2 size={20} className="text-blue-500" />}
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={startGroupChat}
            disabled={selectedUsersForGroupChat.length === 0} // 선택된 사용자 없으면 비활성화
            className={`px-5 py-2 rounded-lg text-white transition-colors ${
              selectedUsersForGroupChat.length > 0
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            채팅 시작 ({selectedUsersForGroupChat.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGroupChatModal;
