import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";

function SignUp() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="signup-container">
            <div className="signup-card">

                {/* 뒤로 가기 버튼 */}
                <span className="back-button material-icons" onClick={() => navigate("/login")}>
                    arrow_back
                </span>

                <h2 className="signup-title">회원가입</h2>

                <div className="input-group">
                    <label htmlFor="name">이름</label>
                    <input type="text" id="name" placeholder="이름을 입력해주세요." />
                </div>

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
                            placeholder="비밀번호(영문+숫자+특수문자 8자 이상)"
                        />
                        <span
                            className="eye-icon material-icons"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "visibility_off" : "visibility"}
                        </span>
                    </div>
                </div>

                <div className="input-group password-group">
                    <label htmlFor="confirm-password">비밀번호 확인</label>
                    <div className="password-container">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirm-password"
                            placeholder="비밀번호를 다시 입력해주세요."
                        />
                        <span
                            className="eye-icon material-icons"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                    </div>
                </div>

                <button className="signup-button" onClick={() => navigate("/welcome")}>
                    회원가입
                </button>

                <div className="signup-links">
                    <p>이미 계정이 있으신가요? <span className="login-link" onClick={() => navigate("/login")}>로그인</span></p>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
