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

  // 도넛 차트 데이터 (예시)
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

  // "자세히 보기" 버튼 클릭 시 GET 요청으로 백엔드에서 속도 분석 결과를 가져옴
  const openPopup = async () => {
    setIsPopupOpen(true);
    setLoadingResults(true);
    try {
      const res = await fetch("http://localhost:8000/speed/analysis-results?" + new Date().getTime());
      const data = await res.json();
      // 백엔드에서 { results: [...] } 형식으로 반환한다고 가정
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

      <h2 className="emotion-title">속도 분석 결과</h2>
      <span className="see-all" onClick={openPopup}>자세히 보기</span>

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
                      길이 : {formatTime(seg.duration)} | 볼륨 : {seg.volume.toFixed(2)}dB
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
            <button className="modal-close-button" onClick={closePopup}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackSpeed;
