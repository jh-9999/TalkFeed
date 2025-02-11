import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadVideo.css";

function UploadVideo() {
    const navigate = useNavigate();
    const [videoPreview, setVideoPreview] = useState(null); // 🔹 영상 미리보기 상태

    // 🔹 파일 선택 시 실행되는 함수
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const videoURL = URL.createObjectURL(file);
            setVideoPreview(videoURL); // 🔹 미리보기 URL 설정
        }
    };

    return (
        <div className="upload-video-container">
            <h1 className="upload-video-title">Video</h1>

            {/* 🔹 영상 업로드 박스 */}
            <label className="upload-box">
                {videoPreview ? (
                    <video className="video-preview" src={videoPreview} controls />
                ) : (
                    <div className="upload-placeholder">
                        <img src="/images/upload_icon.png" alt="업로드 아이콘" className="upload-icon" />
                        <p>파일을 선택하여 업로드하세요.</p>
                    </div>
                )}
                <input type="file" accept="video/*" onChange={handleFileChange} hidden />
            </label>

            {/* 🔹 완료 버튼 */}
            <button className="upload-done-button">완료</button>

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
