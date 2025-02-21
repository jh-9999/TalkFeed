import React from "react";
import { useNavigate } from "react-router-dom";
import loadingGif from "./loading.gif";
import "./AnalysisScreen.css";


function AnalysisScreen() {
  const navigate = useNavigate();

  return (
    <div className="analysis-container">
      <div className="analysis-card">
        <p className="analysis-title">000님의 발표 영상을 </p>
        <p className="analysis-title1">분석하고 있어요! </p>
        <p className="analysis-text1">잠시만 기다려 주세요! </p>
        <div className="analysis-text">
          <img src={loadingGif} alt="Loading..." className="analysis-gif" />
          <p className="analysis-status">아직 분석 중이에요</p>
          <p className="analysis-progress">10% 진행중</p>
        </div>
      </div>
    </div>
  );
}

export default AnalysisScreen;
