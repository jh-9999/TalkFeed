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
  const {
    topic,
    content,
    purpose,
    audience,
    time,
    format,
    keyMessage,
    languageStyle,
    additionalRequests,
  } = req.body;

  const initialInput = {
    topic: topic || '',
    content: content || '',
    purpose: purpose || '',
    audience: audience || '',
    time: time || '',
    format: format || '',
    keyMessage: keyMessage || '',
    languageStyle: languageStyle || '',
    additionalRequests: additionalRequests || '',
  };

  try {
    // 1단계: 입력 데이터 분석
    const analysisResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that extracts key presentation details from a given input.',
          },
          {
            role: 'user',
            content: `
Given the following input, extract the key details as JSON:
1. Topic
2. Purpose
3. Content
4. Audience
5. Time
6. Format
7. Key Message
8. Language Style
9. Additional Requests

Input:
${JSON.stringify(initialInput)}

Output the details in the following JSON format:
{
  "topic": "...",
  "purpose": "...",
  "content": "...",
  "audience": "...",
  "time": "...",
  "format": "...",
  "keyMessage": "...",
  "languageStyle": "...",
  "additionalRequests": "..."
}
            `,
          },
        ],
        max_tokens: 500,
        temperature: 0,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const extractedDetails = JSON.parse(
      analysisResponse.data.choices[0].message.content
    );

    // 분석 결과와 사용자 입력값 병합
    const finalInput = {
      topic: topic || extractedDetails.topic || '',
      purpose: purpose || extractedDetails.purpose || '',
      content: content || extractedDetails.content || '',
      audience: audience || extractedDetails.audience || '일반 청중',
      time: time || extractedDetails.time || '',
      format: format || extractedDetails.format || '',
      keyMessage: keyMessage || extractedDetails.keyMessage || '',
      languageStyle:
        languageStyle ||
        extractedDetails.languageStyle ||
        '한국어, 비즈니스 톤',
      additionalRequests:
        additionalRequests ||
        extractedDetails.additionalRequests ||
        '특별한 요청 없음',
    };

    // 2단계: 스크립트 생성
    const scriptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional assistant for creating Korean business presentation scripts.',
          },
          {
            role: 'user',
            content: `
다음 정보를 바탕으로 한국어 발표 스크립트를 작성해주세요:

1. 발표 주제: ${finalInput.topic}
2. 발표 목적: ${finalInput.purpose}
3. 대략적인 전달 내용: ${finalInput.content}
4. 청중 정보: ${finalInput.audience}
5. 발표 시간: ${finalInput.time}
6. 발표 형식: ${finalInput.format}
7. 핵심 메시지: ${finalInput.keyMessage}
8. 발표 언어와 스타일: ${finalInput.languageStyle}
9. 추가 요청사항: ${finalInput.additionalRequests}

**스크립트 작성 지침**:
1. 발표는 다음 구조를 따라야 합니다:
   - **제목**: 주제에 맞는 간결하고 강렬한 제목.
   - **도입부**: 청중의 관심을 끌고, 발표의 목적과 중요성을 간략히 소개.
   - **본론**: 
     1) 발표 주제와 관련된 맥락과 문제점.
     2) 제공하는 제품이나 서비스의 특징 및 이점.
     3) 청중이 얻을 수 있는 구체적인 이익.
   - **결론**: 발표의 요약과 함께, 핵심 메시지를 다시 강조하고 설득력 있게 마무리.

2. 발표 톤은 ${finalInput.languageStyle}로 유지해주세요.

3. 청중(${finalInput.audience})의 특성과 요구를 반영하여 맞춤형으로 작성해주세요.
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
    console.error('Error Details:', error.response?.data || error.message);
    res.status(500).json({
      error: '스크립트를 생성하는 중 문제가 발생했습니다.',
      details: error.response?.data || 'No additional details available',
    });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
