import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Onboarding.css";

function Onboarding() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);

    const onboardingData = [
        {
            title: "Scripts",
            description: "발표 스크립트가 없다면\n톡피드를 이용하여 쉽게 생성해 보세요!",
            image: "/images/onboarding_scripts.png",
        },
        {
            title: "Video",
            description: "발표 영상을 업로드하고\n표정, 발음, 속도를 분석해 보세요!",
            image: "/images/onboarding_video.png",
        },
        {
            title: "Feedback",
            description: "발표 능력을 향상시키기 위한\n개인화된 맞춤형 피드백을 제공합니다!",
            image: "/images/onboarding_feedback.png",
        }
    ];

    // ✅ "다음" 버튼 클릭 시 동작
    const handleNext = () => {
        if (page < onboardingData.length - 1) {
            setPage(page + 1);
        } else {
            navigate("/login"); // ✅ 마지막 페이지에서 로그인 페이지로 이동
        }
    };

    return (
        <div className="onboarding-container">


            {/* 컨텐츠 */}
            <div className="onboarding-content">
                <h2 className="onboarding-title">{onboardingData[page].title}</h2>
                <p className="onboarding-description">{onboardingData[page].description}</p>
                <img src={onboardingData[page].image} alt="Onboarding" className="onboarding-image" />
            </div>

            {/* 페이지 dots */}
            <div className="dots-container">
                {onboardingData.map((_, index) => (
                    <span key={index} className={`dot ${index === page ? "active" : ""}`}></span>
                ))}
            </div>

            {/* "다음" 버튼 */}
            <button className="next-button" onClick={handleNext}>
                {page === onboardingData.length - 1 ? "시작하기" : "다음"}
            </button>
        </div>
    );
}

export default Onboarding;
