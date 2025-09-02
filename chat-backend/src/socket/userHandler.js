// src/socket/userHandler.js

// 역할: 사용자 로그인 및 연결 해제 이벤트를 처리합니다.
// 동작 방식: 로그인 시, 해당 사용자가 참여한 모든 채팅방 목록과
//           채팅방별로 안 읽은 메시지 수를 계산하여 클라이언트에 전송합니다.
//           기존의 sender 기반 로직을 ChatRoom 기반으로 변경합니다.

const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");

module.exports = (io, socket, onlineUsers) => {
  // 새로운 이벤트: 로그인 시 온라인 사용자 목록에 추가
  socket.on("login", async (username) => {
    console.log(`--- ✅ [Backend] 'login' event received for: ${username} ---`);

    socket.username = username; // 소켓 객체에 사용자 이름을 저장
    onlineUsers[username] = socket.id;
    console.log(`${username}님이 로그인했습니다.`);

    const onlineUserList = Object.keys(onlineUsers);
    console.log(
      `--- 📢 [Backend] Broadcasting 'online_users_update'. Current users:`,
      onlineUserList
    );
    // 모든 클라이언트에게 최신 온라인 사용자 목록을 보냄
    io.emit("online_users_update", Object.keys(onlineUsers));

    try {
      console.log(
        `--- [Backend] ${username}의 안 읽은 메시지 조회를 시작합니다 ---`
      );

      // --- [핵심 수정 1] 사용자가 참여한 모든 채팅방 목록 조회 ---
      const chatRooms = await ChatRoom.find({ participants: username });

      console.log(
        `[userHandler] DB에서 조회된 '${username}'의 채팅방 목록:`,
        chatRooms
      );

      // 로그인한 사용자에게 채팅방 목록 전송
      socket.emit("chat_room_list", chatRooms);

      // --- [핵심 수정 2] 채팅방 ID를 기준으로 안 읽은 메시지 수 계산 ---
      const unreadCounts = await Message.aggregate([
        // 조건 1: 내가 참여한 채팅방에 온 메시지
        { $match: { chatRoom: { $in: chatRooms.map((room) => room._id) } } },
        // 조건 2: 내가 보낸 메시지가 아님
        { $match: { sender: { $ne: username } } },
        // 조건 3: 아직 읽지 않음 (isRead 기능이 완전하다면 이 조건 추가)
        { $match: { isRead: false } },
        // 채팅방 ID(_id)로 그룹화하여 각 그룹의 개수(count)를 합산
        { $group: { _id: "$chatRoom", count: { $sum: 1 } } },
      ]);

      console.log("--- [Backend] DB 조회 결과 (unreadCounts):", unreadCounts);

      // 결과를 { chatRoomId: count } 형태의 객체로 변환
      const unreadSummary = unreadCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      console.log(
        `--- [Backend] ${username}에게 'initial_unread_counts' 이벤트를 보냅니다:`,
        unreadSummary
      );

      console.log(
        `[userHandler] '${username}'의 안 읽은 메시지 수:`,
        unreadSummary
      );

      // 로그인한 사용자에게만 안 읽은 메시지 요약 정보를 보냄
      socket.emit("initial_unread_counts", unreadSummary);

      // --- 👇 여기에 전체 메시지 기록 조회 로직 추가 👇 ---
      // 2. 내가 참여한 모든 메시지를 DB에서 찾기
      console.log(
        `[Backend] ${username}의 전체 메시지 기록 조회를 시작합니다.`
      );

      const allMyMessages = await Message.find({
        $or: [{ sender: username }, { receiver: username }],
      }).sort({ timestamp: 1 });

      // 3. 메시지들을 chatId를 기준으로 그룹화하기
      const messagesByChat = allMyMessages.reduce((acc, msg) => {
        const partner = msg.sender === username ? msg.receiver : msg.sender;
        const chatId = [username, partner].sort().join("-");
        if (!acc[chatId]) {
          acc[chatId] = [];
        }
        acc[chatId].push(msg);
        return acc;
      }, {});

      console.log(
        `--- 📢 [Backend] ${username}에게 'all_messages_history' 이벤트를 보냅니다.`
      );
      // 4. 로그인한 사용자에게 전체 메시지 기록을 보냄
      socket.emit("all_messages_history", messagesByChat);
      // --- 👆 여기까지 추가 👆 ---
    } catch (err) {
      console.error("안 읽은 메시지 개수 조회 실패:", err);
    }
  });

  // 연결 해제 시 처리 (가장 중요)
  socket.on("disconnect", () => {
    if (socket.username) {
      delete onlineUsers[socket.username];
      console.log(`${socket.username}님이 로그아웃했습니다.`);
      // 모든 클라이언트에게 최신 온라인 사용자 목록을 보냄
      io.emit("online_users_update", Object.keys(onlineUsers));
    }
  });
};
