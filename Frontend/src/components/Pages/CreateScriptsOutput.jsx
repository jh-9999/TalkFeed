import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CreateScriptsOutput.css";

function CreateScriptsOutput() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialScript = location.state?.script || localStorage.getItem("generatedScript") || "";
  const [script, setScript] = useState(initialScript);

  useEffect(() => {
    if (location.state?.script) {
      localStorage.setItem("generatedScript", location.state.script);
      setScript(location.state.script);
    }
  }, [location.state]);

  const handleReplay = () => {
    navigate("/create-scripts");
  };

  const handleSaveScript = () => {
    const blob = new Blob([script], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "script.txt";
    link.click();
  };

  const handleUploadVideo = () => {
    navigate("/uploadvideo", { state: { script } });
  };

  return (
    <div className="scripts-output-container">

      {/* ✅ TalkFeed 로고 & 햄버거 메뉴 아이콘 추가 */}
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
          onClick={handleUploadVideo}
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
      <button className="scripts-upload-button" onClick={handleUploadVideo}>
        <span className="material-icons" style={{ color: "white" }}>
          videocam
        </span>
        발표 영상 업로드 및 녹화
        <span className="material-icons" style={{ color: "white" }}>
          arrow_forward
        </span>
      </button>
    </div>
  );
}

export default CreateScriptsOutput;
