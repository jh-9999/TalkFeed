import React, { useState } from 'react';

const EmotionAnalysis = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [emotionCounts, setEmotionCounts] = useState(null);
  const [totalImages, setTotalImages] = useState(null);
  const [noFaceCount, setNoFaceCount] = useState(0);
  const [error, setError] = useState(null);
  const [availableEmotions, setAvailableEmotions] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setResults(null);
    setEmotionCounts(null);
    setTotalImages(null);
    setNoFaceCount(0);
    setError(null);
    setAvailableEmotions([]);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('파일을 선택해주세요');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('http://localhost:8000/analyze-images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResults(data.results);
      setEmotionCounts(data.emotion_counts);
      setTotalImages(data.total_images);
      setNoFaceCount(data.no_face_count || 0);
      setAvailableEmotions(data.available_emotions || []);
    } catch (err) {
      setError('분석 중 오류가 발생했습니다');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">감정 분석</h1>

        <div className="mb-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="mb-2"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            분석하기
          </button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>감정 데이터를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        {totalImages !== null && (
          <div className="mt-6 p-4 border rounded bg-gray-100">
            <h2 className="text-xl font-semibold mb-3">분석 개요</h2>
            <p>총 분석된 이미지 수: <span className="font-bold">{totalImages}</span></p>
            <p className="text-red-500">얼굴을 인식하지 못한 이미지 수: <span className="font-bold">{noFaceCount}</span></p>
          </div>
        )}

        {emotionCounts && availableEmotions.length > 0 && (
          <div className="mt-4 p-4 border rounded bg-gray-100">
            <h2 className="text-lg font-semibold mb-2">감정 개수</h2>
            <ul>
              {availableEmotions.map((emotion) => (
                <li key={emotion}>
                  <span className="font-medium">{emotion}</span>: {emotionCounts[emotion] || 0}회
                </li>
              ))}
            </ul>
          </div>
        )}

        {results && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-3">분석 결과</h2>
            {Object.entries(results).map(([filename, result]) => (
              <div key={filename} className="mb-4 p-4 border rounded">
                <h3 className="font-medium mb-2">{filename}</h3>
                {result.error ? (
                  <p className="text-red-500">{result.error}</p>
                ) : result.results === null ? (
                  <p className="text-red-500">얼굴이 감지되지 않았습니다</p>
                ) : (
                  <ul>
                    {result.results.map((face, index) => (
                      <li key={index} className="mb-2">
                        <span className="font-medium">감정: </span>
                        {face.emotion}
                        <br />
                        <span className="font-medium">신뢰도: </span>
                        {face.confidence.toFixed(2)}%
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionAnalysis;
