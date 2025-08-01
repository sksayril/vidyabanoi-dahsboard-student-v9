import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { Dashboard } from './components/Dashboard';
import { User, LoginResponse } from './types/api';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToSignup={() => setCurrentView('signup')}
      />
    );
  }

  if (currentView === 'signup') {
    return (
      <SignupForm
        onSignup={handleSignup}
        onSwitchToLogin={() => setCurrentView('login')}
      />
    );
  }

  if (currentView === 'dashboard' && user) {
    return <Dashboard user={user} userData={userData} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}

export default App;
