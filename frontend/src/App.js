import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Import components
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import ActivityLogger from './components/ActivityLogger';
import StreakCalendar from './components/StreakCalendar';
import FriendsTab from './components/FriendsTab';
import Navigation from './components/Navigation';

// Context
const AuthContext = createContext();

// API Base URL
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// API Helper
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    if (options.body && typeof options.body !== 'string') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || 'Request failed');
    }
    
    return response.json();
  },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  },
};

// Auth Provider Component
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.get('/api/profile');
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', response.access_token);
    await loadUser();
    return response;
  };

  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    localStorage.setItem('token', response.access_token);
    await loadUser();
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Import components after the API helper and Auth context
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import ActivityLogger from './components/ActivityLogger';
import StreakCalendar from './components/StreakCalendar';
import FriendsTab from './components/FriendsTab';
import Navigation from './components/Navigation';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

// Auth Route Component
function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return !user ? children : <Navigate to="/" />;
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                padding: '16px',
              },
            }}
          />
          
          <Routes>
            <Route 
              path="/login" 
              element={
                <AuthRoute>
                  <LoginForm />
                </AuthRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <AuthRoute>
                  <RegisterForm />
                </AuthRoute>
              } 
            />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <MainApp />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Main App Content (After Authentication)
function MainApp() {
  return (
    <div className="pb-20">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<ActivityLogger />} />
        <Route path="/streak" element={<StreakCalendar />} />
        <Route path="/friends" element={<FriendsTab />} />
      </Routes>
      <Navigation />
    </div>
  );
}

export default App;