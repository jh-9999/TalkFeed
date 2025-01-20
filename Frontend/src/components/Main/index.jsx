import React, { useState } from 'react';
import axios from 'axios';
import "./style.css"

function Main({ user, handleclick,isSpecial,isVip }) {

    const [input, setInput] = useState('');
    const [response, setResponse] = useState(null);
    const usernameText = user || "Stranger"
  
    const handleInputChange = (e) => {
      setInput(e.target.value);
    };
  
    const handleSubmit = async () => {
      try {
        // Node.js 서버를 통해 FastAPI 호출
        const res = await axios.post('http://localhost:5000/ai/predict', { input });
        setResponse(res.data); // FastAPI 응답 데이터 설정
      } catch (error) {
        console.error('Error:', error.message);
        setResponse({ error: 'An error occurred while processing the request.' });
      }
    };


  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Frontend to Backend to AI</h1>
      <input
        type="text"
        placeholder="Enter some data"
        value={input}
        onChange={handleInputChange}
        style={{ padding: '10px', width: '300px', fontSize: '16px' }}
      />
      <br />
      <button
        onClick={handleSubmit}
        style={{
          padding: '10px 20px',
          marginTop: '20px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Submit
      </button>
      <br />
      {response && (
        <div style={{ marginTop: '20px' }}>
          <h3>Response:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
      <br/>
      <p onClick={handleclick}>{usernameText}</p>
      {isSpecial && <span>***Special***</span>}
      {(isSpecial || isVip) && 
        isVip ? <span>***isVip***</span> : isSpecial ? <span>***isSpecial***</span> : null }
      <span>{user || "Guest"}</span>
      <p>12</p>

    </div>
  )
}

export default Main
