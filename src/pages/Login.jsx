import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";
import Logo from "../../public/Webdeves-logo.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Login = () => {
  useEffect(() => {
    document.title = "Login";
  }, []);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    code: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email.trim() || !formData.code.trim()) {
      setError("Please enter both email and exam code");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          code: formData.code.toUpperCase().trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types
        if (data.hasCompletedExam) {
          setError(
            "You have already completed this exam. You cannot retake it.",
          );
          setTimeout(() => {
            navigate("/completed");
          }, 2000);
        } else if (data.codeExpired) {
          setError("Your exam code has expired. Please contact support.");
        } else {
          setError(
            data.error || "Login failed. Please check your credentials.",
          );
        }
        setLoading(false);
        return;
      }

      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("student", JSON.stringify(data.student));

        console.log("Login successful:", data.student);

        // Navigate to instructions page
        navigate("/instructions");
      } else {
        setError("Login failed. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <img src={Logo} alt='Webdeves Logo' className='logo' />
      <div className='container'>
        <div className='auth-container'>
          <div className='auth-card'>
            <div className='auth-header'>
              <h1>STUDENT LOGIN</h1>
              <p className='create'>
                Enter your email and exam code to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className='auth-form'>
              <div className='form-group'>
                <label htmlFor='email'>Email Address *</label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder='your.email@example.com'
                  className='email-input'
                  autoComplete='email'
                />
                <small className='form-hint'>
                  Use the email you registered with
                </small>
              </div>

              <div className='form-group'>
                <label htmlFor='code'>Exam Code *</label>
                <input
                  type='text'
                  id='code'
                  name='code'
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder='Enter your 8-character code'
                  className='code-input'
                  maxLength='10'
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    fontSize: "18px",
                    fontFamily: "monospace",
                  }}
                />
                <small className='form-hint'>
                  Enter the exam code provided to you
                </small>
              </div>

              {error && (
                <div
                  className='error-message'
                  style={{
                    background: "#fee",
                    color: "#c00",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "2px solid #c00",
                    marginBottom: "15px",
                  }}
                >
                  {error}
                </div>
              )}

              <button type='submit' className='btn-primary' disabled={loading}>
                {loading ? "Verifying..." : "Login"}
              </button>

              <div className='auth-footer'>
                <p className='account'>
                  Not registered yet?{" "}
                  <a
                    href='https://docs.google.com/forms/d/e/1FAIpQLSfWZUeXh_9LW4vn6CHy-SgX6uT5GFOxvIjh1lHhBLmNrHE7_Q/viewform'
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{
                      color: "#ec2990",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    REGISTER HERE
                  </a>
                </p>
                <div>
                  <Link to='/admin' style={{ textDecoration: "none" }}>
                    ADMIN LOGIN
                  </Link>
                </div>
              </div>
            </form>

            <div
              className='info-box'
              style={{
                marginTop: "15px",
                background: "#fff3cd",
                borderLeft: "4px solid #ffc107",
              }}
            >
              {/* / <h3 style={{ color: "#856404" }}>⚠️ Important</h3> */}
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "13px",
                  color: "#856404",
                }}
              >
                <strong>One Attempt Only:</strong> You can only take this exam
                once. Make sure you're ready before starting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
