import React, { useState, useEffect } from "react";

// 이미지 리사이즈 함수
function resizeImage(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      let width = image.width;
      let height = image.height;

      // 가로 길이가 더 큰 경우
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      // 세로 길이가 더 큰 경우
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      // Canvas에 그리기
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, width, height);

      // canvas를 Blob으로 변환
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        // 기존 파일명, 타입, 수정시간을 활용해 새 File 생성
        const resizedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now(),
        });
        resolve(resizedFile);
      }, file.type);
    };
    image.onerror = (err) => reject(err);

    // 브라우저 메모리에 로드
    image.src = URL.createObjectURL(file);
  });
}

const EmotionAnalysis = () => {
  const [files, setFiles] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previews, setPreviews] = useState([]);

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

  // 전체 감정 갯수 집계
  const overallCounts = Object.values(analysis || {}).reduce((acc, fileAnalysis) => {
    if (fileAnalysis && fileAnalysis.results && Array.isArray(fileAnalysis.results)) {
      fileAnalysis.results.forEach(result => {
        const emotion = result.emotion;
        acc[emotion] = (acc[emotion] || 0) + 1;
      });
    }
    return acc;
  }, {});

  // 파일 선택 핸들러 (이미지 파일만 허용)
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowedFormats = ["image/jpeg", "image/png", "image/gif"];
    const validFiles = selectedFiles.filter((file) =>
      allowedFormats.includes(file.type)
    );
    if (validFiles.length !== selectedFiles.length) {
      alert("이미지 파일만 업로드 가능합니다.");
    }

    // 파일을 1024×768 이하로 리사이즈
    try {
      const resizedPromises = validFiles.map((file) =>
        resizeImage(file, 1024, 768)
      );
      const resizedFiles = await Promise.all(resizedPromises);
      setFiles(resizedFiles);

      // 파일 미리보기 URL 생성
      const previewsArray = resizedFiles.map((file) => URL.createObjectURL(file));
      setPreviews(previewsArray);
    } catch (err) {
      console.error("Error resizing images:", err);
    }
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
    try {
      const response = await fetch("http://localhost:8000/analyze-images", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setAnalysis(data.results);
    } catch (error) {
      console.error("Error:", error);
      setError("분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // CSS 스타일 삽입 (기존과 동일)
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .container {
        max-width: 960px;
        margin: 0 auto;
        padding: 20px;
        font-family: sans-serif;
        text-align: center;
      }
      .file-input {
        margin: 10px 0;
      }
      .error {
        color: red;
      }
      .results-section {
        margin-top: 30px;
      }
      .gallery-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
        margin-top: 20px;
      }
      .card {
        position: relative;
        border: 1px solid #ccc;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .image-container {
        position: relative;
      }
      .image-container img {
        width: 100%;
        height: auto;
        display: block;
      }
      .overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        padding: 10px;
        font-size: 14px;
        text-align: left;
      }
      .file-name {
        margin: 0 0 8px;
        font-size: 16px;
      }
      .emotion-result {
        margin-bottom: 8px;
      }
      .emoji {
        font-size: 20px;
        margin-right: 6px;
      }
      .emotion-label {
        font-weight: bold;
        margin-right: 8px;
      }
      .confidence-bar {
        background: #ddd;
        border-radius: 4px;
        height: 8px;
        overflow: hidden;
        margin: 4px 0;
      }
      .confidence-fill {
        background: #4caf50;
        height: 100%;
        transition: width 0.3s ease;
      }
      .confidence-text {
        font-size: 12px;
      }
      .overall-count {
        margin-top: 20px;
        text-align: left;
      }
      .overall-count ul {
        list-style: none;
        padding: 0;
      }
      .overall-count li {
        font-size: 16px;
        margin: 4px 0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 미리보기 URL 해제
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  return (
    <div className="container">
      <h1>📷 이미지 표정 분석</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="file-input"
        />
        {files.length > 0 && (
          <p>✅ 선택된 파일: {files.map((file) => file.name).join(", ")}</p>
        )}
        <button type="submit" disabled={files.length === 0 || loading}>
          {loading ? "🔍 분석 중..." : "🎬 분석 시작"}
        </button>
      </form>

      {error && <p className="error">⚠ {error}</p>}

      {analysis && (
        <div className="results-section">
          {/* 분석 결과 타이틀 */}
          <h2>🔎 분석 결과</h2>

          {/* 전체 감정 갯수 표시 (갤러리보다 위쪽) */}
          <div className="overall-count">
            <h3>전체 감정 갯수</h3>
            <ul>
              {Object.entries(emotionIcons).map(([emotion, emoji]) => (
                <li key={emotion}>
                  <span className="emoji">{emoji}</span> {emotion}: {overallCounts[emotion] || 0}
                </li>
              ))}
            </ul>
          </div>

          {/* 이미지별 분석 결과 */}
          <div className="gallery-container">
            {files.map((file, index) => {
              const filename = file.name;
              const resultData = analysis[filename];
              return (
                <div key={index} className="card">
                  <div className="image-container">
                    <img src={previews[index]} alt={filename} />
                    <div className="overlay">
                      <h3 className="file-name">{filename}</h3>
                      {!resultData || resultData.results === null ? (
                        <p>얼굴을 인식하지 못했습니다</p>
                      ) : Array.isArray(resultData.results) ? (
                        resultData.results.map((r, i) => (
                          <div key={i} className="emotion-result">
                            <span className="emoji">
                              {emotionIcons[r.emotion] || "❓"}
                            </span>
                            <span className="emotion-label">{r.emotion}</span>
                            <div className="confidence-bar">
                              <div
                                className="confidence-fill"
                                style={{ width: `${r.confidence}%` }}
                              ></div>
                            </div>
                            <span className="confidence-text">
                              {r.confidence.toFixed(2)}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <p>{resultData.results}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionAnalysis;
