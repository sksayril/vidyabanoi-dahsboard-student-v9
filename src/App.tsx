import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { Dashboard } from './components/Dashboard';
import { User, LoginResponse } from './types/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Signin Page Component
const SigninPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loginResponse: LoginResponse) => {
    setUser({
      id: loginResponse.user.id,
      name: loginResponse.user.name,
      email: loginResponse.user.email,
    });
    // Redirect to dashboard after successful login
    window.location.href = '/dashboard';
  };

  return (
    <>
      {/* Notebook Background */}
      <div className="notebook-bg"></div>
      {/* Geography/Earth Background */}
      <div className="geography-bg"></div>
      {/* Animated Stars Background */}
      <div className="stars">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="star"></div>
        ))}
      </div>
      <div className="content-wrapper">
        <LoginForm
          onLogin={handleLogin}
          onSwitchToSignup={() => window.location.href = '/signup'}
        />
      </div>
    </>
  );
};

// Signup Page Component
const SignupPage: React.FC = () => {
  const handleSignup = (name: string, email: string, password: string) => {
    console.log('User registered:', { name, email });
    // The SignupForm will handle the API call and redirect to signin
    // This function is called after successful registration
  };

  return (
    <>
      {/* Notebook Background */}
      <div className="notebook-bg"></div>
      {/* Geography/Earth Background */}
      <div className="geography-bg"></div>
      {/* Animated Stars Background */}
      <div className="stars">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="star"></div>
        ))}
      </div>
      <div className="content-wrapper">
        <SignupForm
          onSignup={handleSignup}
          onSwitchToLogin={() => window.location.href = '/signin'}
        />
      </div>
    </>
  );
};

// Dashboard Page Component with Auth Protection
const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (token && storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        setUser({
          id: parsedUserData.id,
          name: parsedUserData.name,
          email: parsedUserData.email,
        });
        setUserData(parsedUserData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/signin';
        return;
      }
    } else {
      // No token found, redirect to signin
      window.location.href = '/signin';
      return;
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Redirect to signin page
    window.location.href = '/signin';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Notebook Background */}
        <div className="notebook-bg"></div>
        {/* Geography/Earth Background */}
        <div className="geography-bg"></div>
        {/* Animated Stars Background */}
        <div className="stars">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="star"></div>
          ))}
        </div>
        <div className="content-wrapper text-center">
          <h1 className="text-2xl font-bold notebook-heading mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <>
      {/* Notebook Background */}
      <div className="notebook-bg"></div>
      {/* Geography/Earth Background */}
      <div className="geography-bg"></div>
      {/* Animated Stars Background */}
      <div className="stars">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="star"></div>
        ))}
      </div>
      <div className="content-wrapper">
        <Dashboard user={user} userData={userData} onLogout={handleLogout} />
      </div>
    </>
  );
};

// Loading Component
const LoadingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Notebook Background */}
      <div className="notebook-bg"></div>
      {/* Geography/Earth Background */}
      <div className="geography-bg"></div>
      {/* Animated Stars Background */}
      <div className="stars">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="star"></div>
        ))}
      </div>
      <div className="content-wrapper text-center">
        <h1 className="text-2xl font-bold notebook-heading mb-4">Loading...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default route redirects to signin */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          
          {/* Signin page */}
          <Route path="/signin" element={<SigninPage />} />
          
          {/* Signup page */}
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Dashboard page (protected) */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Catch all other routes and redirect to signin */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
        
        <ToastContainer 
          position="top-center" 
          autoClose={2000} 
          hideProgressBar={false} 
          newestOnTop 
          closeOnClick 
          rtl={false} 
          pauseOnFocusLoss 
          draggable 
          pauseOnHover 
        />
      </div>
    </Router>
  );
}

export default App;
