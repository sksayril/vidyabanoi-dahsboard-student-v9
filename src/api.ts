import { 
  CategoriesResponse, 
  SubcategoriesResponse, 
  RegisterRequest, 
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  StartChatResponse,
  ChatHistoryResponse,
  SendMessageRequest,
  ContinueChatResponse,
  GetChatResponse,
  QuizGenerationRequest,
  QuizGenerationResponse,
  QuizSubmissionRequest,
  QuizSubmissionResponse,
  UserQuizHistory
} from './types/api';

const API_BASE_URL = 'https://api.vidyavani.com/api';

// Subscription interfaces
export interface CreateOrderRequest {
  plan: string;
  amount: number;
  currency: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  key_id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  subscription: {
    isActive: boolean;
    plan: string;
    startDate: string;
    endDate: string;
  };
}

// AI Quiz Service for external API
export class AIQuizService {
  private static AI_API_URL = 'https://api.a0.dev/ai/llm';

  static async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    const prompt = `Generate a ${request.difficulty.toLowerCase()} quiz with ${request.questionCount} multiple choice questions about ${request.topic} in ${request.subject}. 
    Format the response as a JSON object with the following structure:
    {
      "quiz": {
        "id": "unique-id",
        "title": "Quiz Title",
        "topic": "${request.topic}",
        "subject": "${request.subject}",
        "difficulty": "${request.difficulty}",
        "questions": [
          {
            "id": "q1",
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Explanation for the correct answer"
          }
        ],
        "totalQuestions": ${request.questionCount},
        "estimatedDuration": "${Math.ceil(request.questionCount * 1.5)} min"
      }
    }
    
    Make sure the questions are educational, age-appropriate, and cover different aspects of ${request.topic}. 
    The correctAnswer should be the index (0-3) of the correct option.`;

    const response = await fetch(this.AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse the AI response and extract the quiz data
    try {
      const quizData = JSON.parse(data.completion);
      return quizData;
    } catch (error) {
      throw new Error('Failed to parse AI quiz response');
    }
  }
}

export class ApiService {
  private static async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get parent categories
  static async getParentCategories(): Promise<CategoriesResponse[]> {
    return this.makeRequest<CategoriesResponse[]>('/categories/parents');
  }

  // Get subcategories for a specific parent category
  static async getSubcategories(parentCategoryId: string): Promise<SubcategoriesResponse[]> {
    return this.makeRequest<SubcategoriesResponse[]>(`/categories/subcategories/${parentCategoryId}`);
  }

  // Register a new user
  static async registerUser(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.makeRequest<RegisterResponse>('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Login user
  static async loginUser(loginData: LoginRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  // Create subscription order
  static async createSubscriptionOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.makeRequest<CreateOrderResponse>('/users/subscription/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Verify payment
  static async verifyPayment(paymentData: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    return this.makeRequest<VerifyPaymentResponse>('/users/subscription/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Chat-related methods
  static async startChat(message: string, image?: File, pdf?: File): Promise<StartChatResponse> {
    const url = `${API_BASE_URL}/chat/start`;
    const token = localStorage.getItem('authToken');
    
    const formData = new FormData();
    formData.append('message', message);
    
    if (image) {
      formData.append('image', image);
    }
    
    if (pdf) {
      formData.append('pdf', pdf);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async getChatHistory(page: number = 1): Promise<ChatHistoryResponse> {
    return this.makeRequest<ChatHistoryResponse>(`/chat/history?page=${page}`);
  }

  static async sendMessage(request: SendMessageRequest): Promise<StartChatResponse> {
    const url = `${API_BASE_URL}/chat/start`;
    const token = localStorage.getItem('authToken');
    
    const formData = new FormData();
    formData.append('message', request.message);
    
    if (request.chatId) {
      formData.append('chatId', request.chatId);
    }
    
    if (request.image) {
      formData.append('image', request.image);
    }
    
    if (request.pdf) {
      formData.append('pdf', request.pdf);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async continueChat(chatId: string, message: string, image?: File, pdf?: File): Promise<ContinueChatResponse> {
    const url = `${API_BASE_URL}/chat/${chatId}/message`;
    const token = localStorage.getItem('authToken');
    
    const formData = new FormData();
    formData.append('message', message);
    
    if (image) {
      formData.append('image', image);
    }
    
    if (pdf) {
      formData.append('pdf', pdf);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async getChat(chatId: string): Promise<GetChatResponse> {
    return this.makeRequest<GetChatResponse>(`/chat/${chatId}`);
  }

  // AI Quiz methods
  static async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    return this.makeRequest<QuizGenerationResponse>('/quiz/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  static async submitQuiz(request: QuizSubmissionRequest): Promise<QuizSubmissionResponse> {
    return this.makeRequest<QuizSubmissionResponse>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  static async getUserQuizHistory(): Promise<UserQuizHistory> {
    return this.makeRequest<UserQuizHistory>('/quiz/history');
  }
}

// Export individual functions for easier use
export const getParentCategories = () => ApiService.getParentCategories();
export const getSubcategories = (parentCategoryId: string) => ApiService.getSubcategories(parentCategoryId);
export const registerUser = (userData: RegisterRequest) => ApiService.registerUser(userData);
export const loginUser = (loginData: LoginRequest) => ApiService.loginUser(loginData);
export const createSubscriptionOrder = (orderData: CreateOrderRequest) => ApiService.createSubscriptionOrder(orderData);
export const verifyPayment = (paymentData: VerifyPaymentRequest) => ApiService.verifyPayment(paymentData);

// Chat-related exports
export const startChat = (message: string, image?: File, pdf?: File) => ApiService.startChat(message, image, pdf);
export const getChatHistory = (page: number = 1) => ApiService.getChatHistory(page);
export const sendMessage = (request: SendMessageRequest) => ApiService.sendMessage(request);
export const continueChat = (chatId: string, message: string, image?: File, pdf?: File) => ApiService.continueChat(chatId, message, image, pdf);
export const getChat = (chatId: string) => ApiService.getChat(chatId); 

// AI Quiz exports
export const generateQuiz = (request: QuizGenerationRequest) => ApiService.generateQuiz(request);
export const submitQuiz = (request: QuizSubmissionRequest) => ApiService.submitQuiz(request);
export const getUserQuizHistory = () => ApiService.getUserQuizHistory();
export const generateAIQuiz = (request: QuizGenerationRequest) => AIQuizService.generateQuiz(request); 