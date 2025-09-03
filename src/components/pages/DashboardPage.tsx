import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Calendar, Bell, Search, ChevronLeft, ChevronRight, Star, Heart, Zap, Target, Clock, CheckCircle, MapPin, RefreshCw, Download } from 'lucide-react';
import { getHeroBanners } from '../../api';

// Add CSS styles for better text handling
const addStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .learning-card-text {
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      line-height: 1.4;
    }
    
    .learning-card-title {
      color: #ffffff !important;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .learning-card-meta {
      color: #f3f4f6 !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    @media (max-width: 640px) {
      .learning-card-text {
        font-size: 0.875rem;
        line-height: 1.3;
      }
      
      .learning-card-title {
        font-size: 0.875rem;
        line-height: 1.2;
      }
    }
  `;
  document.head.appendChild(style);
};

// Learning Journey Widget Component
const LearningJourneyWidget: React.FC = () => {
  const [learningHistory, setLearningHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    completedItems: 0,
    bookmarkedItems: 0,
    totalProgress: 0
  });

  useEffect(() => {
    // Add styles when component mounts
    addStyles();
    
    // Load learning history from localStorage
    try {
      const history = JSON.parse(localStorage.getItem('learningHistory') || '[]');
      // Sort by last accessed date (most recent first)
      const sortedHistory = history.sort((a: any, b: any) => 
        new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
      );
      setLearningHistory(sortedHistory.slice(0, 6)); // Show only last 6 items
      
      // Calculate statistics
      const totalItems = history.length;
      const completedItems = history.filter((item: any) => item.completed).length;
      const bookmarkedItems = history.filter((item: any) => item.bookmarked).length;
      const totalProgress = history.length > 0 
        ? Math.round(history.reduce((sum: number, item: any) => sum + (item.progress || 0), 0) / history.length)
        : 0;
      
      setStats({ totalItems, completedItems, bookmarkedItems, totalProgress });
    } catch (error) {
      console.error('Error loading learning history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleContinueLearning = (item: any) => {
    // Store the item details in localStorage for navigation
    localStorage.setItem('continueLearningItem', JSON.stringify({
      subcategoryId: item.subcategoryId,
      subcategoryName: item.subcategoryName,
      contentId: item.contentId,
      contentName: item.contentName
    }));
    
    // Navigate to learning page
    window.location.href = '/dashboard?tab=learning&continue=true';
  };

  const refreshLearningHistory = () => {
    // Refresh learning history
    const history = JSON.parse(localStorage.getItem('learningHistory') || '[]');
    const sortedHistory = history.sort((a: any, b: any) => 
      new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
    );
    setLearningHistory(sortedHistory.slice(0, 6));
  };

  const exportLearningHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('learningHistory') || '[]');
      const dataStr = JSON.stringify(history, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `learning-history-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting learning history:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (learningHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium notebook-heading mb-2 text-yellow-400">Start Your Learning Journey</h4>
        <p className="text-yellow-300 mb-4">Begin exploring study materials to see your progress here</p>
        <button className="px-6 py-2 bg-blue-800 text-yellow-300 rounded-lg hover:bg-blue-900 transition-all duration-200">
          Start Learning
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Learning Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
        <div className="bg-blue-800 rounded-lg p-2 sm:p-3 text-center border border-blue-600">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400">{stats.totalItems}</div>
          <div className="text-xs text-yellow-300">Total Items</div>
        </div>
        <div className="bg-blue-800 rounded-lg p-2 sm:p-3 text-center border border-blue-600">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400">{stats.completedItems}</div>
          <div className="text-xs text-yellow-300">Completed</div>
        </div>
        <div className="bg-blue-800 rounded-lg p-2 sm:p-3 text-center border border-blue-600">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400">{stats.bookmarkedItems}</div>
          <div className="text-xs text-yellow-300">Bookmarked</div>
        </div>
        <div className="bg-blue-800 rounded-lg p-2 sm:p-3 text-center border border-blue-600">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400">{stats.totalProgress}%</div>
          <div className="text-xs text-yellow-300">Avg Progress</div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-start sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
        <div className="text-xs sm:text-sm text-blue-800 sm:hidden">
          <span className="font-medium">Learning Progress</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={refreshLearningHistory}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-yellow-300 hover:text-yellow-400 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors"
            title="Refresh learning history"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportLearningHistory}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-yellow-300 hover:text-yellow-400 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors"
            title="Export learning history"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {learningHistory.map((item, index) => (
        <div
          key={item.contentId}
          onClick={() => handleContinueLearning(item)}
          className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4 p-3 sm:p-4 bg-blue-800 rounded-lg sm:rounded-xl border border-blue-600 hover:bg-blue-700 hover:border-blue-500 transition-all duration-200 cursor-pointer group"
        >
          {/* Content Icon */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
              item.completed ? 'bg-yellow-500 text-blue-900' : 'bg-yellow-400 text-blue-900'
            }`}>
              {item.completed ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </div>
          </div>

          {/* Content Details */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex items-center space-x-2 mb-1 sm:mb-2">
              <h4 className="font-semibold notebook-text text-xs sm:text-sm md:text-base learning-card-text learning-card-title break-words leading-tight pr-2">{item.contentName}</h4>
              {item.bookmarked && (
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current flex-shrink-0" />
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 md:space-x-4 text-xs sm:text-sm learning-card-meta">
              <span className="flex items-center space-x-1">
                <MapPin className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="learning-card-text break-words">{item.mainCategory}</span>
              </span>
              <span className="flex items-center space-x-1">
                <BookOpen className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="learning-card-text break-words">{item.subcategoryName}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
                <span className="learning-card-text break-words">{formatTimeAgo(item.lastAccessed)}</span>
              </span>
            </div>
          </div>

          {/* Progress and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-3 w-full sm:w-auto">
            {/* Progress Bar */}
            <div className="w-full sm:w-16 md:w-20">
              <div className="w-full bg-blue-600 rounded-full h-1.5 sm:h-2 mb-1">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress || 0}%` }}
                ></div>
              </div>
              <span className="text-xs text-yellow-200">{item.progress || 0}%</span>
            </div>

            {/* Continue Button */}
            <button className="w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 md:py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-900 text-xs rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 font-semibold">
              Continue
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

interface DashboardPageProps {
  user: any;
  userData: any;
  onNavigateToLearning?: () => void;
  onNavigateToSubscription?: () => void;
  onNavigateToQuiz?: () => void;
  onNavigateToChat?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  user, 
  userData, 
  onNavigateToLearning,
  onNavigateToSubscription,
  onNavigateToQuiz,
  onNavigateToChat
}) => {
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch hero banners on component mount
  useEffect(() => {
    const fetchHeroBanners = async () => {
      try {
        setIsLoading(true);
        const response = await getHeroBanners();
        // Use the data array from the API response
        const banners = response.data || response;
        
        // If API returns empty data, use fallback images
        if (!banners || banners.length === 0) {
          const fallbackBanners = [
            {
              title: "Welcome to Learning Platform",
              desktop: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
              mobile: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
              description: "Start your educational journey with us"
            },
            {
              title: "Unlock Your Potential",
              desktop: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
              mobile: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
              description: "Discover knowledge that transforms lives"
            },
            {
              title: "Learn. Grow. Succeed.",
              desktop: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
              mobile: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
              description: "Excellence in education, innovation in learning"
            }
          ];
          setHeroBanners(fallbackBanners);
        } else {
          setHeroBanners(banners);
        }
      } catch (error) {
        console.error('Error fetching hero banners:', error);
        // Use fallback banners in case of API error
        const fallbackBanners = [
          {
            title: "Welcome to Learning Platform",
            desktop: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            mobile: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            description: "Start your educational journey with us"
          }
        ];
        setHeroBanners(fallbackBanners);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeroBanners();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (heroBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [heroBanners.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="w-full max-w-5xl mx-auto px-1 sm:px-[3px] md:px-4 lg:px-6 xl:px-8 py-2 sm:py-4 md:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Hero Banner Carousel with Enhanced Thumbnail Formatting */}
          {!isLoading && heroBanners.length > 0 && (
            <div className="relative w-full aspect-[16/9] sm:aspect-[18/9] md:aspect-[21/9] lg:aspect-[24/9] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl">
              {/* Main Image Container */}
              <div className="relative w-full h-full">
                {heroBanners.map((banner, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
                      index === currentSlide 
                        ? 'opacity-100 translate-x-0 scale-100' 
                        : index < currentSlide 
                          ? 'opacity-0 -translate-x-full scale-95' 
                          : 'opacity-0 translate-x-full scale-95'
                    }`}
                  >
                    {/* Mobile Image with Proper Thumbnail Formatting */}
                    <div className="relative w-full h-full md:hidden">
                      <img
                        src={banner.mobile}
                        alt={banner.title || `Hero Banner ${index + 1}`}
                        className="w-full h-full object-cover object-center"
                        style={{
                          objectPosition: 'center 25%',
                          imageRendering: 'crisp-edges'
                        }}
                        onError={(e) => {
                          console.error('Mobile banner image failed to load:', banner);
                          e.currentTarget.src = 'https://via.placeholder.com/800x450/3B82F6/FFFFFF?text=Mobile+Banner';
                        }}
                      />
                      {/* Mobile Image Overlay for Better Text Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    </div>
                    
                    {/* Desktop Image with Enhanced Thumbnail Formatting */}
                    <div className="relative w-full h-full hidden md:block">
                      <img
                        src={banner.desktop}
                        alt={banner.title || `Hero Banner ${index + 1}`}
                        className="w-full h-full object-cover object-center"
                        style={{
                          objectPosition: 'center 30%',
                          imageRendering: 'crisp-edges'
                        }}
                        onError={(e) => {
                          console.error('Desktop banner image failed to load:', banner);
                          e.currentTarget.src = 'https://via.placeholder.com/1200x400/3B82F6/FFFFFF?text=Desktop+Banner';
                        }}
                      />
                      {/* Desktop Image Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
                    </div>
                    
                    {/* Enhanced Content Overlay with Better Positioning */}
                    {banner.title && (
                      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-3 sm:left-6 md:left-8 right-3 sm:right-6 md:right-8 text-white z-10">
                        <div className="max-w-4xl">
                          <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 drop-shadow-lg leading-tight">
                            {banner.title}
                          </h3>
                          {banner.description && (
                            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl opacity-95 drop-shadow-md max-w-3xl leading-relaxed">
                              {banner.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional Decorative Elements */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 hidden md:block">
                      <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              {heroBanners.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 group"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 group"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {heroBanners.length > 1 && (
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
                  {heroBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-white scale-125 shadow-lg' 
                          : 'bg-white/50 hover:bg-white/70 hover:scale-110'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Loading Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse opacity-20"></div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="w-full h-48 sm:h-64 md:h-80 lg:h-96 rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-sm sm:text-base md:text-lg font-medium">Loading banners...</div>
              </div>
            </div>
          )}

          {/* Welcome Section with Vibrant Design */}
          <div className="text-center w-full px-1 sm:px-0">
            <div className="inline-flex items-center space-x-2 bg-blue-800 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full shadow-lg mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base">
              <Star className="h-3 w-3 bg-white sm:h-4 sm:w-4 md:h-5 md:w-5" />
              <span className="font-semibold text-white">Welcome back, {user.name}! 🌍</span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold notebook-heading mb-2 break-words px-2 sm:px-0">
              Ready to continue your learning journey?
            </h2>
            <p className="notebook-text text-sm sm:text-base md:text-lg break-words px-2 sm:px-0">
              Let's make today amazing! ✨
            </p>
          </div>

          {/* User Info Cards with Enhanced Thumbnail Formatting */}
          {userData && (
            <div className="flex justify-center w-full px-2 sm:px-0">
              <div className="w-full max-w-sm sm:max-w-md">
                <div 
                  onClick={onNavigateToSubscription}
                  className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:from-blue-600 hover:to-blue-800 group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-24 lg:w-32 h-16 sm:h-20 md:h-24 lg:h-32 bg-yellow-400/20 rounded-full -translate-y-6 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-16 translate-x-6 sm:translate-x-8 md:translate-x-12 lg:translate-x-16"></div>
                  <div className="flex items-center relative z-10">
                    <div className="bg-yellow-400/20 backdrop-blur-sm rounded-full p-2 sm:p-3 mr-2 sm:mr-3 md:mr-4 shadow-lg flex-shrink-0 group-hover:bg-yellow-400/30 transition-all duration-300">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-yellow-400 mb-1">Subscription</h3>
                      <p className="text-yellow-300 text-xs sm:text-sm truncate">
                        {userData.subscription?.isActive ? 'Active' : 'Inactive'} - {userData.subscription?.plan || 'No plan'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions with Enhanced Thumbnail Formatting */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 w-full">
            {/* My Courses - Learning Section */}
            <div 
              onClick={onNavigateToLearning}
              className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 group hover:from-blue-600 hover:to-blue-800 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-12 sm:w-16 md:w-20 lg:w-24 h-12 sm:h-16 md:h-20 lg:h-24 bg-yellow-400/20 rounded-full -translate-y-6 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-12 translate-x-6 sm:translate-x-8 md:translate-x-12 lg:translate-x-12"></div>
              <div className="text-center relative z-10">
                <div className="bg-yellow-400/20 backdrop-blur-sm rounded-full p-2 sm:p-3 md:p-4 mx-auto mb-2 sm:mb-3 md:mb-4 w-8 sm:w-10 md:w-12 lg:w-16 h-8 sm:h-10 md:h-12 lg:h-16 flex items-center justify-center group-hover:bg-yellow-400/30 transition-all duration-300 shadow-lg">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-yellow-400 mb-1 sm:mb-2">My Courses</h3>
                <p className="text-yellow-300 text-xs sm:text-sm">Continue where you left off</p>
              </div>
            </div>

            {/* Achievements - AI Quiz Section */}
            <div 
              onClick={onNavigateToQuiz}
              className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 group hover:from-blue-600 hover:to-blue-800 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-12 sm:w-16 md:w-20 lg:w-24 h-12 sm:h-16 md:h-20 lg:h-24 bg-yellow-400/20 rounded-full -translate-y-6 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-12 translate-x-6 sm:translate-x-8 md:translate-x-12 lg:translate-x-12"></div>
              <div className="text-center relative z-10">
                <div className="bg-yellow-400/20 backdrop-blur-sm rounded-full p-2 sm:p-3 md:p-4 mx-auto mb-2 sm:mb-3 md:mb-4 w-8 sm:w-10 md:w-12 lg:w-16 h-8 sm:h-10 md:h-12 lg:h-16 flex items-center justify-center group-hover:bg-yellow-400/30 transition-all duration-300 shadow-lg">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-yellow-400 mb-1 sm:mb-2">Achievements</h3>
                <p className="text-yellow-300 text-xs sm:text-sm">View your progress</p>
              </div>
            </div>

            {/* Study Goals - AI Chat Section */}
            <div 
              onClick={onNavigateToChat}
              className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 group hover:from-blue-600 hover:to-blue-800 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-12 sm:w-16 md:w-20 lg:w-24 h-12 sm:h-16 md:h-20 lg:h-24 bg-yellow-400/20 rounded-full -translate-y-6 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-12 translate-x-6 sm:translate-x-8 md:translate-x-12 lg:translate-x-12"></div>
              <div className="text-center relative z-10">
                <div className="bg-yellow-400/20 backdrop-blur-sm rounded-full p-2 sm:p-3 md:p-4 mx-auto mb-2 sm:mb-3 md:mb-4 w-8 sm:w-10 md:w-12 lg:w-16 h-8 sm:h-10 md:h-12 lg:h-16 flex items-center justify-center group-hover:bg-yellow-400/30 transition-all duration-300 shadow-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-yellow-400 mb-1 sm:mb-2">Study Goals</h3>
                <p className="text-yellow-300 text-xs sm:text-sm">Set your targets</p>
              </div>
            </div>

            {/* Quick Start - AI Chat Section */}
            <div 
              onClick={onNavigateToChat}
              className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 group hover:from-blue-600 hover:to-blue-800 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-12 sm:w-16 md:w-20 lg:w-24 h-12 sm:h-16 md:h-20 lg:h-24 bg-yellow-400/20 rounded-full -translate-y-6 sm:-translate-y-8 md:-translate-y-12 lg:-translate-y-12 translate-x-6 sm:translate-x-8 md:translate-x-12 lg:translate-x-12"></div>
              <div className="text-center relative z-10">
                <div className="bg-yellow-400/20 backdrop-blur-sm rounded-full p-2 sm:p-3 md:p-4 mx-auto mb-2 sm:mb-3 md:mb-4 w-8 sm:w-10 md:w-12 lg:w-16 h-8 sm:h-10 md:h-12 lg:h-16 flex items-center justify-center group-hover:bg-yellow-400/30 transition-all duration-300 shadow-lg">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-yellow-400 mb-1 sm:mb-2">Quick Start</h3>
                <p className="text-yellow-300 text-xs sm:text-sm">Jump into learning</p>
              </div>
            </div>
          </div>

          {/* Recent Activity with Colorful Design */}
          <div className="notebook-card p-3 sm:p-4 md:p-6 w-full">
            <div className="flex items-center mb-3 sm:mb-4 md:mb-6">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-400 mr-2 sm:mr-3" />
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold notebook-heading text-yellow-400">
                Recent Activity
              </h3>
            </div>
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-2 sm:p-3 md:p-4 bg-blue-800 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-blue-600 shadow-lg">
                <div className="h-3 w-3 sm:h-4 sm:w-4 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-white">Completed Physics Chapter 1</p>
                  <p className="text-xs text-yellow-300">2 hours ago</p>
                </div>
                <div className="bg-yellow-400/20 px-2 sm:px-3 py-1 rounded-full flex-shrink-0">
                  <span className="text-yellow-400 text-xs font-semibold">+10 XP</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-2 sm:p-3 md:p-4 bg-blue-800 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-blue-600 shadow-lg">
                <div className="h-3 w-3 sm:h-4 sm:w-4 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-white">Started Chemistry Quiz</p>
                  <p className="text-xs text-yellow-300">1 day ago</p>
                </div>
                <div className="bg-yellow-400/20 px-2 sm:px-3 py-1 rounded-full flex-shrink-0">
                  <span className="text-yellow-400 text-xs font-semibold">Quiz</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-2 sm:p-3 md:p-4 bg-blue-800 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-blue-600 shadow-lg">
                <div className="h-3 w-3 sm:h-4 sm:w-4 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-white">Earned Achievement Badge</p>
                  <p className="text-xs text-yellow-300">3 days ago</p>
                </div>
                <div className="bg-yellow-400/20 px-2 sm:px-3 py-1 rounded-full flex-shrink-0">
                  <span className="text-yellow-400 text-xs font-semibold">🏆</span>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Journey Section */}
          <div className="notebook-card p-3 sm:p-4 md:p-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 md:mb-6 space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-400 mr-2 sm:mr-3" />
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold notebook-heading text-yellow-400">
                  Continue Your Learning Journey 🌍
                </h3>
              </div>
              <button
                onClick={onNavigateToLearning}
                className="w-full text-white sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 text-xs sm:text-sm font-medium font-semibold"
              >
                View All
              </button>
            </div>
            
            <LearningJourneyWidget />
          </div>
        </div>
      </div>
    </div>
  );
}; 