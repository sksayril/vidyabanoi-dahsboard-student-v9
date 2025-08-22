import React, { useState, useEffect } from 'react';
import { User, Settings, Bell, Shield, Download, LogOut, Edit, Camera, Save, X, KeyRound, History, Trash2 } from 'lucide-react';
import { getUserProfile } from '../../api';
import { UserProfile } from '../../types/api';

interface ProfilePageProps {
  user: any;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security'>('profile');
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string>('');

  // Random emoji avatars for children
  const emojiAvatars = ['🐱', '🐶', '🐰', '🐼', '🐨', '🐯', '🦁', '🐸', '🐙', '🦄', '🦋', '🐢', '🐬', '🐳', '🦕', '🦖', '🐿️', '🦔', '🦡', '🦦'];

  useEffect(() => {
    // Generate random emoji avatar based on user name
    if (profileData?.name) {
      const nameHash = profileData.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const randomEmoji = emojiAvatars[nameHash % emojiAvatars.length];
      setUserAvatar(randomEmoji);
    }
  }, [profileData]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await getUserProfile();
        setProfileData(response.user);
      } catch (err) {
        setError('Failed to fetch profile data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Real profile stats based on actual data
  const getProfileStats = () => {
    if (!profileData) return [];
    
    return [
      { 
        label: 'Subscription Status', 
        value: profileData.subscription.isActive ? 'Active' : 'Inactive', 
        icon: profileData.subscription.isActive ? '⭐' : '🔒',
        color: profileData.subscription.isActive ? 'text-green-600' : 'text-red-600',
        bgColor: profileData.subscription.isActive ? 'bg-green-50' : 'bg-red-50'
      },
      { 
        label: 'Plan Type', 
        value: profileData.subscription.plan.charAt(0).toUpperCase() + profileData.subscription.plan.slice(1), 
        icon: '🎯',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      { 
        label: 'Member Since', 
        value: new Date(profileData.subscription.endDate).getFullYear().toString(), 
        icon: '📅',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      { 
        label: 'Days Left', 
        value: Math.max(0, Math.ceil((new Date(profileData.subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))).toString(), 
        icon: '⏰',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      },
    ];
  };

  const settingsOptions = [
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage your notification preferences',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Download,
      title: 'Download Settings',
      description: 'Configure offline content settings',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Manage your account security',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Settings,
      title: 'Account Settings',
      description: 'Update your account information',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];
  
  const renderInfoField = (label: string, value: string, isEditing: boolean) => {
    if (isEditing) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-300">{label}</label>
          <input
            type="text"
            defaultValue={value}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-300">{label}</label>
        <p className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-700">{value}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent p-2 sm:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header and Tabs */}
        <div className="notebook-card p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col items-start justify-between">
            <div className="w-full mb-4 sm:mb-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold notebook-heading mb-2">
                My Profile 🌍
              </h1>
              <p className="notebook-text text-base sm:text-lg lg:text-xl">Manage your account and track your progress! ✨</p>
            </div>
            <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-2xl sm:rounded-3xl w-full">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-500 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-2xl transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/60'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-500 ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-2xl transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/60'
                }`}
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="notebook-card p-6 sm:p-8 lg:p-12">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 border-4 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <span className="notebook-text text-lg sm:text-xl lg:text-2xl font-bold text-center sm:text-left">Loading your profile... ✨</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 rounded-2xl sm:rounded-3xl shadow-2xl border border-red-200 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <X className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-red-800 mb-2">Oops! Something went wrong</h3>
                <p className="text-red-600 text-base sm:text-lg">{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 sm:mt-6 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
            >
              Try Again 🔄
            </button>
          </div>
        )}

        {/* Profile Content */}
        {!isLoading && !error && profileData && (
          <>
            {activeTab === 'profile' && (
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Profile Header Card */}
                <div className="notebook-card overflow-hidden">
                  <div className="h-32 sm:h-40 lg:h-48 bg-gradient-to-r from-blue-500 via-green-500 to-blue-600 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-green-600/20"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white text-xs sm:text-sm">🌍</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 sm:px-6 lg:px-10 pb-6 sm:pb-8 lg:pb-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-8 -mt-16 sm:-mt-20 lg:-mt-24">
                      <div className="relative group">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-gradient-to-r from-blue-100 via-green-100 to-blue-100 rounded-full flex items-center justify-center border-4 sm:border-6 lg:border-8 border-white shadow-2xl group-hover:border-blue-200 transition-all duration-500 transform group-hover:scale-110 group-hover:shadow-3xl">
                          <span className="text-6xl sm:text-7xl lg:text-9xl animate-pulse">{userAvatar}</span>
                        </div>
                        <button className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110">
                          <Camera className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                        </button>
                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-xs sm:text-sm">⭐</span>
                        </div>
                      </div>
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between space-y-4 sm:space-y-0">
                          <div className="text-center sm:text-left w-full sm:w-auto">
                            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold notebook-heading mb-2 sm:mb-3">{profileData.name}</h2>
                            <div className="space-y-1 sm:space-y-2">
                              <p className="notebook-text text-sm sm:text-base lg:text-xl flex items-center justify-center sm:justify-start">
                                <span className="mr-2 sm:mr-3">📧</span>
                                <span className="break-all">{profileData.email}</span>
                              </p>
                              <p className="text-gray-500 text-sm sm:text-base lg:text-xl flex items-center justify-center sm:justify-start">
                                <span className="mr-2 sm:mr-3">📱</span>
                                <span className="break-all">{profileData.phone}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-2 sm:p-3 lg:p-4 text-gray-400 hover:text-blue-600 transition-all duration-300 hover:bg-blue-50 rounded-xl sm:rounded-2xl group"
                          >
                            <Edit className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 group-hover:scale-110 transition-transform duration-300" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {getProfileStats().map((stat, index) => (
                    <div key={stat.label} className={`group rounded-2xl sm:rounded-3xl shadow-xl border p-4 sm:p-6 lg:p-8 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 sm:hover:-translate-y-3 ${stat.bgColor} border-white/30 backdrop-blur-sm`} style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                         <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-500 ${stat.bgColor} group-hover:scale-110 shadow-xl group-hover:shadow-2xl`}>
                           <span className="text-3xl sm:text-4xl lg:text-6xl animate-bounce">{stat.icon}</span>
                         </div>
                         <div className="text-center sm:text-left">
                           <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${stat.color} mb-1 sm:mb-2`}>{stat.value}</p>
                           <p className="text-xs sm:text-sm font-semibold text-gray-600">{stat.label}</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Profile Information */}
                <div className="notebook-card p-4 sm:p-6 lg:p-10">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-6 sm:mb-8 lg:mb-10 space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg sm:text-xl">📋</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold notebook-heading">Personal Information</h3>
                    </div>
                    {isEditing && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                        <button className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl sm:rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl font-bold text-sm sm:text-base lg:text-lg transform hover:scale-105">
                          <Save className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 sm:mr-3" />
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-200 transition-all duration-300 flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg"
                        >
                          <X className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 sm:mr-3" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                      {renderInfoField('Full Name', profileData.name, isEditing)}
                      {renderInfoField('Email Address', profileData.email, isEditing)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                      {renderInfoField('Phone Number', profileData.phone, isEditing)}
                      {renderInfoField('Subscription Plan', profileData.subscription.plan, isEditing)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                      {renderInfoField('Subscription Status', profileData.subscription.isActive ? 'Active' : 'Inactive', isEditing)}
                      {renderInfoField('Subscription End Date', new Date(profileData.subscription.endDate).toLocaleDateString(), isEditing)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  {settingsOptions.map((option, index) => {
                    const Icon = option.icon;
                    return (
                      <div key={index} className="notebook-card p-4 sm:p-6 lg:p-8 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 sm:hover:-translate-y-3 cursor-pointer group" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                          <div className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 p-3 sm:p-4 lg:p-6 rounded-2xl sm:rounded-3xl ${option.bgColor} shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}>
                            <Icon className={`h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 ${option.color}`} />
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold notebook-heading mb-2 sm:mb-3">{option.title}</h3>
                            <p className="notebook-text text-sm sm:text-base lg:text-lg">{option.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notification Settings */}
                <div className="notebook-card p-4 sm:p-6 lg:p-10">
                  <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8 lg:mb-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg sm:text-xl">🔔</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold notebook-heading">Notification Preferences</h3>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    {[
                      { title: 'Email Notifications', desc: 'Receive updates via email', checked: true },
                      { title: 'Push Notifications', desc: 'Receive push notifications on your devices', checked: true },
                      { title: 'Study Reminders', desc: 'Get reminded about study sessions', checked: false },
                    ].map((item, index) => (
                      <div key={item.title} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-200 hover:shadow-lg transition-all duration-300 group space-y-3 sm:space-y-0" style={{ animationDelay: `${index * 150}ms` }}>
                        <div className="flex-1">
                          <p className="font-bold notebook-text text-base sm:text-lg lg:text-xl mb-1">{item.title}</p>
                          <p className="notebook-text text-sm sm:text-base lg:text-lg">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                          <div className="w-12 h-6 sm:w-14 sm:h-7 lg:w-16 lg:h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 lg:after:h-7 lg:after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-green-500 group-hover:shadow-lg transition-all duration-300"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="notebook-card p-4 sm:p-6 lg:p-10">
                  <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8 lg:mb-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg sm:text-xl">🔐</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold notebook-heading">Security Settings</h3>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 lg:p-8 border border-gray-200 rounded-2xl sm:rounded-3xl hover:bg-gray-50 transition-all duration-500 group space-y-4 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                          <KeyRound className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="font-bold notebook-text text-lg sm:text-xl lg:text-2xl mb-1 sm:mb-2">Change Password</p>
                          <p className="notebook-text text-sm sm:text-base lg:text-lg">Update your account password for enhanced security.</p>
                        </div>
                      </div>
                      <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-green-600 transition-all duration-300 font-bold text-sm sm:text-base lg:text-lg shadow-xl hover:shadow-2xl transform hover:scale-105">Change</button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 lg:p-8 border border-gray-200 rounded-2xl sm:rounded-3xl hover:bg-gray-50 transition-all duration-500 group space-y-4 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                          <Shield className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="font-bold notebook-text text-lg sm:text-xl lg:text-2xl mb-1 sm:mb-2">Two-Factor Authentication</p>
                          <p className="notebook-text text-sm sm:text-base lg:text-lg">Add an extra layer of security to your account.</p>
                        </div>
                      </div>
                      <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-200 transition-all duration-300 font-bold text-sm sm:text-base lg:text-lg">Enable</button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 lg:p-8 border border-gray-200 rounded-2xl sm:rounded-3xl hover:bg-gray-50 transition-all duration-500 group space-y-4 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                          <History className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="font-bold notebook-text text-lg sm:text-xl lg:text-2xl mb-1 sm:mb-2">Login History</p>
                          <p className="notebook-text text-sm sm:text-base lg:text-lg">View your recent login activity.</p>
                        </div>
                      </div>
                      <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-200 transition-all duration-300 font-bold text-sm sm:text-base lg:text-lg">View</button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10">
                  <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-400 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg sm:text-xl">⚠️</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-red-800">Danger Zone</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 lg:p-8 bg-white border border-red-200 rounded-2xl sm:rounded-3xl shadow-lg space-y-4 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-red-400 to-red-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl">
                        <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="font-bold text-red-800 text-lg sm:text-xl lg:text-2xl mb-1 sm:mb-2">Delete Account</p>
                        <p className="text-red-600 text-sm sm:text-base lg:text-lg">Permanently delete your account and all of its data.</p>
                      </div>
                    </div>
                    <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-bold text-sm sm:text-base lg:text-lg shadow-xl hover:shadow-2xl transform hover:scale-105">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto flex items-center justify-center space-x-3 sm:space-x-4 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 notebook-card border border-gray-200 text-gray-600 rounded-2xl sm:rounded-3xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-500 group shadow-2xl hover:shadow-3xl transform hover:scale-105"
          >
            <LogOut className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-gray-500 group-hover:text-white transition-colors" />
            <span className="font-bold text-base sm:text-lg lg:text-xl">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
