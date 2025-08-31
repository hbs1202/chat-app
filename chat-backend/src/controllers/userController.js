// src/controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs"); // bcryptjs 불러오기
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    // 1. 프론트엔드에서 보낸 정보 받기 (username, password 등)
    const {
      username,
      fullName,
      code,
      password,
      department,
      businessSite,
      company,
    } = req.body;

    // 2. 사용자 이름이 이미 존재하는지 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "이미 사용 중인 사용자 이름입니다." });
    }

    // 3. 비밀번호 암호화 (Hashing)
    const hashedPassword = await bcrypt.hash(password, 12); // 12는 암호화 강도

    // 4. 새로운 사용자 생성
    const newUser = new User({
      username,
      fullName,
      code,
      password: hashedPassword, // 암호화된 비밀번호 저장
      department,
      businessSite,
      company,
    });

    // 5. 데이터베이스에 저장
    await newUser.save();

    // 6. 성공 응답 보내기
    res.status(201).json({ message: "회원가입이 성공적으로 완료되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다.", error });
  }
};

// 로그인 함수 (새로운 코드)
exports.login = async (req, res) => {
  try {
    // 1. 프론트엔드에서 보낸 username, password 받기
    const { username, password } = req.body;

    // 👇 2. DB에서 사용자를 찾을 때, .populate()를 추가합니다.

    // 2. DB에서 해당 username을 가진 사용자 찾기
    const user = await User.findOne({ username })
      .populate("company", "name")
      .populate("businessSite", "name")
      .populate("department", "name") // department 정보도 함께 가져옵니다.
      .populate("position", "name");
    if (!user) {
      return res.status(401).json({
        message: "인증 실패: 아이디 가 올바르지 않습니다.",
      });
    }

    // 3. 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "인증 실패:  비밀번호가 올바르지 않습니다.",
      });
    }

    // 4. JWT 생성 (로그인 성공 시 '인증 티켓' 발급)
    const payload = {
      userId: user._id,
      username: user.username,
      fullName: user.fullName,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET, // .env 파일의 비밀 키 사용
      { expiresIn: "1h" } // 토큰 유효기간: 1시간
    );

    // 5. 프론트엔드에 성공 응답 (토큰과 사용자 정보 전송)
    res.status(200).json({
      message: "로그인 성공!",
      token: token,
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다.", error });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .populate("department", "name code") // department 필드를 채우되, 'name' 필드만 가져옴
      .populate("businessSite", "name code") // businessSite 필드도 채움
      .populate("company", "name code"); // company 필드도 채움

    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "사용자를 불러오는 데 실패했습니다.", error });
  }
};
