import { useState, useEffect } from "react";
import { reviewAPI } from "../services/api";
import "../styles/Results.css";

const Results = () => {
  const [results, setResults] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = "Results";
    loadResults();
  }, []);

  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  const loadResults = async () => {
    try {
      const sessionId = localStorage.getItem("sessionId");

      if (!sessionId) {
        setError("No exam session found. Please complete the exam first.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/exam/results/${sessionId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load results");
      }

      const fullResults = await response.json();
      setResults(fullResults);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load results:", error);
      setError(error.message || "Failed to load results");
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      const sessionId = localStorage.getItem("sessionId");

      await fetch(`${API_BASE_URL}:5000/api/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment,
          sessionId,
        }),
      });

      setReviewSubmitted(true);
      setTimeout(() => {
        setShowReviewModal(false);
      }, 2000);
    } catch (error) {
      alert("Failed to submit review");
    }
  };

  const handleSkipReview = () => {
    setShowReviewModal(false);
  };

  if (loading) {
    return (
      <div className='results-loading'>
        <div className='loading-spinner'></div>
        <p>Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='results-loading'>
        <div className='error-container'>
          <h2>Error Loading Results</h2>
          <p>{error}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className='btn-primary'
            style={{ marginTop: "20px" }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className='results-loading'>
        <div className='error-container'>
          <h2>No Results Found</h2>
          <p>Please complete the exam first.</p>
          <button
            onClick={() => (window.location.href = "/")}
            className='btn-primary'
            style={{ marginTop: "20px" }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const percentage = parseFloat(results.percentage);
  const passed = percentage >= 50;

  return (
    <div className='results-container'>
      {showReviewModal && (
        <div className='modal-overlay'>
          <div className='review-modal'>
            {reviewSubmitted ? (
              <div className='review-success'>
                <div className='success-icon'>✓</div>
                <h2>Thank you for your feedback!</h2>
                <p>Your review has been submitted successfully.</p>
              </div>
            ) : (
              <>
                <h2>How was the examination?</h2>
                <p>
                  We'd love to hear your thoughts about the examination process.
                </p>

                <form onSubmit={handleReviewSubmit}>
                  <div className='rating-container'>
                    <label>Rate your experience:</label>
                    <div className='star-rating'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type='button'
                          className={`star ${rating >= star ? "active" : ""}`}
                          onClick={() => setRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className='comment-container'>
                    <label htmlFor='comment'>Additional Comments:</label>
                    <textarea
                      id='comment'
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder='Tell us more about your experience (optional)'
                      rows='4'
                    />
                  </div>

                  <div className='modal-buttons'>
                    <button
                      type='button'
                      onClick={handleSkipReview}
                      className='btn-secondary'
                    >
                      Skip
                    </button>
                    <button type='submit' className='btn-primary'>
                      Submit Review
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <div className='results-card'>
        <div className={`results-header ${passed ? "passed" : "failed"}`}>
          <div className='results-icon'>{passed ? "🎉" : "📚"}</div>
          <h1>{passed ? "Congratulations!" : "Exam Completed"}</h1>
          <p className='results-message'>
            {passed
              ? "You have successfully passed the examination!"
              : "Thank you for completing the exam. Keep studying!"}
          </p>
          <p className='student-name'>{results.studentName}</p>
        </div>

        <div className='score-summary'>
          <div className='score-circle'>
            <svg viewBox='0 0 200 200'>
              <circle
                cx='100'
                cy='100'
                r='90'
                fill='none'
                stroke='#e0e0e0'
                strokeWidth='20'
              />
              <circle
                cx='100'
                cy='100'
                r='90'
                fill='none'
                stroke={passed ? "#4CAF50" : "#f44336"}
                strokeWidth='20'
                strokeDasharray={`${percentage * 5.65} 565`}
                strokeLinecap='round'
                transform='rotate(-90 100 100)'
              />
            </svg>
            <div className='score-text'>
              <div className='score-percentage'>{percentage}%</div>
              <div className='score-fraction'>
                {results.score}/{results.totalQuestions}
              </div>
            </div>
          </div>

          <div className='score-details'>
            <div className='detail-item'>
              <span className='detail-label'>Correct Answers:</span>
              <span className='detail-value correct'>{results.score}</span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Incorrect Answers:</span>
              <span className='detail-value incorrect'>
                {results.totalQuestions - results.score}
              </span>
            </div>
            <div className='detail-item'>
              <span className='detail-label'>Total Questions:</span>
              <span className='detail-value'>{results.totalQuestions}</span>
            </div>
          </div>
        </div>

        <div className='results-footer'>
          <p>
            Your results have been recorded. You cannot retake this examination.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("student");
              localStorage.removeItem("sessionId");
              localStorage.removeItem("examResult");
              window.location.href = "/";
            }}
            className='btn-primary'
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
