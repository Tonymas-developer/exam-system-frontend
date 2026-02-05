// import { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { examAPI } from "../services/api";
// import "../styles/Exam.css";

// const Exam = () => {
//   const navigate = useNavigate();
//   const [questions, setQuestions] = useState([]);
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [answers, setAnswers] = useState({});
//   const [sessionId, setSessionId] = useState(null);
//   const [timeRemaining, setTimeRemaining] = useState(1800);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [student, setStudent] = useState(null);
//   const [sessionExpired, setSessionExpired] = useState(false);

//   // Refs to avoid closure/race issues and duplicate submissions
//   const timerRef = useRef(null);
//   const sessionIdRef = useRef(null);
//   const isSubmittingRef = useRef(false);
//   const hasAutoSubmittedRef = useRef(false);

//   // initialize on mount
//   useEffect(() => {
//     document.title = "Examination in Progress - Exam System";

//     const token = localStorage.getItem("token");
//     const studentData = localStorage.getItem("student");

//     if (!token || !studentData) {
//       navigate("/");
//       return;
//     }

//     setStudent(JSON.parse(studentData));

//     // Restore session from sessionStorage if any
//     const existingSessionId = sessionStorage.getItem("examSessionId");
//     const existingQuestions = sessionStorage.getItem("examQuestions");
//     const existingAnswers = sessionStorage.getItem("examAnswers");
//     const existingTime = sessionStorage.getItem("examTimeRemaining");
//     const existingCurrentQ = sessionStorage.getItem("examCurrentQuestion");

//     if (existingSessionId && existingQuestions) {
//       try {
//         console.log("Restoring existing session:", existingSessionId);

//         const parsedQuestions = JSON.parse(existingQuestions);
//         const parsedAnswers = existingAnswers
//           ? JSON.parse(existingAnswers)
//           : {};
//         const parsedTime = existingTime ? parseInt(existingTime, 10) : 1800;
//         const parsedCurrentQ = existingCurrentQ
//           ? parseInt(existingCurrentQ, 10)
//           : 0;
//         const validTime = Math.max(0, parsedTime);

//         setQuestions(parsedQuestions);
//         setAnswers(parsedAnswers);
//         setTimeRemaining(validTime);
//         setCurrentQuestion(
//           Math.min(parsedCurrentQ, parsedQuestions.length - 1),
//         );
//         setSessionId(existingSessionId);
//         sessionIdRef.current = existingSessionId;
//         setLoading(false);

//         // If time already expired when restoring, trigger auto-submit safely
//         if (
//           validTime === 0 &&
//           !hasAutoSubmittedRef.current &&
//           !isSubmittingRef.current
//         ) {
//           hasAutoSubmittedRef.current = true;
//           // schedule to run outside of render stack
//           setTimeout(() => {
//             handleAutoSubmit();
//           }, 0);
//         }
//       } catch (err) {
//         console.error("Error restoring session:", err);
//         // fallback to fresh start
//         startExam();
//       }
//     } else {
//       startExam();
//     }

//     // cleanup on unmount
//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // persist session state (sessionStorage) when relevant changes
//   useEffect(() => {
//     if (sessionId && questions.length > 0) {
//       try {
//         sessionStorage.setItem("examSessionId", sessionId);
//         sessionStorage.setItem("examQuestions", JSON.stringify(questions));
//         sessionStorage.setItem("examAnswers", JSON.stringify(answers));
//         sessionStorage.setItem("examTimeRemaining", String(timeRemaining));
//         sessionStorage.setItem("examCurrentQuestion", String(currentQuestion));
//         localStorage.setItem("sessionId", sessionId);
//       } catch (err) {
//         console.warn("Failed to persist session:", err);
//       }
//     }
//   }, [sessionId, questions, answers, timeRemaining, currentQuestion]);

//   // Timer effect: single source of truth is timeRemaining state
//   useEffect(() => {
//     if (questions.length === 0) return;
//     if (isSubmittingRef.current) return;

//     // clear any existing timer (safe)
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }

//     timerRef.current = setInterval(() => {
//       setTimeRemaining((prev) => {
//         // if already 0, keep it at 0
//         if (prev <= 0) return 0;
//         const next = prev - 1;
//         if (next <= 0) {
//           // stop timer immediately
//           if (timerRef.current) {
//             clearInterval(timerRef.current);
//             timerRef.current = null;
//           }
//           // schedule auto-submit outside setter context
//           setTimeout(() => {
//             if (!hasAutoSubmittedRef.current && !isSubmittingRef.current) {
//               hasAutoSubmittedRef.current = true;
//               console.log("Auto-submit triggered by timer expiry");
//               handleAutoSubmit();
//             }
//           }, 0);
//           return 0;
//         }
//         return next;
//       });
//     }, 1000);

//     // cleanup when dependencies change
//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//   }, [questions.length]); // we only need to restart timer when questions load/length changes

//   const startExam = async () => {
//     try {
//       console.log("Starting new exam...");
//       const response = await examAPI.startExam(); // expects auth via examAPI wrapper

//       if (!response || !response.sessionId) {
//         throw new Error("Invalid response from startExam");
//       }

//       setQuestions(response.questions || []);
//       setSessionId(response.sessionId);
//       sessionIdRef.current = response.sessionId;

//       const timeInSeconds = response.remainingSeconds ?? 1800;
//       const validTime = Math.max(0, timeInSeconds);
//       setTimeRemaining(validTime);

//       localStorage.setItem("sessionId", response.sessionId);
//       setLoading(false);
//     } catch (error) {
//       console.error("Failed to start exam:", error);
//       alert(
//         error?.response?.data?.error || error.message || "Failed to start exam",
//       );
//       navigate("/instructions");
//     }
//   };

//   const handleAnswerSelect = async (option) => {
//     if (!questions || questions.length === 0) return;
//     const questionId = questions[currentQuestion].id;
//     const newAnswers = { ...answers, [questionId]: option };
//     setAnswers(newAnswers);

//     // optimistic save to sessionStorage
//     try {
//       sessionStorage.setItem("examAnswers", JSON.stringify(newAnswers));
//     } catch (err) {
//       console.warn("Could not persist answers locally:", err);
//     }

//     // send to server — swallow network errors but notify user for real failures
//     try {
//       await examAPI.submitAnswer(sessionIdRef.current, questionId, option);
//     } catch (error) {
//       // handle expired session explicitly
//       if (
//         error?.response?.status === 404 &&
//         error?.response?.data?.error
//           ?.toLowerCase()
//           ?.includes("session not found")
//       ) {
//         setSessionExpired(true);
//         if (timerRef.current) {
//           clearInterval(timerRef.current);
//           timerRef.current = null;
//         }
//         alert(
//           "Your session has expired. Your answers up to this point have been saved on the server. Please contact support.",
//         );
//         return;
//       }
//       console.error("Failed to save answer:", error);
//       // optionally show a non-blocking notice
//     }
//   };

//   const handleNext = () => {
//     setCurrentQuestion((prev) => Math.min(prev + 1, questions.length - 1));
//   };

//   const handlePrevious = () => {
//     setCurrentQuestion((prev) => Math.max(prev - 1, 0));
//   };

//   const handleAutoSubmit = async () => {
//     console.log("Auto-submit handler called at", new Date().toISOString());

//     // stop timer
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }

//     await submitExam();
//   };

//   const handleSubmit = async () => {
//     if (isSubmittingRef.current) {
//       console.log("Already submitting (from handleSubmit)");
//       return;
//     }

//     if (!questions || questions.length === 0) {
//       alert("No questions loaded. Cannot submit.");
//       return;
//     }

//     const unanswered = questions.filter((q) => !answers[q.id]);
//     if (unanswered.length > 0) {
//       const confirmSubmit = window.confirm(
//         `You have ${unanswered.length} unanswered question(s). Do you want to submit anyway?`,
//       );
//       if (!confirmSubmit) return;
//     }

//     await submitExam();
//   };

//   const submitExam = async () => {
//     if (isSubmittingRef.current) {
//       console.log("Already submitting, skipping duplicate call...");
//       return;
//     }

//     const currentSessionId = sessionIdRef.current;
//     if (!currentSessionId) {
//       console.error("No sessionId available for submission");
//       alert("Error: No active session found. Please contact support.");
//       return;
//     }

//     // set submission guard immediately
//     isSubmittingRef.current = true;
//     setSubmitting(true);

//     // stop timer
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }

//     // clear local session copies to avoid accidental re-use
//     try {
//       sessionStorage.removeItem("examSessionId");
//       sessionStorage.removeItem("examQuestions");
//       sessionStorage.removeItem("examAnswers");
//       sessionStorage.removeItem("examTimeRemaining");
//       sessionStorage.removeItem("examCurrentQuestion");
//     } catch (err) {
//       console.warn("Failed to clear sessionStorage:", err);
//     }

//     console.log("Submitting exam with sessionId:", currentSessionId);

//     try {
//       const response = await examAPI.submitExam(currentSessionId); // expects body with sessionId
//       console.log("Exam submitted successfully:", response);

//       // persist result for results page
//       localStorage.setItem(
//         "examResult",
//         JSON.stringify({
//           score: response.score,
//           totalQuestions: response.totalQuestions,
//           percentage: response.percentage,
//           passed: response.passed,
//           sessionId: response.sessionId || currentSessionId,
//         }),
//       );

//       // navigate to results
//       navigate("/results", { replace: true });

//       // clear token after short delay
//       setTimeout(() => {
//         localStorage.removeItem("token");
//       }, 500);
//     } catch (error) {
//       console.error("Failed to submit exam:", error);

//       // handle already-submitted gracefully
//       if (
//         error?.response?.data?.error
//           ?.toLowerCase()
//           ?.includes("already submitted")
//       ) {
//         alert(
//           "This exam has already been submitted. Redirecting to results...",
//         );
//         navigate("/results", { replace: true });
//         return;
//       }

//       alert(
//         error?.response?.data?.error ||
//           "Failed to submit exam. Please try again.",
//       );
//       // reset submission guards on failure
//       isSubmittingRef.current = false;
//       setSubmitting(false);
//     }
//   };

//   const formatTime = (seconds) => {
//     if (
//       isNaN(seconds) ||
//       seconds === null ||
//       seconds === undefined ||
//       seconds < 0
//     ) {
//       return "00:00";
//     }
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
//   };

//   if (loading) {
//     return (
//       <div className='exam-loading'>
//         <div className='loading-container'>
//           <div className='loading-spinner'></div>
//           <h2>Preparing Your Examination</h2>
//           <p>Please wait while we load your questions...</p>
//           <div className='loading-progress'>
//             <div className='loading-bar'></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!questions || questions.length === 0) {
//     return <div className='exam-error'>No questions available</div>;
//   }

//   const currentQ = questions[currentQuestion];
//   const selectedAnswer = answers[currentQ.id];
//   const answeredCount = Object.keys(answers).length;
//   const progress = (answeredCount / questions.length) * 100;

//   return (
//     <div className='exam-container'>
//       <div className='exam-header'>
//         <div className='exam-info'>
//           <h2>Examination in Progress</h2>
//           <div className='student-details'>
//             <p>
//               <strong>{student?.fullname}</strong>
//             </p>
//             <p className='exam-code'>Code: {student?.generatedCode}</p>
//           </div>
//           <p className='question-counter'>
//             Question {currentQuestion + 1} of {questions.length}
//           </p>
//         </div>
//         <div className={`timer ${timeRemaining < 300 ? "timer-warning" : ""}`}>
//           <div className='timer-icon'>⏱️</div>
//           <div className='timer-value'>{formatTime(timeRemaining)}</div>
//         </div>
//       </div>

//       <div className='progress-bar-container'>
//         <div className='progress-bar' style={{ width: `${progress}%` }}></div>
//         <span className='progress-text'>
//           {answeredCount} / {questions.length} answered
//         </span>
//       </div>

//       {sessionExpired && (
//         <div className='warning-message' style={{ marginBottom: "12px" }}>
//           ⚠️ Your session has expired. Answers are no longer being saved. Please
//           contact support.
//         </div>
//       )}

//       <div className='exam-content'>
//         <div className='question-card'>
//           <div className='question-number'>Question {currentQuestion + 1}</div>
//           <div className='question-text'>{currentQ.question}</div>

//           <div className='options-container'>
//             {currentQ.options.map((option, index) => (
//               <button
//                 key={index}
//                 className={`option-button ${selectedAnswer === option ? "selected" : ""}`}
//                 onClick={() => handleAnswerSelect(option)}
//                 disabled={submitting || sessionExpired}
//               >
//                 <span className='option-label'>
//                   {String.fromCharCode(65 + index)}
//                 </span>
//                 <span className='option-text'>{option}</span>
//                 {selectedAnswer === option && (
//                   <span className='check-mark'>✓</span>
//                 )}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className='navigation-buttons'>
//           <button
//             onClick={handlePrevious}
//             disabled={currentQuestion === 0 || submitting}
//             className='btn-secondary'
//           >
//             ← Previous
//           </button>

//           <div className='center-buttons'>
//             {currentQuestion === questions.length - 1 ? (
//               <button
//                 onClick={handleSubmit}
//                 className='btn-submit'
//                 disabled={submitting}
//               >
//                 {submitting ? "Submitting..." : "Submit Exam"}
//               </button>
//             ) : (
//               <button
//                 onClick={handleNext}
//                 className='btn-primary'
//                 disabled={submitting}
//               >
//                 Next →
//               </button>
//             )}
//           </div>

//           <div className='question-indicator'>
//             {selectedAnswer ? "✓ Answered" : "○ Unanswered"}
//           </div>
//         </div>
//       </div>

//       {timeRemaining < 300 && !sessionExpired && timeRemaining > 0 && (
//         <div className='warning-message'>
//           ⚠️ Less than 5 minutes remaining! The exam will auto-submit when time
//           expires.
//         </div>
//       )}
//     </div>
//   );
// };

// export default Exam;

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { examAPI } from "../services/api";
import "../styles/Exam.css";

const Exam = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [student, setStudent] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Refs to avoid closure/race issues and duplicate submissions
  const timerRef = useRef(null);
  const sessionIdRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const hasAutoSubmittedRef = useRef(false);

  // New: single source of truth for the deadline
  // stored as timestamp (ms since epoch)
  const endTimeRef = useRef(null);

  // initialize on mount
  useEffect(() => {
    document.title = "Examination in Progress";

    const token = localStorage.getItem("token");
    const studentData = localStorage.getItem("student");

    if (!token || !studentData) {
      navigate("/");
      return;
    }

    setStudent(JSON.parse(studentData));

    // Restore session from sessionStorage if any
    const existingSessionId = sessionStorage.getItem("examSessionId");
    const existingQuestions = sessionStorage.getItem("examQuestions");
    const existingAnswers = sessionStorage.getItem("examAnswers");
    const existingEndTime = sessionStorage.getItem("examEndTime"); // <-- stored end timestamp
    const existingCurrentQ = sessionStorage.getItem("examCurrentQuestion");

    if (existingSessionId && existingQuestions) {
      try {
        console.log("Restoring existing session:", existingSessionId);

        const parsedQuestions = JSON.parse(existingQuestions);
        const parsedAnswers = existingAnswers
          ? JSON.parse(existingAnswers)
          : {};
        const parsedCurrentQ = existingCurrentQ
          ? parseInt(existingCurrentQ, 10)
          : 0;

        setQuestions(parsedQuestions);
        setAnswers(parsedAnswers);
        setCurrentQuestion(
          Math.min(parsedCurrentQ, parsedQuestions.length - 1),
        );
        setSessionId(existingSessionId);
        sessionIdRef.current = existingSessionId;

        // restore end time if present
        if (existingEndTime) {
          endTimeRef.current = parseInt(existingEndTime, 10);
          const remaining = Math.max(
            0,
            Math.ceil((endTimeRef.current - Date.now()) / 1000),
          );
          setTimeRemaining(remaining);
        } else {
          // fallback to default duration
          setTimeRemaining(1800);
        }

        setLoading(false);

        // If time already expired when restoring, trigger auto-submit safely
        if (
          endTimeRef.current !== null &&
          endTimeRef.current <= Date.now() &&
          !hasAutoSubmittedRef.current &&
          !isSubmittingRef.current
        ) {
          hasAutoSubmittedRef.current = true;
          setTimeout(() => {
            handleAutoSubmit();
          }, 0);
        }
      } catch (err) {
        console.error("Error restoring session:", err);
        // fallback to fresh start
        startExam();
      }
    } else {
      startExam();
    }

    // cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist session state (sessionStorage) when relevant changes
  useEffect(() => {
    if (sessionId && questions.length > 0) {
      try {
        sessionStorage.setItem("examSessionId", sessionId);
        sessionStorage.setItem("examQuestions", JSON.stringify(questions));
        sessionStorage.setItem("examAnswers", JSON.stringify(answers));
        sessionStorage.setItem("examCurrentQuestion", String(currentQuestion));
        localStorage.setItem("sessionId", sessionId);

        // persist endTime if present
        if (endTimeRef.current) {
          sessionStorage.setItem("examEndTime", String(endTimeRef.current));
        }
      } catch (err) {
        console.warn("Failed to persist session:", err);
      }
    }
  }, [sessionId, questions, answers, currentQuestion]);

  // Timer logic using endTimeRef as single source of truth
  useEffect(() => {
    if (questions.length === 0) return;
    if (isSubmittingRef.current) return;

    // helper to recalc remaining and update state immediately
    const recalcAndSet = () => {
      if (!endTimeRef.current) return;
      const remaining = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      );
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        // ensure timer stopped & schedule auto-submit once
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (!hasAutoSubmittedRef.current && !isSubmittingRef.current) {
          hasAutoSubmittedRef.current = true;
          setTimeout(() => {
            console.log("Auto-submit triggered by timer expiry (recalc)");
            handleAutoSubmit();
          }, 0);
        }
      }
    };

    // clear any existing timer (safe)
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // update immediately once
    recalcAndSet();

    timerRef.current = setInterval(() => {
      recalcAndSet();
    }, 1000);

    // visibilitychange: when user switches tabs, immediately recalc so UI syncs
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [questions.length]);

  function handleVisibilityChange() {
    // when the tab becomes visible, recalc immediately
    if (document.visibilityState === "visible") {
      if (endTimeRef.current) {
        const remaining = Math.max(
          0,
          Math.ceil((endTimeRef.current - Date.now()) / 1000),
        );
        setTimeRemaining(remaining);
      }
    }
  }

  const startExam = async () => {
    try {
      console.log("Starting new exam...");
      const response = await examAPI.startExam(); // expects auth via examAPI wrapper

      if (!response || !response.sessionId) {
        throw new Error("Invalid response from startExam");
      }

      setQuestions(response.questions || []);
      setSessionId(response.sessionId);
      sessionIdRef.current = response.sessionId;

      const timeInSeconds = response.remainingSeconds ?? 1800;
      const validTime = Math.max(0, timeInSeconds);
      setTimeRemaining(validTime);

      // set endTimeRef from remainingSeconds (single source of truth)
      endTimeRef.current = Date.now() + validTime * 1000;
      try {
        sessionStorage.setItem("examEndTime", String(endTimeRef.current));
      } catch (err) {
        console.warn("Failed to persist exam end time:", err);
      }

      localStorage.setItem("sessionId", response.sessionId);
      setLoading(false);
    } catch (error) {
      console.error("Failed to start exam:", error);
      alert(
        error?.response?.data?.error || error.message || "Failed to start exam",
      );
      navigate("/instructions");
    }
  };

  const handleAnswerSelect = async (option) => {
    if (!questions || questions.length === 0) return;
    const questionId = questions[currentQuestion].id;
    const newAnswers = { ...answers, [questionId]: option };
    setAnswers(newAnswers);

    // optimistic save to sessionStorage
    try {
      sessionStorage.setItem("examAnswers", JSON.stringify(newAnswers));
    } catch (err) {
      console.warn("Could not persist answers locally:", err);
    }

    // send to server — swallow network errors but notify user for real failures
    try {
      await examAPI.submitAnswer(sessionIdRef.current, questionId, option);
    } catch (error) {
      // handle expired session explicitly
      if (
        error?.response?.status === 404 &&
        error?.response?.data?.error
          ?.toLowerCase()
          ?.includes("session not found")
      ) {
        setSessionExpired(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        alert(
          "Your session has expired. Your answers up to this point have been saved on the server. Please contact support.",
        );
        return;
      }
      console.error("Failed to save answer:", error);
    }
  };

  const handleNext = () => {
    setCurrentQuestion((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
  };

  const handleAutoSubmit = async () => {
    console.log("Auto-submit handler called at", new Date().toISOString());

    // stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    await submitExam();
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      console.log("Already submitting (from handleSubmit)");
      return;
    }

    if (!questions || questions.length === 0) {
      alert("No questions loaded. Cannot submit.");
      return;
    }

    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Do you want to submit anyway?`,
      );
      if (!confirmSubmit) return;
    }

    await submitExam();
  };

  const submitExam = async () => {
    if (isSubmittingRef.current) {
      console.log("Already submitting, skipping duplicate call...");
      return;
    }

    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) {
      console.error("No sessionId available for submission");
      alert("Error: No active session found. Please contact support.");
      return;
    }

    // set submission guard immediately
    isSubmittingRef.current = true;
    setSubmitting(true);

    // stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // clear local session copies to avoid accidental re-use
    try {
      sessionStorage.removeItem("examSessionId");
      sessionStorage.removeItem("examQuestions");
      sessionStorage.removeItem("examAnswers");
      sessionStorage.removeItem("examTimeRemaining");
      sessionStorage.removeItem("examCurrentQuestion");
      sessionStorage.removeItem("examEndTime");
    } catch (err) {
      console.warn("Failed to clear sessionStorage:", err);
    }

    console.log("Submitting exam with sessionId:", currentSessionId);

    try {
      const response = await examAPI.submitExam(currentSessionId);
      console.log("Exam submitted successfully:", response);

      // persist result for results page
      localStorage.setItem(
        "examResult",
        JSON.stringify({
          score: response.score,
          totalQuestions: response.totalQuestions,
          percentage: response.percentage,
          passed: response.passed,
          sessionId: response.sessionId || currentSessionId,
        }),
      );

      // navigate to results
      navigate("/results", { replace: true });

      // clear token after short delay
      setTimeout(() => {
        localStorage.removeItem("token");
      }, 500);
    } catch (error) {
      console.error("Failed to submit exam:", error);

      // handle already-submitted gracefully
      if (
        error?.response?.data?.error
          ?.toLowerCase()
          ?.includes("already submitted")
      ) {
        alert(
          "This exam has already been submitted. Redirecting to results...",
        );
        navigate("/results", { replace: true });
        return;
      }

      alert(
        error?.response?.data?.error ||
          "Failed to submit exam. Please try again.",
      );
      // reset submission guards on failure
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (
      isNaN(seconds) ||
      seconds === null ||
      seconds === undefined ||
      seconds < 0
    ) {
      return "00:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className='exam-loading'>
        <div className='loading-container'>
          <div className='loading-spinner'></div>
          <h2>Preparing Your Examination</h2>
          <p>Please wait while we load your questions...</p>
          <div className='loading-progress'>
            <div className='loading-bar'></div>
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return <div className='exam-error'>No questions available</div>;
  }

  const currentQ = questions[currentQuestion];
  const selectedAnswer = answers[currentQ.id];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className='exam-container'>
      <div className='exam-header'>
        <div className='exam-info'>
          <h2>Examination in Progress</h2>
          <div className='student-details'>
            <p>
              <strong>{student?.fullname}</strong>
            </p>
            <p className='exam-code'>Code: {student?.generatedCode}</p>
          </div>
          <p className='question-counter'>
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        <div className={`timer ${timeRemaining < 300 ? "timer-warning" : ""}`}>
          <div className='timer-icon'>⏱️</div>
          <div className='timer-value'>{formatTime(timeRemaining)}</div>
        </div>
      </div>

      <div className='progress-bar-container'>
        <div className='progress-bar' style={{ width: `${progress}%` }}></div>
        <span className='progress-text'>
          {answeredCount} / {questions.length} answered
        </span>
      </div>

      {sessionExpired && (
        <div className='warning-message' style={{ marginBottom: "12px" }}>
          ⚠️ Your session has expired. Answers are no longer being saved. Please
          contact support.
        </div>
      )}

      <div className='exam-content'>
        <div className='question-card'>
          <div className='question-number'>Question {currentQuestion + 1}</div>
          <div className='question-text'>{currentQ.question}</div>

          <div className='options-container'>
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${selectedAnswer === option ? "selected" : ""}`}
                onClick={() => handleAnswerSelect(option)}
                disabled={submitting || sessionExpired}
              >
                <span className='option-label'>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className='option-text'>{option}</span>
                {selectedAnswer === option && (
                  <span className='check-mark'>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className='navigation-buttons'>
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0 || submitting}
            className='btn-secondary'
          >
            ← Previous
          </button>

          <div className='center-buttons'>
            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className='btn-submit'
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Exam"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className='btn-primary'
                disabled={submitting}
              >
                Next →
              </button>
            )}
          </div>

          <div className='question-indicator'>
            {selectedAnswer ? "✓ Answered" : "○ Unanswered"}
          </div>
        </div>
      </div>

      {timeRemaining < 300 && !sessionExpired && timeRemaining > 0 && (
        <div className='warning-message'>
          ⚠️ Less than 5 minutes remaining! The exam will auto-submit when time
          expires.
        </div>
      )}
    </div>
  );
};

export default Exam;
