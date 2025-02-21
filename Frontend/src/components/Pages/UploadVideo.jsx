import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./UploadVideo.css";

function UploadVideo() {
    const navigate = useNavigate();
    const location = useLocation();
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setUploadedFiles(files);
    };

    const handleUpload = async () => {
        if (uploadedFiles.length === 0) {
            alert("업로드할 파일을 선택하세요.");
            return;
        }
        const formData = new FormData();
        uploadedFiles.forEach((file) => {
            formData.append("file", file);
        });
        try {
            const response = await axios.post("http://localhost:5000/upload/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log("업로드 성공:", response.data);
            navigate("/uploadvideo");
        } catch (error) {
            console.error("업로드 실패:", error);
        }
    };

    return (
        <div className="video-container">
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

            <label className="upload-box">
                <div className="upload-placeholder">
                    <img src="/images/upload_icon.png" alt="업로드 아이콘" className="upload-icon" />
                    <p>{uploadedFiles.length > 0 ? `${uploadedFiles.length}개 선택됨` : "파일을 선택하여 업로드하세요."}</p>
                </div>
                <input type="file" accept="video/*" multiple onChange={handleFileChange} hidden />
            </label>

            <button className="upload-done-button" onClick={handleUpload}>완료</button>

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
