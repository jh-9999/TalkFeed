// import Emotion from './components/Emotion';
import Main from './components/Main';
import React from "react";
import StartPage from "./components/Pages/StartPage";
import Onboarding from './components/Pages/Onboarding';
import LogIn from "./components/Pages/LogIn";
import SignUp from "./components/Pages/SignUp";
import Welcome from "./components/Pages/Welcome";
import Scripts from "./components/Pages/Scripts";
import CreateScripts from "./components/Pages/CreateScripts";
import CreateScriptsOutput from "./components/Pages/CreateScriptsOutput";
import UploadVideo from "./components/Pages/UploadVideo";
import RecordVideo from "./components/Pages/RecordVideo";
import AnalysisScreen from "./components/Pages/AnalysisScreen";
import Feedback from "./components/Pages/Feedback";
import FeedbackEmotion from "./components/Pages/FeedbackEmotion";
import FeedbackSpeed from "./components/Pages/FeedbackSpeed";
import FeedbackWhisper from "./components/Pages/FeedbackWhisper";
import { BrowserRouter as Router, Routes, Route  } from 'react-router-dom';

const App = () => {
  return (
    <div className="app-container">
      <Routes>
        {/* <Route path="/emotion" element={<Emotion />} /> */}
        <Route path="/" element={<StartPage/>} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/scripts" element={<Scripts />} />
        <Route path="/create-scripts" element={<CreateScripts />} />
        <Route path="/create-scripts-output" element={<CreateScriptsOutput />} />
        <Route path="/uploadvideo" element={<UploadVideo />} />
        <Route path="/video" element={<UploadVideo />} />
        <Route path="/record" element={<RecordVideo />} />
        <Route path="/analysisscreen" element={<AnalysisScreen />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/feedback-emotion" element={<FeedbackEmotion />} />
        <Route path="/feedback-speed" element={<FeedbackSpeed />} />
        <Route path="/feedback-whisper" element={<FeedbackWhisper />} />
      </Routes>
      <Main />
      
    </div>
  );
};

export default App;
