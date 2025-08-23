import React from 'react';

interface AnimatedBookProps {
  className?: string;
}

export const AnimatedBook: React.FC<AnimatedBookProps> = ({ 
  className = ""
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-40 object-cover rounded-lg"
      >
        <source 
          src="https://v1.pinimg.com/videos/mc/720p/89/4c/d3/894cd317effec659669ce36be611c390.mp4" 
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};