import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Clock, CheckCircle, Award, TrendingUp, Calendar, GraduationCap, Star, Sparkles, Heart, Rocket } from 'lucide-react';
import { getSubcategories } from '../../api';
import { SubcategoriesResponse } from '../../types/api';
import { ContentDetailPage } from './ContentDetailPage';

interface LearningPageProps {
  userData?: any;
  onNavigateToSubscription?: () => void;
}

export const LearningPage: React.FC<LearningPageProps> = ({ userData, onNavigateToSubscription }) => {
  const [subcategories, setSubcategories] = useState<SubcategoriesResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<{ id: string; name: string } | null>(null);

  // Fetch subcategories on component mount
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!userData?.subCategory?.id) {
        setError('No subcategory ID available');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await getSubcategories(userData.subCategory.id);
        setSubcategories(data);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        setError('Failed to load subcategories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [userData]);

  // Extract class name from path array (last element)
  const getClassName = (path: string[]) => {
    return path[path.length - 1] || 'Unknown Class';
  };

  // Handle start learning button click
  const handleStartLearning = (subcategoryId: string, subcategoryName: string) => {
    setSelectedSubcategory({ id: subcategoryId, name: subcategoryName });
  };

  // Handle back navigation
  const handleBack = () => {
    setSelectedSubcategory(null);
  };

  // If a subcategory is selected, show the content detail page
  if (selectedSubcategory) {
    return (
      <ContentDetailPage
        subcategoryId={selectedSubcategory.id}
        subcategoryName={selectedSubcategory.name}
        onBack={handleBack}
        userData={userData}
        onNavigateToSubscription={onNavigateToSubscription || (() => {})}
      />
    );
  }

  // Color themes for different cards
  const colorThemes = [
    { bg: 'from-pink-100 to-purple-100', border: 'border-pink-200', icon: 'bg-pink-500', text: 'text-pink-700', button: 'bg-pink-500 hover:bg-pink-600' },
    { bg: 'from-blue-100 to-cyan-100', border: 'border-blue-200', icon: 'bg-blue-500', text: 'text-blue-700', button: 'bg-blue-500 hover:bg-blue-600' },
    { bg: 'from-green-100 to-emerald-100', border: 'border-green-200', icon: 'bg-green-500', text: 'text-green-700', button: 'bg-green-500 hover:bg-green-600' },
    { bg: 'from-orange-100 to-yellow-100', border: 'border-orange-200', icon: 'bg-orange-500', text: 'text-orange-700', button: 'bg-orange-500 hover:bg-orange-600' },
    { bg: 'from-purple-100 to-pink-100', border: 'border-purple-200', icon: 'bg-purple-500', text: 'text-purple-700', button: 'bg-purple-500 hover:bg-purple-600' },
    { bg: 'from-teal-100 to-blue-100', border: 'border-teal-200', icon: 'bg-teal-500', text: 'text-teal-700', button: 'bg-teal-500 hover:bg-teal-600' },
  ];

  // Icons for different subjects
  const subjectIcons = [GraduationCap, BookOpen, Star, Rocket, Heart, Sparkles];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">My Learning Journey! 🚀</h2>
          <p className="text-white">Discover amazing classes and start your adventure!</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
            <GraduationCap className="h-4 w-4 inline mr-2" />
            {userData?.subCategory?.name || 'NCERT Books'}
          </div>
        </div>
      </div>

      {/* Available Classes Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">🌟 Available Classes</h3>
            <p className="text-white">Click on any class to start learning!</p>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            <span className="text-sm font-medium text-white">Fun Learning Ahead!</span>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-blue-600 animate-bounce" />
                </div>
              </div>
              <p className="text-white font-medium">Loading amazing classes...</p>
              <p className="text-sm text-white mt-1">Preparing your learning adventure!</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <Heart className="h-6 w-6 text-red-500 mr-3" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && subcategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcategories.map((categoryData, categoryIndex) =>
              categoryData.subcategories.map((subcategory, subcategoryIndex) => {
                const themeIndex = (categoryIndex + subcategoryIndex) % colorThemes.length;
                const theme = colorThemes[themeIndex];
                const IconComponent = subjectIcons[themeIndex % subjectIcons.length];
                
                return (
                  <div
                    key={subcategory._id}
                    className={`bg-gradient-to-br ${theme.bg} rounded-xl p-6 hover:shadow-xl transition-all duration-300 border-2 ${theme.border} hover:border-opacity-80 transform hover:scale-105 cursor-pointer group`}
                    onClick={() => handleStartLearning(subcategory._id, subcategory.name)}
                  >
                    {/* Decorative elements */}
                    <div className="absolute top-2 right-2 opacity-20">
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 ${theme.icon} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-xs bg-white bg-opacity-70 text-gray-700 px-2 py-1 rounded-full font-medium">
                          {subcategory.type}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors">
                      {getClassName(subcategory.path)}
                    </h4>
                    
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {subcategory.name}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full">
                        ID: {subcategory._id.slice(-8)}
                      </span>
                      <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full">
                        Created: {new Date(subcategory.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <button 
                      className={`w-full ${theme.button} text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center text-sm font-bold group-hover:scale-105`}
                    >
                      <Rocket className="h-4 w-4 mr-2 animate-pulse" />
                      Start Learning Adventure!
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {!loading && !error && subcategories.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 max-w-md mx-auto">
              <GraduationCap className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Classes Available Yet</h3>
              <p className="text-gray-600 mb-4">Don't worry! New exciting classes will be added soon!</p>
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                <span className="text-sm text-gray-500">Stay tuned for updates!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 