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
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-800' },
    { id: 'learning', label: 'My Learning', icon: BookOpen, color: 'text-blue-700' },
    { id: 'ai-chat', label: 'AI Chat', icon: MessageCircle, color: 'text-blue-600' },
    { id: 'ai-quiz', label: 'AI Quiz', icon: Brain, color: 'text-blue-700' },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, color: 'text-blue-800' },
    { id: 'profile', label: 'Profile', icon: User, color: 'text-blue-700' },
  ];



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
      <header className="bg-yellow-100/95 backdrop-blur-xl shadow-2xl border-b border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Sidebar Toggle */}
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="hidden lg:block p-2 text-blue-800 hover:text-blue-900 mr-4 transition-all duration-200 hover:bg-yellow-200 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-blue-800 p-1 shadow-lg">
                    <img 
                      src="/image.png" 
                      alt="Vidyavani Logo" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold text-blue-800">
                    Vidyavani
                  </h1>
                  <p className="text-xs text-blue-700 font-medium">Learning Platform</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button className="relative p-3 text-blue-800 hover:text-blue-900 transition-all duration-200 hover:bg-yellow-200 rounded-xl group">
                <Bell className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-blue-800/0 group-hover:bg-blue-800/10 rounded-xl transition-all duration-200"></div>
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
                  <p className="text-xs text-blue-700">{user.email}</p>
                </div>
                <div className="relative">
                  <div className="h-10 w-10 bg-blue-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                    <User className="h-5 w-5 text-yellow-300" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full border-2 border-white"></div>
                </div>
              </div>
            </div>


          </div>
        </div>


      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:block lg:flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
          <div className="flex flex-col h-full bg-yellow-100/90 backdrop-blur-md border-r border-blue-300 shadow-lg">
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
                          ? 'bg-yellow-200 text-blue-800'
                          : 'text-blue-700 hover:bg-yellow-200 hover:text-blue-800'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${item.color}`} />
                      {isSidebarOpen && <span>{item.label}</span>}
                      {!isSidebarOpen && (
                        <div className="relative group">
                          <Icon className={`h-5 w-5 ${item.color}`} />
                          <div className="absolute left-full ml-2 px-2 py-1 text-xs text-white bg-blue-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
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

      {/* Fixed Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Full width background container */}
        <div className="w-full bg-blue-800 border-t border-blue-600/50 shadow-lg">
          {/* Navigation items with proper alignment */}
          <div className="flex justify-between items-stretch px-4 py-3 h-16">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 flex-1 h-full ${
                    isActive
                      ? 'text-yellow-400'
                      : 'text-yellow-300 hover:text-yellow-400'
                  }`}
                >
                  {/* Active background */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-yellow-400/20"></div>
                  )}
                  
                  {/* Icon container */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 mb-1 ${
                    isActive 
                      ? 'bg-yellow-400/20' 
                      : 'group-hover:bg-yellow-400/10'
                  }`}>
                    <Icon className={`w-5 h-5 transition-all duration-200 ${
                      isActive 
                        ? 'text-yellow-400' 
                        : 'text-yellow-300 group-hover:text-yellow-400'
                    }`} />
                  </div>
                  
                  {/* Label */}
                  <span className={`relative z-10 text-xs font-medium transition-all duration-200 ${
                    isActive 
                      ? 'text-yellow-400' 
                      : 'text-yellow-300 group-hover:text-yellow-400'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full"></div>
                  )}
                </button>
              );
            })}
            
            {/* Logout button with proper alignment */}
            <button
              onClick={handleLogoutClick}
              className="group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300 flex-1 h-full"
              title="Logout"
            >
              <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 mb-1 group-hover:bg-red-500/10">
                <LogOut className="w-5 h-5 transition-all duration-200" />
              </div>
              <span className="relative z-10 text-xs font-medium transition-all duration-200 group-hover:text-red-300">
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom padding for mobile to account for bottom navigation */}
      <div className="lg:hidden h-16"></div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-yellow-100 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center space-y-4">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="h-8 w-8 text-red-600" />
              </div>
              
              {/* Title and Message */}
              <div>
                <h3 className="text-xl font-bold text-blue-800 mb-2">Sign Out</h3>
                <p className="text-blue-700">Are you sure you want to sign out? You'll need to sign in again to access your account.</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-3 bg-yellow-200 text-blue-800 rounded-xl hover:bg-yellow-300 transition-colors duration-200 font-medium"
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