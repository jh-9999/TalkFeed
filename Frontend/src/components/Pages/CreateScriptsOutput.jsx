import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CreateScriptsOutput.css";

function CreateScriptsOutput() {
    const navigate = useNavigate();
    const location = useLocation();

    // 🔹 스크립트 재생성 버튼 클릭 시 CreateScripts.jsx로 이동
    const handleReplay = () => {
        navigate("/create-scripts"); // ✅ 즉시 이동
    };

    return (
        <div className="scripts-output-container">

            {/* 네비게이션 */}
            <div className="scripts-nav">
                <span className={location.pathname.includes("scripts") ? "active-tab" : ""} onClick={() => navigate("/scripts")}>
                    Scripts
                </span>
                <span className={location.pathname.includes("video") ? "active-tab" : ""} onClick={() => navigate("/uploadvideo")}>
                    Video
                </span>
                <span className={location.pathname.includes("feedback") ? "active-tab" : ""} onClick={() => navigate("/feedback")}>
                    Feedback
                </span>
            </div>

            {/* 🔹 생성된 스크립트 박스 */}
            <textarea 
                className="scripts-output-box"
                placeholder="생성된 스크립트"
                readOnly
            />

            {/* 🔹 스크립트 재생성 버튼 */}
            <button className="scripts-replay-button" onClick={handleReplay}>
                스크립트 재생성
            </button>

            {/* 🔹 발표 영상 업로드 및 녹화 버튼 */}
            <button className="scripts-upload-button" onClick={() => navigate("/uploadvideo")}>
                <span className="material-icons" style={{ color: "white" }}>videocam</span> 
                발표 영상 업로드 및 녹화
                <span className="material-icons" style={{ color: "white" }}>arrow_forward</span>
            </button>
        </div>
    );
}

export default CreateScriptsOutput;
