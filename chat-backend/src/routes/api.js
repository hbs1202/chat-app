// src/routes/api.js
console.log("--- ✅ api.js 라우터 파일이 로드되었습니다. ---");

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const orgController = require("../controllers/organizationController");
const chatController = require("../controllers/chatController");

// --- User 라우트 ---
// POST /api/signup
router.post("/signup", userController.signup);

router.post("/login", userController.login);

// GET /api/users
router.get("/users", userController.getAllUsers);

// --- 조직 정보 라우트 ---
// GET /api/companies
router.get("/companies", orgController.getAllCompanies);

router.get("/sites", orgController.getAllBusinessSites);

// GET /api/sites/:companyId
router.get("/sites/:companyId", orgController.getBusinessSitesByCompany);

// GET /api/departments/:siteId
router.get("/departments/:siteId", orgController.getDepartmentsBySite);

router.get("/positions", orgController.getAllPositions);

// POST /api/chat/room: 채팅방을 생성하거나 기존 채팅방을 찾는 요청
router.post("/chat/room", chatController.findOrCreateChatRoom);

module.exports = router;
