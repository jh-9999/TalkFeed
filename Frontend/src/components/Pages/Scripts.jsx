import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Scripts.css";

function Scripts() {
    const navigate = useNavigate();
    const location = useLocation();
    const [showModal, setShowModal] = useState(false); // ✅ 모달 상태 추가

    return (
        <div className={`scripts-container ${showModal ? "modal-active" : ""}`}>
            {/* ✅ 네비게이션 바 */}
            <header className="scripts-header">
                <div className="scripts-nav">
                    <span className={location.pathname === "/scripts" ? "active-tab" : ""} onClick={() => navigate("/scripts")}>
                        Scripts
                    </span>
                    <span className={location.pathname === "/video" ? "active-tab" : ""} onClick={() => navigate("/video")}>
                        Video
                    </span>
                    <span className={location.pathname === "/feedback" ? "active-tab" : ""} onClick={() => navigate("/feedback")}>
                        Feedback
                    </span>
                </div>


            </header>

            {/* ✅ 스크립트 입력 박스 */}
            <textarea className="scripts-textarea" placeholder="스크립트 입력"></textarea>

            {/* ✅ 완료 버튼 */}
            <button className="scripts-button" onClick={() => navigate("/video")}>
                완료
            </button>

            {/* ✅ 스크립트 생성 버튼 (모달 열기) */}
            <div className="scripts-create" onClick={() => setShowModal(true)}>
                <span className="material-icons">add_circle_outline</span>
                <span className="scripts-create-text">스크립트 생성</span>
                <span className="material-icons">arrow_forward</span>
            </div>

            {/* ✅ 모달 창 */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">스크립트 생성 예시</span>
                        </div>
                        <p className="modal-description">• 발표 스크립트 주제, 목차 등 간단히 입력</p>

                        <button className="modal-next-button" onClick={() => {
                            setShowModal(false);
                            navigate("/create-scripts");
                        }}>
                            생성
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Scripts;
