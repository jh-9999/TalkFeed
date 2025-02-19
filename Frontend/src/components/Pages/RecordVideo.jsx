import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./RecordVideo.css";

function RecordVideo() {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const navigate = useNavigate();
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
    const handleSaveRecording = () => {
        if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const videoURL = URL.createObjectURL(blob);
    
            // 🔹 녹화된 비디오를 localStorage에 저장 (선택 사항)
            localStorage.setItem("recordedVideo", videoURL);
    
            // 🔹 다운로드 자동 실행
            const a = document.createElement("a");
            a.href = videoURL;
            a.download = "recorded-video.webm"; // 🔹 파일 이름 설정
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
    
            // 🔹 업로드 페이지로 이동
            navigate("/uploadvideo");
        }
    };

    return (
        <div className="record-video-container">

            {/* 네비게이션 */}
            <div className="scripts-nav">
                <span className={location.pathname.includes("scripts") ? "active-tab" : ""} onClick={() => navigate("/scripts")}>
                    Scripts
                </span>
                <span className={location.pathname.includes("video") || location.pathname.includes("record") ? "active-tab" : ""} 
                    onClick={() => navigate("/uploadvideo")}>
                    Video
                </span>
                <span className={location.pathname.includes("feedback") ? "active-tab" : ""} onClick={() => navigate("/feedback")}>
                    Feedback
                </span>
            </div>

            {/* ✅ 녹화 화면 박스 (수정된 부분) */}
            <div className="record-box">
                <video ref={videoRef} autoPlay playsInline className="video-preview" />
                {!stream && <span className="camera-icon material-icons">photo_camera</span>}
            </div>            

            {/* ✅ 녹화 시작 및 중지 버튼 */}
            <button className={recording ? "recording-stop-button" : "recording-start-button"} 
                    onClick={stream ? (recording ? stopRecording : startRecording) : startWebcam}>
                {stream ? (recording ? "녹화 중단" : "녹화 시작") : "카메라 켜기"}
            </button>

            {/* ✅ 완료 버튼 (녹화 저장 & 업로드 페이지 이동) */}
            <button className="record-done-button" onClick={handleSaveRecording}>
                완료
            </button>
        </div>
    );
}

export default RecordVideo;
