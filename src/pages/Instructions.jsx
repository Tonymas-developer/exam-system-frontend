import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Instructions.css";

const Instructions = () => {
  useEffect(() => {
    document.title = "Instructions";
  }, []);

  const navigate = useNavigate();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const studentData = localStorage.getItem("student");

    if (!token || !studentData) {
      navigate("/");
      return;
    }

    setStudent(JSON.parse(studentData));
  }, [navigate]);

  const handleStartExam = () => {
    navigate("/exam");
  };

  if (!student) {
    return <div>Loading...</div>;
  }

  return (
    <div className='instructions-container'>
      <div className='instructions-card'>
        <div className='welcome-section'>
          <h1>Welcome, {student.fullname}!</h1>
          <p className='student-info'>
            Course: <strong style={{color: '#ccc'}}>{student.course}</strong> | Code:{" "}
            <strong>{student.generatedCode}</strong>
          </p>
        </div>

        <div className='instructions-content'>
          <h2>Exam Instructions</h2>
          <p className='intro-text'>
            Please read the following instructions carefully before clicking the
            "Start Exam" button. Understanding these guidelines will help ensure
            a smooth examination experience.
          </p>

          <div className='instruction-item'>
            <div className='instruction-icon'>📋</div>
            <div className='instruction-text'>
              <h3>Exam Structure</h3>
              <p>
                The exam contains 50 questions. Answer all questions to boost your score.
              </p>
            </div>
          </div>

          <div className='instruction-item'>
            <div className='instruction-icon'>⏱️</div>
            <div className='instruction-text'>
              <h3>Time Limit</h3>
              <p>
                You have exactly 30 minutes to complete the exam. The system
                will automatically submit your answers when time expires.
              </p>
            </div>
          </div>

          <div className='instruction-item'>
            <div className='instruction-icon'>⚠️</div>
            <div className='instruction-text'>
              <h3>One-Time Opportunity</h3>
              <p>
                You can only take this exam once. There are no retakes, so give
                it your best shot.
              </p>
            </div>
          </div>

          <div className='instruction-item'>
            <div className='instruction-icon'>✅</div>
            <div className='instruction-text'>
              <h3>Results</h3>
              <p>
                Your score will be displayed immediately after submission. 
              </p>
            </div>
          </div>

          <div className='instruction-item'>
            <div className='instruction-icon'>💡</div>
            <div className='instruction-text'>
              <h3>Navigation</h3>
              <p>
                You can move between questions using the Previous and Next
                buttons. Make sure to answer all questions before submitting.
              </p>
            </div>
          </div>
        </div>

        <div className='important-note'>
          <strong>Important:</strong> Once you click "Start Exam," the timer
          will begin immediately. Make sure you are ready before proceeding.
        </div>

        <div className='action-buttons'>
          <button onClick={() => navigate("/")} className='btn-secondary'>
            Logout
          </button>
          <button onClick={handleStartExam} className='btn-primary'>
            Start Exam Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
