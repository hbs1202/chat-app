// chat-backend/src/models/ChatRoom.js

// 역할: 그룹 채팅방의 데이터 구조(Schema)를 정의합니다.
// 동작 방식: 채팅방에 참여한 사용자들의 목록(participants)과 같은
//           핵심 정보를 저장하기 위한 필드와 타입을 정의합니다.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const chatRoomSchema = new Schema({
  // 채팅방 이름 (예: "프로젝트 회의")
  name: { type: String, trim: true },

  // 참여자들의 username을 배열 형태로 저장합니다.
  // User 모델을 참조하여 나중에 사용자 정보를 쉽게 가져올 수 있습니다.
  participants: [{ type: String, required: true }],

  // 그룹 채팅방인지 여부를 나타냅니다.
  isGroup: { type: Boolean, default: true },

  // 채팅방을 생성한 사람
  createdBy: { type: String, required: true },

  // 생성 및 마지막 업데이트 시간
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
