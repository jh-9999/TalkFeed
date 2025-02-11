import React, { useState } from "react"; 
import { useNavigate } from "react-router-dom";
import "./CreateScriptsOutput.css";

function CreateScriptsOutput() {
    const navigate = useNavigate();
    const script = localStorage.getItem("generatedScript") || "";
    const [errorMessage, setErrorMessage] = useState("");

    // 스크립트를 파일로 다운로드한 후 업로드 페이지로 이동하는 함수
    const handleDownloadScript = () => {
        if (!script.trim()) {
            setErrorMessage("다운로드할 스크립트가 없습니다.");
            return;
        }
        setErrorMessage("");
        const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "script.txt"; // 다운로드될 파일명 지정
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        // 다운로드 후 /uploadvideo 페이지로 이동
        navigate("/uploadvideo");
    };

    return (
        <div className="scripts-output-container">
            <h1 className="scripts-output-title">Scripts</h1>

            <textarea 
                className="scripts-output-box"
                value={script || "스크립트가 없습니다."}
                readOnly
            />

            {/* 완료 버튼: 클릭 시 스크립트를 파일로 다운로드하고 /uploadvideo로 이동 */}
            <button className="scripts-button" onClick={handleDownloadScript}>
                완료
            </button>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            {/* 스크립트 재생성 버튼: 클릭 시 /create-scripts 페이지로 이동 */}
            <button className="scripts-replay-button" onClick={() => navigate("/create-scripts")}>
                스크립트 재생성
            </button>
        </div>
    );
}

export default CreateScriptsOutput;
