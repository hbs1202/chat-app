// src/socket/index.js
const registerMessageHandler = require("./messageHandler");
const registerUserHandler = require("./userHandler");

let onlineUsers = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`새로운 클라이언트 연결: ${socket.id}`);

    // 각 핸들러에 io, socket, onlineUsers 객체를 전달하여 이벤트 리스너를 등록
    registerUserHandler(io, socket, onlineUsers);
    registerMessageHandler(io, socket, onlineUsers);
  });
};
