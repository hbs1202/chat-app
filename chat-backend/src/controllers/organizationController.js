// src/controllers/organizationController.js
const Company = require("../models/Company");
const BusinessSite = require("../models/BusinessSite");
const Department = require("../models/Department");
const Position = require("../models/Position");

// 모든 회사 목록 조회
exports.getAllCompanies = async (req, res) => {
  try {
    // 프론트엔드가 key와 value로 사용할 _id를 명시적으로 포함합니다.
    const companies = await Company.find({}, "_id name code");
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ message: "회사 정보를 불러오는 데 실패했습니다." });
  }
};

// 모든 사업장 목록 조회
exports.getAllBusinessSites = async (req, res) => {
  try {
    // 프론트엔드가 필터링에 사용할 company 필드를 명시적으로 포함합니다.
    const sites = await BusinessSite.find({}, "_id name code company");
    res.status(200).json(sites);
  } catch (error) {
    res
      .status(500)
      .json({ message: "전체 사업장 정보를 불러오는 데 실패했습니다." });
  }
};

// 모든 부서 목록 조회
exports.getAllDepartments = async (req, res) => {
  try {
    // 프론트엔드가 필터링에 사용할 businessSite 필드를 명시적으로 포함합니다.
    const departments = await Department.find({}, "_id name code businessSite");
    res.status(200).json(departments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "전체 부서 정보를 불러오는 데 실패했습니다." });
  }
};

// 특정 회사에 속한 사업장 목록 조회
exports.getBusinessSitesByCompany = async (req, res) => {
  try {
    // 라우터의 :companyId 파라미터를 받습니다.
    const { companyId } = req.params;
    // 받은 ID로 바로 검색하고, company 필드를 포함하여 응답합니다.
    const sites = await BusinessSite.find(
      { company: companyId },
      "_id name code company"
    );
    res.status(200).json(sites);
  } catch (error) {
    res
      .status(500)
      .json({ message: "사업장 정보를 불러오는 데 실패했습니다." });
  }
};

// 특정 사업장에 속한 부서 목록 조회
exports.getDepartmentsBySite = async (req, res) => {
  try {
    // 라우터의 :siteId 파라미터를 받습니다.
    const { siteId } = req.params;
    // 받은 ID로 바로 검색하고, businessSite 필드를 포함하여 응답합니다.
    const departments = await Department.find(
      { businessSite: siteId },
      "_id name code businessSite"
    );
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: "부서 정보를 불러오는 데 실패했습니다." });
  }
};

exports.getAllPositions = async (req, res) => {
  try {
    const positions = await Position.find({}, "_id name");
    res.status(200).json(positions);
  } catch (error) {
    res.status(500).json({ message: "직급 정보를 불러오는 데 실패했습니다." });
  }
};
