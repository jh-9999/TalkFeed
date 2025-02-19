import React from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";

function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="welcome-container">
            {/* 체크 아이콘 이미지 */}
            <div className="welcome-icon">
                <img src="/images/check.png" alt="Check Icon" className="check-image" />
            </div>

            {/* 환영 문구 */}
            <h1 className="welcome-text">
                발표 피드백 AI 플랫폼 <br /> 톡피드에 오신 것을 환영합니다
            </h1>

            {/* 시작하기 버튼 */}
            <button className="welcome-button" onClick={() => navigate("/scripts")}>
                시작하기
            </button>
        </div>
    );
}

export default Welcome;
