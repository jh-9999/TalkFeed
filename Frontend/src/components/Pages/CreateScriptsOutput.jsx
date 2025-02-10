import React from "react";
import { useNavigate } from "react-router-dom";
import "./CreateScriptsOutput.css";

function CreateScriptsOutput() {
    const navigate = useNavigate();

    // 🔹 스크립트 재생성 버튼 클릭 시 CreateScripts.jsx로 이동
    const handleReplay = () => {
        navigate("/create-scripts"); // ✅ 즉시 이동
    };

    return (
        <div className="scripts-output-container">
            <h1 className="scripts-output-title">Scripts</h1>

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
            <button className="scripts-upload-button" onClick={() => navigate("/upload")}>
                <span className="material-icons">videocam</span> 발표 영상 업로드 및 녹화 
                <span className="material-icons">arrow_forward</span>
            </button>
        </div>
    );
}

export default CreateScriptsOutput;
