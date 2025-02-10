import React from 'react'
import './StartPage.css'
import { useNavigate } from "react-router-dom";

function StartPage() {

    const navigate = useNavigate();

    return (
        <div className="container">
          <div className="card">
            
            {/* 휘어진 텍스트 */}
            <svg className="curved-text" viewBox="0 0 380 140">
              <defs>
                <path id="circlePath" d="M 190,150 m -150,0 a 150,150 0 1,1 300,0 a 150,150 0 1,1 -300,0"/>
              </defs>
              <text font-size="25" letter-spacing="2" transform="rotate(-86, 220, 130)">
                <textPath href="#circlePath" startOffset="50%" text-anchor="middle">
                    발표 피드백 AI 플랫폼
                </textPath>
              </text>
            </svg>
            
            {/* 배경 원 */}
            <div className="circle bg-gray large top-right"></div>
            <div className="circle bg-green medium top-left"></div>
            <div className="circle bg-blue large bottom-right"></div>
            <div className="circle bg-gray small bottom-left"></div>
            
            {/* 로고 및 텍스트 */}
            <div className="text-container">
              <h1 className="title">TalkFeed</h1>
            </div>
            
            {/* 시작하기 버튼 */}
            <button className="start-button" onClick={() => navigate("/login")}>
                시작하기 
            </button>
          </div>
        </div>
      );
};

export default StartPage
