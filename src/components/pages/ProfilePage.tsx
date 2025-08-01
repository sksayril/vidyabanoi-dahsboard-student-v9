import React, { useState } from 'react';
import { User, Settings, Bell, Shield, Download, LogOut, Edit, Camera, Save, X, KeyRound, History, Trash2 } from 'lucide-react';

interface ProfilePageProps {
  user: any;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security'>('profile');

  const profileStats = [
    { label: 'Courses Completed', value: '12', icon: '📚' },
    { label: 'Study Hours', value: '156', icon: '⏰' },
    { label: 'Achievements', value: '8', icon: '🏆' },
    { label: 'Current Streak', value: '7 days', icon: '🔥' },
  ];

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
    <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header and Tabs */}
        <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-white mt-1">Manage your account settings and track your progress.</p>
            </div>
            <div className="flex space-x-1 p-1 bg-gray-700 rounded-xl mt-4 sm:mt-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-300 hover:text-blue-400'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'settings'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-300 hover:text-blue-400'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'security'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-300 hover:text-blue-400'
                }`}
              >
                Security
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-8">
            {/* Profile Header Card */}
            <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
              <div className="px-8 pb-8">
                <div className="flex items-end space-x-6 -mt-16">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center border-4 border-gray-600 shadow-lg group-hover:border-blue-400 transition-all duration-300">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <button className="absolute bottom-1 right-1 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-600 transition-all duration-200 transform hover:scale-110">
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-3xl font-bold text-white">{user.name}</h2>
                        <p className="text-gray-300">{user.email}</p>
                      </div>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors duration-200 hover:bg-gray-700 rounded-lg"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {profileStats.map((stat) => (
                <div key={stat.label} className="group bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center space-x-4">
                     <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300">
                       <span className="text-3xl">{stat.icon}</span>
                     </div>
                     <div>
                       <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                       <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                     </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                {isEditing && (
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center shadow-sm hover:shadow-md">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInfoField('Full Name', user.name, isEditing)}
                  {renderInfoField('Email Address', user.email, isEditing)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInfoField('Phone Number', '+1 (555) 123-4567', isEditing)}
                  {renderInfoField('Location', 'New York, USA', isEditing)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settingsOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl ${option.bgColor}`}>
                        <Icon className={`h-6 w-6 ${option.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{option.title}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { title: 'Email Notifications', desc: 'Receive updates via email', checked: true },
                  { title: 'Push Notifications', desc: 'Receive push notifications on your devices', checked: true },
                  { title: 'Study Reminders', desc: 'Get reminded about study sessions', checked: false },
                ].map(item => (
                  <div key={item.title} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-800">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <KeyRound className="h-6 w-6 text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-800">Change Password</p>
                      <p className="text-sm text-gray-600">Update your account password for enhanced security.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">Change</button>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Shield className="h-6 w-6 text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-800">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold">Enable</button>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <History className="h-6 w-6 text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-800">Login History</p>
                      <p className="text-sm text-gray-600">View your recent login activity.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold">View</button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Danger Zone</h3>
              <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-xl">
                <div className="flex items-center space-x-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Delete Account</p>
                    <p className="text-sm text-red-600">Permanently delete your account and all of its data.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={onLogout}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 group"
          >
            <LogOut className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
            <span className="font-semibold">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
