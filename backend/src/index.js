require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
const PORT = 5000;

// CORS 설정 (특정 출처만 허용)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'], // React 앱의 모든 URL 허용
}));

// JSON 요청 본문 처리
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Node.js Backend is running!');
});

// OpenAI와 통신
app.post('/ai/predict', async (req, res) => {
  const { topic, summary } = req.body;

  // 요청 본문 데이터 검증
  if (!topic || !summary) {
    return res.status(400).json({ error: 'Both topic and summary are required.' });
  }

  try {
    // OpenAI API 요청
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // OpenAI 모델
        messages: [
          { role: 'system', content: 'You are a helpful assistant for creating presentation scripts.' },
          { role: 'user', content: `Create a presentation script based on the following topic and summary:\n\nTopic: ${topic}\n\nSummary: ${summary}` },
        ],
        max_tokens: 500, // 생성될 텍스트 최대 길이
        temperature: 0.7, // 창의성 조정
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`, // OpenAI API 키
        },
      }
    );

    // OpenAI의 응답에서 생성된 스크립트 추출
    const script = response.data.choices[0].message.content.trim();
    res.json({ script }); // 스크립트를 프론트엔드로 반환
  } catch (error) {
    console.error('Error communicating with OpenAI:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate the script.',
      details: error.response?.data || 'No additional details available',
    });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
