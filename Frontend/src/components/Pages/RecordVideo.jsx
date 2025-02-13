import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./RecordVideo.css";

const RecordVideo = () => {
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videoURL, setVideoURL] = useState(null);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [stopTime, setStopTime] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // 녹화 시작 함수
  const startRecording = async () => {
    try {
      setError(null);
      setRecording(true);
      setRecordedChunks([]);
      setVideoURL(null);
      setStartTime(Date.now());

      // 웹캠(비디오 + 오디오) 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      // 오디오 트랙 확인
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn("⚠️ 오디오 트랙이 없습니다! (마이크 미감지 또는 권한 문제)");
      } else {
        console.log("🎤 오디오 트랙 감지:", audioTracks);
      }

      // 비디오 요소에 스트림 연결
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // MediaRecorder 생성 (WebM 형식, vp9 & opus 코덱 사용)
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9,opus",
      });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorderRef.current.start();
      console.log("녹화 시작");
    } catch (err) {
      console.error("녹화 시작 에러:", err);
      setError("카메라 또는 마이크에 접근할 수 없습니다.");
      setRecording(false);
    }
  };

  // 녹화 중지 함수
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
    setStopTime(Date.now());

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    console.log("녹화 중지");
  };

  // 녹화 완료 후 Blob으로 변환하여 URL 생성
  useEffect(() => {
    if (!recording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      console.log("녹화 완료. URL 생성:", url);
    }
  }, [recordedChunks, recording]);

  // 서버에 녹화된 영상을 업로드하는 함수
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
        setVideoURL(null);
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
    <div className="record-container">
      <h1 className="record-title">Video</h1>
      <div className="video-wrapper">
        {videoURL ? (
          <video src={videoURL} controls className="record-box" />
        ) : (
          <video ref={videoRef} autoPlay muted className="record-box" />
        )}
      </div>
      <div className="record-video-controls">
        {!recording ? (
          <button onClick={startRecording} className="record-button">
            녹화 시작
          </button>
        ) : (
          <button onClick={stopRecording} className="record-button stop">
            녹화 중지
          </button>
        )}
        {!recording && recordedChunks.length > 0 && (
          <button onClick={saveVideo} className="record-button">
            동영상 저장(업로드)
          </button>
        )}
      </div>
      <Link to="/"><button className="record-button">뒤로 가기</button></Link>
      {startTime && stopTime && (
        <div className="record-info">
          <p>녹화 시간: {((stopTime - startTime) / 1000).toFixed(2)}초</p>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default RecordVideo;
