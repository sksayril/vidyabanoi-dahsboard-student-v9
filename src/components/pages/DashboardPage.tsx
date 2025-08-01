import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Calendar, Bell, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getHeroBanners } from '../../api';

interface DashboardPageProps {
  user: any;
  userData: any;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, userData }) => {
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
    <div className="space-y-8">
      {/* Hero Banner Carousel */}
      {!isLoading && heroBanners.length > 0 && (
        <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
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
                {/* Mobile Image */}
                <img
                  src={banner.mobile}
                  alt={banner.title || `Hero Banner ${index + 1}`}
                  className="w-full h-full object-cover md:hidden"
                  onError={(e) => {
                    console.error('Mobile banner image failed to load:', banner);
                    e.currentTarget.src = 'https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=Mobile+Banner';
                  }}
                />
                {/* Desktop Image */}
                <img
                  src={banner.desktop}
                  alt={banner.title || `Hero Banner ${index + 1}`}
                  className="w-full h-full object-cover hidden md:block"
                  onError={(e) => {
                    console.error('Desktop banner image failed to load:', banner);
                    e.currentTarget.src = 'https://via.placeholder.com/1200x400/3B82F6/FFFFFF?text=Desktop+Banner';
                  }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>
                
                {/* Content Overlay */}
                {banner.title && (
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg">
                      {banner.title}
                    </h3>
                    {banner.description && (
                      <p className="text-sm md:text-base opacity-90 drop-shadow-md max-w-2xl">
                        {banner.description}
                      </p>
                    )}
                  </div>
                )}
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

      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user.name}! 👋
        </h2>
        <p className="text-white">
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