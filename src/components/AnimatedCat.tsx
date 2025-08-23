import React, { useState, useEffect } from 'react';

interface AnimatedBookProps {
  isOpen?: boolean;
  isReading?: boolean;
  isFlipping?: boolean;
  className?: string;
  currentPage?: number;
  totalPages?: number;
}

export const AnimatedBook: React.FC<AnimatedBookProps> = ({ 
  isOpen = false, 
  isReading = false, 
  isFlipping = false,
  className = "",
  currentPage = 1,
  totalPages = 10
}) => {
  const [pageFlip, setPageFlip] = useState(false);
  const [bookGlow, setBookGlow] = useState(false);
  const [pageRustle, setPageRustle] = useState(false);
  const [bookmarkBounce, setBookmarkBounce] = useState(false);
  const [sparkleEffect, setSparkleEffect] = useState(false);

  // Page flipping animation
  useEffect(() => {
    if (isFlipping) {
      setPageFlip(true);
      setTimeout(() => setPageFlip(false), 800);
    }
  }, [isFlipping]);

  // Book glow when reading
  useEffect(() => {
    if (isReading) {
      const glowInterval = setInterval(() => {
        setBookGlow(prev => !prev);
      }, 2000);
      return () => clearInterval(glowInterval);
    } else {
      setBookGlow(false);
    }
  }, [isReading]);

  // Page rustle animation
  useEffect(() => {
    if (isOpen) {
      const rustleInterval = setInterval(() => {
        setPageRustle(true);
        setTimeout(() => setPageRustle(false), 300);
      }, 4000);
      return () => clearInterval(rustleInterval);
    }
  }, [isOpen]);

  // Bookmark bounce animation
  useEffect(() => {
    if (isOpen) {
      const bounceInterval = setInterval(() => {
        setBookmarkBounce(true);
        setTimeout(() => setBookmarkBounce(false), 600);
      }, 5000);
      return () => clearInterval(bounceInterval);
    }
  }, [isOpen]);

  // Sparkle effect when opening
  useEffect(() => {
    if (isOpen && !isReading) {
      setSparkleEffect(true);
      setTimeout(() => setSparkleEffect(false), 1500);
    }
  }, [isOpen, isReading]);

  return (
    <div className={`relative ${className}`}>
      {/* Book Container */}
      <div className="relative">
        {/* Shadow Layer */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black opacity-20 rounded-full blur-md"></div>
        
        {/* Book Body */}
        <div className={`relative w-32 h-40 transition-all duration-1000 ${isOpen ? 'transform rotate-y-12' : ''}`}>
          
          {/* Book Cover - Front */}
          <div className={`absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-lg border-4 border-blue-900 shadow-2xl transition-all duration-1000 ${
            isOpen ? 'transform -rotate-y-45 translate-x-8' : ''
          } ${bookGlow ? 'shadow-blue-400 shadow-2xl' : ''}`}>
            
            {/* Cover Design */}
            <div className="absolute inset-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded border-2 border-blue-400">
              {/* Title */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
                <div className="w-16 h-1 bg-white rounded-full mb-2"></div>
                <div className="w-12 h-0.5 bg-white rounded-full mb-1"></div>
                <div className="w-14 h-0.5 bg-white rounded-full"></div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Bottom Pattern */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
              </div>
            </div>
            
            {/* Spine */}
            <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-blue-800 to-indigo-900 border-r border-blue-700"></div>
          </div>

          {/* Book Cover - Back */}
          <div className={`absolute inset-0 bg-gradient-to-br from-blue-800 via-indigo-800 to-blue-900 rounded-lg border-4 border-blue-900 shadow-2xl transition-all duration-1000 ${
            isOpen ? 'transform rotate-y-45 -translate-x-8' : ''
          }`}>
            {/* Back Cover Design */}
            <div className="absolute inset-2 bg-gradient-to-br from-blue-700 to-indigo-800 rounded border-2 border-blue-600">
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-blue-300 rounded-full"></div>
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blue-300 rounded-full"></div>
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-14 h-0.5 bg-blue-300 rounded-full"></div>
            </div>
          </div>

          {/* Pages Stack */}
          <div className={`absolute inset-0 transition-all duration-1000 ${
            isOpen ? 'transform rotate-y-6' : ''
          }`}>
            
            {/* Multiple Page Layers */}
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className={`absolute inset-0 bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-1000 ${
                  isOpen ? 'transform rotate-y-12' : ''
                }`}
                style={{
                  zIndex: 8 - index,
                  transform: isOpen 
                    ? `rotateY(${12 + index * 2}deg) translateX(${index * 0.5}px)` 
                    : 'rotateY(0deg) translateX(0px)',
                  transitionDelay: `${index * 50}ms`
                }}
              >
                {/* Page Content */}
                <div className="absolute inset-2 text-gray-600 text-xs">
                  <div className="w-full h-0.5 bg-gray-300 rounded-full mb-2"></div>
                  <div className="w-3/4 h-0.5 bg-gray-300 rounded-full mb-1"></div>
                  <div className="w-1/2 h-0.5 bg-gray-300 rounded-full mb-2"></div>
                  <div className="w-full h-0.5 bg-gray-300 rounded-full mb-1"></div>
                  <div className="w-2/3 h-0.5 bg-gray-300 rounded-full"></div>
                </div>
                
                {/* Page Number */}
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 font-mono">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Bookmark */}
          <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${
            bookmarkBounce ? 'animate-bounce' : ''
          }`}>
            <div className="w-3 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-t-full border border-red-500 shadow-md">
              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1 opacity-80"></div>
            </div>
          </div>

          {/* Page Flip Animation */}
          {pageFlip && (
            <div className="absolute inset-0 bg-white rounded-lg border border-gray-200 shadow-lg animate-pulse z-10">
              <div className="absolute inset-2">
                <div className="w-full h-0.5 bg-gray-300 rounded-full mb-2"></div>
                <div className="w-3/4 h-0.5 bg-gray-300 rounded-full mb-1"></div>
                <div className="w-1/2 h-0.5 bg-gray-300 rounded-full mb-2"></div>
                <div className="w-full h-0.5 bg-gray-300 rounded-full mb-1"></div>
                <div className="w-2/3 h-0.5 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Reading Glow Effect */}
          {isReading && (
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-transparent to-yellow-200 opacity-30 rounded-lg animate-pulse"></div>
          )}

          {/* Sparkle Effect */}
          {sparkleEffect && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                    animationDelay: `${index * 100}ms`,
                    animationDuration: '1s'
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Indicators */}
      {isOpen && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
          {isReading && (
            <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full shadow-lg border border-blue-200">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-600 font-medium">Reading</span>
            </div>
          )}
          {isFlipping && (
            <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full shadow-lg border border-green-200">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Flipping...</span>
            </div>
          )}
          {!isReading && !isFlipping && (
            <div className="flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-full shadow-lg border border-purple-200">
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-purple-600 font-medium">Open</span>
            </div>
          )}
        </div>
      )}

      {/* Page Counter */}
      {isOpen && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-full px-3 py-1 shadow-lg border border-gray-200">
            <span className="text-xs text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* Closed Book Indicator */}
      {!isOpen && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full shadow-lg border border-gray-200">
            <div className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-medium">Closed</span>
          </div>
        </div>
      )}
    </div>
  );
};