// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Instructions from "./pages/Instructions";
import Exam from "./pages/Exam";
import Results from "./pages/Results";
import Admin from "./pages/Admin";
import ExamCompleted from "./pages/ExamCompleted";

function App() {
  return (
    <Router>
      <div className='app'>
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/signup' element={<SignUp />} />
          <Route path='/instructions' element={<Instructions />} />
          <Route path='/exam' element={<Exam />} />
          <Route path='/results' element={<Results />} />
          <Route path='/admin' element={<Admin />} />
          <Route path='/completed' element={<ExamCompleted />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
