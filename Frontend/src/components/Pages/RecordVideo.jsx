import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./RecordVideo.css";

function RecordVideo() {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const generatedScript = location.state?.script || localStorage.getItem("generatedScript") || "";
  console.log("RecordVideo - 전달받은 AI 스크립트:", generatedScript);

  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const startWebcam = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error("웹캠 활성화 실패:", error);
      alert("웹캠을 활성화할 수 없습니다. 권한을 확인하세요.");
    }
  };

  const startRecording = () => {
    if (!stream) {
      alert("먼저 카메라를 켜주세요.");
      return;
    }
    const options = { mimeType: "video/webm;codecs=vp8,opus" };
    let recorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (e) {
      console.error("MediaRecorder 생성 실패:", e);
      alert("녹화가 지원되지 않는 브라우저입니다.");
      return;
    }
    mediaRecorderRef.current = recorder;
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = () => {
      console.log("녹화 종료됨, 청크 개수:", chunks.length);
      setRecordedChunks(chunks);
    };
    recorder.start();
    setRecording(true);
    console.log("녹화 시작됨");
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      console.log("녹화 중지 요청됨");
    }
  };

  const handleSaveRecording = async () => {
    if (recordedChunks.length === 0) {
      alert("녹화된 데이터가 없습니다. 녹화를 중지했는지 확인하세요.");
      return;
    }
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const formData = new FormData();
    formData.append("file", blob, "recorded-video.webm");
    formData.append("original_script", generatedScript);

    try {
      const response = await fetch("http://localhost:8000/vod/upload/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("업로드 성공:", data);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      navigate("/feedback", { state: { analysisResults: data } });
    } catch (error) {
      console.error("업로드 실패:", error);
      alert("업로드에 실패했습니다.");
    }
  };

  return (
    <div className="record-video-container">

      {/* ✅ TalkFeed 로고 & 햄버거 메뉴 아이콘 추가 */}
      <div className="header">
        <h1 className="header-title">TalkFeed</h1>
        <span className="material-icons menu-icon">menu</span>
      </div>

      <div className="scripts-nav">
        <span className={location.pathname.includes("scripts") ? "active-tab" : ""} onClick={() => navigate("/scripts")}>Scripts</span>
        <span className={(location.pathname.includes("video") || location.pathname.includes("record")) ? "active-tab" : ""} onClick={() => navigate("/uploadvideo")}>Video</span>
        <span className={location.pathname.includes("feedback") ? "active-tab" : ""} onClick={() => navigate("/feedback")}>Feedback</span>
      </div>

      <div className="record-box">
        <video ref={videoRef} autoPlay playsInline className="video-preview" />
        {!stream && <span className="camera-icon material-icons">photo_camera</span>}
      </div>

      <button className={recording ? "recording-stop-button" : "recording-start-button"} onClick={() => {
        if (!stream) {
          startWebcam();
        } else {
          recording ? stopRecording() : startRecording();
        }
      }}>
        {!stream ? "카메라 켜기" : recording ? "녹화 중단" : "녹화 시작"}
      </button>

      <button className="record-done-button" onClick={handleSaveRecording}>완료</button>
    </div>
  );
}

export default RecordVideo;
