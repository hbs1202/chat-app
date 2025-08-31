// src/config/db.js
const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB에 성공적으로 연결되었습니다."))
    .catch((err) => {
      console.error("MongoDB 연결 실패:", err);
      process.exit(1); // 연결 실패 시 프로세스 종료
    });
};

module.exports = connectDB;
