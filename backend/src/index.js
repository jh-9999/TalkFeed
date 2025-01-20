const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5000;

// CORS 설정 (특정 출처만 허용)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // React 앱의 모든 URL 허용
}));

// JSON 요청 본문 처리
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Node.js Backend is running!');
});

// FastAPI와 통신하는 라우트
app.post('/ai/predict', async (req, res) => {
  console.log('Received data from Frontend:', req.body); // 요청 로그
  try {
    // FastAPI로 데이터 전달
    const response = await axios.post('http://127.0.0.1:8000/predict/', req.body);

    console.log('Response from FastAPI:', response.data); // FastAPI 응답 로그

    // FastAPI의 응답 데이터를 React로 전달
    res.json(response.data);
  } catch (error) {
    console.error('Error communicating with FastAPI:', error.message, error.response?.data);
    res.status(500).json({ error: 'Failed to communicate with AI server' });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
