import React from 'react';
import { BookOpen, Trophy, Calendar, Bell, Search } from 'lucide-react';

interface DashboardPageProps {
  user: any;
  userData: any;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, userData }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}! 👋
        </h2>
        <p className="text-gray-600">
          Ready to continue your learning journey?
        </p>
      </div>

      {/* User Info Cards */}
      {userData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Main Category</h3>
                <p className="text-gray-600">{userData.parentCategory?.name || 'Not selected'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Subcategory</h3>
                <p className="text-gray-600">{userData.subCategory?.name || 'Not selected'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
                <p className="text-gray-600">
                  {userData.subscription?.isActive ? 'Active' : 'Inactive'} - {userData.subscription?.plan || 'No plan'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for courses, topics, or subjects..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Courses</h3>
            <p className="text-gray-600 text-sm">Continue where you left off</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Achievements</h3>
            <p className="text-gray-600 text-sm">View your progress</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Study Schedule</h3>
            <p className="text-gray-600 text-sm">Plan your learning</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-center">
            <Bell className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
            <p className="text-gray-600 text-sm">Stay updated</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Completed Physics Chapter 1</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Started Chemistry Quiz</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Earned Achievement Badge</p>
              <p className="text-xs text-gray-500">3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 