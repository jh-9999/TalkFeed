import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./UploadVideo.css";

function UploadVideo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const originalScript = location.state?.original_script || "";

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(files);
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      alert("업로드할 파일을 선택하세요.");
      return;
    }
    if (!originalScript.trim()) {
      alert("원본 스크립트가 없습니다.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const videoFormData = new FormData();
      uploadedFiles.forEach((file) => {
        videoFormData.append("file", file);
      });
      videoFormData.append("original_script", originalScript);

      const vodResponse = await axios.post("http://localhost:8000/vod/upload/", videoFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("vod.py 처리 완료:", vodResponse.data);

      navigate("/feedback", { state: { analysisResults: vodResponse.data } });
    } catch (err) {
      console.error("업로드 및 처리 실패:", err);
      setError("업로드 또는 처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-container">

      {/* ✅ TalkFeed 로고 & 햄버거 메뉴 아이콘 추가 */}
      <div className="header">
        <h1 className="header-title">TalkFeed</h1>
        <span className="material-icons menu-icon">menu</span>
      </div>

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

      <label className="upload-box">
        <div className="upload-placeholder">
          <img src="/images/upload_icon.png" alt="업로드 아이콘" className="upload-icon" />
          <p>
            {uploadedFiles.length > 0
              ? `${uploadedFiles.length}개 선택됨`
              : "파일을 선택하여 업로드하세요."}
          </p>
        </div>
        <input type="file" accept="video/*" multiple onChange={handleFileChange} hidden />
      </label>

      {error && <p className="error-message" style={{ color: "red" }}>{error}</p>}

      <button className="upload-done-button" onClick={handleUpload} disabled={loading}>
        {loading ? "처리 중..." : "업로드 및 분석 시작"}
      </button>

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
