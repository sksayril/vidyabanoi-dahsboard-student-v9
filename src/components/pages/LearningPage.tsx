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
  const [continueLearningItem, setContinueLearningItem] = useState<any>(null);

  // Check for continue learning item on component mount
  useEffect(() => {
    const continueItem = localStorage.getItem('continueLearningItem');
    if (continueItem) {
      try {
        const parsedItem = JSON.parse(continueItem);
        setContinueLearningItem(parsedItem);
        // Clear the localStorage item after reading it
        localStorage.removeItem('continueLearningItem');
      } catch (error) {
        console.error('Error parsing continue learning item:', error);
      }
    }
  }, []);

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
        
        // If we have a continue learning item, automatically navigate to it
        if (continueLearningItem && continueLearningItem.subcategoryId === userData.subCategory.id) {
          // Find the content in the fetched data
          const foundContent = data.find(category => 
            category.subcategories?.some(sub => sub._id === continueLearningItem.contentId)
          );
          
          if (foundContent) {
            const subcategory = foundContent.subcategories?.find(sub => sub._id === continueLearningItem.contentId);
            if (subcategory) {
              handleStartLearning(subcategory._id, subcategory.name);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        setError('Failed to load subcategories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [userData, continueLearningItem]);

  // Extract class name from path array (last element)
  const getClassName = (path: string[]) => {
    return path[path.length - 1] || 'Unknown Class';
  };

  // Handle continue learning from dashboard
  const handleContinueLearning = (item: any) => {
    // Navigate to the specific content
    if (item.subcategoryId && item.contentId) {
      // Find the content in the current data
      const foundContent = subcategories.find(category => 
        category.subcategories?.some(sub => sub._id === item.contentId)
      );
      
      if (foundContent) {
        const subcategory = foundContent.subcategories?.find(sub => sub._id === item.contentId);
        if (subcategory) {
          handleStartLearning(subcategory._id, subcategory.name);
        }
      }
    }
  };

  // Handle start learning button click
  const handleStartLearningClick = () => {
    // Navigate to the first available subcategory
    if (subcategories.length > 0 && subcategories[0].subcategories && subcategories[0].subcategories.length > 0) {
      const firstSubcategory = subcategories[0].subcategories[0];
      handleStartLearning(firstSubcategory._id, firstSubcategory.name);
    }
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

  // Color themes for different cards - single colors for children-friendly design
  const colorThemes = [
    // { bg: 'bg-pink-300', border: 'border-pink-400', icon: 'bg-pink-600', text: 'text-pink-800', button: 'bg-pink-600 hover:bg-pink-700' },
    { bg: 'bg-blue-300', border: 'border-blue-400', icon: 'bg-blue-600', text: 'text-blue-800', button: 'bg-blue-600 hover:bg-blue-700' },
    // { bg: 'bg-green-300', border: 'border-green-400', icon: 'bg-green-600', text: 'text-green-800', button: 'bg-green-600 hover:bg-green-700' },
    // { bg: 'bg-yellow-300', border: 'border-yellow-400', icon: 'bg-yellow-600', text: 'text-yellow-800', button: 'bg-yellow-600 hover:bg-yellow-700' },
    // { bg: 'bg-purple-300', border: 'border-purple-400', icon: 'bg-purple-600', text: 'text-purple-800', button: 'bg-purple-600 hover:bg-purple-700' },
    // { bg: 'bg-orange-300', border: 'border-orange-400', icon: 'bg-orange-600', text: 'text-orange-800', button: 'bg-orange-600 hover:bg-orange-700' },
  ];

  // Icons for different subjects
  const subjectIcons = [GraduationCap, BookOpen, Star, Rocket, Heart, Sparkles];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between notebook-card p-6">
        <div>
          <h2 className="text-3xl font-bold notebook-heading mb-2">My Learning Journey! 🌍</h2>
          <p className="notebook-text">Discover amazing classes and start your adventure!</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
            <GraduationCap className="h-4 w-4 inline mr-2" />
            {userData?.subCategory?.name || 'NCERT Books'}
          </div>
        </div>
      </div>

      {/* Available Classes Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6 notebook-card p-6">
          <div>
            <h3 className="text-2xl font-bold notebook-heading mb-2">🌟 Available Classes</h3>
            <p className="notebook-text">Click on any class to start learning!</p>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            <span className="text-sm font-medium notebook-text">Fun Learning Ahead!</span>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center notebook-card p-8">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-blue-600 animate-bounce" />
                </div>
              </div>
              <p className="notebook-text font-medium">Loading amazing classes...</p>
              <p className="text-sm notebook-text mt-1">Preparing your learning adventure!</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 notebook-card">
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
                    className={`notebook-card p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group bg-white`}
                    onClick={() => handleStartLearning(subcategory._id, subcategory.name)}
                  >
                    {/* Decorative elements - geography themed */}
                    <div className="absolute top-3 right-3 opacity-60">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-green-400 rounded-full animate-bounce"></div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-200 border-4 border-white`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-current animate-pulse" />
                        <span className="text-sm bg-gradient-to-r from-blue-100 to-green-100 text-gray-700 px-3 py-2 rounded-full font-bold shadow-md">
                          {subcategory.type}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-bold notebook-heading mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                      {getClassName(subcategory.path)}
                    </h4>
                    
                    <p className="text-base notebook-text mb-5 leading-relaxed font-medium">
                      {subcategory.name}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-5">
                      <span className="bg-gray-100 px-3 py-2 rounded-full font-medium shadow-sm">
                        ID: {subcategory._id.slice(-8)}
                      </span>
                      <span className="bg-gray-100 px-3 py-2 rounded-full font-medium shadow-sm">
                        Created: {new Date(subcategory.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <button 
                      className={`w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-4 rounded-2xl hover:shadow-xl transition-all duration-200 flex items-center justify-center text-base font-bold group-hover:scale-105 border-2 border-white shadow-lg`}
                    >
                      <Rocket className="h-5 w-5 mr-3 animate-bounce" />
                      Start Learning Adventure! 🌍
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

      {subcategories.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold notebook-heading mb-2">No Study Materials Available</h3>
          <p className="text-gray-500 mb-6">Start your learning journey by exploring available content</p>
          <button
            onClick={handleStartLearningClick}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl hover:from-blue-600 hover:to-green-600 transition-all duration-200 font-medium"
          >
            Start Learning 🌍
          </button>
        </div>
      )}
      </div>
    </div>
  );
}; 