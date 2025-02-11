import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Scripts.css";

function Scripts() {
    const [script, setScript] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    // 사용자가 textarea에 입력할 때마다 script 상태 업데이트
    const handleScriptChange = (e) => {
        setScript(e.target.value);
        if (e.target.value.trim()) {
            setErrorMessage("");
        }
    };

    // "완료" 버튼 클릭 시 스크립트를 파일로 다운로드한 후 업로드 페이지로 이동
    const handleDownloadScript = () => {
        if (!script.trim()) {
            setErrorMessage("스크립트 내용을 입력해주세요.");
            return;
        }
        setErrorMessage("");
        const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "script.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        // 다운로드 후 업로드 페이지로 이동
        navigate("/uploadvideo");
    };

    return (
        <div className={`scripts-container ${showModal ? "modal-active" : ""}`}>
            <h1 className="scripts-title">Scripts</h1>
            
            <textarea
                className="scripts-textarea"
                value={script}
                onChange={handleScriptChange}
                placeholder="스크립트 입력"
            />
            
            {/* 완료 버튼: 스크립트를 다운로드하고 이후 /uploadvideo 페이지로 이동 */}
            <button className="scripts-button" onClick={handleDownloadScript}>
                완료
            </button>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            
            {/* 스크립트 생성 버튼 (모달 열기) */}
            <div className="scripts-create" onClick={() => setShowModal(true)}>
                <span className="material-icons">edit</span>
                <span className="scripts-create-text">스크립트 생성</span>
                <span className="material-icons">arrow_forward</span>
            </div>
            
            {/* 모달: 스크립트 생성 예시 및 페이지 이동 안내 */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="material-icons">info</span>
                            <span className="modal-title">스크립트 생성 예시</span>
                        </div>
                        <p className="modal-description">
                            • 발표 스크립트 주제, 목차 등 간단히 입력
                        </p>
                        <button
                            className="modal-next-button"
                            onClick={() => {
                                setShowModal(false);
                                navigate("/create-scripts");
                            }}
                        >
                            스크립트 생성 →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Scripts;
