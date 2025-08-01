import React, { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Play, 
  Clock, 
  Award, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  RefreshCw, 
  BookOpen,
  Target,
  Zap,
  Star,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Home,
  Plus,
  Search,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { 
  QuizGenerationRequest, 
  QuizGenerationResponse, 
  QuizQuestion, 
  QuizSubmissionRequest, 
  QuizSubmissionResponse,
  UserQuizHistory 
} from '../../types/api';
import { generateAIQuiz, submitQuiz, getUserQuizHistory } from '../../api';

type QuizState = 'topic-selection' | 'generating' | 'quiz-taking' | 'results';
type ActiveTab = 'available' | 'completed' | 'history';

// Timer component for quiz
const QuizTimer: React.FC<{ 
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

export const AiQuizPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('available');
  const [quizState, setQuizState] = useState<QuizState>('topic-selection');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [currentQuiz, setCurrentQuiz] = useState<QuizGenerationResponse['quiz'] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: number }>({});
  const [quizResults, setQuizResults] = useState<QuizSubmissionResponse | null>(null);
  const [quizHistory, setQuizHistory] = useState<UserQuizHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  // Predefined topics based on common subjects
  const predefinedTopics = [
    { name: 'Mathematics', topics: ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry'] },
    { name: 'Science', topics: ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth Science'] },
    { name: 'History', topics: ['Ancient History', 'World War II', 'American History', 'Ancient Egypt', 'Renaissance'] },
    { name: 'Geography', topics: ['World Geography', 'Countries and Capitals', 'Climate Zones', 'Oceans and Seas', 'Mountain Ranges'] },
    { name: 'Literature', topics: ['Shakespeare', 'Poetry', 'Novels', 'Short Stories', 'Drama'] },
    { name: 'Computer Science', topics: ['Programming', 'Web Development', 'Data Structures', 'Algorithms', 'Database'] },
  ];

  useEffect(() => {
    if (activeTab === 'history') {
      loadQuizHistory();
    }
  }, [activeTab]);

  const loadQuizHistory = async () => {
    try {
      setLoading(true);
      const history = await getUserQuizHistory();
      setQuizHistory(history);
    } catch (err) {
      console.error('Error loading quiz history:', err);
      setError('Failed to load quiz history');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelection = (topic: string) => {
    setSelectedTopic(topic);
    setCustomTopic('');
  };

  const handleCustomTopic = (topic: string) => {
    setCustomTopic(topic);
    setSelectedTopic('');
  };

  const generateQuiz = async () => {
    const finalTopic = selectedTopic || customTopic;
    if (!finalTopic.trim()) {
      setError('Please select or enter a topic');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setQuizState('generating');

      const request: QuizGenerationRequest = {
        topic: finalTopic,
        subject: 'General Knowledge',
        difficulty,
        questionCount: 10
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

  const handleTimeUp = useCallback(() => {
    setShowTimeUpModal(true);
  }, []);

  const submitQuizAnswers = async (timeTaken?: number) => {
    if (!currentQuiz) return;

    try {
      setLoading(true);
      
      const answers = Object.entries(userAnswers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer
      }));

      const actualTimeTaken = timeTaken || Math.floor((Date.now() - quizStartTime) / 1000);

      const request: QuizSubmissionRequest = {
        quizId: currentQuiz.id,
        answers,
        timeTaken: actualTimeTaken
      };

      const response = await submitQuiz(request);
      setQuizResults(response);
      setQuizState('results');
      setShowTimeUpModal(false);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz results');
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuizState('topic-selection');
    setCurrentQuiz(null);
    setUserAnswers({});
    setQuizResults(null);
    setCurrentQuestionIndex(0);
    setSelectedTopic('');
    setCustomTopic('');
    setError('');
    setQuizStartTime(0);
    setShowTimeUpModal(false);
  };

  const nextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const renderTopicSelection = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Brain className="h-12 w-12 text-orange-600 mr-3" />
          <h1 className="text-3xl font-bold text-white">AI Quiz Generator</h1>
        </div>
        <p className="text-white text-lg">Choose a topic and let AI create a personalized quiz for you!</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          <Target className="h-6 w-6 mr-2 text-orange-600" />
          Select Your Topic
        </h2>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Popular Topics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedTopics.map((category) => (
              <div key={category.name} className="space-y-3">
                <h4 className="font-medium text-gray-700">{category.name}</h4>
                <div className="space-y-2">
                  {category.topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleTopicSelection(topic)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                        selectedTopic === topic
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-300 text-gray-700'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-green-600" />
            Or Enter Your Own Topic
          </h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => handleCustomTopic(e.target.value)}
              placeholder="Enter any topic you want to learn about..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
            />
            {customTopic && (
              <button
                onClick={() => handleTopicSelection(customTopic)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Use This Topic
              </button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-600" />
            Choose Difficulty
          </h3>
          <div className="flex gap-4">
            {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all duration-200 ${
                  difficulty === level
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-orange-300 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center">
                  {level === 'Easy' && <Star className="h-4 w-4 mr-2" />}
                  {level === 'Medium' && <Target className="h-4 w-4 mr-2" />}
                  {level === 'Hard' && <Trophy className="h-4 w-4 mr-2" />}
                  {level}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={generateQuiz}
            disabled={loading || (!selectedTopic && !customTopic.trim())}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate AI Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuizTaking = () => {
    if (!currentQuiz) return null;

    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const totalQuestions = currentQuiz.questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const answeredQuestions = Object.keys(userAnswers).length;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h2>
              <p className="text-gray-600">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
            </div>
            <div className="flex items-center space-x-4">
              <QuizTimer 
                duration={30 * 60} // 30 minutes
                onTimeUp={handleTimeUp}
                isActive={quizState === 'quiz-taking'}
              />
              <div className="flex items-center text-gray-600">
                <Target className="h-5 w-5 mr-2" />
                <span>{currentQuiz.difficulty}</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Progress: {currentQuestionIndex + 1}/{totalQuestions}</span>
            <span>Answered: {answeredQuestions}/{totalQuestions}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.question}
            </h3>

            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    userAnswers[currentQuestion.id] === index
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                      userAnswers[currentQuestion.id] === index
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-300'
                    }`}>
                      {userAnswers[currentQuestion.id] === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </button>

            <div className="flex items-center space-x-4">
              {currentQuestionIndex === totalQuestions - 1 ? (
                <button
                  onClick={() => submitQuizAnswers()}
                  disabled={Object.keys(userAnswers).length < totalQuestions}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Time Up Modal */}
        {showTimeUpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md mx-4">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Time's Up!</h3>
                <p className="text-gray-600 mb-6">Your quiz time has expired. Your answers will be submitted automatically.</p>
                <button
                  onClick={() => submitQuizAnswers(30 * 60)} // 30 minutes
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Submit Answers
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!quizResults || !currentQuiz) return null;

    const { result, performance, feedback } = quizResults;
    const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <div className="mb-6">
            {performance === 'Excellent' ? (
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            ) : performance === 'Good' ? (
              <Award className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <Target className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
          <p className="text-gray-600 text-lg">{feedback}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">{percentage}%</div>
              <div className="text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{result.correctAnswers}/{result.totalQuestions}</div>
              <div className="text-gray-600">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{Math.round(result.timeTaken / 60)}m</div>
              <div className="text-gray-600">Time Taken</div>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
              performance === 'Excellent' ? 'bg-yellow-100 text-yellow-800' :
              performance === 'Good' ? 'bg-green-100 text-green-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {performance === 'Excellent' && <Trophy className="h-5 w-5 mr-2" />}
              {performance === 'Good' && <Award className="h-5 w-5 mr-2" />}
              {performance === 'Needs Improvement' && <Target className="h-5 w-5 mr-2" />}
              {performance}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Question Review</h3>
            {currentQuiz.questions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                    <div className="flex items-center">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{question.question}</p>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-2 rounded ${
                          optionIndex === question.correctAnswer
                            ? 'bg-green-100 text-green-800'
                            : optionIndex === userAnswer && !isCorrect
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-50'
                        }`}
                      >
                        {option}
                        {optionIndex === question.correctAnswer && (
                          <CheckCircle className="h-4 w-4 inline ml-2" />
                        )}
                        {optionIndex === userAnswer && !isCorrect && (
                          <XCircle className="h-4 w-4 inline ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={resetQuiz}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <Home className="h-5 w-5 mr-2" />
            Take Another Quiz
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
          >
            <Trophy className="h-5 w-5 mr-2" />
            View History
          </button>
        </div>
      </div>
    );
  };

  const renderGenerating = () => (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="mb-8">
        <div className="relative">
          <Brain className="h-20 w-20 text-orange-600 mx-auto mb-4 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
          </div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">Generating Your Quiz</h2>
      <p className="text-white text-lg mb-8">Our AI is creating personalized questions just for you...</p>
      
      <div className="flex items-center justify-center space-x-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );

  const renderHistory = () => {
    if (!quizHistory) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Quiz History</h2>
          <button
            onClick={() => setActiveTab('available')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Take New Quiz
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{quizHistory.totalQuizzes}</p>
                <p className="text-sm text-gray-600">Total Quizzes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{quizHistory.completedQuizzes.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{Math.round(quizHistory.averageScore)}%</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{Math.round(quizHistory.totalStudyTime / 60)}h</p>
                <p className="text-sm text-gray-600">Study Time</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Quizzes</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {quizHistory.completedQuizzes.map((quiz, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Quiz #{index + 1}</h4>
                    <p className="text-sm text-gray-600">Completed on {new Date(quiz.completedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{quiz.score}%</div>
                    <div className="text-sm text-gray-600">{quiz.correctAnswers}/{quiz.totalQuestions} correct</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {quizState === 'topic-selection' && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">AI Quiz</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'available'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              History
            </button>
          </div>
        </div>
      )}

      {quizState === 'topic-selection' && activeTab === 'available' && renderTopicSelection()}
      {quizState === 'topic-selection' && activeTab === 'history' && renderHistory()}
      {quizState === 'generating' && renderGenerating()}
      {quizState === 'quiz-taking' && renderQuizTaking()}
      {quizState === 'results' && renderResults()}
    </div>
  );
}; 