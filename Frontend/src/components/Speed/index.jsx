import React, { useState } from "react";
import axios from "axios";

function Speed() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

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
        <button
          style={buttonStyle}
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? "분석 중..." : "분석하기"}
        </button>
      </div>

      {results && (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <h2>분석 결과</h2>
          {results.map((segment) => (
            <div
              key={segment.segment}
              style={{
                backgroundColor: "#f8f9fa",
                padding: "10px",
                margin: "10px 0",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            >
              <p>
                <strong>구간:</strong> {segment.segment}
              </p>
              <p>
                <strong>길이:</strong> {segment.duration.toFixed(2)}초
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
      )}
    </div>
  );
}

export default Speed;
