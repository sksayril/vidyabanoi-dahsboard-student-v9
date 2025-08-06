import React, { useState, useEffect } from 'react';
import {
  LogOut, BookOpen, User, Trophy, Calendar, Bell, Search, Menu, X,
  MessageCircle, Brain, CreditCard, Home, ChevronRight
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
      <header className="bg-gradient-to-r from-blue-900/95 via-purple-900/95 to-indigo-900/95 backdrop-blur-xl shadow-2xl border-b border-blue-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Sidebar Toggle */}
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="hidden lg:block p-2 text-blue-300 hover:text-blue-100 mr-4 transition-all duration-200 hover:bg-blue-500/20 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 p-1 shadow-lg">
                    <img 
                      src="/image.png" 
                      alt="Vidyabani Logo" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    Vidyabani
                  </h1>
                  <p className="text-xs text-blue-200 font-medium">Learning Platform</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button className="relative p-3 text-blue-200 hover:text-white transition-all duration-200 hover:bg-blue-500/20 rounded-xl group">
                <Bell className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-xl transition-all duration-200"></div>
              </button>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-blue-200">{user.email}</p>
                </div>
                <div className="relative">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-blue-900"></div>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-3 text-blue-200 hover:text-white transition-all duration-200 hover:bg-blue-500/20 rounded-xl"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gradient-to-b from-blue-900/95 to-purple-900/95 border-t border-blue-500/30 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-blue-900"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-blue-200">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-3 text-blue-200 hover:text-white w-full p-3 rounded-xl hover:bg-blue-500/20 transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:block lg:flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
          <div className="flex flex-col h-full bg-gray-800/90 backdrop-blur-md border-r border-gray-700">
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
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-md border-t border-gray-700 z-50">
        <div className="flex justify-around items-center h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className={`h-6 w-6 mb-1 ${activeTab === item.id ? item.color : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom padding for mobile to account for bottom navigation */}
      <div className="lg:hidden h-16"></div>
    </div>
  );
};