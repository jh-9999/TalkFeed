import React from "react";
import { useNavigate } from "react-router-dom"; // 🔹 페이지 이동을 위한 useNavigate 추가
import "./CreateScripts.css";

function CreateScripts() {
    const navigate = useNavigate(); // 🔹 페이지 이동 함수

    return (
        <div className="create-scripts-container">
            <h1 className="create-scripts-title">Scripts</h1>
            
            {/* 발표 주제 입력 */}
            <textarea
                className="create-scripts-textarea"
                placeholder={`발표 주제를 입력하세요\n(ex. 인공지능의 현재와 미래)`}
            />
            <textarea
                className="create-scripts-textarea"
                placeholder={`발표 목적을 입력하세요\n(ex. 정보 공유, 설득, 동기 부여)`}
            />
            <textarea
                className="create-scripts-textarea2"
                placeholder={`대략적인 전달 내용을 입력하세요.\n(ex. 발표하고 싶은 내용)`}
            />            
            {/* 🔹 스크립트 생성 버튼 (누르면 새로운 페이지로 이동) */}
            <button 
                className="create-scripts-button"
                onClick={() => navigate("/create-scripts-output")} // 🔹 새로운 페이지로 이동
            >
                스크립트 생성
            </button>
        </div>
    );
}

export default CreateScripts;
