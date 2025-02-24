import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./FeedbackEmotion.css";
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

  // 응답 데이터를 기반으로 집계 계산 함수
  const computeAggregates = (dataObj) => {
    const emotions = ["HAPPY", "SAD", "ANGRY", "CONFUSED", "DISGUSTED", "SURPRISED", "CALM", "FEAR"];
    let totalImages = Object.keys(dataObj).length;
    let noFaceCount = 0;
    let emotionCounts = {};
    emotions.forEach((emo) => (emotionCounts[emo] = 0));

    Object.values(dataObj).forEach((resultObj) => {
      if (!resultObj.results || resultObj.results.length === 0) {
        noFaceCount++;
      } else {
        resultObj.results.forEach((emotionData) => {
          let emo = emotionData.emotion;
          emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
        });
      }
    });
    return { totalImages, noFaceCount, emotionCounts };
  };

  // "자세히 보기" 버튼 클릭 시, GET 요청으로 emotion 분석 결과를 가져옴
  const openPopup = async () => {
    setIsPopupOpen(true);
    setLoading(true);
    try {
      // emotion.py의 GET 엔드포인트 (end.py에 마운트된 emotion 앱)
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

  // analysisResult가 있으면 집계 계산
  const aggregates = analysisResult ? computeAggregates(analysisResult) : null;

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
                <p>Total Images: {aggregates.totalImages}</p>
                <p>No Face Detected: {aggregates.noFaceCount}</p>
                <p>Emotion Counts: {JSON.stringify(aggregates.emotionCounts)}</p>
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
