export interface Category {
  _id: string;
  name: string;
  path: string[];
}

export interface CategoriesResponse {
  parents: Category[];
}

export interface Content {
  imageUrls: string[];
  text?: string;
  pdfUrl?: string;
  videoUrl?: string;
}

export interface Subcategory {
  content: Content;
  _id: string;
  name: string;
  type: string;
  parentId: string;
  path: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SubcategoriesResponse {
  subcategories: Subcategory[];
}

export interface Subscription {
  isActive: boolean;
  plan: string;
  startDate?: string;
  endDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription?: Subscription;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  subscription: {
    isActive: boolean;
    plan: string;
    endDate: string;
  };
}

export interface UserProfileResponse {
  user: UserProfile;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  parentCategoryId: string;
  subCategoryId: string;
}

export interface RegisterResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    parentCategory: {
      id: string;
      name: string;
      type: string;
    };
    subCategory: {
      id: string;
      name: string;
      type: string;
    };
    subscription: {
      isActive: boolean;
      plan: string;
    };
  };
}

// Chat-related interfaces
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  contentType: 'text' | 'image';
  _id: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface StartChatResponse {
  message: string;
  chat: Chat;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: {
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
  };
  messageCount: number;
}

export interface ChatHistoryResponse {
  chats: ChatHistoryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalChats: number;
    hasMore: boolean;
  };
}

export interface SendMessageRequest {
  message: string;
  chatId?: string;
  image?: File;
  pdf?: File;
}

export interface ContinueChatResponse {
  message: string;
  response: string;
  chatId: string;
}

export interface GetChatResponse {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// AI Quiz interfaces
export interface QuizGenerationRequest {
  topic: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'short_answer' | 'long_answer';
  question: string;
  options?: string[]; // Only for multiple choice questions
  correctAnswer: number | string; // Index for multiple choice, string for others
  explanation?: string;
}

export interface QuizGenerationResponse {
  quiz: {
    id: string;
    title: string;
    topic: string;
    subject: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questions: QuizQuestion[];
    totalQuestions: number;
    estimatedDuration: string;
  };
}

export interface QuizSubmissionRequest {
  quizId: string;
  answers: { questionId: string; selectedAnswer: number }[];
  timeTaken: number; // in seconds
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  completedAt: string;
  answers: {
    questionId: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
}

export interface QuizSubmissionResponse {
  result: QuizResult;
  performance: 'Excellent' | 'Good' | 'Needs Improvement';
  feedback: string;
}

export interface UserQuizHistory {
  completedQuizzes: QuizResult[];
  totalQuizzes: number;
  averageScore: number;
  totalStudyTime: number; // in minutes
}

// Enhanced Notes Response Interface
export interface EnhancedNotesResponse {
  notes: string | object; // Allow both string and object to handle API inconsistencies
  summary: string;
  keyPoints: string[];
  definitions: {
    term: string;
    definition: string;
  }[];
  qaNotes: {
    question: string;
    answer: string;
    category: string;
  }[];
}