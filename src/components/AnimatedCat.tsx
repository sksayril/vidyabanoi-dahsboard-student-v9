import React from 'react';

interface AnimatedCatProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedCat: React.FC<AnimatedCatProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <div className="absolute inset-0 animate-bounce">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-blue-600"
          fill="currentColor"
        >
          {/* Cat body */}
          <ellipse cx="50" cy="65" rx="25" ry="20" className="text-blue-500" fill="currentColor" />
          
          {/* Cat head */}
          <circle cx="50" cy="35" r="20" className="text-blue-600" fill="currentColor" />
          
          {/* Cat ears */}
          <polygon points="35,20 40,5 45,20" className="text-blue-700" fill="currentColor" />
          <polygon points="55,20 60,5 65,20" className="text-blue-700" fill="currentColor" />
          
          {/* Inner ears */}
          <polygon points="37,18 40,8 43,18" className="text-pink-400" fill="currentColor" />
          <polygon points="57,18 60,8 63,18" className="text-pink-400" fill="currentColor" />
          
          {/* Eyes */}
          <circle cx="43" cy="32" r="3" className="text-white" fill="currentColor" />
          <circle cx="57" cy="32" r="3" className="text-white" fill="currentColor" />
          <circle cx="43" cy="32" r="1.5" className="text-black" fill="currentColor" />
          <circle cx="57" cy="32" r="1.5" className="text-black" fill="currentColor" />
          
          {/* Nose */}
          <polygon points="50,38 48,42 52,42" className="text-pink-500" fill="currentColor" />
          
          {/* Mouth */}
          <path d="M 50 42 Q 45 45 40 42" stroke="currentColor" strokeWidth="1" fill="none" className="text-blue-800" />
          <path d="M 50 42 Q 55 45 60 42" stroke="currentColor" strokeWidth="1" fill="none" className="text-blue-800" />
          
          {/* Whiskers */}
          <line x1="25" y1="35" x2="35" y2="33" stroke="currentColor" strokeWidth="1" className="text-blue-800" />
          <line x1="25" y1="40" x2="35" y2="40" stroke="currentColor" strokeWidth="1" className="text-blue-800" />
          <line x1="65" y1="33" x2="75" y2="35" stroke="currentColor" strokeWidth="1" className="text-blue-800" />
          <line x1="65" y1="40" x2="75" y2="40" stroke="currentColor" strokeWidth="1" className="text-blue-800" />
          
          {/* Tail */}
          <path d="M 75 65 Q 85 50 80 35" stroke="currentColor" strokeWidth="4" fill="none" className="text-blue-500" />
        </svg>
      </div>
      
      {/* Floating hearts animation */}
      <div className="absolute -top-2 -right-2 animate-pulse">
        <div className="w-3 h-3 bg-pink-400 rounded-full animate-ping"></div>
      </div>
    </div>
  );
};