import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LogIn.css";

function LogIn() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="login-container">
            <div className="login-card">

                {/* 뒤로 가기 버튼 */}
                <span className="back-button material-icons" onClick={() => navigate("/")}>
                    arrow_back
                </span>

                <h2 className="login-title">로그인</h2>

                <div className="input-group">
                    <label htmlFor="email">이메일</label>
                    <input type="email" id="email" placeholder="이메일을 입력해주세요." />
                </div>

                <div className="input-group password-group">
                    <label htmlFor="password">비밀번호</label>
                    <div className="password-container">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            placeholder="비밀번호를 입력해주세요."
                        />
                        <span
                            className="eye-icon material-icons"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "visibility_off" : "visibility"}
                        </span>
                    </div>
                </div>

                <button className="login-button" onClick={() => navigate("/welcome")}>
                    로그인
                </button>

                <div className="login-links">
                    <a href="#" className="forgot-password">비밀번호를 잃어버리셨나요?</a>
                    <p>계정이 없으신가요? <span className="signup-link" onClick={() => navigate("/signup")}>회원가입</span></p>
                </div>
            </div>
        </div>
    );
}

export default LogIn;
