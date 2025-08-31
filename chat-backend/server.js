// server.js

require("dotenv").config();
const bcrypt = require("bcryptjs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./src/config/db");
const initializeSocket = require("./src/socket");

const Company = require("./src/models/Company");
const BusinessSite = require("./src/models/BusinessSite");
const Department = require("./src/models/Department");
const User = require("./src/models/User");

// 데이터베이스 연결
connectDB();

const app = express();
app.use(cors());

app.use(express.json());

app.use("/api", require("./src/routes/api"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    //    origin: ["http://localhost:3000", "http://localhost:5173"],
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 소켓 초기화
initializeSocket(io);

// (향후 REST API 라우트 설정은 여기에 추가)
// app.use('/api', require('./src/routes/api'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`채팅 서버가 ${PORT}번 포트에서 실행 중입니다.`);
});

const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    // console.log("테스트 데이터 생성 시작...");

    // // 1. 회사 생성
    const myCompany = await new Company({
      name: "MyCompany",
      code: "C001",
    }).save();

    // 2. 사업장 생성
    const mainOffice = await new BusinessSite({
      name: "본사",
      code: "BS01",
      company: myCompany._id,
    }).save();

    // 3. 부서 생성
    const devDept = await new Department({
      name: "개발팀",
      code: "D-DEV",
      businessSite: mainOffice._id,
    }).save();
    const designDept = await new Department({
      name: "디자인팀",
      code: "D-DGN",
      businessSite: mainOffice._id,
    }).save();

    // 4. 사용자 생성
    const usersToSeed = [
      {
        username: "kim",
        fullName: "김철수",
        code: "E1001",
        password: "1234",
        department: devDept._id,
        businessSite: mainOffice._id,
        company: myCompany._id,
      },
      {
        username: "lee",
        fullName: "이영희",
        code: "E1002",
        password: "1234",
        department: designDept._id,
        businessSite: mainOffice._id,
        company: myCompany._id,
      },
      {
        username: "park",
        fullName: "박민수",
        code: "E1003",
        password: "1234",
        department: devDept._id,
        businessSite: mainOffice._id,
        company: myCompany._id,
      },
    ];
    // --- 👇👇 여기가 핵심 수정 사항입니다 👇👇 ---
    // usersToSeed 배열을 순회하며 각 사용자의 비밀번호를 해싱합니다.
    const hashedUsers = await Promise.all(
      usersToSeed.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        return { ...user, password: hashedPassword };
      })
    );
    // --- 👆👆 여기까지 수정 👆👆 ---

    await User.insertMany(hashedUsers);
    console.log("계층 구조 테스트 데이터가 성공적으로 생성되었습니다.");
  } catch (error) {
    console.error("테스트 데이터 생성 중 오류 발생:", error);
  }
};
seedDatabase();
