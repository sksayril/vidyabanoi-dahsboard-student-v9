import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../api';
import { LoginRequest, LoginResponse } from '../types/api';

interface LoginFormProps {
  onLogin: (userData: LoginResponse) => void;
  onSwitchToSignup: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const loginData: LoginRequest = {
        email,
        password,
      };

      const response = await loginUser(loginData);
      
      // Store token in localStorage
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify(response.user));
      
      // Call the parent onLogin function with the full response
      onLogin(response);
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="notebook-card backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-400 via-blue-400 to-blue-400 p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60"></div>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-8 right-8 w-16 h-16 bg-white/5 rounded-full blur-2xl"></div>
          
          {/* Logo Section */}
          <div className="relative z-10 pt-2 sm:pt-4 mb-6 sm:mb-8">
            <div className="flex justify-center">
              <div className="relative group">
                <img 
                  src="/logo.png" 
                  alt="Vidyavani Logo" 
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 object-contain drop-shadow-2xl filter brightness-110 hover:scale-110 transition-all duration-500 ease-out"
                  onError={(e) => {
                    console.error('Logo image failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
               </div>
            </div>
          </div>
          
          {/* Text Section */}
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">Vidyavani</h1>
            <p className="text-blue-100 text-sm sm:text-base drop-shadow-md">Welcome back, young learner! 🌍</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <label className="block text-sm font-medium notebook-text mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 notebook-text placeholder-gray-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="block text-sm font-medium notebook-text mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 notebook-text placeholder-gray-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-900 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Switch to Signup */}
          <div className="mt-6 text-center">
            <p className="notebook-text">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-blue-800 hover:text-blue-900 font-semibold hover:underline transition-colors duration-200"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};