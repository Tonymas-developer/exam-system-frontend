import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import "../styles/Auth.css";
import "../styles/SignUp.css";
import Logo from "../../public/Webdeves-logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";

const SignUp = () => {
  useEffect(() => {
    document.title = "Registration";
  }, []);

  const navigate = useNavigate();
  
  // Initial form state
  const initialFormState = {
    fullname: "",
    email: "",
    phoneNumber: "",
    gender: "",
    course: "",
    password: "",
    confirmPassword: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const courses = [
    "CyberSecurity",
    "Data Analysis",
    "UI/UX Design",
    "Digital Marketing",
    "Graphic Design",
    "Web Development",
    "Python Programming",
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;
      const response = await authAPI.signup(dataToSend);

      // Clear form on success
      setFormData(initialFormState);
      setShowPassword(false);
      setSuccess(true);

      // Redirect to login after 5 seconds
      // setTimeout(() => {
      //   navigate("/");
      // }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <img src={Logo} alt="Webdeves Logo" className="logo" />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>SCHOLARSHIP EXAM REGISTRATION</h1>
            <p className="create">Register for the scholarship examination</p>
          </div>

          {success ? (
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h2>Registration Successful!</h2>
              <div className="success-message">
                <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#2e7d32" }}>
                  Thank you for registering for Webdeves scholarship examination!
                </p>
                <div
                  style={{
                    background: "#e8f5e9",
                    padding: "20px",
                    borderRadius: "10px",
                    margin: "20px 0",
                  }}
                >
                  <p
                    style={{
                      color: "#2e7d32",
                      fontWeight: "600",
                      marginBottom: "10px",
                    }}
                  >
                    ✉ Please Check Your Email
                  </p>
                  <p style={{ color: "#2e7d32", fontSize: "14px" }}>
                    We've sent exam details to your email address. Please check
                    your inbox (and spam folder).
                  </p>
                </div>
                <div
                  style={{
                    background: "#fff3cd",
                    padding: "20px",
                    borderRadius: "10px",
                    margin: "20px 0",
                  }}
                >
                  <p
                    style={{
                      color: "#856404",
                      fontWeight: "600",
                      marginBottom: "10px",
                    }}
                  >
                    📱 Important: Your Exam Code
                  </p>
                  <p style={{ color: "#856404", fontSize: "14px" }}>
                    Your unique exam access code will be given to you on the day of exam. Ensure you come early to the venue sent via your Email. Thank you.
                  </p>
                </div>
                {/* <p style={{ fontSize: "14px", color: "#666" }}>
                  Redirecting to login page in 5 seconds...
                </p> */}
              </div>
              <button
                onClick={() => navigate("/")}
                className="btn-primary"
                style={{ marginTop: "20px" }}
              >
                Go to Login Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="fullname">Full Name *</label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="+234 XXX XXX XXXX"
                />
                {/* <small className="form-hint" style={{ color: "#fff" }}>
                  Your exam code will be sent to this number via SMS
                </small> */}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="course">Course *</label>
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Minimum 6 characters"
                  />
                  <span
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: "white" }}
                  >
                    {showPassword ? (
                      <FontAwesomeIcon icon={faEyeSlash} />
                    ) : (
                      <FontAwesomeIcon icon={faEye} />
                    )}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Registering..." : "Register for Exam"}
              </button>

              <div className="auth-footer">
                <p className="account">
                  Already registered? <Link to="/">Login here</Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default SignUp;