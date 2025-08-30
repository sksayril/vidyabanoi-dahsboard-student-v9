import React from 'react';
import { BookOpen, MessageCircle, CreditCard, User, Home, Brain, LogOut } from 'lucide-react';

interface MobileNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ activeTab, onTabChange, onLogout }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'subjects', label: 'My Learning', icon: BookOpen },
    { id: 'chat', label: 'AI Chat', icon: MessageCircle },
    { id: 'quiz', label: 'AI Quiz', icon: Brain },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50">
      {/* Enhanced background with gradient and blur */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-800/80 to-blue-700/70 backdrop-blur-xl"></div>
      
      {/* Main navigation container with enhanced mobile app styling */}
      <div className="relative mx-3 mb-2 rounded-3xl bg-gradient-to-t from-blue-800 via-blue-700 to-blue-600 border border-blue-500/50 shadow-2xl overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-yellow-400/5 animate-pulse"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent"></div>
        
        {/* Navigation items with enhanced mobile app feel */}
        <div className="relative flex justify-around items-center px-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex flex-col items-center py-2 px-1 rounded-2xl transition-all duration-300 ease-out transform ${
                  isActive
                    ? 'text-yellow-400 scale-110 z-10'
                    : 'text-yellow-300 hover:text-yellow-400 hover:scale-105'
                }`}
              >
                {/* Enhanced active indicator with mobile app styling */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-yellow-400 to-yellow-500 opacity-95 animate-pulse"></div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-yellow-300 to-yellow-400 opacity-70 animate-ping"></div>
                    <div className="absolute -inset-1 rounded-2xl bg-yellow-400/40 blur-md animate-pulse"></div>
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-t from-yellow-400/20 to-transparent"></div>
                  </>
                )}
                
                {/* Enhanced icon container with mobile app animations */}
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/50 scale-110 ring-2 ring-yellow-300/50' 
                    : 'bg-transparent group-hover:bg-yellow-400/15 group-hover:scale-105 group-hover:shadow-md'
                }`}>
                  {/* Icon with enhanced mobile app animations */}
                  <Icon className={`w-5 h-5 transition-all duration-300 ${
                    isActive 
                      ? 'animate-bounce text-blue-900 drop-shadow-sm' 
                      : 'group-hover:animate-pulse text-yellow-300 group-hover:text-yellow-400'
                  }`} />
                  
                  {/* Enhanced floating particles for active state */}
                  {isActive && (
                    <>
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                      <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse"></div>
                      <div className="absolute top-1/2 -left-1 w-1 h-1 bg-yellow-200 rounded-full animate-bounce"></div>
                    </>
                  )}
                </div>
                
                {/* Enhanced label with mobile app typography */}
                <span className={`relative z-10 text-xs font-semibold mt-1.5 transition-all duration-300 ${
                  isActive 
                    ? 'text-yellow-400 drop-shadow-sm' 
                    : 'text-yellow-300 group-hover:text-yellow-400'
                }`}>
                  {tab.label}
                </span>
                
                {/* Enhanced mobile app ripple effect */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/40 to-yellow-300/20 scale-0 group-active:scale-100 transition-transform duration-200 ease-out rounded-2xl"></div>
                </div>
                
                {/* Enhanced hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                
                {/* Active state indicator dot */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-sm"></div>
                )}
              </button>
            );
          })}
          
          {/* Logout button with distinct styling */}
          <button
            onClick={onLogout}
            className="group relative flex flex-col items-center py-2 px-1 rounded-2xl transition-all duration-300 ease-out transform text-red-400 hover:text-red-300 hover:scale-105"
          >
            <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 bg-transparent group-hover:bg-red-500/15 group-hover:scale-105 group-hover:shadow-md">
              <LogOut className="w-5 h-5 transition-all duration-300 group-hover:animate-pulse" />
            </div>
            <span className="relative z-10 text-xs font-semibold mt-1.5 transition-all duration-300 group-hover:text-red-300">
              Logout
            </span>
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-red-400/10 scale-0 group-active:scale-100 transition-transform duration-200 ease-out rounded-2xl"></div>
            </div>
          </button>
        </div>
        
        {/* Enhanced bottom glow effects */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-3 bg-gradient-to-t from-yellow-400/30 via-yellow-400/20 to-transparent rounded-full blur-lg animate-pulse"></div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gradient-to-t from-yellow-300/40 to-transparent rounded-full blur-md"></div>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-t from-yellow-200/50 to-transparent rounded-full blur-sm"></div>
        
        {/* Side glow effects */}
        <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-16 bg-gradient-to-r from-yellow-400/20 to-transparent rounded-full blur-sm"></div>
        <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-16 bg-gradient-to-l from-yellow-400/20 to-transparent rounded-full blur-sm"></div>
      </div>
      
      {/* Bottom safe area for mobile devices */}
      <div className="h-2 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
    </div>
  );
};