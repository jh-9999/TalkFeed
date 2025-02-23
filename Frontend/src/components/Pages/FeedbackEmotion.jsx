import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./FeedbackEmotion.css"; // 기존 CSS 파일 유지
import feedbackIcon from "./feedbackicon.png";

ChartJS.register(ArcElement, Tooltip, Legend);

function FeedbackEmotion() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 도넛 차트 데이터 (예시)
  const data = {
    datasets: [
      {
        data: [75, 25], 
        backgroundColor: ["#4880EE", "#E0E0E0"], 
        borderWidth: 0, 
      },
    ],
  };

  const options = {
    responsive: false,
    maintainAspectRatio: false,
    cutout: "80%",
    animation: false,
    hover: false,
    plugins: {
      tooltip: false,
      legend: false,
    },
  };

  // "자세히 보기" 버튼 클릭 시, emotion 분석 결과를 가져옵니다.
  const openPopup = async () => {
    setIsPopupOpen(true);
    setLoading(true);
    try {
      // GET URL을 /emotion/analysis-results로 수정합니다.
      const res = await fetch("http://localhost:8000/emotion/analysis-results?" + new Date().getTime());
      const data = await res.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error("Emotion analysis 결과 가져오는 중 오류 발생:", error);
      setAnalysisResult(null);
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <div className="feedback-emotion-container">
      {/* 네비게이션 바 */}
      <div className="scripts-nav">
        <span
          className={location.pathname.includes("scripts") ? "active-tab" : ""}
          onClick={() => navigate("/scripts")}
        >
          Scripts
        </span>
        <span
          className={location.pathname.includes("video") ? "active-tab" : ""}
          onClick={() => navigate("/uploadvideo")}
        >
          Video
        </span>
        <span
          className={location.pathname.includes("feedback") ? "active-tab" : ""}
          onClick={() => navigate("/feedback")}
        >
          Feedback
        </span>
      </div>

      <h2 className="emotion-title">표정 분석 결과</h2>
      <span className="see-all" onClick={openPopup}>자세히 보기</span>

      {/* 도넛 차트 */}
      <div className="chart-container">
        <div className="emotion-chart-wrapper">
          <Doughnut data={data} options={options} width={101} height={101} />
          <div className="emotion-chart-text">75점</div>
        </div>
      </div>

      <div className="feedback-divider"></div>

      <div className="feedback-list">
        <div className="feedback-item" onClick={() => navigate("/feedback")}>
          <img src={feedbackIcon} alt="전체 분석 아이콘" className="icon-img" />&nbsp;전체 분석 결과
          <span className="arrow">{">"}</span>
        </div>
        <div className="feedback-item" onClick={() => navigate("/feedback-speed")}>
          <img src={feedbackIcon} alt="속도 분석 아이콘" className="icon-img" />&nbsp;속도 분석 결과
          <span className="arrow">{">"}</span>
        </div>
        <div className="feedback-item" onClick={() => navigate("/feedback-whisper")}>
          <img src={feedbackIcon} alt="발음 분석 아이콘" className="icon-img" />&nbsp;발음 분석 결과
          <span className="arrow">{">"}</span>
        </div>
      </div>

      {isPopupOpen && (
        <div className="modal-overlay" onClick={closePopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>상세 분석 결과</h3>
            {loading ? (
              <p>분석 결과 로딩 중...</p>
            ) : analysisResult ? (
              <div className="result-box">
                <p>Total Images: {analysisResult.total_images}</p>
                <p>No Face Detected: {analysisResult.no_face_count}</p>
                <p>Emotion Counts: {JSON.stringify(analysisResult.emotion_counts)}</p>
              </div>
            ) : (
              <p>분석 결과가 없습니다.</p>
            )}
            <button className="modal-close-button" onClick={closePopup}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackEmotion;
