import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';

function Main() {
  // 사용자가 입력한 값을 관리하기 위한 상태 변수로 기본값으로 topic과 summary가 있다.
  const [input, setInput] = useState({ topic: '', summary: '' });

  // API로 요청한 값을 저장하고 사용하기 위한 상태 변수
  const [response, setResponse] = useState(null);

  // 로딩 상태를 관리하기 위한 상대 변수
  const [loading, setLoading] = useState(false);

  const [showGuide, setShowGuide] = useState(false);

  // 모달창의 현재 좌표(위치)를 관리하는 상태 변수
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // 현재 사용자가 모달을 드래그 중인지 여부를 저장하는 상태 변수
  const [isDragging, setIsDragging] = useState(false);

  // 사용자가 모달을 드래그할 때, 클릭한 위치를 저장하는 상태 변수수
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  //모달창을 처음 화면 중앙에 배치하기 위해 한 번만 좌표를 계산하여 설정하는 코드.
  useEffect(() => {
    const centerX =
      (window.innerWidth - Math.min(window.innerWidth * 0.9, 350)) / 2;
    const centerY =
      (window.innerHeight - Math.min(window.innerHeight * 0.9, 500)) / 2;
    setPosition({ x: centerX, y: centerY });
  }, []);

  // 사용자가 모달을 드래그하기 위해 마우스를 클릭했을 때 실행되는 함수.
  // 1. 드래그가 시작되었음을 표시하기 위해 'setIsDragging(true)'를 설정.
  // 2. 마우스 클릭 위치를 기준으로 드래그 시작점을 'setStartPoint()' 에 저장.
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPoint({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  // 사용자가 모달을 드래그 중이라면, 마우스의 현재 위치를 기반으로 모달의 새로운 좌표를 설정하는 함수.
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPoint.x,
      y: e.clientY - startPoint.y,
    });
  };

  // 사용자가 마우스 클릭 버튼에서 손을 땠을 때, 드래그 상태를 종료하는 함수.
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 사용자가 입력 필드(input, textarea 등)에 값을 입력할 때마다 호출되는 함수.
  // - `name`: 변경된 입력 필드의 `name` 속성 값 (ex: 'topic' 또는 'summary').
  // - `value`: 사용자가 입력한 새로운 값.
  // - `setInput((prev) => ({ ...prev, [name]: value }))`:
  //   - 기존 `prev` 상태를 유지하면서, 변경된 `name` 필드의 값을 업데이트.
  const handleInputChange = (e) => {
    // 구조 분해 할당을 사용하여 'e.target' 객체에서 'name'과 'value' 속성을 추출하여 변수로 선언언
    const { name, value } = e.target;

    // 구조 분해 할당으로 가져온 name, value 값을 가져와서 상태 변수에 저장
    // prev 는 특성 명령어나 메서드가 아닌 기존 값을 보존하기 위해 들어가있는 요소로
    // 원하는 이름으로 변경해도 작동하는데에는 문제가 없다.
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  // 사용자가 발표 주제와 내용을 입력하고 확인 버튼을 누르면 실행되는 함수
  // 백엔드와 통신하기 위해 사용하는 axios 가 비동기 통신이기 때문에
  // await 를 사용해야 하고, await 를 사용하기 위해서는 async 로 함수가 선언 되어야 한다.
  const handleSubmit = async () => {
    // 사용자가 topic 과 summary를 입력 했는지 걸러내는 조건문.
    // 풀어서 설명하면, topic 안에 값이 있으면 True 를 반환, 없다면 false 를 반환
    // 앞에 !인 not 연산자가 붙어서 값이 없다면 True를 반환하므로 해당 함수 실행
    // || or 연산자로 둘 중 하나의 값만 없더라도 해당 함수 실행.
    // 따라서 사용자가 topic 이나 summary 둘 중 하나라도 입력하지 않으면
    // 에러 메시지를 출력하고, return 다음 코드로 넘어가지 않고
    // handleSubmit 함수는 종료.
    if (!input.topic.trim() || !input.summary.trim()) {
      setResponse({ error: '발표 주제와 내용을 모두 입력해주세요.' });
      return;
    }
    // 사용자가 값을 제대로 입력하면, 데이터를 받아 올 때까지 시간이걸리기 때문에
    // 로딩 state 값을 true로 바꿔 줌으로써 로딩이 되고 있다는 것을 화면에 출력.
    setLoading(true);
    // API 요청하기 전에 기존 응답 상태를 초기화 하여, 이전 결과가 화면에 출력되지 않게끔하기위해
    // null 값으로 초기화화
    setResponse(null);

    //  `axios.post()`를 사용하여 백엔드 서버에 데이터를 보내고 응답을 받는 코드.
    // - 첫 번째 인수: API 요청을 보낼 URL (`'http://localhost:5000/ai/predict'`).
    // - 두 번째 인수: 서버로 보낼 데이터를 JSON 형식으로 전달 (`{ topic, content }`).
    // - `await`를 사용하여 응답이 도착할 때까지 기다린 후, 결과를 `res` 변수에 저장.
    // - `res.data`에는 서버에서 반환한 응답 데이터가 포함됨.
    try {
      const res = await axios.post('http://localhost:5000/ai/predict', {
        topic: input.topic,
        content: input.summary,
      });
      // 요청한 값이 data.script 안에 있기 때문에 해당 값 까지 접근하여 Response에 저장
      setResponse(res.data.script);
    } catch (error) {
      // API 요청 중 에러가 발생했을 때 실행되는 `catch` 블록.
      // - `console.error('Error:', error.message);` → 개발자가 콘솔에서 에러 메시지를 확인할 수 있도록 출력.
      // - `setResponse({ error: '스크립트를 생성하는 중 문제가 발생했습니다.' });`
      //   → UI에서 사용자에게 오류 메시지를 표시하기 위해 `response` 상태를 에러 객체로 설정.
      // - `error.message`에는 백엔드에서 반환한 에러 메시지가 포함될 수 있음.
      console.error('Error:', error.message);
      setResponse({ error: '스크립트를 생성하는 중 문제가 발생했습니다.' });
    } finally {
      // API 요청이 성공했든 실패했든 무조건 실행되는 `finally` 블록.
      // 로딩 상태를 false 로 변환하면서 로딩 종료.
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-3 py-4 min-vh-100 d-flex flex-column">
      <div className="text-center mb-4">
        <h1 className="h3">스크립트 생성기</h1>
        <p className="small text-muted">
          발표 주제와 내용을 입력하여 스크립트를 생성하세요.
        </p>
      </div>

      <div className="w-100 px-2">
        <textarea
          name="topic"
          value={input.topic}
          onChange={handleInputChange}
          placeholder="발표 주제를 입력하세요"
          className="form-control mb-2"
          rows="2"
        />
        <textarea
          name="summary"
          value={input.summary}
          onChange={handleInputChange}
          placeholder="발표 내용을 간략히 입력하세요"
          className="form-control mb-2"
          rows="4"
        />
        <button
          className="btn btn-primary w-100 mb-2"
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

      <div className="mt-3 w-100 px-2">
        {response && (
          <div className="p-3 bg-light rounded shadow-sm">
            <h5 className="mb-2 h6">생성된 스크립트:</h5>
            {response.error ? (
              <span className="text-danger small">{response.error}</span>
            ) : (
              <pre className="script-output small">{response}</pre>
            )}
          </div>
        )}
      </div>

      {showGuide && (
        <div
          className="modal mobile-modal"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            top: `${position.y}px`,
            left: `${position.x}px`,
          }}
        >
          <div className="modal_content" onMouseDown={handleMouseDown}>
            <div className="modal-header" onMouseDown={handleMouseDown}>
              <h2 className="h5">작성 가이드</h2>
            </div>
            <ol className="small p-0 px-3">
              <li>
                <strong>발표 주제:</strong> ex) 인공지능의 현재와 미래
              </li>
              <li>
                <strong>발표 목적:</strong> ex) 정보 공유, 설득, 동기 부여
              </li>
              <li>
                <strong>대략적인 전달 내용:</strong> 발표하고 싶은 내용
              </li>
              <li>
                <strong>청중 정보:</strong> 대상 청중 특성
                <br />
                ex) 대학생, IT 전문가 등
              </li>
              <li>
                <strong>발표 시간:</strong> 사용할 전체 시간
                <br />
                ex) 5분, 10분 등
              </li>
              <li>
                <strong>발표 형식:</strong> 스크립트 스타일
                <br />
                ex) 프레젠테이션, 토크쇼 스타일
              </li>
              <li>
                <strong>핵심 메시지:</strong> 전달하고 싶은 핵심 메시지
              </li>
              <li>
                <strong>발표 언어와 스타일:</strong> 톤과 언어
              </li>
              <li>
                <strong>추가 요청사항:</strong> 강조/피해야 할 사항
              </li>
            </ol>

            <button
              onClick={() => setShowGuide(false)}
              className="btn btn-outline-secondary btn-sm"
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
