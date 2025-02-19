import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LogIn.css";

function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="login-container">
            {/* 뒤로가기 버튼 */}
            <span className="back-button material-icons" onClick={() => navigate(-1)}>arrow_back</span>

            {/* 제목 */}
            <h1 className="login-title">회원가입</h1>

            {/* 입력 폼 */}
            <div className="input-group">
                <label>E-mail</label>
                <input type="email" placeholder="Enter your email" />
            </div>

            <div className="input-group password-group">
                <label>Password</label>
                <div className="password-wrapper">
                    <input type={showPassword ? "text" : "password"} placeholder="Enter your password" />
                    <span className="toggle-password material-icons" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "visibility" : "visibility_off"}
                    </span>
                </div>
                <span className="forgot-password">비밀번호 찾기</span>
            </div>

            {/* 로그인 버튼 */}
            <button className="login-button" onClick={() => navigate("/welcome")}>로그인</button>

            {/* 구글 로그인 */}
            <p className="divider">다른 계정으로 로그인</p>
            <button className="google-login">
                <img src="/images/google_icon.png" alt="Google" className="google-icon" />
                Google 계정으로 로그인
            </button>

            {/* 계정이 없을 때 회원가입 버튼 */}
            <p className="signup-text">
                계정이 없으신가요? <span className="signup-link" onClick={() => navigate("/signup")}>회원가입</span>
            </p>
        </div>
    );
}

export default Login;
