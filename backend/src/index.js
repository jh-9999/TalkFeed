require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
const PORT = 5000;

// CORS 설정
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ], // React 앱 주소
  })
);

// JSON 요청 본문 처리
app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
  res.send('Node.js Backend is running!');
});

// 스크립트 생성 라우트
app.post('/ai/predict', async (req, res) => {
  const { topic, purpose, summary, time } = req.body; // ✅ 수정: time 값을 직접 받음

  const finalInput = {
    topic: topic || "",
    purpose: purpose || "",
    content: summary || "",
    time: time || "5분", // ✅ time 값 없으면 기본값 적용
  };

  try {
    const scriptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional assistant for creating Korean business presentation scripts.',
          },
          {
            role: 'user',
            content: `
                다음 정보를 바탕으로 발표 스크립트를 작성해주세요:

            1. 발표 주제: ${finalInput.topic}
            2. 발표 목적: ${finalInput.purpose}
            3. 대략적인 전달 내용: ${finalInput.content}
            4. 발표 시간: ${finalInput.time}

            **스크립트 작성 지침**:
            - 발표 시간(${finalInput.time})에 맞춰 적절한 길이로 조절해주세요.
            - 도입부는 청중의 관심을 끌 수 있도록 강렬한 질문이나 흥미로운 사실을 포함해주세요.
            - 결론에서는 핵심 메시지를 다시 강조하고, 마지막 마무리 멘트를 포함해주세요.
            - 발표 스타일은 명확하고 설득력 있게 작성해주세요.
          `,
          },
        ],
        max_tokens: 700,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const script = scriptResponse.data.choices[0].message.content.trim();
    res.json({ script });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({
      error: '스크립트 생성 중 오류가 발생했습니다.',
    });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
