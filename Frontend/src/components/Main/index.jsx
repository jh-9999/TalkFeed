import React, { useState } from 'react';
import axios from 'axios';
import "./style.css"; // CSS 파일 불러오기

function Main() {
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [response, setResponse] = useState(null);

  const handleTopicChange = (e) => {
    setTopic(e.target.value);
  };

  const handleSummaryChange = (e) => {
    setSummary(e.target.value);
  };

  const handleSubmit = async () => {
    if (!topic.trim() || !summary.trim()) {
      setResponse({ error: 'Please enter both the topic and a summary.' });
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/ai/predict', { topic, summary });
      setResponse(res.data.script); // OpenAI에서 반환된 스크립트 설정
    } catch (error) {
      console.error('Error:', error.message);
      setResponse({ error: 'Failed to generate script. Please try again.' });
    }
  };

  return (
    <div className="Title_main">
      <h1>Script Generator</h1>
      <textarea
        value={topic}
        onChange={handleTopicChange}
        placeholder="Enter the presentation topic"
        className="input_text"
        rows="3"
      />
      <br />
      <textarea
        value={summary}
        onChange={handleSummaryChange}
        placeholder="Enter a brief summary of the presentation"
        className="input_text"
        rows="5"
      />
      <br />
      <button onClick={handleSubmit} className="click_button">
        Generate Script
      </button>
      {response && (
        <div className="res_main">
          <h3>Generated Script:</h3>
          {response.error ? (
            <span className="res_err">{response.error}</span>
          ) : (
            <pre className="script_text">{response}</pre>
          )}
        </div>
      )}
      <p>안녕</p>
    </div>
  );
}

export default Main;
