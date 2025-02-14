import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./style.css";

const Record = () => {
    const [recording, setRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const mediaRecorderRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const startRecording = async () => {
      try {
          // 🎤 오디오 & 비디오 활성화
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
  
          // 🎤 마이크 감지 여부 확인
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length === 0) {
              console.warn("⚠️ 오디오 트랙이 없습니다! 마이크가 감지되지 않거나, 권한이 없을 수 있습니다.");
          } else {
              console.log("🎤 오디오 트랙이 정상적으로 추가됨:", audioTracks);
          }
  
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
  
          // 🔹 WebM 녹화 (오디오 포함)
          const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9,opus" });
          mediaRecorderRef.current = mediaRecorder;
  
          mediaRecorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                  setRecordedChunks((prev) => [...prev, event.data]);
              }
          };
  
          mediaRecorder.start();
          setRecording(true);
      } catch (error) {
          console.error("카메라/마이크 접근 오류:", error);
          alert("카메라 또는 마이크에 접근할 수 없습니다.");
      }
  };
  

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        setRecording(false);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
    };

    const saveVideo = async () => {
        if (recordedChunks.length === 0) {
            alert("녹화된 영상이 없습니다!");
            return;
        }

        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recorded_video.webm");

        try {
            console.log("🚀 업로드 시작...");
            const response = await fetch("http://localhost:8000/upload/", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            console.log("📌 서버 응답:", data);

            if (response.ok) {
                alert(data.message || "업로드 성공!");
                setRecordedChunks([]);
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            } else {
                alert(`업로드 실패: ${data.error || "서버 응답 오류"}`);
            }

        } catch (error) {
            console.error("❌ 업로드 오류:", error);
            alert("업로드 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="container">
            <h1>동영상 녹화 (클라이언트 측)</h1>
            <video ref={videoRef} autoPlay controls style={{ width: "400px" }} />
            <button onClick={recording ? stopRecording : startRecording}>
                {recording ? "녹화 중지" : "녹화 시작"}
            </button>
            {!recording && recordedChunks.length > 0 && <button onClick={saveVideo}>동영상 저장(업로드)</button>}
            <Link to="/"><button>뒤로 가기</button></Link>
        </div>
    );
};

export default Record;
