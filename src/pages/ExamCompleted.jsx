// src/pages/ExamCompleted.jsx
import { useNavigate } from "react-router-dom";
// import "../styles/ExamCompleted.css";

const ExamCompleted = () => {
  const navigate = useNavigate();

  return (
    <div className='completed-container'>
      <div className='completed-card'>
        <div className='completed-icon'>✓</div>
        <h1>Exam Already Completed</h1>
        <p>
          You have already completed this examination. Each student is only
          allowed to take the exam once.
        </p>
        <p className='info-text'>
          Your results have been recorded and are available to the
          administrator.
        </p>
        <button onClick={() => navigate("/")} className='btn-primary'>
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default ExamCompleted;
