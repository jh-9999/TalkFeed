import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./FeedbackSpeed.css"; // ✅ 새로운 CSS 파일 연결
import feedbackIcon from "./feedbackicon.png";

ChartJS.register(ArcElement, Tooltip, Legend);

function FeedbackEmotion() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 도넛 차트 데이터 설정
  const data = {
    datasets: [
      {
        data: [90, 10], 
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
    }
  };

  return (
    <div className="feedback-emotion-container">
      {/* ✅ 네비게이션 바 */}
      <div className="scripts-nav">
        <span className={location.pathname.includes("scripts") ? "active-tab" : ""} onClick={() => navigate("/scripts")}>Scripts</span>
        <span className={location.pathname.includes("video") ? "active-tab" : ""} onClick={() => navigate("/uploadvideo")}>Video</span>
        <span className={location.pathname.includes("feedback") ? "active-tab" : ""} onClick={() => navigate("/feedback")}>Feedback</span>
      </div>

      {/* ✅ 네비게이션 바 밑 회색 줄 */}
      <div className="nav-underline"></div>

      {/* ✅ 분석 결과 타이틀 */}
      <h2 className="emotion-title">속도 분석 결과</h2>
      <span className="see-all">자세히 보기</span>

      {/* ✅ 도넛 차트 (표정 분석 결과) */}
      <div className="chart-container">
      <div className="emotion-chart-wrapper">
        <Doughnut data={data} options={options} width={101} height={101} />
        <div className="emotion-chart-text">90점</div>
      </div>
      </div>

      {/* ✅ 분석 상세 결과 리스트 위에 회색 박스 */}
      <div className="feedback-divider"></div>

      {/* ✅ 분석 상세 결과 리스트 */}
      <div className="feedback-list">
        <div className="feedback-item" onClick={() => navigate("/feedback")}>
            <img src={feedbackIcon} alt="전체 분석 아이콘" className="icon-img" />&nbsp;전체 분석 결과
            <span className="arrow">{">"}</span>
        </div>
        <div className="feedback-item" onClick={() => navigate("/feedback-emotion")}>
            <img src={feedbackIcon} alt="전체 분석 아이콘" className="icon-img" />&nbsp;표정 분석 결과
            <span className="arrow">{">"}</span>
        </div>
        <div className="feedback-item" onClick={() => navigate("/feedback-whisper")}>
            <img src={feedbackIcon} alt="전체 분석 아이콘" className="icon-img" />&nbsp;발음 분석 결과 
            <span className="arrow">{">"}</span>
        </div>
      </div>
    </div>
  );
}

export default FeedbackEmotion;
