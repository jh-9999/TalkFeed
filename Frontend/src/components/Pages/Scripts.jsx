import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Scripts.css";

function Scripts() {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false); // ✅ 모달 상태 추가

    // ✅ 모달 닫고 다음 페이지로 이동하는 함수
    const handleNextPage = () => {
        setShowModal(false); // ✅ 모달 닫기
        navigate("/create-scripts"); // ✅ 즉시 페이지 이동
    };

    // ✅ 완료 버튼 클릭 시 UploadVideo.jsx로 이동
    const handleUploadVideo = () => {
        navigate("/uploadvideo"); // ✅ 즉시 페이지 이동
    };

    return (
        <div className={`scripts-container ${showModal ? "modal-active" : ""}`}>
            <h1 className="scripts-title">Scripts</h1>

            <textarea className="scripts-textarea" placeholder="스크립트 입력"></textarea>

            {/* ✅ 완료 버튼 (UploadVideo.jsx로 이동) */}
            <button className="scripts-button" onClick={handleUploadVideo}>
                완료
            </button>

            {/* ✅ 스크립트 생성 버튼 (모달 열기) */}
            <div className="scripts-create" onClick={() => setShowModal(true)}>
                <span className="material-icons">edit</span>
                <span className="scripts-create-text">스크립트 생성</span>
                <span className="material-icons">arrow_forward</span>
            </div>

            {/* ✅ 바텀 시트 모달 */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="material-icons">info</span>
                            <span className="modal-title">스크립트 생성 예시</span>
                        </div>
                        <p className="modal-description">• 발표 스크립트 주제, 목차 등 간단히 입력</p>

                        <button className="modal-next-button" onClick={handleNextPage}>
                            스크립트 생성 →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Scripts;
