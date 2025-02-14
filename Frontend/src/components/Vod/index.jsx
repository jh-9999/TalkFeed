import { Routes, Route, Link } from "react-router-dom";
import Record from "./Record";
import Upload from "./Upload";

const Vod = () => {
  return (
    <Routes> {/* 🚀 BrowserRouter를 제거하고 Routes만 남김 */}
      <Route path="/" element={<MainPage />} />
      <Route path="/record" element={<Record />} />
      <Route path="/upload" element={<Upload />} />
    </Routes>
  );
};

// 🔹 메인 선택 페이지
const MainPage = () => {
  return (
    <div className="container">
      <h1>동영상 페이지</h1>
      <Link to="/record">
        <button>동영상 녹화</button>
      </Link>
      <Link to="/upload">
        <button>동영상 업로드</button>
      </Link>
    </div>
  );
};

export default Vod;
