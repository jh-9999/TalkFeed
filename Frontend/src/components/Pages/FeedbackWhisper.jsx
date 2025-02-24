import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./FeedbackWhisper.css";
import feedbackIcon from "./feedbackicon.png";

ChartJS.register(ArcElement, Tooltip, Legend);

function FeedbackWhisper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // 도넛 차트 데이터 (예시)
  const data = {
    datasets: [
      {
        data: [85, 15],
        backgroundColor: ["#F5C55B", "#E0E0E0"],
        borderWidth: 0,
      },
    ],
  };

  // 차트 옵션 (예시)
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

  // "자세히 보기" 버튼 클릭 시 GET 요청 URL 수정: "/whisper/analysis-results"
  const openPopup = async () => {
    setIsPopupOpen(true);
    setLoadingResults(true);
    try {
      const res = await fetch("http://localhost:8000/whisper/analysis-results");
      const data = await res.json();
      setAnalysisResults(data);
    } catch (error) {
      console.error("분석 결과를 가져오는 중 오류 발생:", error);
      setAnalysisResults(null);
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

      {/* 네비게이션 밑 회색 줄 */}
      <div className="nav-underline"></div>

      {/* 분석 결과 타이틀 및 "자세히 보기" 버튼 */}
      <h2 className="emotion-title">발음 분석 결과</h2>
      <span className="see-all" onClick={openPopup}>자세히 보기</span>

      {/* 도넛 차트 */}
      <div className="chart-container">
        <div className="emotion-chart-wrapper">
          <Doughnut data={data} options={options} width={101} height={101} />
          <div className="emotion-chart-text">85점</div>
        </div>
      </div>

      {/* 분석 상세 결과 리스트 위 회색 박스 */}
      <div className="feedback-divider"></div>

      {/* 분석 상세 결과 리스트 */}
      <div className="feedback-list">
        <div className="feedback-item" onClick={() => navigate("/feedback")}>
          <img src={feedbackIcon} alt="전체 분석 아이콘" className="icon-img" />
          &nbsp;전체 분석 결과
          <span className="arrow">{">"}</span>
        </div>
        <div className="feedback-item" onClick={() => navigate("/feedback-emotion")}>
          <img src={feedbackIcon} alt="표정 분석 아이콘" className="icon-img" />
          &nbsp;표정 분석 결과
          <span className="arrow">{">"}</span>
        </div>
        <div className="feedback-item" onClick={() => navigate("/feedback-speed")}>
          <img src={feedbackIcon} alt="속도 분석 아이콘" className="icon-img" />
          &nbsp;속도 분석 결과 
          <span className="arrow">{">"}</span>
        </div>
      </div>

      {/* 팝업 모달 */}
      {isPopupOpen && (
        <div className="modal-overlay" onClick={closePopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>상세 분석 결과</h3>
            {loadingResults ? (
              <p>분석 결과 로딩 중...</p>
            ) : analysisResults ? (
              <div className="results-list">
                <div className="result-box">
                  <p>정확도 : {analysisResults.accuracy?.toFixed(2)}%</p>
                </div>
                <div className="result-box">
                  <p>틀린 단어 : {analysisResults.diff_count}</p>
                </div>
                <div className="result-box">
                  <div
                    className="whisper-diff-html"
                    dangerouslySetInnerHTML={{ __html: analysisResults.diff_html }}
                  />
                </div>
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

export default FeedbackWhisper;
