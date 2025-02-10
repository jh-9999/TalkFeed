import React from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";

function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="welcome-container">
            <div className="welcome-card">

                {/* 뒤로 가기 버튼 */}
                <span className="back-button material-icons" onClick={() => navigate("/")}>
                    arrow_back
                </span>

                {/* 환영 메시지 */}
                <div className="welcome-text">
                    <p>발표 피드백 AI 플랫폼.</p>
                    <p>톡피드에 오신 것을 환영합니다. 👏</p>
                </div>

                {/* 시작하기 버튼 */}
                <button className="start-button" onClick={() => navigate("/home")}> 
                    톡피드 시작하기 →
                </button>


            </div>
        </div>
    );
}

export default Welcome;
