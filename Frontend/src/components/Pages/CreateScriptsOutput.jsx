import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CreateScriptsOutput.css";

function CreateScriptsOutput() {
  const navigate = useNavigate();
  const location = useLocation();
  const script = location.state?.script || ""; // 전달받은 스크립트 결과

  // 스크립트 재생성 버튼 클릭 시 CreateScripts.jsx로 이동
  const handleReplay = () => {
    navigate("/create-scripts");
  };

  // 스크립트 저장 버튼 클릭 시 동작 (파일 다운로드)
  const handleSaveScript = () => {
    const blob = new Blob([script], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "script.txt";
    link.click();
  };

  return (
    <div className="scripts-output-container">

      <div className="header">
          <h1 className="header-title">TalkFeed</h1>
          <span className="material-icons menu-icon">menu</span>
      </div>

      {/* 네비게이션 */}
      <div className="scripts-nav">
        <span
          className={location.pathname.includes("scripts") ? "active-tab" : ""}
          onClick={() => navigate("/scripts")}
        >
          Scripts
        </span>
        <span
          className={location.pathname.includes("video") ? "active-tab" : ""}
          onClick={() => navigate("/uploadvideo")}
        >
          Video
        </span>
        <span
          className={location.pathname.includes("feedback") ? "active-tab" : ""}
          onClick={() => navigate("/feedback")}
        >
          Feedback
        </span>
      </div>

      {/* 생성된 스크립트 박스 */}
      <textarea 
        className="scripts-output-box"
        placeholder="생성된 스크립트"
        readOnly
        value={script}
      />

      {/* 스크립트 재생성 버튼 */}
      <button className="scripts-replay-button" onClick={handleReplay}>
        스크립트 재생성
      </button>

      {/* 스크립트 저장 버튼 */}
      <button className="scripts-save-button" onClick={handleSaveScript}>
        스크립트 저장
      </button>

      {/* 발표 영상 업로드 및 녹화 버튼 */}
      <button className="scripts-upload-button" onClick={() => navigate("/uploadvideo")}>
        <span className="material-icons" style={{ color: "white" }}>videocam</span> 
        발표 영상 업로드 및 녹화
        <span className="material-icons" style={{ color: "white" }}>arrow_forward</span>
      </button>
    </div>
  );
}

export default CreateScriptsOutput;
