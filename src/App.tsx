import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { Dashboard } from './components/Dashboard';
import { User, LoginResponse } from './types/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'dashboard'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth token on app load
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
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (loginResponse: LoginResponse) => {
    setUser({
      id: loginResponse.user.id,
      name: loginResponse.user.name,
      email: loginResponse.user.email,
    });
    setUserData(loginResponse.user);
    setCurrentView('dashboard');
  };

  const handleSignup = (name: string, email: string, password: string) => {
    // This is now handled by the SignupForm redirecting to login
    console.log('User registered:', { name, email });
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    setUser(null);
    setUserData(null);
    setCurrentView('login');
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Animated Stars Background */}
        <div className="stars">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="star"></div>
          ))}
        </div>
        <div className="content-wrapper text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <>
        {/* Animated Stars Background */}
        <div className="stars">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="star"></div>
          ))}
        </div>
        <div className="content-wrapper">
          <LoginForm
            onLogin={handleLogin}
            onSwitchToSignup={() => setCurrentView('signup')}
          />
        </div>
      </>
    );
  }

  if (currentView === 'signup') {
    return (
      <>
        {/* Animated Stars Background */}
        <div className="stars">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="star"></div>
          ))}
        </div>
        <div className="content-wrapper">
          <SignupForm
            onSignup={handleSignup}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        </div>
      </>
    );
  }

  if (currentView === 'dashboard' && user) {
    return (
      <>
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
  }

  return (
    <>
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="min-h-screen flex items-center justify-center">
        {/* Animated Stars Background */}
        <div className="stars">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="star"></div>
          ))}
        </div>
        <div className="content-wrapper text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    </>
  );
}

export default App;
