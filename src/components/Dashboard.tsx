import React, { useState, useEffect } from 'react';
import {
  LogOut, BookOpen, User, Bell, Menu, X,
  CreditCard, Home, ClipboardList, Bot, GraduationCap,
  MessageCircle, Brain
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const openMenu = () => {
    setMobileMenuOpen(true);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const goTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    closeMenu();
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
            onNavigateToProfile={() => setActiveTab('profile')}
          />
        );
      case 'learning':
        return (
          <LearningPage
            userData={currentUserData}
            onNavigateToSubscription={() => setActiveTab('subscription')}
            onNavigateToProfile={() => setActiveTab('profile')}
          />
        );
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
            onNavigateToProfile={() => setActiveTab('profile')}
          />
        );
    }
  };

  const mobileBottomItems: { id: ActiveTab; label: string; icon: typeof Home }[] = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'learning', label: 'Courses', icon: GraduationCap },
    { id: 'ai-quiz', label: 'Mock Test', icon: ClipboardList },
    { id: 'ai-chat', label: 'Ask AI', icon: Bot },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      {/* App bar — matches Vidyavani home mock */}
      <header className="sticky top-0 z-40 bg-[#2B7FD9] shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth >= 1024) toggleSidebar();
              else openMenu();
            }}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-white tracking-tight">
            Vidyavani
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="relative p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                1
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="h-9 w-9 rounded-full overflow-hidden border-2 border-white/80 bg-white/20 flex items-center justify-center shrink-0"
              aria-label="Profile"
            >
              <User className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-over menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[min(85vw,280px)] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-[#1e3a5f]">Menu</span>
              <button type="button" onClick={closeMenu} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTab(item.id as ActiveTab)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-medium ${
                      activeTab === item.id ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  handleLogoutClick();
                  closeMenu();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-medium text-red-600 hover:bg-red-50 mt-2"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Sign out
              </button>
            </nav>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:block lg:flex-shrink-0 ${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
          <div className="flex flex-col h-full bg-white/90 backdrop-blur-md border-r border-blue-300 shadow-lg">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto min-h-[calc(100vh-3.5rem)]">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as ActiveTab)}
                      className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full text-left transition-colors duration-200 ${
                        activeTab === item.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
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
              <div className="px-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md w-full text-left text-red-600 hover:bg-red-50 transition-colors duration-200`}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  {isSidebarOpen && <span>Sign out</span>}
                </button>
              </div>
            </div>

          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${isSidebarOpen ? 'lg:ml-0' : 'lg:ml-0'} transition-all duration-300`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 pb-24 lg:pb-8 lg:py-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — tinted to match app shell (no stark white bar) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#eef2f7] shadow-[0_-4px_16px_rgba(0,0,0,0.07)]">
        <div className="flex justify-between items-stretch px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-h-[3.5rem]">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 rounded-lg transition-colors"
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#2B7FD9]' : 'text-gray-400'}`}
                />
                <span
                  className={`mt-0.5 text-[10px] sm:text-xs font-medium truncate max-w-full px-0.5 ${
                    isActive ? 'text-[#2B7FD9]' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Spacer for fixed bottom nav */}
      <div className="lg:hidden h-[4.25rem]" aria-hidden />

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
                <h3 className="text-xl font-bold text-blue-800 mb-2">Sign Out</h3>
                <p className="text-blue-700">Are you sure you want to sign out? You'll need to sign in again to access your account.</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-3 bg-gray-100 text-blue-800 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
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