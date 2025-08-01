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
      {/* Breathing body */}
      <div className="absolute inset-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full text-blue-600"
          fill="currentColor"
        >
          {/* Cat body with breathing animation */}
          <ellipse
            cx="50"
            cy="65"
            rx="25"
            ry="20"
            className="text-blue-500 animate-cat-breath"
            fill="currentColor"
          />

          {/* Cat head */}
          <circle cx="50" cy="35" r="20" className="text-blue-600" fill="currentColor" />

          {/* Cat ears */}
          <polygon points="35,20 40,5 45,20" className="text-blue-700" fill="currentColor" />
          <polygon points="55,20 60,5 65,20" className="text-blue-700" fill="currentColor" />

          {/* Inner ears */}
          <polygon points="37,18 40,8 43,18" className="text-pink-400" fill="currentColor" />
          <polygon points="57,18 60,8 63,18" className="text-pink-400" fill="currentColor" />

          {/* Eyes with blinking animation */}
          <ellipse
            cx="43"
            cy="32"
            rx="3"
            ry="3"
            className="text-white"
            fill="currentColor"
          />
          <ellipse
            cx="57"
            cy="32"
            rx="3"
            ry="3"
            className="text-white"
            fill="currentColor"
          />
          <ellipse
            cx="43"
            cy="32"
            rx="1.5"
            ry="1.5"
            className="text-black animate-cat-blink"
            fill="currentColor"
          />
          <ellipse
            cx="57"
            cy="32"
            rx="1.5"
            ry="1.5"
            className="text-black animate-cat-blink"
            fill="currentColor"
          />

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

          {/* Wagging tail */}
          <path
            d="M 75 65 Q 85 50 80 35"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-blue-500 animate-cat-tail"
          />
        </svg>
      </div>

      {/* Loader: moving ball of yarn */}
      <div className="absolute left-1/2 bottom-2 -translate-x-1/2">
        <div className="w-5 h-5 rounded-full bg-pink-300 border-2 border-pink-400 animate-cat-yarn"></div>
      </div>
    </div>
  );
};