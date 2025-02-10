import React from "react";
import "./RecordVideo.css";

function RecordVideo() {
    return (
        <div className="record-container">
            <h1 className="record-title">Video</h1>

            {/* 🔹 실시간 녹화 화면 박스 */}
            <textarea 
                className="record-box"
                placeholder="실시간 녹화 화면"
                readOnly
            />

            {/* 🔹 녹화 시작 버튼 */}
            <button className="record-button">
                녹화 시작
            </button>
        </div>
    );
}

export default RecordVideo;
