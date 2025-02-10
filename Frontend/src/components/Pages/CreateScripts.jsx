import React from "react";
import { useNavigate } from "react-router-dom";
import "./CreateScripts.css";

function CreateScripts() {
    const navigate = useNavigate();

    return (
        <div className="create-scripts-container">
            <h1 className="create-scripts-title">Scripts</h1>

            <textarea className="create-scripts-textarea" placeholder="스크립트 주제 입력"></textarea>

            <textarea className="create-scripts-textarea" placeholder="목차 및 스크립트 내용 간단히 입력"></textarea>

            <button className="create-scripts-button" onClick={() => navigate("/CreateScripts")}>
                생성
            </button>
        </div>
    );
}

export default CreateScripts;
