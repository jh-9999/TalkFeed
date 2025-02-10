import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">

            <div className="home-card">
                <h1 className="home-title">TalkFeed</h1>

                <div className="home-image">
                    <img src="/images/main-illustration.png" alt="메인 이미지" />
                </div>

                <div className="home-description">
                    <p>톡피드는 사용자의 발표 능력을 향상시키기 위한 다양한 작업들을 돕습니다!</p>
                </div>

                <button className="home-button" onClick={() => navigate("/scripts")}>
                    <span className="icon">📄</span> 발표 스크립트 입력 및 생성 →
                </button>
            </div>
        </div>
    );
}

export default Home;
