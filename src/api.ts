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
  UserQuizHistory,
  UserProfileResponse
} from './types/api';

const API_BASE_URL = 'https://api.vidyavani.com/api';
// const API_BASE_URL = 'http://localhost:3330/api';

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

// AI Service for external API
export class AIService {
  private static AI_API_URL = 'https://api.a0.dev/ai/llm';

  static async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    const prompt = `Generate a comprehensive ${request.difficulty.toLowerCase()} quiz with ${request.questionCount} questions about "${request.topic}" in ${request.subject}. 
    
    Question Distribution:
    - ${Math.floor(request.questionCount * 0.5)} Multiple Choice Questions (50%)
    - ${Math.floor(request.questionCount * 0.25)} Short Answer Questions (25%) 
    - ${Math.floor(request.questionCount * 0.25)} Long Answer Questions (25%)
    
    Format the response as a JSON object with the following structure:
    {
      "quiz": {
        "id": "quiz-${Date.now()}",
        "title": "Comprehensive Quiz: ${request.topic}",
        "topic": "${request.topic}",
        "subject": "${request.subject}",
        "difficulty": "${request.difficulty}",
        "questions": [
          {
            "id": "q1",
            "type": "multiple_choice",
            "question": "What is the main concept of ${request.topic}?",
            "options": ["Option A - detailed option", "Option B - detailed option", "Option C - detailed option", "Option D - detailed option"],
            "correctAnswer": 0,
            "explanation": "Detailed explanation for why this answer is correct, including additional context and learning points."
          },
          {
            "id": "q2",
            "type": "short_answer",
            "question": "Define the key term related to ${request.topic}.",
            "correctAnswer": "Expected concise answer with key points",
            "explanation": "Explanation of the answer and why it's important to understand this concept."
          },
          {
            "id": "q3",
            "type": "long_answer",
            "question": "Explain in detail how ${request.topic} works and provide examples.",
            "correctAnswer": "Comprehensive answer covering all aspects with examples and applications",
            "explanation": "Detailed explanation covering all the important points that should be included in a complete answer."
          }
        ],
        "totalQuestions": ${request.questionCount},
        "estimatedDuration": "${Math.ceil(request.questionCount * 2)} min"
      }
    }
    
    Requirements:
    1. Create questions that test different levels of understanding (knowledge, comprehension, application, analysis, synthesis, evaluation)
    2. Include questions about definitions, concepts, examples, applications, processes, comparisons, and real-world connections
    3. Make questions progressive in difficulty within the ${request.difficulty} level
    4. Ensure all questions are educational, age-appropriate, and relevant to ${request.topic}
    5. Provide detailed explanations that help students learn, not just verify answers
    6. Include practical examples and real-world applications where relevant
    7. Make multiple choice options plausible but clearly distinguishable
    8. For short answers, expect concise but complete responses
    9. For long answers, expect comprehensive responses with examples and explanations
    10. Cover all important aspects of ${request.topic} comprehensively
    11. Include questions about cause-and-effect relationships
    12. Add questions about historical context and significance
    13. Include questions about current relevance and modern applications
    14. Ensure questions cover both theoretical and practical aspects
    
    Focus on creating questions that promote deep understanding and critical thinking about ${request.topic}. Generate comprehensive coverage of all important subtopics.`;

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
      // Remove markdown code blocks and extract JSON content using regex
      const jsonMatch = data.completion.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonString = jsonMatch ? jsonMatch[1] : data.completion;
      
      // If no markdown blocks found, try to extract JSON directly
      if (!jsonMatch) {
        // Look for JSON object starting with { and ending with }
        const directJsonMatch = data.completion.match(/\{[\s\S]*\}/);
        jsonString = directJsonMatch ? directJsonMatch[0] : data.completion;
      }
      
      const quizData = JSON.parse(jsonString);
      return quizData;
    } catch (error) {
      console.error('Original AI response:', data.completion);
      throw new Error('Failed to parse AI quiz response');
    }
  }

  static async generateNotes(content: string, topic: string, subject: string): Promise<{ notes: string; summary: string; keyPoints: string[]; definitions: { term: string; definition: string }[]; qaNotes: { question: string; answer: string; category: string }[] }> {
    const prompt = `Generate comprehensive study notes, summary, key points, definitions, and question-answer pairs for the following content about "${topic}" in ${subject}:

    Content: ${content}

    Format the response as a JSON object with the following structure:
    {
      "notes": "Comprehensive study notes covering all important points, concepts, definitions, and examples from the content. Organize it in a clear, structured format with headings, bullet points, and sub-sections. Make it detailed and educational.",
      "summary": "A concise summary of the key points and main concepts covered in the content. Should be 2-3 sentences maximum.",
      "keyPoints": [
        "Key point 1 - important concept or fact",
        "Key point 2 - another important concept",
        "Key point 3 - additional important information"
      ],
      "definitions": [
        {
          "term": "Important term 1",
          "definition": "Clear and comprehensive definition of the term"
        },
        {
          "term": "Important term 2", 
          "definition": "Clear and comprehensive definition of the term"
        }
      ],
      "qaNotes": [
        {
          "question": "What is the main concept discussed in this topic?",
          "answer": "Detailed answer explaining the main concept with examples",
          "category": "Basic Concepts"
        },
        {
          "question": "How does this concept apply in real life?",
          "answer": "Practical examples and applications",
          "category": "Applications"
        },
        {
          "question": "What are the key characteristics of this topic?",
          "answer": "List and explain the key characteristics",
          "category": "Characteristics"
        }
      ]
    }

    Requirements:
    1. Generate 8-12 key points that are most important for understanding the topic
    2. Create 5-8 important definitions with clear explanations
    3. Generate 8-12 question-answer pairs covering different aspects (basic concepts, applications, characteristics, examples, processes, comparisons, importance, etc.)
    4. Make all content educational, age-appropriate, and suitable for students
    5. Ensure the notes are well-structured with proper headings and formatting
    6. Include practical examples and real-world applications where relevant
    7. Make the content engaging and easy to understand
    8. Cover all important subtopics and concepts comprehensively
    9. Include both theoretical and practical aspects
    10. Provide detailed explanations that help students understand deeply

    Focus on making the study material comprehensive, well-organized, and helpful for learning and revision. Generate more content to ensure thorough coverage of the topic.`;

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
    
    // Parse the AI response and extract the notes data
    try {
      // Remove markdown code blocks and extract JSON content using regex
      const jsonMatch = data.completion.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonString = jsonMatch ? jsonMatch[1] : data.completion;
      
      // If no markdown blocks found, try to extract JSON directly
      if (!jsonMatch) {
        // Look for JSON object starting with { and ending with }
        const directJsonMatch = data.completion.match(/\{[\s\S]*\}/);
        jsonString = directJsonMatch ? directJsonMatch[0] : data.completion;
      }
      
      const notesData = JSON.parse(jsonString);
      return notesData;
    } catch (error) {
      console.error('Original AI response:', data.completion);
      throw new Error('Failed to parse AI notes response');
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

    // Handle both 200 and 201 as success status codes
    if (!response.ok && response.status !== 201) {
      // Try to parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Create error with response data for token handling
      const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
      (error as any).response = { data: errorData, status: response.status };
      throw error;
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

  // Get hero banners
  static async getHeroBanners(): Promise<any> {
    return this.makeRequest<any>('/get/hero-banners');
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
      // Try to parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Create error with response data for token handling
      const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
      (error as any).response = { data: errorData, status: response.status };
      throw error;
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
      // Try to parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Create error with response data for token handling
      const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
      (error as any).response = { data: errorData, status: response.status };
      throw error;
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
      // Try to parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Create error with response data for token handling
      const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
      (error as any).response = { data: errorData, status: response.status };
      throw error;
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

  static async getUserProfile(): Promise<UserProfileResponse> {
    return this.makeRequest<UserProfileResponse>('/users/profile');
  }
}

// Export individual functions for easier use
export const getParentCategories = () => ApiService.getParentCategories();
export const getSubcategories = (parentCategoryId: string) => ApiService.getSubcategories(parentCategoryId);
export const getHeroBanners = () => ApiService.getHeroBanners();
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
export const generateAIQuiz = (request: QuizGenerationRequest) => AIService.generateQuiz(request);
export const generateAINotes = (content: string, topic: string, subject: string) => AIService.generateNotes(content, topic, subject);
export const getUserProfile = () => ApiService.getUserProfile(); 