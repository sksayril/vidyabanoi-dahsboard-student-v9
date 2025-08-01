import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface QuizTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  isActive: boolean;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({ duration, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeUp]);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 30) return 'text-red-600';
    if (timeLeft <= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className={`flex items-center ${getTimeColor()}`}>
      <Clock className="h-5 w-5 mr-2" />
      <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
      {timeLeft <= 30 && (
        <AlertTriangle className="h-4 w-4 ml-2 animate-pulse" />
      )}
    </div>
  );
}; 