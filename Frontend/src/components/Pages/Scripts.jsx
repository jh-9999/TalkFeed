import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Scripts.css";

function Scripts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [script, setScript] = useState(""); // 스크립트 상태 추가

  const handleScriptChange = (e) => {
    setScript(e.target.value);
  };

  // "완료" 버튼 클릭 시, 입력한 스크립트를 UploadVideo.jsx로 전달
  const handleComplete = () => {
    navigate("/uploadvideo", { state: { original_script: script } });
  };

  // "스크립트 생성" 버튼 클릭 시 바로 /create-scripts 페이지로 이동
  const handleCreateScript = () => {
    navigate("/create-scripts");
  };

  return (
    <div className="scripts-container">
      {/* ✅ TalkFeed 로고 & 햄버거 메뉴 아이콘 추가 */}
      <div className="header">
        <h1 className="header-title">TalkFeed</h1>
        <span className="material-icons menu-icon">menu</span>
      </div>

      {/* 네비게이션 바 */}
      <header className="scripts-header">
        <div className="scripts-nav">
          <span
            className={location.pathname === "/scripts" ? "active-tab" : ""}
            onClick={() => navigate("/scripts")}
          >
            Scripts
          </span>
          <span
            className={location.pathname === "/video" ? "active-tab" : ""}
            onClick={() => navigate("/video")}
          >
            Video
          </span>
          <span
            className={location.pathname === "/feedback" ? "active-tab" : ""}
            onClick={() => navigate("/feedback")}
          >
            Feedback
          </span>
        </div>
      </header>

      {/* 스크립트 입력 박스 */}
      <textarea
        className="scripts-textarea"
        placeholder="스크립트 입력"
        value={script}
        onChange={handleScriptChange}
      ></textarea>

      {/* 완료 버튼: 입력한 스크립트를 UploadVideo.jsx로 전달 */}
      <button className="scripts-button" onClick={handleComplete}>
        완료
      </button>

      {/* 스크립트 생성 버튼: 클릭 시 바로 /create-scripts 페이지로 이동 */}
      <div className="scripts-create" onClick={handleCreateScript}>
        <span className="material-icons">add_circle_outline</span>
        <span className="scripts-create-text">스크립트 생성</span>
        <span className="material-icons">arrow_forward</span>
      </div>
    </div>
  );
}

export default Scripts;
