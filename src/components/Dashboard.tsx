import React, { useState, useEffect } from 'react';
import {
  LogOut, BookOpen, User, Trophy, Calendar, Bell, Search, Menu, X,
  MessageCircle, Brain, CreditCard, Home, ChevronRight, Crown
} from 'lucide-react';
import { User as UserType } from '../types/api';
import { DashboardPage } from './pages/DashboardPage';
import { LearningPage } from './pages/LearningPage';
import { AiChatPage } from './pages/AiChatPage';
import { AiQuizPage } from './pages/AiQuizPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { ProfilePage } from './pages/ProfilePage';

interface DashboardProps {
  user: UserType;
  userData: any;
  onLogout: () => void;
}

type ActiveTab = 'dashboard' | 'learning' | 'ai-chat' | 'ai-quiz' | 'subscription' | 'profile';

export const Dashboard: React.FC<DashboardProps> = ({ user, userData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(userData);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam && ['dashboard', 'learning', 'ai-chat', 'ai-quiz', 'subscription', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam as ActiveTab);
      
      // Clean up the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-600' },
    { id: 'learning', label: 'My Learning', icon: BookOpen, color: 'text-green-600' },
    { id: 'ai-chat', label: 'AI Chat', icon: MessageCircle, color: 'text-purple-600' },
    { id: 'ai-quiz', label: 'AI Quiz', icon: Brain, color: 'text-orange-600' },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, color: 'text-red-600' },
    { id: 'profile', label: 'Profile', icon: User, color: 'text-gray-600' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle logout with confirmation
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Handle subscription update
  const handleSubscriptionUpdate = (subscriptionData: any) => {
    // Update local user data with new subscription info
    const updatedUserData = {
      ...currentUserData,
      subscription: subscriptionData
    };
    setCurrentUserData(updatedUserData);
    
    // Update localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      parsedUserData.subscription = subscriptionData;
      localStorage.setItem('userData', JSON.stringify(parsedUserData));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage 
            user={user} 
            userData={currentUserData} 
            onNavigateToLearning={() => setActiveTab('learning')}
            onNavigateToSubscription={() => setActiveTab('subscription')}
            onNavigateToQuiz={() => setActiveTab('ai-quiz')}
            onNavigateToChat={() => setActiveTab('ai-chat')}
          />
        );
      case 'learning':
        return <LearningPage userData={currentUserData} onNavigateToSubscription={() => setActiveTab('subscription')} />;
      case 'ai-chat':
        return <AiChatPage />;
      case 'ai-quiz':
        return <AiQuizPage />;
      case 'subscription':
        return <SubscriptionPage userData={currentUserData} onSubscriptionUpdate={handleSubscriptionUpdate} />;
      case 'profile':
        return <ProfilePage user={user} onLogout={onLogout} />;
      default:
        return (
          <DashboardPage 
            user={user} 
            userData={currentUserData} 
            onNavigateToLearning={() => setActiveTab('learning')}
            onNavigateToSubscription={() => setActiveTab('subscription')}
            onNavigateToQuiz={() => setActiveTab('ai-quiz')}
            onNavigateToChat={() => setActiveTab('ai-chat')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-2xl border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Sidebar Toggle */}
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="hidden lg:block p-2 text-blue-600 hover:text-blue-800 mr-4 transition-all duration-200 hover:bg-blue-100 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-green-500 p-1 shadow-lg">
                    <img 
                      src="/image.png" 
                      alt="Vidyabani Logo" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-blue-800 bg-clip-text text-transparent">
                    Vidyabani
                  </h1>
                  <p className="text-xs text-blue-600 font-medium">Learning Platform</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button className="relative p-3 text-blue-600 hover:text-blue-800 transition-all duration-200 hover:bg-blue-100 rounded-xl group">
                <Bell className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-green-500/0 group-hover:from-blue-500/10 group-hover:to-green-500/10 rounded-xl transition-all duration-200"></div>
              </button>
              
              {/* Logout Button - Desktop */}
              <button
                onClick={handleLogoutClick}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 hover:shadow-md group"
                title="Logout"
              >
                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">Logout</span>
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium notebook-text">{user.name}</p>
                  <p className="text-xs text-blue-600">{user.email}</p>
                </div>
                <div className="relative">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-3 text-blue-600 hover:text-blue-800 transition-all duration-200 hover:bg-blue-100 rounded-xl"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 border-t border-blue-200 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-4">
              {/* User Info Section */}
              <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
                <div className="relative">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold notebook-text">{user.name}</p>
                  <p className="text-sm text-blue-600">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Student</p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-200"
                >
                  <User className="h-6 w-6 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-blue-700">Profile</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('subscription');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-200"
                >
                  <Crown className="h-6 w-6 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-700">Subscription</span>
                </button>
              </div>
              
              {/* Logout Button - Enhanced Mobile */}
              <button
                onClick={handleLogoutClick}
                className="flex items-center justify-center space-x-3 w-full p-4 bg-gradient-to-r from-red-50 to-red-100 text-red-700 hover:from-red-100 hover:to-red-200 border border-red-200 rounded-xl transition-all duration-200 hover:shadow-md group"
              >
                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-semibold">Sign Out</span>
              </button>
              
              {/* Additional Info */}
              <div className="text-center text-xs text-gray-500 pt-2">
                <p>Vidyabani Learning Platform</p>
                <p>Version 9.0</p>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:block lg:flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
          <div className="flex flex-col h-full bg-white/90 backdrop-blur-md border-r border-gray-200 shadow-lg">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as ActiveTab)}
                      className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full text-left transition-colors duration-200 ${
                        activeTab === item.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${item.color}`} />
                      {isSidebarOpen && <span>{item.label}</span>}
                      {!isSidebarOpen && (
                        <div className="relative group">
                          <Icon className={`h-5 w-5 ${item.color}`} />
                          <div className="absolute left-full ml-2 px-2 py-1 text-xs text-white bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            {item.label}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
            

          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${isSidebarOpen ? 'lg:ml-0' : 'lg:ml-0'} transition-all duration-300`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-6 w-6 mb-1 ${activeTab === item.id ? item.color : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {/* Logout Button in Bottom Navigation */}
          <button
            onClick={handleLogoutClick}
            className="flex flex-col items-center justify-center flex-1 h-full text-red-600 hover:text-red-700 transition-colors duration-200"
            title="Logout"
          >
            <LogOut className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Bottom padding for mobile to account for bottom navigation */}
      <div className="lg:hidden h-16"></div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="h-8 w-8 text-red-600" />
              </div>
              
              {/* Title and Message */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Out</h3>
                <p className="text-gray-600">Are you sure you want to sign out? You'll need to sign in again to access your account.</p>
              </div>
              
              {/* Action Buttons */}F
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};