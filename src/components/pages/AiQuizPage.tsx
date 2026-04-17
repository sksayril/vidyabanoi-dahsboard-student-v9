import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Target,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Star,
  Trophy,
  Edit3,
  Eye,
  FileText,
  FolderOpen,
  FilePlus,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { 
  QuizGenerationRequest, 
  QuizGenerationResponse, 
} from '../../types/api';
import { generateAIQuiz } from '../../api';

type QuizState = 'topic-selection' | 'generating' | 'quiz-taking' | 'results' | 'review';
type ActiveTab = 'available' | 'history';
type TopicMode = 'predefined' | 'custom';
type AnalysisReportTab = 'overview' | 'accuracy' | 'weak-topics';

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

/** Preview tiles + copy change with selected quiz topic */
type PreviewTile = { label: string; box: string };
type TopicPreview = { blurb: string; badge: string; tiles: PreviewTile[] };

const TILE_BOX = [
  'bg-rose-100 border-rose-200/80 text-rose-800',
  'bg-sky-100 border-sky-200/80 text-sky-900',
  'bg-cyan-100 border-cyan-200/80 text-cyan-900',
  'bg-amber-100 border-amber-200/80 text-amber-900',
] as const;

const DEFAULT_TOPIC_PREVIEW: TopicPreview = {
  blurb:
    'Real numbers combine rationals and irrationals — number lines, fractions, roots, and π. Build fluency before your exam.',
  badge: '+5′',
  tiles: [
    { label: '-5', box: TILE_BOX[0] },
    { label: '0', box: TILE_BOX[1] },
    { label: '½', box: TILE_BOX[2] },
    { label: 'π', box: TILE_BOX[3] },
  ],
};

const TOPIC_PREVIEW_MAP: Record<string, TopicPreview> = {
  Algebra: {
    blurb:
      'Practice multiple-choice questions on Algebra. AI builds a balanced set for your level.',
    badge: 'x²',
    tiles: [
      { label: '-5', box: TILE_BOX[0] },
      { label: '0', box: TILE_BOX[1] },
      { label: '½', box: TILE_BOX[2] },
      { label: 'π', box: TILE_BOX[3] },
    ],
  },
  Geometry: {
    blurb:
      'Shapes, angles, area, and volume — sharpen reasoning with diagrams and definitions in every quiz.',
    badge: '∠',
    tiles: [
      { label: '△', box: TILE_BOX[0] },
      { label: '°', box: TILE_BOX[1] },
      { label: 'π', box: TILE_BOX[2] },
      { label: 'r', box: TILE_BOX[3] },
    ],
  },
  Calculus: {
    blurb:
      'Limits, derivatives, and change — bite-sized MCQs that build intuition step by step.',
    badge: '∫',
    tiles: [
      { label: 'lim', box: TILE_BOX[0] },
      { label: 'd', box: TILE_BOX[1] },
      { label: '∫', box: TILE_BOX[2] },
      { label: 'e', box: TILE_BOX[3] },
    ],
  },
  Statistics: {
    blurb:
      'Data, charts, and probability — interpret results and choose the right method under exam-style prompts.',
    badge: 'μ',
    tiles: [
      { label: 'μ', box: TILE_BOX[0] },
      { label: 'σ', box: TILE_BOX[1] },
      { label: '%', box: TILE_BOX[2] },
      { label: 'n', box: TILE_BOX[3] },
    ],
  },
  Trigonometry: {
    blurb:
      'Sine, cosine, and angles — identities and triangles in quick, focused multiple-choice practice.',
    badge: 'θ',
    tiles: [
      { label: 'sin', box: TILE_BOX[0] },
      { label: 'cos', box: TILE_BOX[1] },
      { label: 'θ', box: TILE_BOX[2] },
      { label: 'π', box: TILE_BOX[3] },
    ],
  },
  Physics: {
    blurb:
      'Forces, motion, and energy — conceptual and numerical items aligned with school-level physics.',
    badge: 'F',
    tiles: [
      { label: 'F', box: TILE_BOX[0] },
      { label: 'v', box: TILE_BOX[1] },
      { label: 'a', box: TILE_BOX[2] },
      { label: 'W', box: TILE_BOX[3] },
    ],
  },
  Chemistry: {
    blurb:
      'Atoms, reactions, and equations — balance concepts and symbols with exam-style MCQs.',
    badge: '→',
    tiles: [
      { label: 'H₂O', box: TILE_BOX[0] },
      { label: 'pH', box: TILE_BOX[1] },
      { label: '→', box: TILE_BOX[2] },
      { label: 'Δ', box: TILE_BOX[3] },
    ],
  },
  Biology: {
    blurb:
      'Cells, life processes, and systems — recall and apply ideas through varied question stems.',
    badge: '🧬',
    tiles: [
      { label: 'DNA', box: TILE_BOX[0] },
      { label: 'cell', box: TILE_BOX[1] },
      { label: 'ATP', box: TILE_BOX[2] },
      { label: 'gene', box: TILE_BOX[3] },
    ],
  },
};

function previewForTopicKey(topicKey: string): TopicPreview {
  const t = topicKey.trim();
  if (!t) return DEFAULT_TOPIC_PREVIEW;
  if (TOPIC_PREVIEW_MAP[t]) return TOPIC_PREVIEW_MAP[t];
  const ci = Object.keys(TOPIC_PREVIEW_MAP).find((k) => k.toLowerCase() === t.toLowerCase());
  if (ci) return TOPIC_PREVIEW_MAP[ci];

  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  const sets: [string, string, string, string][] = [
    ['①', '②', '③', '④'],
    ['A', 'B', 'C', 'D'],
    ['•', '→', '★', '?'],
    ['Q1', 'Q2', 'Q3', 'Q4'],
  ];
  const labels = sets[Math.abs(h) % sets.length];
  return {
    blurb: `Practice multiple-choice questions on ${t}. AI builds a balanced set for your level.`,
    badge: t.length <= 4 ? t : `${t.slice(0, 3)}…`,
    tiles: labels.map((label, i) => ({
      label,
      box: TILE_BOX[i % TILE_BOX.length],
    })),
  };
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
  const [analysisTab, setAnalysisTab] = useState<AnalysisReportTab>('overview');
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState(15); // Default 15 questions
  const customTopicInputRef = useRef<HTMLInputElement>(null);

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
        selectedAnswer: userAnswer ?? -1,
        correctAnswer: Number(question.correctAnswer),
        isCorrect,
        question: question.question,
        options: question.options ?? [],
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
    setAnalysisTab('overview');
    setError('');
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 80) return { message: 'Excellent!', color: 'text-green-600' };
    if (score >= 60) return { message: 'Good Job!', color: 'text-blue-600' };
    return { message: 'Keep Practicing!', color: 'text-orange-600' };
  };

  const formatDurationShort = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const parentSubjectForTopic = (topic: string): string => {
    for (const [parent, subs] of Object.entries(topics)) {
      if ((subs as string[]).includes(topic)) return parent;
    }
    return 'General';
  };

  const quarterSegmentsForResult = (result: QuizResult) => {
    const { answers, timeTaken } = result;
    const n = Math.max(1, answers.length);
    const chunk = Math.max(1, Math.ceil(n / 4));
    const segs: { acc: number; label: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const slice = answers.slice(i * chunk, (i + 1) * chunk);
      const correct = slice.filter((a) => a.isCorrect).length;
      const acc = slice.length ? Math.round((correct / slice.length) * 100) : 0;
      const sliceSecs = (timeTaken / n) * slice.length;
      const label =
        sliceSecs >= 60 ? `${Math.round(sliceSecs / 60)}m` : `${sliceSecs.toFixed(1)}s`;
      segs.push({ acc, label });
    }
    return segs;
  };

  // History while on topic screen (must be before topic-selection return)
  if (quizState === 'topic-selection' && activeTab === 'history') {
    return (
      <div className="min-h-screen bg-[#eef2f7] -mx-3 sm:-mx-6 lg:mx-0 px-3 sm:px-4 pb-28 max-w-lg lg:max-w-xl mx-auto pt-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-[#1a3a6e]" />
            <h1 className="text-lg font-bold text-[#1a3a6e]">Quiz History</h1>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className="px-3 py-1.5 rounded-lg bg-[#1a3a6e] text-white text-xs font-semibold"
          >
            Available
          </button>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(26,58,110,0.08)] border border-gray-100/90">
          {quizHistory.length === 0 ? (
            <div className="text-center py-10">
              <Star className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-[#1a3a6e] font-medium">No quiz history yet</p>
              <p className="text-sm text-slate-500 mt-1">Complete a mock test to see scores here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizHistory.map((result, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-slate-50 border border-gray-100"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[#1a3a6e] text-sm truncate">{result.topic}</span>
                    <span className="text-lg font-bold text-[#1a3a6e] shrink-0">{result.score}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      {result.correctAnswers}/{result.totalQuestions} correct
                      {result.isCustom && (
                        <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                          Custom
                        </span>
                      )}
                    </span>
                    <span>
                      {Math.floor(result.timeTaken / 60)}:{(result.timeTaken % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
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

  // Topic Selection Screen — Vidyavani-style mock test layout
  if (quizState === 'topic-selection') {
    const effectiveTopic =
      topicMode === 'custom' && customTopic.trim()
        ? customTopic.trim()
        : selectedTopic || '';
    const topicPreview = previewForTopicKey(effectiveTopic);
    const overviewTitle = effectiveTopic
      ? `Explain ${effectiveTopic}`
      : 'Explain Real Numbers';
    const overviewBlurb = topicPreview.blurb;
    const estMinutes = Math.max(10, Math.round(questionCount * 1.33));
    const canGenerate = Boolean(
      (topicMode === 'custom' && customTopic.trim().length >= 3) ||
        (topicMode === 'predefined' && selectedTopic)
    );

    return (
      <div className="min-h-screen bg-[#eef2f7] -mx-3 sm:-mx-6 lg:mx-0 px-3 sm:px-4 pb-28 max-w-lg lg:max-w-xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 mb-4 pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#1a3a6e] flex items-center justify-center shrink-0">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[#1a3a6e] leading-tight truncate">Mock Test</h1>
              <p className="text-[11px] text-slate-500">AI Quiz</p>
            </div>
          </div>
          <div className="flex rounded-xl bg-white p-0.5 shadow-sm border border-gray-100 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'available' ? 'bg-[#1a3a6e] text-white' : 'text-[#1a3a6e]'
              }`}
            >
              Available
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'history' ? 'bg-[#1a3a6e] text-white' : 'text-[#1a3a6e]'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* 1) Topic overview card */}
        <section
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(26,58,110,0.08)] border border-gray-100/90 mb-4"
        >
          <h2
            className="text-base sm:text-lg font-bold text-[#1a3a6e] leading-snug pr-2"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {overviewTitle}
          </h2>
          <div className="flex gap-3 mt-3">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-md text-white font-bold text-xs sm:text-sm px-1 text-center leading-tight"
              title="Topic hint"
            >
              {topicPreview.badge}
            </div>
            <p
              className="text-[13px] sm:text-sm text-[#1e3a5c]/90 leading-relaxed flex-1"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {overviewBlurb}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-100 text-[12px] sm:text-sm text-[#2563eb] font-medium">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4 shrink-0 opacity-90" />
              {questionCount} Questions
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 shrink-0 opacity-90" />~{estMinutes} minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="w-4 h-4 shrink-0 opacity-90" />
              100%
            </span>
          </div>
        </section>

        {/* 2) Mock test — decorative number tiles */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(26,58,110,0.08)] border border-gray-100/90 mb-4">
          <h3
            className="text-sm font-bold text-[#1a3a6e] mb-3"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Mock Test
          </h3>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {topicPreview.tiles.map((cell) => (
              <div
                key={cell.label}
                className={`aspect-square rounded-xl border-2 flex items-center justify-center text-[11px] sm:text-lg font-bold shadow-sm px-0.5 text-center leading-tight ${cell.box}`}
              >
                {cell.label}
              </div>
            ))}
          </div>
        </section>

        {/* Question count */}
        <div className="mb-4">
          <p
            className="text-xs font-semibold text-[#1a3a6e] mb-2"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Questions in test
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[10, 15, 20].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setQuestionCount(count)}
                className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  questionCount === count
                    ? 'border-[#1a3a6e] bg-[#1a3a6e] text-white'
                    : 'border-gray-200 bg-white text-[#1a3a6e] hover:border-[#1a3a6e]/40'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Topic source toggle + pickers */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setTopicMode('predefined')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
              topicMode === 'predefined'
                ? 'border-[#1a3a6e] bg-[#1a3a6e] text-white'
                : 'border-gray-200 bg-white text-[#1a3a6e]'
            }`}
          >
            <Target className="w-4 h-4 inline mr-1 -mt-0.5" />
            Topics
          </button>
          <button
            type="button"
            onClick={() => {
              setTopicMode('custom');
              setTimeout(() => customTopicInputRef.current?.focus(), 0);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
              topicMode === 'custom'
                ? 'border-[#1a3a6e] bg-[#1a3a6e] text-white'
                : 'border-gray-200 bg-white text-[#1a3a6e]'
            }`}
          >
            <Edit3 className="w-4 h-4 inline mr-1 -mt-0.5" />
            Custom
          </button>
        </div>

        {topicMode === 'predefined' ? (
          <div className="space-y-3 mb-6">
            {Object.entries(topics).map(([subject, subjectTopics]) => (
              <div key={subject}>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">{subject}</p>
                <div className="grid grid-cols-2 gap-2">
                  {subjectTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicSelection(topic)}
                      className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                        selectedTopic === topic
                          ? 'border-[#1a3a6e] bg-blue-50/80 text-[#1a3a6e]'
                          : 'border-gray-100 bg-white text-[#334155] hover:border-[#1a3a6e]/30'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6" id="custom-topic-anchor">
            <label className="block text-xs font-semibold text-[#1a3a6e] mb-2">Your topic</label>
            <input
              ref={customTopicInputRef}
              type="text"
              value={customTopic}
              onChange={(e) => handleCustomTopic(e.target.value)}
              placeholder="e.g. Real Numbers, Photosynthesis…"
              className="w-full p-3.5 rounded-xl border-2 border-gray-200 focus:border-[#1a3a6e] focus:outline-none text-[#1a3a6e] placeholder:text-slate-400 text-sm bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-2">At least 3 characters. Be specific for better questions.</p>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-center bg-red-50 border border-red-100 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {/* 3) Test analytics — dual CTAs */}
        <h3 className="text-sm font-bold text-[#1a3a6e] mb-3">Test Analytics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-amber-300 flex items-center justify-center shadow-sm">
                <FolderOpen className="w-6 h-6 text-white drop-shadow" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#1a3a6e] text-sm">Mock Test</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  AI builds {questionCount} MCQs from your selected topic.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={generateQuiz}
              disabled={!canGenerate || loading}
              className="mt-auto w-full py-2.5 rounded-full bg-sky-100 hover:bg-sky-200 text-[#1a3a6e] text-sm font-bold border border-sky-200/80 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating…
                </span>
              ) : (
                'Generate Test'
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-[#e8f0fe] flex items-center justify-center border border-blue-100">
                <FilePlus className="w-6 h-6 text-[#1a3a6e]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#1a3a6e] text-sm">Create Test</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Write any topic — perfect for revision and weak areas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setTopicMode('custom');
                setSelectedTopic('');
                setTimeout(() => {
                  customTopicInputRef.current?.focus();
                  document.getElementById('custom-topic-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 0);
              }}
              className="mt-auto w-full py-2.5 rounded-full bg-sky-100 hover:bg-sky-200 text-[#1a3a6e] text-sm font-bold border border-sky-200/80 transition-colors"
            >
              Create Test
            </button>
          </div>
        </div>

        {/* Secondary full-width start (same as Generate when topic set) */}
        <button
          type="button"
          onClick={generateQuiz}
          disabled={!canGenerate || loading}
          className="w-full py-3.5 rounded-2xl bg-[#1a3a6e] text-white text-sm font-bold shadow-md hover:bg-[#152a52] disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Generating quiz…
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Start quiz · {questionCount} questions
            </>
          )}
        </button>
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
            {(currentQuestion.options ?? []).map((option, index) => (
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

  // Results Screen — Mock Test Analysis Report
  if (quizState === 'results' && quizResults) {
    const performance = getPerformanceMessage(quizResults.score);
    const segments = quarterSegmentsForResult(quizResults);
    const maxBar = Math.max(10, ...segments.map((s) => s.acc));
    const parentSubject = parentSubjectForTopic(quizResults.topic);
    const sameTopicAttempts = quizHistory.filter((r) => r.topic === quizResults.topic).length;
    const wrongAnswers = quizResults.answers.filter((a) => !a.isCorrect);
    const accuracyPct =
      quizResults.totalQuestions > 0
        ? Math.round((quizResults.correctAnswers / quizResults.totalQuestions) * 100)
        : 0;

    const analysisTabs: { id: AnalysisReportTab; label: string }[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'accuracy', label: 'Accuracy' },
      { id: 'weak-topics', label: 'Weak Topics' },
    ];

    return (
      <div className="min-h-screen bg-[#eef2f7] -mx-3 sm:-mx-6 lg:mx-0 px-3 sm:px-4 pb-28 max-w-lg lg:max-w-xl mx-auto pt-2">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-7 w-7 text-[#2563eb]" />
          <div>
            <h1 className="text-lg font-bold text-[#1e293b] leading-tight">Mock Test Analysis</h1>
            <p className="text-xs text-slate-500">Performance report</p>
          </div>
        </div>

        {/* Segmented tabs */}
        <div className="flex rounded-2xl bg-white p-1 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 mb-4">
          {analysisTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAnalysisTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                analysisTab === t.id
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {analysisTab === 'overview' && (
          <>
            {/* Chapter performance */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1e293b]">
                    Chapter: <span className="text-[#2563eb]">{quizResults.topic}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mock tests attempted:{' '}
                    <span className="font-semibold text-slate-700">{sameTopicAttempts}</span>
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mb-2">Score by quarter of this test (time share per segment)</p>
              <div className="flex items-end justify-between gap-2 h-36 pl-1 pr-1 border-b border-slate-100 pb-2">
                {segments.map((seg, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 gap-1.5">
                    <div className="relative w-full flex flex-col justify-end items-center h-28 rounded-t-lg overflow-hidden bg-slate-100/80">
                      <div
                        className="w-[72%] rounded-t-md bg-gradient-to-t from-[#22c55e] to-emerald-300 transition-all"
                        style={{ height: `${(seg.acc / maxBar) * 100}%`, minHeight: seg.acc > 0 ? '12%' : '4%' }}
                      />
                      <div
                        className="absolute bottom-0 w-[88%] rounded-t bg-[#2563eb]/25"
                        style={{ height: `${Math.min(100, (seg.acc / maxBar) * 100 + 8)}%` }}
                        aria-hidden
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 tabular-nums">{seg.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Weak chapter summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 mb-4">
              <button
                type="button"
                onClick={() => setAnalysisTab('weak-topics')}
                className="w-full flex items-center justify-between gap-2 text-left mb-3 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Target className="h-4 w-4 text-amber-700" />
                  </div>
                  <span className="text-sm font-bold text-[#1e293b]">Weak chapter test</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-[#2563eb] shrink-0" />
              </button>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-100">
                  {parentSubject}
                </span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-800 border border-violet-100">
                  {quizResults.isCustom ? 'Custom topic' : 'Curriculum'}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {quizResults.totalQuestions} Q
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                  <span className="text-xs text-slate-600 flex-1">Score</span>
                  <span className="text-xs font-bold text-[#1e293b] tabular-nums">{quizResults.score}%</span>
                  <span className="text-[11px] text-slate-500 tabular-nums w-[52px] text-right">
                    {formatDurationShort(quizResults.timeTaken)}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-xs text-slate-600 flex-1">Correct</span>
                  <span className="text-xs font-bold text-[#1e293b] tabular-nums">
                    {quizResults.correctAnswers}/{quizResults.totalQuestions}
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums w-[52px] text-right">
                    {accuracyPct}%
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0" />
                  <span className="text-xs text-slate-600 flex-1">To review</span>
                  <span className="text-xs font-bold text-[#1e293b] tabular-nums">{wrongAnswers.length}</span>
                  <span className="text-[11px] text-slate-500 w-[52px] text-right">items</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQuizState('review')}
                className="mt-4 w-full py-3.5 rounded-2xl bg-[#2563eb] text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.99] transition-transform"
              >
                Review answers
              </button>
            </div>
          </>
        )}

        {analysisTab === 'accuracy' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-5 mb-4">
            <h2 className="text-sm font-bold text-[#1e293b] mb-4">Accuracy breakdown</h2>
            <div className="flex flex-col items-center mb-6">
              <div
                className="relative w-36 h-36 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(#2563eb ${(accuracyPct / 100) * 360}deg, #e2e8f0 0deg)`,
                }}
              >
                <div className="absolute inset-[10px] rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-black text-[#2563eb]">{accuracyPct}%</span>
                  <span className="text-[10px] text-slate-500 font-medium">accuracy</span>
                </div>
              </div>
              <p className={`text-sm font-semibold mt-4 ${performance.color}`}>{performance.message}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Correct</span>
                <span className="font-bold text-emerald-600">{quizResults.correctAnswers}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${(quizResults.correctAnswers / Math.max(1, quizResults.totalQuestions)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Incorrect</span>
                <span className="font-bold text-rose-600">
                  {quizResults.totalQuestions - quizResults.correctAnswers}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-400"
                  style={{
                    width: `${((quizResults.totalQuestions - quizResults.correctAnswers) / Math.max(1, quizResults.totalQuestions)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Time: {formatDurationShort(quizResults.timeTaken)} · Avg per question:{' '}
              {quizResults.totalQuestions > 0
                ? `${(quizResults.timeTaken / quizResults.totalQuestions).toFixed(1)}s`
                : '—'}
            </p>
          </div>
        )}

        {analysisTab === 'weak-topics' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 mb-4">
            <h2 className="text-sm font-bold text-[#1e293b] mb-1">Questions to strengthen</h2>
            <p className="text-xs text-slate-500 mb-4">
              Review these items — they were marked incorrect on this mock test.
            </p>
            {wrongAnswers.length === 0 ? (
              <div className="text-center py-8 px-2">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1e293b]">No weak spots this time</p>
                <p className="text-xs text-slate-500 mt-1">Great work — try another mock to stay sharp.</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {wrongAnswers.map((a, idx) => (
                  <li
                    key={a.questionId}
                    className="p-3 rounded-xl bg-rose-50/80 border border-rose-100 text-xs text-slate-700 leading-snug"
                  >
                    <span className="font-semibold text-rose-800 mr-1">#{idx + 1}</span>
                    {a.question.length > 140 ? `${a.question.slice(0, 140)}…` : a.question}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Summary strip + secondary actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="text-center mb-3">
            <p className="text-xs text-slate-500">Overall</p>
            <p className="text-2xl font-black text-[#2563eb]">{quizResults.score}%</p>
            <p className="text-[11px] text-slate-600">
              {quizResults.correctAnswers}/{quizResults.totalQuestions} correct · {quizResults.topic}
            </p>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={restartQuiz}
              className="w-full py-3 rounded-xl bg-[#1e3a8a] text-amber-200 text-sm font-bold hover:bg-[#172554]"
            >
              Take another mock test
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setQuizState('topic-selection');
              }}
              className="w-full py-3 rounded-xl bg-slate-100 text-[#1e293b] text-sm font-semibold hover:bg-slate-200"
            >
              View history
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

  // History Tab (topic-selection + history is handled above)
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