import React, { useState } from 'react';
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
        return <DashboardPage user={user} userData={currentUserData} />;
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
        return <DashboardPage user={user} userData={currentUserData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Sidebar Toggle */}
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="hidden lg:block p-2 text-gray-400 hover:text-gray-600 mr-4"
              >
                <Menu className="h-6 w-6" />
              </button>
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Vidyabani</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 w-full"
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
          <div className="flex flex-col h-full bg-white border-r border-gray-200">
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
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${item.color}`} />
                      {isSidebarOpen && <span>{item.label}</span>}
                      {!isSidebarOpen && (
                        <div className="relative group">
                          <Icon className={`h-5 w-5 ${item.color}`} />
                          <div className="absolute left-full ml-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
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
                    : 'text-gray-500 hover:text-gray-700'
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