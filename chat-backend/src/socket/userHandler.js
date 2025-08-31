// src/socket/userHandler.js
const Message = require("../models/Message");

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

      // 내가 수신자인 모든 메시지를 찾아서 보낸 사람(sender)별로 그룹화하고 개수를 센다.
      // 이 로직은 아직 '읽음' 상태가 없으므로 모든 메시지를 카운트합니다.
      // 더 정교하게 만들려면 Message 스키마에 isRead 필드가 필요합니다.
      const unreadCounts = await Message.aggregate([
        { $match: { receiver: username, isRead: false } }, // 내가 수신자인 메시지만 필터링
        { $group: { _id: "$sender", count: { $sum: 1 } } }, // 보낸 사람 기준으로 그룹화하고 개수 세기
      ]);
      console.log("--- [Backend] DB 조회 결과 (unreadCounts):", unreadCounts);

      // [{ _id: '김철수', count: 5 }, { _id: '박민수', count: 2 }] 와 같은 결과를
      // { '김철수': 5, '박민수': 2 } 형태로 변환
      const unreadSummary = unreadCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      console.log(
        `--- [Backend] ${username}에게 'initial_unread_counts' 이벤트를 보냅니다:`,
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
