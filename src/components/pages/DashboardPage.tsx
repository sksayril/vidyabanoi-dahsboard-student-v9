import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Calendar, Bell, Search, ChevronLeft, ChevronRight, Star, Heart, Zap, Target } from 'lucide-react';
import { getHeroBanners } from '../../api';

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
    <div className="space-y-8 p-6">
      {/* Hero Banner Carousel with Enhanced Thumbnail Formatting */}
      {!isLoading && heroBanners.length > 0 && (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] rounded-2xl overflow-hidden shadow-2xl">
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
                  <div className="absolute bottom-8 left-8 right-8 text-white z-10">
                    <div className="max-w-4xl">
                      <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 drop-shadow-lg leading-tight">
                        {banner.title}
                      </h3>
                      {banner.description && (
                        <p className="text-sm md:text-lg lg:text-xl opacity-95 drop-shadow-md max-w-3xl leading-relaxed">
                          {banner.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Additional Decorative Elements */}
                <div className="absolute top-4 right-4 hidden md:block">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
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
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 group"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 group"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {heroBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {heroBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
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
        <div className="w-full h-64 md:h-80 lg:h-96 rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 text-lg font-medium">Loading banners...</div>
          </div>
        </div>
      )}

      {/* Welcome Section with Vibrant Design */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg mb-4">
          <Star className="h-5 w-5" />
          <span className="font-semibold">Welcome back, {user.name}! 👋</span>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Ready to continue your learning journey?
        </h2>
        <p className="text-gray-600 text-lg">
          Let's make today amazing! ✨
        </p>
      </div>

      {/* User Info Cards with Enhanced Thumbnail Formatting */}
      {userData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="flex items-center relative z-10">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-4 shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1">Main Category</h3>
                <p className="text-blue-100 text-sm truncate">{userData.parentCategory?.name || 'Not selected'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="flex items-center relative z-10">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-4 shadow-lg">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1">Subcategory</h3>
                <p className="text-green-100 text-sm truncate">{userData.subCategory?.name || 'Not selected'}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={onNavigateToSubscription}
            className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:from-purple-500 hover:to-purple-700 group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="flex items-center relative z-10">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-4 group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                <Calendar className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1">Subscription</h3>
                <p className="text-purple-100 text-sm truncate">
                  {userData.subscription?.isActive ? 'Active' : 'Inactive'} - {userData.subscription?.plan || 'No plan'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Section with Playful Design */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl shadow-xl p-6 mb-8 border border-pink-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-pink-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for courses, topics, or subjects..."
              className="w-full pl-12 pr-4 py-4 border-2 border-pink-200 rounded-2xl focus:ring-4 focus:ring-pink-300 focus:border-pink-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold">
            Search
          </button>
        </div>
      </div>

      {/* Quick Actions with Enhanced Thumbnail Formatting */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* My Courses - Learning Section */}
        <div 
          onClick={onNavigateToLearning}
          className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 group hover:from-blue-500 hover:to-blue-700 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="text-center relative z-10">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
              <BookOpen className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">My Courses</h3>
            <p className="text-blue-100 text-sm">Continue where you left off</p>
          </div>
        </div>

        {/* Achievements - AI Quiz Section */}
        <div 
          onClick={onNavigateToQuiz}
          className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 group hover:from-green-500 hover:to-green-700 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="text-center relative z-10">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
              <Trophy className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Achievements</h3>
            <p className="text-green-100 text-sm">View your progress</p>
          </div>
        </div>

        {/* Study Goals - AI Chat Section */}
        <div 
          onClick={onNavigateToChat}
          className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 group hover:from-purple-500 hover:to-purple-700 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="text-center relative z-10">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
              <Target className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Study Goals</h3>
            <p className="text-purple-100 text-sm">Set your targets</p>
          </div>
        </div>

        {/* Quick Start - AI Chat Section */}
        <div 
          onClick={onNavigateToChat}
          className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 group hover:from-orange-500 hover:to-orange-700 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="text-center relative z-10">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
              <Zap className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Quick Start</h3>
            <p className="text-orange-100 text-sm">Jump into learning</p>
          </div>
        </div>
      </div>

      {/* Recent Activity with Colorful Design */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl shadow-xl p-6 border border-indigo-200">
        <div className="flex items-center mb-6">
          <Heart className="h-6 w-6 text-pink-500 mr-3" />
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Recent Activity
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-green-200 shadow-lg">
            <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Completed Physics Chapter 1</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
            <div className="bg-green-100 px-3 py-1 rounded-full">
              <span className="text-green-700 text-xs font-semibold">+10 XP</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200 shadow-lg">
            <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Started Chemistry Quiz</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
            <div className="bg-blue-100 px-3 py-1 rounded-full">
              <span className="text-blue-700 text-xs font-semibold">Quiz</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200 shadow-lg">
            <div className="h-4 w-4 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Earned Achievement Badge</p>
              <p className="text-xs text-gray-500">3 days ago</p>
            </div>
            <div className="bg-purple-100 px-3 py-1 rounded-full">
              <span className="text-purple-700 text-xs font-semibold">🏆</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 