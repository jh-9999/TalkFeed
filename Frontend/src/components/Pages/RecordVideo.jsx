import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./RecordVideo.css";

function RecordVideo() {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const navigate = useNavigate(); // ✅ 페이지 이동을 위한 useNavigate 추가
    const location = useLocation();
    const [stream, setStream] = useState(null);
    const [recording, setRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);

    // 🔹 웹캠 활성화 및 스트림 설정
    const startWebcam = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (error) {
            console.error("웹캠을 활성화할 수 없습니다:", error);
        }
    };

    // 🔹 녹화 시작
    const startRecording = () => {
        if (!stream) return;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        const chunks = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        recorder.onstop = () => {
            setRecordedChunks(chunks);
        };

        recorder.start();
        setRecording(true);
    };

    // 🔹 녹화 중지
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    return (
        <div className="record-container">

            {/* ✅ 네비게이션 */}
            <div className="record-nav">
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

            {/* 🔹 실시간 녹화 화면 */}
            <div className="record-box">
                <video ref={videoRef} autoPlay playsInline className="video-preview" />
            </div>

            {/* 🔹 버튼 */}
            <button className="record-button" onClick={stream ? (recording ? stopRecording : startRecording) : startWebcam}>
                {stream ? (recording ? "녹화 중지" : "녹화 시작") : "카메라 켜기"}
            </button>

            {/* 🔹 녹화 완료된 비디오 다운로드 */}
            {recordedChunks.length > 0 && (
                <a
                    href={URL.createObjectURL(new Blob(recordedChunks, { type: "video/webm" }))}
                    download="recorded-video.webm"
                    className="download-link"
                >
                    녹화된 비디오 다운로드
                </a>
            )}

            {/* 🔹 발표 영상 업로드 버튼 추가 (UploadVideo.jsx로 이동) */}
            <button className="upload-video-button" onClick={() => navigate("/upload")}>
                <span className="material-icons" style={{ color: "white" }}>file_upload</span> 발표 영상 업로드
                <span className="material-icons" style={{ color: "white" }}>arrow_forward</span>
            </button>
        </div>
    );
}

export default RecordVideo;
