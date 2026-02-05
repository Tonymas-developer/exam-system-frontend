import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// API methods
export const authAPI = {
  signup: async (studentData) => {
    const response = await api.post("/api/students/signup", studentData);
    return response.data;
  },

  login: async (generatedCode) => {
    const response = await api.post("/api/students/login", { generatedCode });
    return response.data;
  },
};

export const examAPI = {
  startExam: async () => {
    const response = await api.post("/api/exam/start");
    return response.data;
  },

  submitAnswer: async (sessionId, questionId, answer) => {
    const response = await api.post("/api/exam/answer", {
      sessionId,
      questionId,
      answer,
    });
    return response.data;
  },

  submitExam: async (sessionId) => {
    const response = await api.post("/api/exam/submit", { sessionId });
    return response.data;
  },

  getResults: async (sessionId) => {
    const response = await api.get(`/api/exam/results/${sessionId}`);
    return response.data;
  },
};

export const reviewAPI = {
  submitReview: async (rating, comment, sessionId) => {
    const response = await api.post("/api/review", {
      rating,
      comment,
      sessionId,
    });
    return response.data;
  },
};

export const adminAPI = {
  getStudents: async (adminSecret) => {
    const response = await axios.get(`${API_BASE_URL}/api/admin/students`, {
      headers: {
        "admin-token": adminSecret,
      },
    });
    return response.data;
  },

  getSessions: async (adminSecret) => {
    const response = await axios.get(`${API_BASE_URL}/api/admin/sessions`, {
      headers: {
        "admin-token": adminSecret,
      },
    });
    return response.data;
  },

  addQuestions: async (adminSecret, questions, day) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/admin/questions/bulk`,
      { questions, day },
      {
        headers: {
          "admin-token": adminSecret,
        },
      },
    );
    return response.data;
  },

  updateDay: async (adminSecret, day) => {
    const response = await axios.put(
      `${API_BASE_URL}/api/admin/config/day`,
      { day },
      {
        headers: {
          "admin-token": adminSecret,
        },
      },
    );
    return response.data;
  },

  getReviews: async (adminSecret) => {
    const response = await axios.get(`${API_BASE_URL}/api/admin/reviews`, {
      headers: {
        "admin-token": adminSecret,
      },
    });
    return response.data;
  },
};

export default api;
