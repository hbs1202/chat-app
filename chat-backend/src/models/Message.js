// src/models/Message.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
  sender: { type: String, required: true }, // 보낸 사람의 username
  senderFullName: { type: String, required: true }, // 보낸 사람의 전체 이름
  receiver: { type: String }, // 1:1 채팅 시 받는 사람의 username
  chatRoom: { type: Schema.Types.ObjectId, ref: "ChatRoom" }, // 그룹 채팅 시 채팅방 ID (새로운 ChatRoom 모델 필요)
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  // receiver 또는 chatRoom 둘 중 하나는 반드시 존재해야 함 (스키마 유효성 검사 추가 필요)
});

// `receiver` 또는 `chatRoom` 둘 중 하나는 반드시 존재해야 하는 유효성 검사 (예시)
messageSchema.pre("validate", function (next) {
  if (!this.receiver && !this.chatRoom) {
    this.invalidate("receiver", "Receiver or ChatRoom must be provided.");
  }
  next();
});

module.exports = mongoose.model("Message", messageSchema);
