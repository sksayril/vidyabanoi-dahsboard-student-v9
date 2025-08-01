import React from 'react';
import { BookOpen, MessageCircle, CreditCard, User } from 'lucide-react';

interface MobileNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'subjects', label: 'My Subjects', icon: BookOpen },
    { id: 'chat', label: 'Chat AI', icon: MessageCircle },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden z-50">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};