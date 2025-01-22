import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';

function Main() {
  const [input, setInput] = useState({ topic: '', summary: '' });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false); // 드래그 중인지 확인
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const centerX = (window.innerWidth - 600) / 2; // 모달 너비: 600px
    const centerY = (window.innerHeight - 400) / 2; // 모달 높이: 대략 400px
    setPosition({ x: centerX, y: centerY });
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true); // 드래그 시작
    setStartPoint({ x: e.clientX - position.x, y: e.clientY - position.y }); // 시작 위치 저장
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return; // 드래그 중이 아니면 무시
    setPosition({
      x: e.clientX - startPoint.x,
      y: e.clientY - startPoint.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false); // 드래그 종료
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!input.topic.trim() || !input.summary.trim()) {
      setResponse({ error: '발표 주제와 내용을 모두 입력해주세요.' });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await axios.post('http://localhost:5000/ai/predict', {
        topic: input.topic,
        content: input.summary,
      });
      setResponse(res.data.script);
    } catch (error) {
      console.error('Error:', error.message);
      setResponse({ error: '스크립트를 생성하는 중 문제가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center min-vh-100">
      <div className="text-center mb-5">
        <h1 className="display-4">스크립트 생성기</h1>
        <p className="lead">
          발표 주제와 내용을 입력하여 스크립트를 생성하세요.
        </p>
      </div>

      <div className="w-100" style={{ maxWidth: '600px' }}>
        <textarea
          name="topic"
          value={input.topic}
          onChange={handleInputChange}
          placeholder="발표 주제를 입력하세요"
          className="form-control mb-3"
          rows="2"
        />
        <textarea
          name="summary"
          value={input.summary}
          onChange={handleInputChange}
          placeholder="발표 내용을 간략히 입력하세요"
          className="form-control mb-3"
          rows="5"
        />
        <button
          className="btn btn-primary w-100 mb-3"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
              스크립트 생성 중...
            </>
          ) : (
            '스크립트 생성'
          )}
        </button>
        <button
          className="btn btn-secondary w-100"
          onClick={() => setShowGuide(true)}
        >
          작성 가이드 보기
        </button>
      </div>

      <div className="mt-5 w-100" style={{ maxWidth: '600px' }}>
        {response && (
          <div className="p-4 bg-light rounded shadow-sm">
            <h5 className="mb-3">생성된 스크립트:</h5>
            {response.error ? (
              <span className="text-danger">{response.error}</span>
            ) : (
              <pre className="script-output">{response}</pre>
            )}
          </div>
        )}
      </div>

      {showGuide && (
        <div
          className="modal"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            top: `${position.y}px`, // 상태에서 가져온 값
            left: `${position.x}px`, // 상태에서 가져온 값
          }}
        >
          <div className="modal_content" onMouseDown={handleMouseDown}>
            <div
              className="modal-header"
              onMouseDown={handleMouseDown} // 드래그 시작
            >
              <h2>작성 가이드</h2>
            </div>
            <ol>
              <li>
                <strong>발표 주제:</strong> ex) 인공지능의 현재와 미래
              </li>
              <li>
                <strong>발표 목적:</strong> ex) 정보를 공유, 설득, 동기 부여,
                제품 소개 등
              </li>
              <li>
                <strong>대략적인 전달 내용:</strong> 자신이 발표하고 싶은 내용을
                적어주세요.
              </li>
              <li>
                <strong>청중 정보:</strong> 대상 청중의 특성과 수준을 파악.
                <br />
                ex) 나이, 직업, 관심사, 전문성 등<br />
                ex) 대학생, IT 전문가, 비전문 일반인 등
              </li>
              <li>
                <strong>발표 시간:</strong> 발표에 사용할 수 있는 전체 시간
                <br />
                ex) 5분, 10분 등
              </li>
              <li>
                <strong>발표 형식:</strong> 스크립트 스타일 방향성 결정
                <br />
                ex) 형식적인 발표 (프레젠테이션 발표)
                <br />
                ex) 친근한 톤 (토크쇼 스타일)
                <br />
                ex) 간결한 요약 (짧은 동영상용)
              </li>
              <li>
                <strong>핵심 메시지:</strong> ex) "AI는 인간의 삶을 혁신적으로
                바꿀 수 있는 도구입니다."
              </li>
              <li>
                <strong>발표 언어와 스타일:</strong> ex) 전문적/비격식적 톤,
                한국어, 또는 한국어 + 영어 혼합
              </li>
              <li>
                <strong>추가 요청사항:</strong> 특별히 강조하거나 피해야 할 사항
                <br />
                ex) 너무 기술적인 용어는 피해주세요, 농담은 적당히 사용해주세요
                등
              </li>
            </ol>

            <button
              onClick={() => setShowGuide(false)}
              className="btn btn-outline-secondary"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Main;
