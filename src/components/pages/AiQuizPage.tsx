import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Target,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Home,
  Star,
  Trophy,
  Plus,
  Edit3,
  Eye
} from 'lucide-react';
import { 
  QuizGenerationRequest, 
  QuizGenerationResponse, 
  QuizQuestion
} from '../../types/api';
import { generateAIQuiz } from '../../api';

type QuizState = 'topic-selection' | 'generating' | 'quiz-taking' | 'results' | 'review';
type ActiveTab = 'available' | 'history';
type TopicMode = 'predefined' | 'custom';

// Simple Timer Component
const SimpleTimer: React.FC<{ 
  duration: number; 
  onTimeUp: () => void; 
  isActive: boolean;
}> = ({ duration, onTimeUp, isActive }) => {
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center bg-blue-800 text-yellow-300 px-4 py-2 rounded-lg">
      <Clock className="h-5 w-5 mr-2" />
      <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
    </div>
  );
};

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  completedAt: string;
  topic: string;
  isCustom: boolean;
  answers: {
    questionId: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    question: string;
    options: string[];
  }[];
}

export const AiQuizPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('available');
  const [quizState, setQuizState] = useState<QuizState>('topic-selection');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [topicMode, setTopicMode] = useState<TopicMode>('predefined');
  const [currentQuiz, setCurrentQuiz] = useState<QuizGenerationResponse['quiz'] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: number }>({});
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState(15); // Default 15 questions

  // Simple topics for class 5-10 students
  const topics = {
    'Mathematics': ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry'],
    'Science': ['Physics', 'Chemistry', 'Biology']
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadQuizHistory();
    }
  }, [activeTab]);

  const loadQuizHistory = () => {
    const savedHistory = localStorage.getItem('quizHistory');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setQuizHistory(history);
      } catch (err) {
        console.error('Error loading quiz history:', err);
      }
    }
  };

  const saveQuizHistory = (result: QuizResult) => {
    const currentHistory = localStorage.getItem('quizHistory');
    let history = currentHistory ? JSON.parse(currentHistory) : [];
    history.unshift(result);
    history = history.slice(0, 20); // Keep last 20 results
    localStorage.setItem('quizHistory', JSON.stringify(history));
    setQuizHistory(history);
  };

  const handleTopicSelection = (topic: string) => {
    setSelectedTopic(topic);
    setCustomTopic('');
    setTopicMode('predefined');
  };

  const handleCustomTopic = (topic: string) => {
    setCustomTopic(topic);
    setSelectedTopic('');
    setTopicMode('custom');
  };

  const generateQuiz = async () => {
    const finalTopic = topicMode === 'custom' ? customTopic : selectedTopic;
    
    if (!finalTopic.trim()) {
      setError('Please select or enter a topic');
      return;
    }

    if (topicMode === 'custom' && finalTopic.length < 3) {
      setError('Please enter a topic with at least 3 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setQuizState('generating');

      // Optimized prompt for better quiz generation
      const optimizedTopic = topicMode === 'custom' 
        ? `Create a comprehensive quiz about "${finalTopic}" with clear, educational questions suitable for students aged 10-16. Focus on fundamental concepts, key facts, and practical understanding.`
        : `Create a comprehensive quiz about ${finalTopic} with clear, educational questions suitable for students aged 10-16. Focus on fundamental concepts, key facts, and practical understanding.`;

      const request: QuizGenerationRequest = {
        topic: optimizedTopic,
        subject: 'General Knowledge',
      difficulty: 'Medium',
        questionCount: questionCount
      };

      const response = await generateAIQuiz(request);
      setCurrentQuiz(response.quiz);
      setQuizState('quiz-taking');
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setQuizStartTime(Date.now());
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Failed to generate quiz. Please try again.');
      setQuizState('topic-selection');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (currentQuiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishQuiz = () => {
    if (!currentQuiz) return;

    const totalQuestions = currentQuiz.questions.length;
    let correctAnswers = 0;
    const answers = currentQuiz.questions.map(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;
      
      return {
        questionId: question.id,
        selectedAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        question: question.question,
        options: question.options
      };
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);
    const finalTopic = topicMode === 'custom' ? customTopic : selectedTopic;

    const result: QuizResult = {
      score,
      totalQuestions,
      correctAnswers,
      timeTaken,
      completedAt: new Date().toISOString(),
      topic: finalTopic,
      isCustom: topicMode === 'custom',
      answers
    };

    setQuizResults(result);
    saveQuizHistory(result);
    setQuizState('results');
  };

  const handleTimeUp = () => {
    finishQuiz();
  };

  const restartQuiz = () => {
    setQuizState('topic-selection');
    setSelectedTopic('');
    setCustomTopic('');
    setTopicMode('predefined');
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizResults(null);
    setError('');
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 80) return { message: 'Excellent!', color: 'text-green-600' };
    if (score >= 60) return { message: 'Good Job!', color: 'text-blue-600' };
    return { message: 'Keep Practicing!', color: 'text-orange-600' };
  };

  // Topic Selection Screen
  if (quizState === 'topic-selection') {
    return (
      <div className="min-h-screen bg-yellow-100 p-4">
        {/* Header */}
        <div className="bg-blue-800 rounded-t-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-300 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-blue-800" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-yellow-300">AI Quiz</h1>
                <p className="text-yellow-200 text-sm">Learning Platform</p>
              </div>
                </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'available' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-gray-700'
                }`}
              >
                Available
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'history' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-gray-700'
                }`}
              >
                History
              </button>
            </div>
      </div>
    </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          {/* AI Quiz Generator Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-yellow-200 rounded-full flex items-center justify-center">
                <Brain className="h-12 w-12 text-orange-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-blue-800 mb-2">AI Quiz Generator</h2>
            <p className="text-blue-700 text-lg">Choose a topic and let AI create a personalized quiz for you!</p>
          </div>

          {/* Question Count Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-blue-800 mb-3">
              Number of Questions:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 15, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    questionCount === count
                      ? 'bg-blue-800 text-yellow-300'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Topic Mode Selection */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setTopicMode('predefined')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                topicMode === 'predefined'
                  ? 'bg-blue-800 text-yellow-300'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Target className="h-5 w-5 inline mr-2" />
              Predefined Topics
            </button>
            <button
              onClick={() => setTopicMode('custom')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                topicMode === 'custom'
                  ? 'bg-blue-800 text-yellow-300'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Edit3 className="h-5 w-5 inline mr-2" />
              Custom Topic
            </button>
              </div>

          {/* Topic Selection */}
          <div className="space-y-6">
            {topicMode === 'predefined' ? (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="h-6 w-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-blue-800">Select Your Topic</h3>
              </div>

                {Object.entries(topics).map(([subject, subjectTopics]) => (
                  <div key={subject} className="space-y-3">
                    <h4 className="text-lg font-semibold text-blue-800">{subject}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {subjectTopics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => handleTopicSelection(topic)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            selectedTopic === topic
                              ? 'border-blue-800 bg-blue-50 text-blue-800'
                              : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-blue-400'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
              </div>
            </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  <Edit3 className="h-6 w-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-blue-800">Enter Your Custom Topic</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      What would you like to learn about?
                    </label>
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => handleCustomTopic(e.target.value)}
                      placeholder="e.g., Solar System, Ancient Egypt, Programming Basics..."
                      className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-800 focus:outline-none text-blue-800 placeholder-gray-500"
                    />
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-blue-800 mb-2">💡 Tips for better quizzes:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Be specific (e.g., "Photosynthesis" instead of "Science")</li>
                      <li>• Use clear, simple language</li>
                      <li>• Focus on one topic at a time</li>
                    </ul>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="text-red-600 text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={generateQuiz}
              disabled={!selectedTopic && !customTopic.trim() || loading}
              className="w-full bg-blue-800 text-yellow-300 py-4 rounded-lg font-bold text-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Generating Quiz...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Play className="h-5 w-5 mr-2" />
                  Start Quiz ({questionCount} Questions)
            </div>
              )}
            </button>
          </div>
        </div>
    </div>
  );
  }

  // Quiz Taking Screen
  if (quizState === 'quiz-taking' && currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const totalQuestions = currentQuiz.questions.length;

    return (
      <div className="min-h-screen bg-yellow-100 p-4">
        {/* Header with Timer */}
        <div className="bg-blue-800 rounded-t-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-yellow-300" />
              <h1 className="text-xl font-bold text-yellow-300">AI Quiz</h1>
            </div>
            <SimpleTimer 
              duration={questionCount * 60} // 1 minute per question
              onTimeUp={handleTimeUp}
              isActive={true}
            />
          </div>
            </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-800 font-medium">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span className="text-blue-600">{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
            </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-800 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
          <h2 className="text-xl font-bold text-blue-800 mb-6">{currentQuestion.question}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  userAnswers[currentQuestion.id] === index
                    ? 'border-blue-800 bg-blue-50 text-blue-800'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-blue-400'
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
      </div>
    </div>

        {/* Navigation Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNextQuestion}
            className="flex-1 bg-blue-800 text-yellow-300 py-3 rounded-lg font-medium hover:bg-blue-900"
          >
            {currentQuestionIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  // Results Screen
  if (quizState === 'results' && quizResults) {
    const performance = getPerformanceMessage(quizResults.score);

    return (
      <div className="min-h-screen bg-yellow-100 p-4">
        {/* Header */}
        <div className="bg-blue-800 rounded-t-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-yellow-300" />
              <h1 className="text-xl font-bold text-yellow-300">Quiz Results</h1>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-10 w-10 text-yellow-300" />
            </div>
            <h2 className="text-2xl font-bold text-blue-800 mb-2">{performance.message}</h2>
            <div className="text-4xl font-bold text-blue-800 mb-2">{quizResults.score}%</div>
            <p className="text-blue-600">You got {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correct!</p>
            
            {/* Topic Display */}
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
              <p className="text-blue-800 font-medium">
                Topic: {quizResults.topic}
                {quizResults.isCustom && (
                  <span className="ml-2 text-sm bg-orange-500 text-white px-2 py-1 rounded-full">
                    Custom
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-800">{quizResults.correctAnswers}</div>
              <div className="text-blue-600">Correct</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-800">{Math.floor(quizResults.timeTaken / 60)}:{(quizResults.timeTaken % 60).toString().padStart(2, '0')}</div>
              <div className="text-blue-600">Time</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setQuizState('review')}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600"
            >
              <Eye className="h-5 w-5 inline mr-2" />
              Review Answers
            </button>
            <button
              onClick={restartQuiz}
              className="w-full bg-blue-800 text-yellow-300 py-3 rounded-lg font-bold hover:bg-blue-900"
            >
              Take Another Quiz
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="w-full bg-yellow-200 text-blue-800 py-3 rounded-lg font-bold hover:bg-yellow-300"
            >
              View History
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review Answers Screen
  if (quizState === 'review' && quizResults) {
    return (
      <div className="min-h-screen bg-yellow-100 p-4">
        {/* Header */}
        <div className="bg-blue-800 rounded-t-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-6 w-6 text-yellow-300" />
              <h1 className="text-xl font-bold text-yellow-300">Review Answers</h1>
            </div>
            <div className="text-yellow-300 text-sm">
              {quizResults.correctAnswers}/{quizResults.totalQuestions} Correct
            </div>
          </div>
        </div>

        {/* Review Questions */}
        <div className="space-y-4">
          {quizResults.answers.map((answer, index) => (
            <div key={answer.questionId} className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-800">Question {index + 1}</h3>
                <div className="flex items-center space-x-2">
                  {answer.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
              </div>
              
              <p className="text-blue-800 mb-4">{answer.question}</p>
              
              <div className="space-y-2">
                {answer.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`p-3 rounded-lg border-2 ${
                      optionIndex === answer.correctAnswer
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : optionIndex === answer.selectedAnswer && !answer.isCorrect
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                      </span>
                      <div className="flex items-center space-x-2">
                        {optionIndex === answer.correctAnswer && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {optionIndex === answer.selectedAnswer && !answer.isCorrect && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {optionIndex === answer.selectedAnswer && answer.isCorrect && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => setQuizState('results')}
            className="w-full bg-blue-800 text-yellow-300 py-3 rounded-lg font-bold hover:bg-blue-900"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  // History Tab
  if (activeTab === 'history') {
    return (
      <div className="min-h-screen bg-yellow-100 p-4">
        {/* Header */}
        <div className="bg-blue-800 rounded-t-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Star className="h-6 w-6 text-yellow-300" />
              <h1 className="text-xl font-bold text-yellow-300">Quiz History</h1>
            </div>
            <button
              onClick={() => setActiveTab('available')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium"
            >
              Available
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          {quizHistory.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-800 mb-2">No Quiz History</h3>
              <p className="text-blue-600">Complete your first quiz to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizHistory.map((result, index) => (
                <div key={index} className="bg-yellow-100 p-4 rounded-lg border border-blue-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-blue-800">{result.topic}</h3>
                      {result.isCustom && (
                        <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-blue-800">{result.score}%</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>{result.correctAnswers}/{result.totalQuestions} correct</span>
                    <span>{Math.floor(result.timeTaken / 60)}:{(result.timeTaken % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    {new Date(result.completedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading State
  return (
    <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-12 w-12 text-blue-800 animate-spin mx-auto mb-4" />
        <p className="text-blue-800 font-medium">Loading...</p>
      </div>
    </div>
  );
}; 