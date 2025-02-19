import React, { useState } from "react";
import axios from "axios";

function Speed() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 파일 선택 핸들러
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // 서버로 업로드하여 분석 요청
  const handleUpload = async () => {
    if (!file) {
      alert("파일을 선택하세요.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await axios.post("http://localhost:8000/upload-audio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResults(response.data.results);
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  // 초 -> 분:초 변환 함수
  const formatTime = (seconds) => {
    const totalSeconds = Math.floor(seconds); // 소수점 버림
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}분 ${secs}초`;
  };

  // 결과 데이터를 바탕으로 종합 정보를 계산
  const calculateSummary = (segments) => {
    let totalDuration = 0;
    let totalVolume = 0;
    let rateCounts = {};

    segments.forEach(segment => {
      totalDuration += segment.duration;
      totalVolume += segment.volume;
      rateCounts[segment.rate] = (rateCounts[segment.rate] || 0) + 1;
    });

    const totalSegments = segments.length;
    return {
      totalSegments,
      averageDuration: totalSegments ? (totalDuration / totalSegments) : 0,
      averageVolume: totalSegments ? (totalVolume / totalSegments) : 0,
      rateCounts,
    };
  };

  // summary 객체 생성
  const summary = results ? calculateSummary(results) : null;

  // 스타일 정의
  const containerStyle = {
    maxWidth: "600px",
    margin: "20px auto",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
  };

  const buttonStyle = {
    backgroundColor: uploading ? "#ccc" : "#28a745",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: uploading ? "not-allowed" : "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s ease",
  };

  const fileNameStyle = {
    marginTop: "10px",
    fontSize: "14px",
    color: "#555",
  };

  const segmentStyle = {
    backgroundColor: "#f8f9fa",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
    border: "1px solid #ddd",
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px", color: "#333" }}>발표 속도 측정</h1>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <label
          style={{
            display: "inline-block",
            backgroundColor: "#007BFF",
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          파일 선택
        </label>
        {file && <span style={fileNameStyle}>{file.name}</span>}
        <button style={buttonStyle} onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? "분석 중..." : "분석하기"}
        </button>
      </div>

      {results && (
        <>
          {/* 세부 구간 결과 (변경 없음) */}
          <div style={{ marginTop: "20px", textAlign: "left" }}>
            <h2>세부 구간 결과</h2>
            {results.map((segment) => (
              <div key={segment.segment} style={segmentStyle}>
                <p>
                  <strong>구간:</strong> {segment.segment}
                </p>
                <p>
                  <strong>시간대:</strong>{" "}
                  {formatTime(segment.start_time)} ~ {formatTime(segment.end_time)}
                </p>
                <p>
                  <strong>볼륨:</strong> {segment.volume.toFixed(2)}dB
                </p>
                <p>
                  <strong>속도:</strong> {segment.rate}
                </p>
              </div>
            ))}
          </div>

          {/* 종합 결과 (수정된 부분) */}
          <div style={{ marginTop: "20px", textAlign: "left" }}>
            <h2>종합 결과</h2>
            <p><strong>전체 구간 수:</strong> {summary.totalSegments}</p>
            <p>
              <strong>평균 길이:</strong> {summary.averageDuration.toFixed(2)}초,{" "}
              <strong>평균 볼륨:</strong> {summary.averageVolume.toFixed(2)}dB
            </p>
            <div>
              <strong>속도 분류 빈도:</strong>
              <ul>
                {/*
                  원하는 순서를 명시적으로 지정:
                  "매우 빠름" -> "빠름" -> "보통" -> "느림" -> "매우 느림"
                */}
                {["매우 빠름", "빠름", "보통", "느림", "매우 느림"].map(rate => (
                  <li key={rate}>
                    {rate}: {summary.rateCounts[rate] || 0}개
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Speed;
