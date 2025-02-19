import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";

function SignUp() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="signup-container">
            {/* 뒤로가기 버튼 */}
            <span className="back-button material-icons" onClick={() => navigate(-1)}>arrow_back</span>

            {/* 제목 */}
            <h1 className="signup-title">회원가입</h1>

            {/* 입력 폼 */}
            <div className="name-inputs">
                <div className="input-group">
                    <label>First Name</label>
                    <input type="text" placeholder="John" />
                </div>
                <div className="input-group">
                    <label>Last Name</label>
                    <input type="text" placeholder="Doe" />
                </div>
            </div>

            <div className="input-group">
                <label>E-mail</label>
                <input type="email" placeholder="Enter your email" />
            </div>


            {/* 비밀번호 입력 */}
            <div className="input-group password-group">
                <label>Password</label>
                <div className="password-wrapper">
                    <input type={showPassword ? "text" : "password"} placeholder="Enter your password" />
                    <span className="toggle-password material-icons" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "visibility" : "visibility_off"}
                    </span>
                </div>
                <p className="password-requirements">must contain 8 char.</p>
            </div>

            {/* 비밀번호 확인 입력 */}
            <div className="input-group password-group">
                <label>Confirm Password</label>
                <div className="password-wrapper">
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" />
                    <span className="toggle-password material-icons" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? "visibility" : "visibility_off"}
                    </span>
                </div>
            </div>

            {/* 회원가입 버튼 */}
            <button className="signup-button" onClick={() => navigate("/welcome")}>회원가입</button>


            {/* 이용약관 */}
            <p className="terms">
                By continuing, you agree to our <span className="link">Terms of Service</span> and <span className="link">Privacy Policy</span>.
            </p>
        </div>
    );
}

export default SignUp;
