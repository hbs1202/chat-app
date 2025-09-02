// src/components/Auth/LoginScreen.jsx
import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { API_BASE_URL } from "../../constants/config";
const LoginScreen = ({
  handleLogin,
  handleSignup,
  isLoginView,
  setIsLoginView,
}) => {
  // --- 1. 상태(State) 관리 ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");

  const [companies, setCompanies] = useState([]);
  const [sites, setSites] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // --- 2. 데이터 불러오기 (useEffect) ---
  useEffect(() => {
    if (!isLoginView) {
      const fetchCompanies = async () => {
        try {
          const response = await fetch("${API_BASE_URL}/api/companies");
          if (!response.ok) throw new Error("서버 응답 오류");
          const data = await response.json();
          setCompanies(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("회사 목록 로딩 실패:", error);
          setCompanies([]);
        }
      };
      fetchCompanies();
    }
  }, [isLoginView]);

  useEffect(() => {
    if (!selectedCompany) {
      setSites([]);
      setSelectedSite("");
      return;
    }
    const fetchSites = async () => {
      console.log("사업장 목록 요청 시작, 선택된 회사 ID:", selectedCompany);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/sites/${selectedCompany}`
        );
        if (!response.ok) throw new Error("서버 응답 오류");
        const data = await response.json();

        console.log("서버로부터 수신된 사업장 데이터 (data):", data);

        if (Array.isArray(data)) {
          setSites(data);
        } else {
          console.error(
            "API로부터 배열이 아닌 응답을 받았습니다 (sites):",
            data
          );
          setSites([]);
        }
      } catch (error) {
        console.error("사업장 목록 로딩 실패:", error);
        setSites([]);
      }
    };
    fetchSites();
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedSite) {
      setDepartments([]);
      setSelectedDepartment("");
      return;
    }
    const fetchDepartments = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/departments/${selectedSite}`
        );
        if (!response.ok) throw new Error("서버 응답 오류");
        const data = await response.json();
        // API 응답이 배열인지 확인하여 .map() 오류 방지
        if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          console.error(
            "API로부터 배열이 아닌 응답을 받았습니다 (departments):",
            data
          );
          setDepartments([]);
        }
      } catch (error) {
        console.error("부서 목록 로딩 실패:", error);
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, [selectedSite]);

  // --- 3. 폼 제출 핸들러 ---
  const onLoginSubmit = (e) => {
    e.preventDefault();
    handleLogin({ username, password });
  };

  const onSignupSubmit = (e) => {
    e.preventDefault();
    if (!selectedCompany || !selectedSite || !selectedDepartment) {
      alert("소속 정보를 모두 선택해주세요.");
      return;
    }
    handleSignup({
      username,
      password,
      fullName,
      code,
      department: selectedDepartment,
      businessSite: selectedSite,
      company: selectedCompany,
    });
  };

  // --- 4. JSX 렌더링 ---
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <MessageCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">
            {isLoginView ? "채팅 로그인" : "회원가입"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isLoginView ? "계정 정보로 로그인하세요" : "새 계정을 만드세요"}
          </p>
        </div>

        {isLoginView ? (
          // --- 로그인 폼 ---
          <form onSubmit={onLoginSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 이름
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
            >
              로그인
            </button>
            <p className="text-center text-sm text-gray-600 mt-4">
              계정이 없으신가요?{" "}
              <button
                type="button"
                onClick={() => setIsLoginView(false)}
                className="font-medium text-blue-600 hover:underline"
              >
                회원가입
              </button>
            </p>
          </form>
        ) : (
          // --- 회원가입 폼 ---
          <form onSubmit={onSignupSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 이름 (로그인 ID)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성명
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사번
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                회사
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">회사를 선택하세요</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업장
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={!selectedCompany}
                required
              >
                <option value="">사업장을 선택하세요</option>
                {sites
                  .filter(
                    (site) => String(site.company) === String(selectedCompany)
                  )
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부서
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={!selectedSite}
                required
              >
                <option value="">부서를 선택하세요</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
            >
              가입하기
            </button>
            <p className="text-center text-sm text-gray-600 mt-4">
              이미 계정이 있으신가요?{" "}
              <button
                type="button"
                onClick={() => setIsLoginView(true)}
                className="font-medium text-blue-600 hover:underline"
              >
                로그인
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
