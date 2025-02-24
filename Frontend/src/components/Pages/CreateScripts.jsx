import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CreateScripts.css";

function CreateScripts() {
  const navigate = useNavigate();
  const routerLocation = useLocation(); // 'location' 대신 routerLocation 사용

  const [selectedTime, setSelectedTime] = useState("3분"); // 기본 선택 시간: 3분
  const [topic, setTopic] = useState("");
  const [purpose, setPurpose] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateScript = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/ai/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          purpose,
          summary,
          duration: selectedTime,
        }),
      });
      const data = await response.json();
      // 생성된 스크립트는 data.script에 있다고 가정합니다.
      // CreateScriptsOutput 페이지로 생성된 스크립트를 전달합니다.
      navigate("/create-scripts-output", { state: { script: data.script } });
    } catch (error) {
      console.error("API 호출 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-scripts-container">
      {/* 네비게이션 */}
      <div className="scripts-nav">
        <span
          className={routerLocation.pathname.includes("scripts") ? "active-tab" : ""}
          onClick={() => navigate("/scripts")}
        >
          Scripts
        </span>
        <span
          className={routerLocation.pathname.includes("video") ? "active-tab" : ""}
          onClick={() => navigate("/uploadvideo")}
        >
          Video
        </span>
        <span
          className={routerLocation.pathname.includes("feedback") ? "active-tab" : ""}
          onClick={() => navigate("/feedback")}
        >
          Feedback
        </span>
      </div>

      {/* 발표 주제 입력 */}
      <textarea
        className="create-scripts-textarea"
        placeholder="발표 주제를 입력하세요 (ex. 인공지능의 현재와 미래)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <textarea
        className="create-scripts-textarea"
        placeholder="발표 목적을 입력하세요 (ex. 정보 공유, 설득, 동기 부여)"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
      />
      <textarea
        className="create-scripts-textarea2"
        placeholder="대략적인 전달 내용을 입력하세요 (ex. 발표하고 싶은 내용)"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />

      {/* 발표 시간 선택 버튼 */}
      <div className="time-select-container">
        {["3분", "5분", "10분"].map((time) => (
          <button
            key={time}
            className={`time-button ${selectedTime === time ? "selected" : ""}`}
            onClick={() => setSelectedTime(time)}
          >
            {time}
          </button>
        ))}
      </div>

      {/* 스크립트 생성 버튼 */}
      <button
        className="create-scripts-button"
        onClick={handleGenerateScript}
        disabled={loading}
      >
        {loading ? "생성 중..." : "스크립트 생성"}
      </button>
    </div>
  );
}

export default CreateScripts;
