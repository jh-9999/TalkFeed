import { useRef } from "react";
import { Link } from "react-router-dom";
import "./style.css";

const Upload = () => {
  const fileInputRef = useRef(null);

  // 🔹 파일 업로드
  const uploadVideo = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) {
      alert("업로드할 파일을 선택하세요!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:8000/upload/", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    alert(data.message || "업로드 실패");
  };

  return (
    <div className="container">
      <h1>동영상 업로드</h1>
      <input type="file" ref={fileInputRef} accept="video/*" />
      <button onClick={uploadVideo}>업로드</button>
      <Link to="/">
        <button>뒤로 가기</button>
      </Link>
    </div>
  );
};

export default Upload;
