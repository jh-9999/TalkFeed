import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Gesture = () => {
  const [gestureCount, setGestureCount] = useState(0);
  const [gestureHistory, setGestureHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/gesture-count');
        setGestureCount(response.data.count || 0);
        setGestureHistory((prev) => {
          const maxHistory = 50;
          return [...prev.slice(-maxHistory + 1), response.data.count || 0];
        });
      } catch (error) {
        console.error('Error fetching gesture count:', error);
      }
    };

    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: gestureHistory.map((_, index) => index + 1),
    datasets: [
      {
        label: 'Gesture Count Over Time',
        data: gestureHistory,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4, // 곡선 형태 부드럽게
        pointRadius: 5, // 포인트 크기
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(54, 162, 235, 1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#4ade80', // 녹색 글자
        },
      },
      tooltip: {
        backgroundColor: 'rgba(54, 162, 235, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#93c5fd', // 파란색
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // X축 그리드 색상
        },
      },
      y: {
        ticks: {
          color: '#93c5fd', // 파란색
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Y축 그리드 색상
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-100 mb-4">
          Gesture Counter
        </h1>
        <p className="text-lg text-gray-300">
          Track and analyze your gestures in real-time!
        </p>
      </div>

      {/* Current Gesture Count */}
      <div className="bg-gray-800 shadow-xl rounded-lg py-4 px-8 mb-8 w-11/12 md:w-1/2">
        <p className="text-xl text-gray-300 text-center">
          <span className="font-bold text-green-400">
            Current Gesture Count:
          </span>{' '}
          <span className="text-2xl text-blue-400">{gestureCount}</span>
        </p>
      </div>

      {/* Chart */}
      <div className="bg-gray-800 shadow-xl rounded-lg p-6 w-11/12 md:w-3/4 lg:w-1/2">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Gesture;
