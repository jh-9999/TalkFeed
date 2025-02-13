import React, { useState } from "react";

const EmotionAnalysis = () => {
  const [files, setFiles] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 감정별 이모지 매핑
  const emotionIcons = {
    happy: "😃",
    sad: "😢",
    neutral: "😐",
    angry: "😡",
    surprise: "😲",
    fear: "😨",
    disgust: "🤢",
  };

  // 파일 선택 핸들러 (여러 이미지 파일 선택, 이미지 파일만 허용)
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowedFormats = ["image/jpeg", "image/png", "image/gif"];
    const validFiles = selectedFiles.filter((file) =>
      allowedFormats.includes(file.type)
    );
    if (validFiles.length !== selectedFiles.length) {
      alert("이미지 파일만 업로드 가능합니다.");
    }
    console.log("Selected files:", validFiles);
    setFiles(validFiles);
  };

  // 폼 제출 시 FastAPI의 /analyze-images 엔드포인트 호출
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("파일을 선택해주세요");
      return;
    }
    setLoading(true);
    setError(null);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    console.log("Sending files to server...");

    try {
      const response = await fetch("http://localhost:8000/analyze-images", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Received analysis:", data);
      setAnalysis(data.results);
    } catch (error) {
      console.error("Error:", error);
      setError("분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>📷 이미지 표정 분석</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="file-input"
          />
        </div>
        {files.length > 0 && (
          <div>
            <p>✅ 선택된 파일: {files.map((file) => file.name).join(", ")}</p>
          </div>
        )}
        <button type="submit" disabled={files.length === 0 || loading}>
          {loading ? "🔍 분석 중..." : "🎬 분석 시작"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>⚠ {error}</p>}

      {analysis && (
        <div className="analysis-results">
          <h2>🔎 분석 결과</h2>
          {Object.keys(analysis).map((filename, index) => (
            <div key={index} className="result-item">
              <h3>{filename}</h3>
              {analysis[filename].results === null ? (
                <p>얼굴 인식 없음</p>
              ) : typeof analysis[filename].results === "string" ? (
                <p>{analysis[filename].results}</p>
              ) : (
                analysis[filename].results.map((result, idx) => (
                  <div key={idx}>
                    <p>
                      {emotionIcons[result.emotion] || "❓"} 감정:{" "}
                      <strong>{result.emotion}</strong> (신뢰도:{" "}
                      {result.confidence.toFixed(2)}%)
                    </p>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmotionAnalysis;
