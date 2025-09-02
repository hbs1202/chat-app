// chat-backend/src/controllers/chatController.js

// 역할: 채팅 관련 API 요청(채팅방 생성/조회)에 대한 로직을 처리합니다.
// 동작 방식: 클라이언트로부터 받은 참여자 목록을 기반으로 DB에서
//           기존 채팅방을 검색하거나, 없을 경우 새로운 채팅방을 생성하여 반환합니다.

const ChatRoom = require("../models/ChatRoom");

// 참여자들이 동일한 기존 채팅방을 찾거나, 없으면 새로 생성하는 함수
exports.findOrCreateChatRoom = async (req, res) => {
  const { participants, createdBy } = req.body;

  // 참여자 목록이 없거나 2명 미만인 경우 오류 처리
  if (!participants || participants.length < 2) {
    return res.status(400).json({
      message: "채팅방을 만들려면 최소 2명 이상의 참여자가 필요합니다.",
    });
  }

  // 참여자 목록을 정렬하여 순서에 상관없이 동일한 채팅방을 찾을 수 있도록 함
  const sortedParticipants = [...participants].sort();

  try {
    // 1. 동일한 참여자를 가진 채팅방이 있는지 검색
    let chatRoom = await ChatRoom.findOne({ participants: sortedParticipants });

    // 2. 기존 채팅방이 없을 경우 새로 생성
    if (!chatRoom) {
      chatRoom = new ChatRoom({
        participants: sortedParticipants,
        createdBy: createdBy,
        isGroup: sortedParticipants.length > 2, // 참여자가 3명 이상이면 그룹 채팅
      });
      await chatRoom.save();
    }

    // 3. 찾거나 생성한 채팅방 정보를 클라이언트에 반환
    res.status(200).json(chatRoom);
  } catch (error) {
    console.error("채팅방 생성/조회 오류:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};
