import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CreateScriptsOutput.css";

function CreateScriptsOutput() {
  const navigate = useNavigate();
  const location = useLocation();
  // location.state에서 script를 가져오고, 없으면 localStorage에서 읽어옵니다.
  const initialScript = location.state?.script || localStorage.getItem("generatedScript") || "";
  const [script, setScript] = useState(initialScript);

  // 컴포넌트가 마운트될 때, location.state에 script가 있으면 localStorage에 저장합니다.
  useEffect(() => {
    if (location.state?.script) {
      localStorage.setItem("generatedScript", location.state.script);
      setScript(location.state.script);
    }
  }, [location.state]);

  // 스크립트 재생성 버튼 클릭 시 CreateScripts.jsx로 이동
  const handleReplay = () => {
    navigate("/create-scripts");
  };

  // 스크립트 저장 버튼 클릭 시 (파일 다운로드)
  const handleSaveScript = () => {
    const blob = new Blob([script], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "script.txt";
    link.click();
  };

  // 동영상 업로드 페이지로 이동할 때 생성된 스크립트를 state에 포함시킵니다.
  const handleUploadVideo = () => {
    navigate("/uploadvideo", { state: { script } });
  };

  return (
    <div className="scripts-output-container">
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
