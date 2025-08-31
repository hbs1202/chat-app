// src/socket/messageHandler.js
const Message = require("../models/Message");

module.exports = (io, socket, onlineUsers) => {
  // 여기에 'typing' 관련 이벤트 리스너들을 추가합니다.
  socket.on("typing_start", (data) => {
    // data 객체 예시: { sender: '김철수', receiver: '이영희' }
    const recipientSocketId = onlineUsers[data.receiver];
    if (recipientSocketId) {
      // 상대방에게만 'user_typing' 이벤트를 보냅니다.
      io.to(recipientSocketId).emit("user_typing", { sender: data.sender });
    }
  });

  socket.on("typing_stop", (data) => {
    const recipientSocketId = onlineUsers[data.receiver];
    if (recipientSocketId) {
      // 상대방에게만 'user_stopped_typing' 이벤트를 보냅니다.
      io.to(recipientSocketId).emit("user_stopped_typing", {
        sender: data.sender,
      });
    }
  });

  // 여기에 새로운 이벤트 리스너를 추가합니다.
  socket.on("get_chat_history", async (data) => {
    const { user1, user2 } = data; // user1: reader (나), user2: sender (상대방)
    try {
      // 1. DB 업데이트: 상대방이 나에게 보낸 모든 안 읽은 메시지를 '읽음'으로 변경
      const updateResult = await Message.updateMany(
        { sender: user2, receiver: user1, isRead: false },
        { $set: { isRead: true } }
      );

      // 2. 만약 실제로 '읽음' 처리된 메시지가 1개 이상 있다면,
      //    온라인 상태인 원본 발신자(sender)에게 즉시 알림을 보냅니다.
      if (updateResult.modifiedCount > 0) {
        const senderSocketId = onlineUsers[user2]; // 상대방(sender)의 소켓 ID 찾기
        if (senderSocketId) {
          // 'messages_read' 이벤트를 통해 누가 내 메시지를 읽었는지 알려줌
          io.to(senderSocketId).emit("messages_read", {
            readerUsername: user1, // 읽은 사람: 나 (user1)
          });
          console.log(
            `[Socket] ${user1}이(가) ${user2}의 메시지를 읽었음을 알립니다.`
          );
        }
      }
      // --- 👆 여기까지 수정 👆 ---

      // 3. 평소대로 요청자에게 전체 대화 기록을 조회하여 전송
      const messages = await Message.find({
        $or: [
          { sender: user1, receiver: user2 },
          { sender: user2, receiver: user1 },
        ],
      }).sort({ timestamp: 1 });

      socket.emit("chat_history", messages);
    } catch (err) {
      console.error("대화 기록 처리 실패:", err);
    }
  });

  // 클라이언트에서 'send_message' 이벤트를 보냈을 때 처리
  socket.on("send_message", async (data) => {
    console.log("받은 메시지:", data);

    // 받은 메시지를 DB에 저장
    const newMessage = new Message({
      sender: data.sender,
      receiver: data.receiver,
      content: data.content,
      timestamp: new Date(data.timestamp), // 날짜 형식으로 변환
    });

    try {
      await newMessage.save(); // 비동기적으로 저장
      console.log("메시지가 DB에 저장되었습니다.");

      // 자신을 제외한 모든 클라이언트에게 'receive_message' 이벤트 전달
      socket.broadcast.emit("receive_message", data);
    } catch (err) {
      console.error("메시지 저장 실패:", err);
    }
  });
  // --- 👇 여기에 '읽음 처리' 핸들러를 추가합니다. 👇 ---
  socket.on("mark_as_read", async (data) => {
    try {
      const { readerUsername, senderUsername } = data;
      console.log(
        `--- ✅ [서버] ${readerUsername}가 ${senderUsername}의 메시지를 읽었다는 신호 수신 ---`
      );

      // 1. DB 업데이트: sender가 reader에게 보낸 모든 안 읽은 메시지를 '읽음'으로 변경
      await Message.updateMany(
        { sender: senderUsername, receiver: readerUsername, isRead: false },
        { $set: { isRead: true } }
      );

      // 2. 온라인 상태인 원본 발신자(sender)에게 알림 보내기
      const senderSocketId = onlineUsers[senderUsername];
      if (senderSocketId) {
        console.log(
          `--- 📢 [서버] ${senderUsername}에게 'messages_read' 이벤트를 보냅니다 ---`
        );
        // 'messages_read' 이벤트를 통해 누가 내 메시지를 읽었는지 알려줌
        io.to(senderSocketId).emit("messages_read", { readerUsername });
      } else {
        console.log(
          `--- ⚠️ [서버] ${senderUsername}는 오프라인이라 알림을 보내지 않습니다 ---`
        );
      }
    } catch (error) {
      console.error("'읽음' 처리 중 오류 발생:", error);
    }
  });
  // --- 👆 여기까지 추가 👆 ---
};
