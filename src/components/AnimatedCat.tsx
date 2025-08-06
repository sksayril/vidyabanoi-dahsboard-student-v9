import React, { useState, useEffect } from 'react';

interface AnimatedCatProps {
  isVoiceEnabled?: boolean;
  isSpeaking?: boolean;
  isRecording?: boolean;
  className?: string;
}

export const AnimatedCat: React.FC<AnimatedCatProps> = ({ 
  isVoiceEnabled = false, 
  isSpeaking = false, 
  isRecording = false,
  className = ""
}) => {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blink, setBlink] = useState(false);
  const [tailWag, setTailWag] = useState(false);
  const [earTwitch, setEarTwitch] = useState(false);
  const [whiskerTwitch, setWhiskerTwitch] = useState(false);

  // Mouth animation for talking
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 200);
      return () => clearInterval(interval);
    } else {
      setMouthOpen(false);
    }
  }, [isSpeaking]);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Tail wagging when voice is enabled
  useEffect(() => {
    if (isVoiceEnabled) {
      const tailInterval = setInterval(() => {
        setTailWag(prev => !prev);
      }, 800);
      return () => clearInterval(tailInterval);
    } else {
      setTailWag(false);
    }
  }, [isVoiceEnabled]);

  // Ear twitching animation
  useEffect(() => {
    const earInterval = setInterval(() => {
      setEarTwitch(true);
      setTimeout(() => setEarTwitch(false), 200);
    }, 4000);
    return () => clearInterval(earInterval);
  }, []);

  // Whisker twitching when speaking
  useEffect(() => {
    if (isSpeaking) {
      const whiskerInterval = setInterval(() => {
        setWhiskerTwitch(prev => !prev);
      }, 300);
      return () => clearInterval(whiskerInterval);
    } else {
      setWhiskerTwitch(false);
    }
  }, [isSpeaking]);

  return (
    <div className={`relative ${className}`}>
      {/* Proper Cat Body Structure - Sitting Position */}
      <div className="relative">
        {/* Shadow Layer */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-black opacity-15 rounded-full blur-sm"></div>
        
        {/* Cat Body Container */}
        <div className="relative w-24 h-32">
          
          {/* Cat Head */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 via-white to-gray-50 rounded-full border-2 border-gray-300 shadow-lg mx-auto">
            {/* 3D Highlight */}
            <div className="absolute top-2 left-3 w-8 h-8 bg-white opacity-40 rounded-full blur-sm"></div>
            
            {/* Cat Ears */}
            <div className="absolute -top-3 left-2">
              <div className={`w-6 h-8 bg-gradient-to-b from-gray-100 to-white rounded-t-full border border-gray-300 transform transition-transform duration-200 ${earTwitch ? 'rotate-2' : ''} shadow-md`}>
                <div className="w-3 h-4 bg-pink-100 rounded-t-full mx-auto mt-1.5 border border-pink-200"></div>
              </div>
            </div>
            <div className="absolute -top-3 right-2">
              <div className={`w-6 h-8 bg-gradient-to-b from-gray-100 to-white rounded-t-full border border-gray-300 transform transition-transform duration-200 ${earTwitch ? '-rotate-2' : ''} shadow-md`}>
                <div className="w-3 h-4 bg-pink-100 rounded-t-full mx-auto mt-1.5 border border-pink-200"></div>
              </div>
            </div>

            {/* Large Eyes like reference */}
            <div className="absolute top-4 left-3">
              <div className={`w-5 h-5 bg-gradient-to-br from-green-300 to-green-500 rounded-full border-2 border-green-600 flex items-center justify-center transition-all duration-200 shadow-inner ${blink ? 'h-1' : ''}`}>
                <div className="w-2 h-3 bg-black rounded-full"></div>
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
                <div className="absolute top-0.5 right-1 w-1 h-1 bg-white rounded-full opacity-60"></div>
              </div>
            </div>
            <div className="absolute top-4 right-3">
              <div className={`w-5 h-5 bg-gradient-to-br from-green-300 to-green-500 rounded-full border-2 border-green-600 flex items-center justify-center transition-all duration-200 shadow-inner ${blink ? 'h-1' : ''}`}>
                <div className="w-2 h-3 bg-black rounded-full"></div>
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
                <div className="absolute top-0.5 right-1 w-1 h-1 bg-white rounded-full opacity-60"></div>
              </div>
            </div>

            {/* Pink Triangle Nose */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-pink-400 shadow-sm"></div>
            </div>

            {/* Mouth */}
            <div className="absolute top-9 left-1/2 transform -translate-x-1/2">
              {mouthOpen ? (
                <div className="w-3 h-2 bg-pink-200 rounded-b-full border border-pink-300 shadow-inner"></div>
              ) : (
                <div className="flex space-x-1">
                  <div className="w-2 h-0.5 bg-gray-400 rounded-full transform -rotate-12"></div>
                  <div className="w-2 h-0.5 bg-gray-400 rounded-full transform rotate-12"></div>
                </div>
              )}
            </div>

            {/* Longer Whiskers */}
            <div className={`absolute top-6 -left-2 transform transition-transform duration-300 ${whiskerTwitch ? 'translate-x-1' : ''}`}>
              <div className="w-6 h-0.5 bg-gray-500 rounded-full opacity-80"></div>
              <div className="w-5 h-0.5 bg-gray-500 rounded-full opacity-80 mt-1"></div>
            </div>
            <div className={`absolute top-6 -right-2 transform transition-transform duration-300 ${whiskerTwitch ? '-translate-x-1' : ''}`}>
              <div className="w-6 h-0.5 bg-gray-500 rounded-full opacity-80"></div>
              <div className="w-5 h-0.5 bg-gray-500 rounded-full opacity-80 mt-1"></div>
            </div>

            {/* Cheek Blush */}
            <div className="absolute top-6 left-0">
              <div className="w-3 h-2 bg-pink-200 rounded-full opacity-30 blur-sm"></div>
            </div>
            <div className="absolute top-6 right-0">
              <div className="w-3 h-2 bg-pink-200 rounded-full opacity-30 blur-sm"></div>
            </div>
          </div>

          {/* Cat Body - Sitting Position */}
          <div className="relative -mt-3 mx-auto">
            <div className="w-20 h-16 bg-gradient-to-br from-gray-100 via-white to-gray-50 rounded-full border-2 border-gray-300 shadow-lg">
              {/* Body Highlight */}
              <div className="absolute top-2 left-3 w-6 h-6 bg-white opacity-30 rounded-full blur-sm"></div>
              
              {/* White Chest Marking */}
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-white opacity-80 rounded-full"></div>
              
              {/* Body Stripes/Pattern */}
              <div className="absolute top-3 left-2 w-8 h-1 bg-gray-200 rounded-full opacity-50"></div>
              <div className="absolute top-5 left-3 w-6 h-1 bg-gray-200 rounded-full opacity-50"></div>
            </div>
          </div>

          {/* Front Paws - Sitting Position */}
          <div className="absolute top-16 left-4">
            <div className="w-4 h-6 bg-gradient-to-b from-gray-100 to-white rounded-full border border-gray-300 shadow-md">
              {/* Paw Highlight */}
              <div className="w-1 h-3 bg-white opacity-40 rounded-full ml-1 mt-1"></div>
              {/* Paw Pads */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-3 h-2 bg-pink-200 rounded-full border border-pink-300 shadow-sm">
                  <div className="flex justify-center space-x-0.5 mt-0.5">
                    <div className="w-0.5 h-0.5 bg-pink-300 rounded-full"></div>
                    <div className="w-0.5 h-0.5 bg-pink-300 rounded-full"></div>
                    <div className="w-0.5 h-0.5 bg-pink-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-16 right-4">
            <div className="w-4 h-6 bg-gradient-to-b from-gray-100 to-white rounded-full border border-gray-300 shadow-md">
              {/* Paw Highlight */}
              <div className="w-1 h-3 bg-white opacity-40 rounded-full ml-1 mt-1"></div>
              {/* Paw Pads */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-3 h-2 bg-pink-200 rounded-full border border-pink-300 shadow-sm">
                  <div className="flex justify-center space-x-0.5 mt-0.5">
                    <div className="w-0.5 h-0.5 bg-pink-300 rounded-full"></div>
                    <div className="w-0.5 h-0.5 bg-pink-300 rounded-full"></div>
                    <div className="w-0.5 h-0.5 bg-pink-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back Legs - Hidden/Sitting */}
          <div className="absolute top-20 left-2">
            <div className="w-6 h-4 bg-gradient-to-b from-gray-100 to-white rounded-full border border-gray-300 shadow-md opacity-60">
              <div className="w-2 h-2 bg-white opacity-40 rounded-full ml-1 mt-1"></div>
            </div>
          </div>
          <div className="absolute top-20 right-2">
            <div className="w-6 h-4 bg-gradient-to-b from-gray-100 to-white rounded-full border border-gray-300 shadow-md opacity-60">
              <div className="w-2 h-2 bg-white opacity-40 rounded-full ml-1 mt-1"></div>
            </div>
          </div>

          {/* Beautiful Curved Tail */}
          <div className={`absolute top-8 -right-4 transform transition-all duration-500 ${tailWag ? 'rotate-12 scale-105' : 'rotate-3'}`}>
            <div className="w-12 h-4 bg-gradient-to-br from-gray-100 to-white rounded-full border border-gray-300 transform rotate-45 shadow-lg">
              <div className="w-3 h-1 bg-gray-200 rounded-full mt-1.5 ml-2 opacity-60"></div>
              <div className="absolute top-1 left-2 w-4 h-1.5 bg-white opacity-40 rounded-full blur-sm"></div>
            </div>
            {/* Tail tip */}
            <div className="w-8 h-3 bg-gradient-to-br from-gray-100 to-white rounded-full border border-gray-300 transform rotate-45 -mt-1 ml-2 shadow-md">
              <div className="w-2 h-1 bg-gray-200 rounded-full mt-1 ml-1.5 opacity-60"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Status Indicators */}
      {isVoiceEnabled && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          {isRecording && (
            <div className="flex items-center space-x-2 bg-red-100 px-4 py-2 rounded-full shadow-lg border border-red-200">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">Listening</span>
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full shadow-lg border border-green-200">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Talking</span>
            </div>
          )}
          {!isRecording && !isSpeaking && (
            <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-full shadow-lg border border-blue-200">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-600 font-medium">Ready</span>
            </div>
          )}
        </div>
      )}

      {/* Speech Bubbles when talking */}
      {isSpeaking && (
        <div className="absolute -top-24 -left-8">
          <div className="bg-white rounded-2xl px-5 py-3 shadow-lg border border-gray-200 min-w-max">
            <div className="flex space-x-1.5 items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          <div className="w-4 h-4 bg-white transform rotate-45 border-r border-b border-gray-200 ml-8 -mt-2"></div>
        </div>
      )}

      {/* Recording Animation */}
      {isRecording && (
        <div className="absolute -top-24 -left-10">
          <div className="bg-red-100 rounded-2xl px-5 py-3 shadow-lg border border-red-200 min-w-max">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">Listening...</span>
            </div>
          </div>
          <div className="w-4 h-4 bg-red-100 transform rotate-45 border-r border-b border-red-200 ml-8 -mt-2"></div>
        </div>
      )}
    </div>
  );
};