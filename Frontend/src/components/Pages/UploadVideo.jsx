import React from "react";
import { useNavigate } from "react-router-dom";
import "./UploadVideo.css";

function UploadVideo() {
    const navigate = useNavigate();

    return (
        <div className="video-container">
            <h1 className="video-title">Video</h1>

            {/* 🔹 업로드된 발표 영상 박스 */}
            <textarea 
                className="video-upload-box"
                placeholder="업로드된 발표 영상"
                readOnly
            />

            {/* 🔹 완료 버튼 */}
            <button className="video-complete-button">
                완료
            </button>

            {/* 🔹 비디오 녹화 버튼 */}
            <div className="video-record-section" onClick={() => navigate("/record")}>
                <div className="record-icon">
                    <span className="material-icons">fiber_manual_record</span>
                </div>
                <span className="video-record-text">비디오 녹화</span>
                <span className="material-icons">arrow_forward</span>
            </div>
        </div>
    );
}

export default UploadVideo;
