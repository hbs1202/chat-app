// src/socket/messageHandler.js

// 역할: 메시지 전송, 채팅 기록 조회, 읽음 처리, 타이핑 상태 등
//       채팅과 관련된 모든 실시간 이벤트를 처리합니다.
// 동작 방식: 모든 채팅을 '채팅방(ChatRoom)' 기준으로 처리합니다.
//           클라이언트로부터 chatRoomId를 받아 해당 채팅방의 참여자들에게
//           메시지를 전달하거나 DB에서 메시지 기록을 조회합니다.

const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom"); // ChatRoom 모델 import

module.exports = (io, socket, onlineUsers) => {
  // --- 타이핑 관련 이벤트 리스너 ---
  socket.on("typing_start", async (data) => {
    const { sender, chatRoomId } = data;
    if (!chatRoomId) return;

    try {
      const room = await ChatRoom.findById(chatRoomId);
      if (!room) return;

      // 자신을 제외한 채팅방의 모든 참여자에게 이벤트 전송
      room.participants.forEach((participantUsername) => {
        if (participantUsername !== sender) {
          const recipientSocketId = onlineUsers[participantUsername];
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("user_typing", {
              sender,
              chatRoomId,
            });
          }
        }
      });
    } catch (error) {
      console.error("Typing start event error:", error);
    }
  });

  socket.on("typing_stop", async (data) => {
    const { sender, chatRoomId } = data;
    if (!chatRoomId) return;

    try {
      const room = await ChatRoom.findById(chatRoomId);
      if (!room) return;

      // 자신을 제외한 채팅방의 모든 참여자에게 이벤트 전송
      room.participants.forEach((participantUsername) => {
        if (participantUsername !== sender) {
          const recipientSocketId = onlineUsers[participantUsername];
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("user_stopped_typing", {
              sender,
              chatRoomId,
            });
          }
        }
      });
    } catch (error) {
      console.error("Typing stop event error:", error);
    }
  });

  // --- 채팅 기록 조회 이벤트 리스너 (수정) ---
  socket.on("get_chat_history", async (data) => {
    const { chatRoomId } = data; // 이제 user1, user2 대신 chatRoomId를 받습니다.

    if (!chatRoomId) {
      return console.error("get_chat_history 오류: chatRoomId가 없습니다.");
    }

    try {
      // 해당 채팅방 ID를 가진 모든 메시지를 시간순으로 정렬하여 조회
      const messages = await Message.find({
        chatRoom: chatRoomId,
      }).sort({ timestamp: 1 });

      // 요청한 클라이언트에게만 채팅 기록을 보냅니다.
      socket.emit("chat_history", messages);
    } catch (err) {
      console.error("대화 기록 처리 실패:", err);
    }
  });

  // --- 메시지 전송 이벤트 리스너 (수정 및 통합) ---
  socket.on("send_message", async (data) => {
    const { sender, senderFullName, message, chatRoomId, timestamp } = data;

    if (!chatRoomId) {
      return console.error("send_message 오류: chatRoomId가 없습니다.");
    }

    try {
      // 1. 새로운 메시지를 Message 모델 형식에 맞게 생성
      const newMessage = new Message({
        sender,
        senderFullName,
        message,
        chatRoom: chatRoomId,
        timestamp: new Date(timestamp), // 클라이언트에서 보낸 시간을 Date 객체로 변환
        isRead: false, // 기본값은 false
      });

      // 2. 생성한 메시지를 데이터베이스에 저장
      await newMessage.save();

      // 3. chatRoomId를 사용하여 채팅방 정보를 DB에서 조회
      const room = await ChatRoom.findById(chatRoomId);
      if (!room) {
        return console.error(`채팅방(ID: ${chatRoomId})을 찾을 수 없습니다.`);
      }

      // 해당 채팅방의 참여자들 중, 메시지를 보낸 사람을 제외한 다른 사람들에게만 메시지를 전송
      room.participants.forEach((participantUsername) => {
        // 만약 참여자가 메시지를 보낸 사람(sender)이 아니라면,
        if (participantUsername !== sender) {
          const recipientSocketId = onlineUsers[participantUsername];
          if (recipientSocketId) {
            // 해당 참여자에게만 'receive_message' 이벤트를 보냅니다.
            io.to(recipientSocketId).emit("receive_message", newMessage);
          }
        }
      });
    } catch (err) {
      console.error("메시지 전송 중 오류 발생:", err);
    }
  });

  // --- 메시지 읽음 처리 이벤트 리스너 (개선) ---
  // 참고: 이 로직은 현재 1:1 채팅에 더 적합합니다. 그룹 채팅의 '읽음' 처리는
  //      '읽은 사람 수'를 표시하는 등 더 복잡한 로직이 필요합니다.
  socket.on("mark_as_read", async (data) => {
    const { readerUsername, senderUsername, chatRoomId } = data;

    console.log(`[mark_as_read] 이벤트 수신:`, data);

    // 1:1 채팅방인지 확인하는 로직 추가 (옵션)
    if (!senderUsername || !chatRoomId) {
      console.log(
        "[mark_as_read] senderUsername 또는 chatRoomId가 없어 중단됩니다."
      );

      return; // 그룹 채팅의 읽음 처리는 별도 로직 필요
    }

    try {
      // DB 업데이트: 특정 채팅방에서 상대방이 나에게 보낸 모든 안 읽은 메시지를 '읽음'으로 변경
      const updateResult = await Message.updateMany(
        { chatRoom: chatRoomId, sender: senderUsername, isRead: false },
        { $set: { isRead: true } }
      );
      console.log(`[mark_as_read] DB 업데이트 결과:`, updateResult);

      // 온라인 상태인 원본 발신자(sender)에게 알림 보내기
      const senderSocketId = onlineUsers[senderUsername];

      console.log(
        `[mark_as_read] '${senderUsername}'의 소켓 ID: ${senderSocketId}`
      );

      if (senderSocketId) {
        // --- [오류 수정] dataToSend 변수를 사용하기 전에 선언합니다. ---
        const dataToSend = {
          readerUsername,
          chatRoomId,
        };

        console.log(`[mark_as_read] 클라이언트로 이벤트 전송:`, dataToSend);
        io.to(senderSocketId).emit("messages_read", dataToSend);
      }
    } catch (error) {
      console.error("'읽음' 처리 중 오류 발생:", error);
    }
  });
};
