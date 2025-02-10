import Main from './components/Main';
import React from "react";
import StartPage from "./components/Pages/StartPage";
import LogIn from "./components/Pages/LogIn";
import SignUp from "./components/Pages/SignUp";
import Welcome from "./components/Pages/Welcome";
import Home from "./components/Pages/Home";
import Scripts from "./components/Pages/Scripts";
import CreateScripts from "./components/Pages/CreateScripts";
import { BrowserRouter as Router, Routes, Route  } from 'react-router-dom';

const App = () => {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<StartPage/>} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/scripts" element={<Scripts />} />
        <Route path="/create-scripts" element={<CreateScripts />} />
      </Routes>
      <Main />
      
    </div>
  );
};

export default App;
