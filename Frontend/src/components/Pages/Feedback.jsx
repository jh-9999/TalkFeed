import React from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./Feedback.css";
import feedbackIcon from "./feedbackicon.png";

ChartJS.register(ArcElement, Tooltip, Legend);

function Feedback() {
  const navigate = useNavigate();
  const location = useLocation(); 

  // 도넛 차트 데이터 설정
  const data = {
    labels: ["표정", "속도", "발음"],
    datasets: [
      {
        data: [75, 85, 85], 
        backgroundColor: ["#3366FF", "#2ECC71", "#F4A62A"], 
        hoverBackgroundColor: ["#1D4ED8", "#27AE60", "#E67E22"],
        borderWidth: 0, 
      },
    ],
  };

  const options = {
    responsive: false,
    maintainAspectRatio: false,
    cutout: "70%", 
    animation: false,
    hover: false,
    plugins: {
      tooltip: false,
      legend: false,
    }
  };

  return (
    <div className="feedback-container">
      <div className="header">
          <h1 className="header-title">TalkFeed</h1>
          <span className="material-icons menu-icon">menu</span>
      </div>

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

      {/* 회색 줄 */}
      <div className="nav-underline"></div>

      {/* 분석 결과 박스 */}
      <h2 className="result-title">분석 결과</h2>

      {/* 도넛 차트와 점수 리스트 */}
      <div className="chart-container">
        <div className="doughnut-chart">
          <Doughnut data={data} options={options} width={101} height={101} />
        </div>
        <div className="score-list">
            <div className="score-item">
                <span className="dot blue"></span> <span className="score-label">표정</span>&nbsp;&nbsp;&nbsp;<span className="score">75점</span>
            </div>
            <div className="score-item">
                <span className="dot green"></span> <span className="score-label">속도</span>&nbsp;&nbsp;&nbsp;<span className="score">85점</span>
            </div>
            <div className="score-item">
                <span className="dot orange"></span> <span className="score-label">발음</span>&nbsp;&nbsp;&nbsp;<span className="score">85점</span>
            </div>
        </div>
      </div>

      {/* LLM 총평 영역 제거 */}

      {/* 분석 상세 결과 위의 구분선 */}
      <div className="feedback-divider"></div>

      {/* 분석 상세 결과 리스트 */}
      <div className="feedback-list">
          <div className="feedback-item" onClick={() => navigate("/feedback-emotion")}>
              <img src={feedbackIcon} alt="전체 분석 아이콘" className="icon-img" />&nbsp;표정 분석 결과
              <span className="arrow">{">"}</span>
          </div>
          <div className="feedback-item" onClick={() => navigate("/feedback-speed")}>
              <img src={feedbackIcon} alt="전체 분석 아이콘" className="icon-img" />&nbsp;속도 분석 결과
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

export default Feedback;
