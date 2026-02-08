import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import "@/App.css";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import EnergyPage from "./pages/EnergyPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import InsightsPage from "./pages/InsightsPage";
import PlannerPage from "./pages/PlannerPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// API instance with auth
export const apiClient = axios.create({
  baseURL: API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("ecopulse_token"));
  const [loading, setLoading] = useState(true);

  // Set auth header on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem("ecopulse_token");
    if (storedToken) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          const response = await apiClient.get("/auth/me");
          setUser(response.data);
        } catch (error) {
          console.error("Auth error:", error);
          // Clear invalid token
          localStorage.removeItem("ecopulse_token");
          delete apiClient.defaults.headers.common["Authorization"];
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    fetchUserData();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem("ecopulse_token", access_token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);
      toast.success("Welcome back!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (email, password, name, organizationName) => {
    try {
      const response = await apiClient.post("/auth/register", {
        email,
        password,
        name,
        organization_name: organizationName,
      });
      const { access_token, user: userData } = response.data;
      localStorage.setItem("ecopulse_token", access_token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setToken(access_token);
      setUser(userData);
      toast.success("Account created successfully!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("ecopulse_token");
    delete apiClient.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/energy"
            element={
              <ProtectedRoute>
                <EnergyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <ActivitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <InsightsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <PlannerPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { API, BACKEND_URL };
