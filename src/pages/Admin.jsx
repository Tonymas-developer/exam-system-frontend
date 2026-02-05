import { useState, useEffect } from "react";
import { adminAPI } from "../services/api";
import "../styles/Admin.css";
import "../styles/Auth.css";
import Logo from "../../public/Webdeves-logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faSearch,
  faSync,
  faPrint,
  faCopy,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";

// const API_BASE = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const Admin = () => {
  useEffect(() => {
    document.title = "Admin";
  }, []);

  const [adminSecret, setAdminSecret] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem("adminSessionToken");
    if (savedToken) {
      setSessionToken(savedToken);
      verifyAndLogin(savedToken);
    }
  }, []);

  const verifyAndLogin = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/students`, {
        headers: { "admin-token": token },
      });
      if (response.ok) {
        setIsAuthenticated(true);
        await loadData();
      } else {
        // Session expired or invalid
        sessionStorage.removeItem("adminSessionToken");
        setSessionToken(null);
      }
    } catch (error) {
      console.error("Auto-login failed:", error);
      sessionStorage.removeItem("adminSessionToken");
      setSessionToken(null);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);

    if (!adminSecret.trim()) {
      setError("Please enter admin password");
      setLoginLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminSecret }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem("adminSessionToken", data.sessionToken);
        setSessionToken(data.sessionToken);
        setIsAuthenticated(true);
        await loadData();
      } else {
        setError(data.error || "Invalid admin password");
      }
    } catch (error) {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const token = sessionStorage.getItem("adminSessionToken");

    try {
      const [studentsRes, reviewsRes, sessionsRes, statsRes] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/students`, {
            headers: { "admin-token": token },
          }),
          fetch(`${API_BASE_URL}/api/admin/reviews`, {
            headers: { "admin-token": token },
          }),
          fetch(`${API_BASE_URL}/api/admin/active-sessions`, {
            headers: { "admin-token": token },
          }),
          fetch(`${API_BASE_URL}/api/admin/stats`, {
            headers: { "admin-token": token },
          }),
        ]);

      const studentsData = await studentsRes.json();
      const reviewsData = await reviewsRes.json();
      const sessionsData = await sessionsRes.json();
      const statsData = await statsRes.json();

      setStudents(studentsData.students || studentsData);
      setReviews(reviewsData.reviews || reviewsData);
      setActiveSessions(sessionsData.sessions || sessionsData);
      setStats(statsData);
    } catch (error) {
      setError("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === "active") {
      // Initial fetch
      const token = sessionStorage.getItem("adminSessionToken");
      const fetchSessions = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/admin/active-sessions`,
            {
              headers: { "admin-token": token },
            },
          );
          const data = await response.json();
          setActiveSessions(data.sessions || []);
        } catch (error) {
          console.error("Failed to refresh sessions:", error);
        }
      };

      fetchSessions();

      const fetchInterval = setInterval(fetchSessions, 10000);

      const countdownInterval = setInterval(() => {
        setActiveSessions(
          (prevSessions) =>
            prevSessions
              .map((session) => {
                const now = Date.now();
                const endTime = new Date(session.endTimeLimit).getTime();
                const remainingMs = Math.max(0, endTime - now);
                const remainingSeconds = Math.floor(remainingMs / 1000);
                const remainingMinutes = Math.floor(remainingSeconds / 60);

                return {
                  ...session,
                  remainingSeconds,
                  remainingMinutes,
                };
              })
              .filter((session) => session.remainingSeconds > 0), // Remove completed sessions
        );
      }, 1000);

      return () => {
        clearInterval(fetchInterval);
        clearInterval(countdownInterval);
      };
    }
  }, [isAuthenticated, activeTab]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError("");
    setSearchResults([]);
    setIsSearching(true);

    if (!searchQuery.trim()) {
      setSearchError("Please enter a search query");
      setIsSearching(false);
      return;
    }

    const token = sessionStorage.getItem("adminSessionToken");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/students/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: { "admin-token": token },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSearchError(data.message || "No results found");
        setSearchResults([]);
      } else {
        setSearchResults(data.results);
      }
    } catch (error) {
      setSearchError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
  };

  const handleSyncSheets = async () => {
    setSyncLoading(true);
    const token = sessionStorage.getItem("adminSessionToken");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/sync-sheets`,
        {
          method: "POST",
          headers: { "admin-token": token },
        },
      );

      const data = await response.json();

      if (data.success) {
        await loadData();
        console.log("✅ Data reloaded after sync");
      } else {
        alert(`❌ Sync failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Sync error:", error);
      alert(`Failed to sync with Google Sheets: ${error.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCopyCode = (code, name) => {
    navigator.clipboard.writeText(code);
  };

  const handlePrintCodes = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      alert("Please allow popups for this site to print codes");
      return;
    }

    const studentsTable = students
      .map(
        (s, i) => `
      <tr>
        <td style="text-align: center; border: 1px solid #ddd; padding: 12px;">${i + 1}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${s.fullname}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${s.email}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${s.course}</td>
        <td style="text-align: center; font-weight: bold; font-size: 16px; font-family: 'Courier New', monospace; background: #fff3cd; border: 1px solid #ddd; padding: 12px;">${s.generatedCode}</td>
      </tr>
    `,
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Exam Codes - ${new Date().toLocaleDateString()}</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page { 
                margin: 1.5cm; 
                size: A4;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              color: #333;
              max-width: 1200px;
              margin: 0 auto;
            }
            .header { 
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #ec2990;
            }
            h1 { 
              color: #532c3c; 
              margin-bottom: 10px;
              font-size: 28px;
            }
            .header-info {
              color: #666;
              font-size: 14px;
              line-height: 1.6;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            th { 
              background: linear-gradient(135deg, #ec2990 0%, #532c3c 100%);
              color: white; 
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.5px;
              padding: 12px 8px;
              text-align: left;
              border: 1px solid #999;
            }
            tr:nth-child(even) { 
              background: #f9f9f9; 
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .print-button {
              background: #ec2990;
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 16px;
              border-radius: 5px;
              cursor: pointer;
              margin: 20px auto;
              display: block;
            }
            @media print {
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎓 Webdeves Scholarship Examination</h1>
            <div class="header-info">
              <p><strong>Student Exam Access Codes</strong></p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <button class="print-button" onclick="window.print()">🖨️ Print This Page</button>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Course</th>
                <th style="width: 120px;">Exam Code</th>
              </tr>
            </thead>
            <tbody>
              ${studentsTable}
            </tbody>
          </table>

          <div class="footer">
            <p><strong>Webdeves Technologies</strong></p>
            <p>No. 282 Rumuokwurusi, Port Harcourt, Rivers State</p>
          </div>

          <script>
            window.onload = function() {
              document.querySelector('.print-button').focus();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const csvContent = [
      [
        "S/N",
        "Full Name",
        "Email",
        "Phone",
        "Gender",
        "Course",
        "Exam Code",
        "Completed",
        "Score",
        "Registered Date",
      ],
      ...students.map((s, i) => [
        i + 1,
        s.fullname,
        s.email,
        s.phoneNumber,
        s.gender,
        s.course,
        s.generatedCode,
        s.hasCompletedExam ? "Yes" : "No",
        s.examScore || "-",
        new Date(s.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-codes-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUpdateDay = async () => {
    const token = sessionStorage.getItem("adminSessionToken");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/config/day`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "admin-token": token,
          },
          body: JSON.stringify({ day: currentDay }),
        },
      );

      if (response.ok) {
        alert(`✅ Exam day updated to Day ${currentDay}`);
      } else {
        alert("❌ Failed to update day");
      }
    } catch (error) {
      alert("Failed to update day");
    }
  };

  // IMPROVED: Logout that clears session from server and sessionStorage
  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      const token = sessionStorage.getItem("adminSessionToken");

      try {
        // Call logout endpoint to invalidate session on server
        await fetch(`${API_BASE_URL}/api/admin/logout`, {
          method: "POST",
          headers: { "admin-token": token },
        });
      } catch (error) {
        console.error("Logout error:", error);
      }

      // Clear session data
      sessionStorage.removeItem("adminSessionToken");
      setIsAuthenticated(false);
      setAdminSecret("");
      setSessionToken(null);
    }
  };

  // IMPROVED: Format time with proper padding
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isAuthenticated) {
    return (
      <>
        <img src={Logo} alt='Webdeves Logo' className='logo' />
        <div className='admin-login'>
          <div className='admin-login-card'>
            <h1>🔐 Admin Login</h1>
            <form onSubmit={handleAdminLogin}>
              <div className='form-group'>
                <label htmlFor='adminSecret'>Admin Password</label>
                <div className='password-input'>
                  <input
                    type={showPassword ? "text" : "password"}
                    id='adminSecret'
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder='Enter admin password'
                    required
                  />
                  <button
                    type='button'
                    className='toggle-password'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              {error && <div className='error-message'>{error}</div>}
              <button
                type='submit'
                className='btn-primary'
                disabled={loginLoading}
              >
                {loginLoading ? "Authenticating..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  const displayStudents = searchResults.length > 0 ? searchResults : students;

  return (
    <>
      <div className='admin-container'>
        <div className='admin-header'>
          <h1>ADMIN</h1>
          <button onClick={handleLogout} className='btn-secondary'>
            Logout
          </button>
        </div>

        {/* Search Section */}
        <div className='search-section'>
          <form onSubmit={handleSearch} className='search-form'>
            <div className='search-input-group'>
              <input
                type='text'
                className='search-input'
                placeholder='Search by name, email, phone, or exam code...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type='submit'
                className='search-button'
                disabled={isSearching}
              >
                <FontAwesomeIcon icon={faSearch} />
                {isSearching ? " Searching..." : " Search"}
              </button>
              {searchQuery && (
                <button
                  type='button'
                  onClick={handleClearSearch}
                  className='btn-secondary'
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {searchError && <div className='search-error'>❌ {searchError}</div>}

          {searchResults.length > 0 && (
            <div className='search-results'>
              <h3>
                Found {searchResults.length} student(s) matching "{searchQuery}"
              </h3>
            </div>
          )}
        </div>

        <div className='admin-tabs'>
          <button
            className={activeTab === "students" ? "active" : ""}
            onClick={() => setActiveTab("students")}
          >
            Students ({students.length})
          </button>
          <button
            className={activeTab === "active" ? "active" : ""}
            onClick={() => setActiveTab("active")}
          >
            ⏱️ Active Sessions
            {activeSessions.length > 0 && (
              <span className='badge-count'>{activeSessions.length}</span>
            )}
          </button>
          <button
            className={activeTab === "reviews" ? "active" : ""}
            onClick={() => setActiveTab("reviews")}
          >
            ⭐ Reviews ({reviews.length})
          </button>
          {/* <button
            className={activeTab === "config" ? "active" : ""}
            onClick={() => setActiveTab("config")}
          >
            ⚙️ Configuration
          </button> */}
        </div>

        <div className='admin-content'>
          {loading ? (
            <div className='loading-spinner'>Loading...</div>
          ) : (
            <>
              {activeTab === "students" && (
                <div className='data-section'>
                  <div className='section-header'>
                    <h2>REGISTERED STUDENTS</h2>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={handleSyncSheets}
                        className='btn-primary'
                        disabled={syncLoading}
                      >
                        <FontAwesomeIcon icon={faSync} />
                        {syncLoading ? " Syncing..." : " Sync Sheets"}
                      </button>
                      <button
                        onClick={handlePrintCodes}
                        className='btn-primary'
                      >
                        <FontAwesomeIcon icon={faPrint} /> Print Codes
                      </button>
                      <button onClick={handleExportCSV} className='btn-primary'>
                        <FontAwesomeIcon icon={faDownload} /> Export CSV
                      </button>
                    </div>
                  </div>

                  <div className='stats-grid'>
                    <div className='stat-card'>
                      <h3>Total Students</h3>
                      <p className='stat-value'>{students.length}</p>
                    </div>
                    <div className='stat-card'>
                      <h3>Completed Exams</h3>
                      <p className='stat-value'>
                        {students.filter((s) => s.hasCompletedExam).length}
                      </p>
                    </div>
                    <div className='stat-card'>
                      <h3>Pending Exams</h3>
                      <p className='stat-value'>
                        {students.filter((s) => !s.hasCompletedExam).length}
                      </p>
                    </div>
                    {/* <div className='stat-card'>
                      <h3>Average Score</h3>
                      <p className='stat-value'>
                        {students.filter((s) => s.examScore !== null).length > 0
                          ? (
                              students
                                .filter((s) => s.examScore !== null)
                                .reduce((sum, s) => sum + s.examScore, 0) /
                              students.filter((s) => s.examScore !== null)
                                .length
                            ).toFixed(1)
                          : "N/A"}
                      </p>
                    </div> */}
                  </div>

                  <div className='table-container'>
                    <table>
                      <thead>
                        <tr>
                          <th>S/N</th>
                          <th>Full Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Course</th>
                          <th>Exam Code</th>
                          <th>Completed</th>
                          <th>Score</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayStudents.map((student, index) => (
                          <tr key={student._id}>
                            <td data-label='S/N'>{index + 1}</td>
                            <td data-label='Full Name'>{student.fullname}</td>
                            <td data-label='Email'>{student.email}</td>
                            <td data-label='Phone'>{student.phoneNumber}</td>
                            <td data-label='Course'>{student.course}</td>
                            <td data-label='Code'>
                              <code
                                style={{
                                  cursor: "pointer",
                                  userSelect: "all",
                                }}
                                onClick={() =>
                                  handleCopyCode(
                                    student.generatedCode,
                                    student.fullname,
                                  )
                                }
                              >
                                {student.generatedCode}
                              </code>
                            </td>
                            <td data-label='Completed'>
                              <span
                                className={`badge ${student.hasCompletedExam ? "success" : "warning"}`}
                              >
                                {student.hasCompletedExam ? "Yes" : "No"}
                              </span>
                            </td>
                            <td data-label='Score'>
                              {student.examScore ?? "-"}
                            </td>
                            <td data-label='Action'>
                              <button
                                onClick={() =>
                                  handleCopyCode(
                                    student.generatedCode,
                                    student.fullname,
                                  )
                                }
                                className='btn-copy'
                                title='Copy code to clipboard'
                                style={{
                                  background: "#4CAF50",
                                  color: "white",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                <FontAwesomeIcon icon={faCopy} /> Copy
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "active" && (
                <div className='data-section'>
                  <div className='section-header'>
                    <h2>⏱️ Active Exam Sessions</h2>
                    <button onClick={loadData} className='btn-primary'>
                      <FontAwesomeIcon icon={faSync} /> Refresh
                    </button>
                  </div>
                  {activeSessions.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "60px 20px",
                        color: "#666",
                        background: "#f8f8f8",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ fontSize: "48px", marginBottom: "15px" }}>
                        📝
                      </div>
                      <h3>No Active Exam Sessions</h3>
                      <p>
                        When students start their exams, they will appear here
                        with live countdown timers.
                      </p>
                    </div>
                  ) : (
                    <div className='active-sessions-grid'>
                      {activeSessions.map((session) => (
                        <div key={session.sessionId} className='session-card'>
                          <div className='session-header'>
                            <h3>{session.student.fullname}</h3>
                            <span
                              className={`timer-badge ${session.remainingMinutes < 5 ? "critical" : ""}`}
                            >
                              ⏱️ {formatTime(session.remainingSeconds)}
                            </span>
                          </div>
                          <div className='session-details'>
                            <p>
                              <strong>Email:</strong> {session.student.email}
                            </p>
                            <p>
                              <strong>Course:</strong> {session.student.course}
                            </p>
                            <p>
                              <strong>Code:</strong>{" "}
                              <code>{session.student.generatedCode}</code>
                            </p>
                            <p>
                              <strong>Started:</strong>{" "}
                              {new Date(session.startTime).toLocaleTimeString()}
                            </p>
                            <p>
                              <strong>Progress:</strong>{" "}
                              {session.questionsAnswered}/
                              {session.totalQuestions} answered (
                              {session.progressPercentage}%)
                            </p>
                          </div>
                          <div className='progress-bar-container'>
                            <div
                              className='progress-bar'
                              style={{
                                width: `${session.progressPercentage}%`,
                                background:
                                  session.remainingMinutes < 5
                                    ? "#f44336"
                                    : "linear-gradient(135deg, #ec2990, #d41f7a)",
                                height: "8px",
                                borderRadius: "4px",
                                transition: "width 0.3s ease",
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className='data-section'>
                  <div className='section-header'>
                    <h2>⭐ Student Reviews</h2>
                  </div>
                  <div className='stats-grid'>
                    <div className='stat-card'>
                      <h3>Total Reviews</h3>
                      <p className='stat-value'>{reviews.length}</p>
                    </div>
                    <div className='stat-card'>
                      <h3>Average Rating</h3>
                      <p className='stat-value'>
                        {reviews.length > 0
                          ? (
                              reviews.reduce((acc, r) => acc + r.rating, 0) /
                              reviews.length
                            ).toFixed(1)
                          : "0"}{" "}
                        ★
                      </p>
                    </div>
                  </div>
                  <div className='reviews-list'>
                    {reviews.map((review) => (
                      <div key={review._id} className='review-card'>
                        <div className='review-header'>
                          <div>
                            <strong>
                              {review.studentId?.fullname || "Anonymous"}
                            </strong>
                            <span className='review-course'>
                              {review.studentId?.course}
                            </span>
                          </div>
                          <div className='review-rating'>
                            {"★".repeat(review.rating)}
                            {"☆".repeat(5 - review.rating)}
                          </div>
                        </div>
                        {review.comment && (
                          <p className='review-comment'>{review.comment}</p>
                        )}
                        <p className='review-date'>
                          {new Date(review.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* {activeTab === "config" && (
                <div className='data-section'>
                  <h2>⚙️ Exam Configuration</h2>
                  <div className='config-form'>
                    <div className='form-group'>
                      <label>Current Exam Day</label>
                      <select
                        value={currentDay}
                        onChange={(e) => setCurrentDay(Number(e.target.value))}
                      >
                        <option value={1}>Day 1 (Feb 12, 2026)</option>
                        <option value={2}>Day 2 (Feb 13, 2026)</option>
                        <option value={3}>Day 3 (Feb 14, 2026)</option>
                      </select>
                    </div>
                    <button onClick={handleUpdateDay} className='btn-primary'>
                      Update Day
                    </button>
                    <div className='config-info'>
                      <p>
                        <strong>System Configuration:</strong>
                      </p>
                      <p>• Each day has 150 unique questions</p>
                      <p>• System randomly selects 50 questions per exam</p>
                      <p>• Exam duration: 30 minutes</p>
                      <p>• Auto-submit on time expiry: Enabled</p>
                      <p>• One exam per student: Enforced</p>
                      <p>• Session expires when tab closes: Enabled</p>
                    </div>
                  </div>
                </div>
              )} */}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Admin;
