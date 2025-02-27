import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./FeedbackSpeed.css";
import feedbackIcon from "./feedbackicon.png";

ChartJS.register(ArcElement, Tooltip, Legend);

// 초를 분과 초로 변환하는 헬퍼 함수
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}분 ${secs.toFixed(2)}초`;
  } else {
    return `${secs.toFixed(2)}초`;
  }
}

function FeedbackSpeed() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const data = {
    datasets: [
      {
        data: [85, 15],
        backgroundColor: ["#57BD79", "#E0E0E0"],
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

  const openPopup = async () => {
    setIsPopupOpen(true);
    setLoadingResults(true);
    try {
      const res = await fetch("http://localhost:8000/speed/analysis-results?" + new Date().getTime());
      const data = await res.json();
      setAnalysisResults(data.results || []);
    } catch (error) {
      console.error("분석 결과를 가져오는 중 오류 발생:", error);
      setAnalysisResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <div className="feedback-emotion-container">
      {/* 헤더 */}
      <div className="header">
        <h1 className="header-title">TalkFeed</h1>
        <span className="material-icons menu-icon">menu</span>
      </div>

      {/* 네비게이션 바 */}
      <div className="feedback-nav">
        <span className={location.pathname.includes("scripts") ? "active-tab" : ""} onClick={() => navigate("/scripts")}>
          Scripts
        </span>
        <span className={location.pathname.includes("video") ? "active-tab" : ""} onClick={() => navigate("/uploadvideo")}>
          Video
        </span>
        <span className={location.pathname.includes("feedback") ? "active-tab" : ""} onClick={() => navigate("/feedback")}>
          Feedback
        </span>
      </div>

      <h2 className="emotion-title">속도 분석 결과</h2>
      <span className="see-all" onClick={openPopup}>
        자세히 보기
      </span>

      <div className="chart-container">
        <div className="emotion-chart-wrapper">
          <Doughnut data={data} options={options} width={101} height={101} />
          <div className="emotion-chart-text">85점</div>
        </div>
      </div>

      <div className="feedback-divider"></div>

      <div className="feedback-list">
        <div className="feedback-item" onClick={() => navigate("/feedback")}>
          <img src={feedbackIcon} alt="전체 분석 아이콘" className="icon-img" />&nbsp;전체 분석 결과
          <span className="arrow">{">"}</span>
        </div>
        <div className="feedback-item" onClick={() => navigate("/feedback-emotion")}>
          <img src={feedbackIcon} alt="표정 분석 아이콘" className="icon-img" />&nbsp;표정 분석 결과
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
            {loadingResults ? (
              <p>분석 결과 로딩 중...</p>
            ) : analysisResults.length > 0 ? (
              <div className="results-list">
                {analysisResults.map((seg, idx) => (
                  <div key={idx} className="segment-box">
                    <p>
                      시작 : {formatTime(seg.start_time)} | 종료 : {formatTime(seg.end_time)}
                    </p>
                    <p>
                      속도 : {seg.rate}
                    </p>
                  </div>
                ))}
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

export default FeedbackSpeed;
