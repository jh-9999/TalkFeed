import React from 'react'
import "./StartPage.css";
import { useNavigate } from "react-router-dom";

function StartPage() {

    const navigate = useNavigate();

    return (
        <div className="container">
          <div className="card">
            
            {/* 아이콘 및 제목 */}
            <div className="logo-section">
                <img src="/images/talkfeed_icon.png" alt="TalkFeed Logo" className="logo-icon" />
                <h1 className="title">TalkFeed</h1>
            </div>
            
            {/* 시작하기 버튼 */}
            <button className="startpage-button" onClick={() => navigate("/onboarding")}>
                시작하기 
            </button>
          </div>
        </div>
      );
};

export default StartPage
