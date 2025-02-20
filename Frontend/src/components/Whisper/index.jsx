import React, { useState } from 'react';
import '../../App.css';

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [originalScript, setOriginalScript] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 정확도에 따른 메시지를 반환하는 함수
  function getAccuracyMessage(accuracy) {
    if (accuracy >= 95) return "매우 좋음";
    else if (accuracy >= 90) return "좋음";
    else if (accuracy >= 85) return "보통";
    else if (accuracy >= 80) return "나쁨";
    else if (accuracy >= 70) return "매우 나쁨";
    else return "😥 더 공부가 필요해요!";
  }

  const handleFileChange = (e) => setAudioFile(e.target.files[0]);

  const handleTranscribe = async () => {
    if (!audioFile) return alert("MP3 파일을 선택해주세요.");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      const response = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "음성 변환 중 오류 발생");
      setTranscription(data.transcription_text);
    } catch (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleCompare = async () => {
    if (!originalScript.trim()) return alert("원본 스크립트를 입력해주세요.");
    if (!transcription) return alert("먼저 음성 변환을 진행해주세요.");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_script: originalScript, transcription_text: transcription }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "비교 중 오류 발생");
      setCompareResult(data);
    } catch (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Whisper 텍스트 변환 시스템</h1>
      
      <section className="card">
        <h2>1. 음성 파일 변환</h2>
        <input type="file" accept=".mp3,audio/mpeg" onChange={handleFileChange} />
        <button onClick={handleTranscribe} disabled={loading} className="btn">
          {loading ? "변환 중..." : "변환 시작"}
        </button>
        <div className="result-box">{transcription || "변환된 텍스트가 여기에 표시됩니다."}</div>
      </section>

      <section className="card">
        <h2>2. 텍스트 비교</h2>
        <textarea 
          placeholder="원본 스크립트를 입력하세요"
          value={originalScript}
          onChange={(e) => setOriginalScript(e.target.value)}
          className="textarea"
        />
        <button onClick={handleCompare} disabled={loading} className="btn">
          {loading ? "비교 중..." : "비교하기"}
        </button>
      </section>

      {compareResult && (
        <section className="card">
          <h2>비교 결과</h2>
          <div className="result-summary">
            <div className="result-stat accuracy">
              <h3>정확도</h3>
              <p className="stat-value">{compareResult.accuracy.toFixed(1)}%</p>
              <p className="accuracy-message" style={{ marginTop: '0.5rem', color: '#333' }}>
                {getAccuracyMessage(compareResult.accuracy)}
              </p>
            </div>
            <div className="result-stat difference">
              <h3>차이 발견</h3>
              <p className="stat-value">{compareResult.diff_count}개 단어</p>
            </div>
          </div>
          
          <div className="diff-result">
            <h3>변환 결과 비교</h3>
            <div className="diff-legend">
              <span className="legend-item">
                <span style={{ color: '#c62828' }}>🔴</span> : 틀린 부분
              </span>
              <p className="legend-note">※ 아래는 원문과 달라진 부분만 표시됩니다.</p>
            </div>
            <div dangerouslySetInnerHTML={{ 
              __html: compareResult.diff_html
                .replace(
                  /<span class="diff-delete">/g,
                  '<span style="background-color: #ffebee; text-decoration: underline wavy #c62828; padding: 2px 4px; margin: 0 2px; border-radius: 2px;">'
                )
            }} />
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
