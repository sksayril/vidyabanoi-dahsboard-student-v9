import React from 'react';
import { BookOpen, MessageCircle, CreditCard, User, Home, Brain } from 'lucide-react';

interface MobileNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'subjects', label: 'My Learning', icon: BookOpen },
    { id: 'chat', label: 'AI Chat', icon: MessageCircle },
    { id: 'quiz', label: 'AI Quiz', icon: Brain },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 pb-2">
      {/* Enhanced background blur effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent backdrop-blur-md"></div>
      
      {/* Main navigation container with enhanced styling */}
      <div className="relative mx-4 rounded-3xl bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-2xl border border-white/30 shadow-2xl">
        {/* Animated background gradient with multiple layers */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent"></div>
        
        {/* Navigation items with enhanced animations */}
        <div className="relative flex justify-around items-center px-3 py-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex flex-col items-center py-2 px-2 rounded-2xl transition-all duration-500 ease-out ${
                  isActive
                    ? 'text-white scale-110'
                    : 'text-gray-400 hover:text-white hover:scale-105'
                }`}
              >
                {/* Enhanced active indicator with multiple layers */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-90 animate-pulse"></div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-60 animate-ping"></div>
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 blur-sm animate-pulse"></div>
                  </>
                )}
                
                {/* Enhanced icon container with better animations */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 ${
                  isActive 
                    ? 'bg-white/25 shadow-xl shadow-blue-500/50 scale-110' 
                    : 'bg-transparent group-hover:bg-white/15 group-hover:scale-105'
                }`}>
                  {/* Icon with enhanced animations */}
                  <Icon className={`w-6 h-6 transition-all duration-500 ${
                    isActive 
                      ? 'animate-bounce text-white' 
                      : 'group-hover:animate-pulse text-gray-300 group-hover:text-white'
                  }`} />
                  
                  {/* Floating particles for active state */}
                  {isActive && (
                    <>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                    </>
                  )}
                </div>
                
                {/* Enhanced label with better typography */}
                <span className={`relative z-10 text-xs font-bold mt-2 transition-all duration-500 ${
                  isActive 
                    ? 'text-white drop-shadow-lg' 
                    : 'text-gray-400 group-hover:text-white'
                }`}>
                  {tab.label}
                </span>
                
                {/* Enhanced ripple effect on click */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent scale-0 group-active:scale-100 transition-transform duration-300 ease-out"></div>
                </div>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
              </button>
            );
          })}
        </div>
        
        {/* Enhanced bottom glow effect */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full blur-md animate-pulse"></div>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 rounded-full blur-sm"></div>
      </div>
    </div>
  );
};