import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./UploadVideo.css";

function UploadVideo() {
    const navigate = useNavigate();
    const location = useLocation();
    const [uploadedFiles, setUploadedFiles] = useState([]); // ✅ 업로드된 파일 리스트 상태 추가

    // 🔹 파일 선택 시 실행되는 함수
    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setUploadedFiles(files); // ✅ 파일 개수 업데이트
    };

    return (
        <div className="video-container">
            
            {/* ✅ 네비게이션 */}
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

            {/* 🔹 영상 업로드 박스 */}
            <label className="upload-box">
                <div className="upload-placeholder">
                    <img src="/images/upload_icon.png" alt="업로드 아이콘" className="upload-icon" />
                    <p>{uploadedFiles.length > 0 ? `${uploadedFiles.length}개 선택됨` : "파일을 선택하여 업로드하세요."}</p>
                </div>
                <input type="file" accept="video/*" multiple onChange={handleFileChange} hidden />
            </label>

            {/* 🔹 완료 버튼 */}
            <button className="upload-done-button">완료</button>

            {/* ✅ 비디오 녹화 버튼 */}
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
