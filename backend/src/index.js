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
            당신은 전문적인 발표 스크립트를 작성하는 AI입니다.  
            다음 발표 정보를 바탕으로, **발표 시간이 정확히 맞도록 스크립트를 작성하세요.**  
        
            **발표 정보**  
            - 발표 주제: ${finalInput.topic}  
            - 발표 목적: ${finalInput.purpose}  
            - 주요 내용: ${finalInput.content}  
            - 발표 시간: ${finalInput.time}  
        
            **📌 스크립트 작성 규칙 (시간별 길이 조정)**  
            - 발표 시간이 **3분이면 (400~500 단어)**, 핵심 내용을 간결하게 요약하고 불필요한 설명을 제거하세요.  
            - 발표 시간이 **5분이면 (700~900 단어)**, 핵심 내용과 간단한 사례를 추가하세요.  
            - 발표 시간이 **10분이면 반드시 1500~2000 단어 이상**을 작성하세요.  
              - **도입부** (최소 5문단)  
              - **본론** (최소 4개의 주요 개념, 각 개념마다 5문단 이상)  
              - **결론** (최소 4문단)  
            - 발표 시간이 길수록 **더 깊이 있는 분석, 연구 사례, 역사적 맥락, 통계 데이터**를 포함하세요.  
            - 각 개념을 설명할 때 **반드시 4~5문단 이상** 작성하세요.  
            - 연구 결과, 통계 데이터, 역사적 사례 등을 **구체적인 출처와 함께 인용**하세요.  
            - 문장이 자연스럽게 연결되도록 하며, 발표자가 읽기에 적절한 스타일로 작성하세요.  
            - 반드시 **자연스러운 한국어**로 작성하세요.  
        
            **📌 발표문 구성 (발표 시간에 맞게 자동 조정됨)**  
            1. **도입부**  
               - 발표 주제 소개 (발표 시간이 길 경우, 실생활 사례와 질문 추가)  
               - 흥미로운 질문을 통해 청중의 관심을 유도  
               - 역사적 사건, 실제 사례, 연구 결과 등을 포함 (최소 5문단)  
            2. **본론**  
               - 핵심 내용 설명 (발표 시간이 길 경우, 연구 사례 및 역사적 맥락 추가)  
               - 발표 시간이 10분 이상이면, **최소 4개의 주요 개념을 다루고 각 개념을 5문단 이상 확장**  
               - 각 개념별로 **실제 연구 사례, 통계 자료, 역사적 사건을 포함**  
            3. **결론**  
               - 발표 요약 및 핵심 메시지 강조  
               - 발표 시간이 길 경우, 미래 전망 및 추가 제언 포함 (최소 4문단)  
          `,
          },
        ],
        max_tokens: 5000,
        temperature: 0.8,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    // ✅ OpenAI API 응답 로그 추가
    console.log('OpenAI API 응답:', scriptResponse.data);
    console.log('OpenAI API 토큰 사용량:', scriptResponse.data.usage);

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
