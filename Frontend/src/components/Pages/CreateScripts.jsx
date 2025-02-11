import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import "./CreateScripts.css";

function CreateScripts() {
    const navigate = useNavigate(); 

    const [input, setInput] = useState({
        topic: "",
        purpose: "",
        summary: "",
    });

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(""); // 에러 메시지 상태 추가

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInput((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        // 누락된 필드를 동적으로 체크합니다.
        const missingFields = [];
        if (!input.topic.trim()) {
            missingFields.push("발표 주제");
        }
        if (!input.purpose.trim()) {
            missingFields.push("발표 목적");
        }
        if (!input.summary.trim()) {
            missingFields.push("대략적인 전달 내용");
        }
        
        if (missingFields.length > 0) {
            const errorStr = missingFields.join(" 및 ") + "을(를) 입력하세요.";
            setErrorMessage(errorStr);
            return;
        }
        
        // 모든 필드가 채워진 경우 에러 메시지 초기화 후 진행
        setErrorMessage("");
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/ai/predict", input);
            if (response.data.script) {
                localStorage.setItem("generatedScript", response.data.script);
                navigate("/create-scripts-output");
            }
        } catch (error) {
            console.error("Error:", error);
            setErrorMessage("서버 연결 오류 발생 🚨");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-scripts-container">
            <h1 className="create-scripts-title">Scripts</h1>
            
            <textarea
                className="create-scripts-textarea"
                name="topic"
                value={input.topic}
                onChange={handleInputChange}
                placeholder="발표 주제를 입력하세요 (ex. 인공지능의 현재와 미래)"
            />
            <textarea
                className="create-scripts-textarea"
                name="purpose"
                value={input.purpose}
                onChange={handleInputChange}
                placeholder="발표 목적을 입력하세요 (ex. 정보 공유, 설득, 동기 부여)"
            />
            <textarea
                className="create-scripts-textarea2"
                name="summary"
                value={input.summary}
                onChange={handleInputChange}
                placeholder="대략적인 전달 내용을 입력하세요 (ex. 발표하고 싶은 내용)"
            />
            
            <button 
                className="create-scripts-button"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? "생성 중..." : "스크립트 생성"}
            </button>

            {/* 에러 메시지가 있을 경우 버튼 아래에 표시 */}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}

export default CreateScripts;
