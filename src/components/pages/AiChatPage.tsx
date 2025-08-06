import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  Image, 
  FileText, 
  History,
  Plus,
  X,
  Menu,
  ArrowLeft,
  Search,
  MoreVertical,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { startChat, getChatHistory, continueChat, getChat } from '../../api';
import { ChatMessage, ChatHistoryItem } from '../../types/api';
import { AnimatedCat } from '../AnimatedCat';

// Markdown rendering function
const renderMarkdown = (text: string) => {
  // Convert markdown to HTML-like elements
  return text
    // Bold text: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic text: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code: `code`
    .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    // Lists: - item or * item
    .replace(/^[-*]\s+(.+)$/gm, '<li class="ml-4">$1</li>')
    // Numbered lists: 1. item
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>')
    // Headers: # Header
    .replace(/^#\s+(.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 mb-2">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h4 class="text-base font-semibold text-gray-800 mb-1">$1</h4>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Wrap lists in ul tags
    .replace(/(<li.*?<\/li>)/gs, '<ul class="list-disc space-y-1 mb-2">$1</ul>');
};

// Component to render formatted text
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const formattedText = renderMarkdown(text);
  
  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
};

export const AiChatPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentChat, setCurrentChat] = useState<{ id: string; messages: ChatMessage[] } | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Token expiration states
  const [showTokenError, setShowTokenError] = useState(false);
  const [tokenErrorMessage, setTokenErrorMessage] = useState('');
  
  // Subscription states
  const [showSubscriptionRequired, setShowSubscriptionRequired] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  
  // Voice-related states
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    'Explain quantum physics',
    'Help with calculus',
    'Chemistry formulas',
    'Math problem solving',
  ];

  // Handle token expiration
  const handleTokenExpiration = (errorMessage: string = 'Token has been invalidated. Please login again.') => {
    setTokenErrorMessage(errorMessage);
    setShowTokenError(true);
    
    // Clear session data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Stop any ongoing voice features
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    if (speechRecognition && isRecording) {
      speechRecognition.stop();
    }
    
    // Redirect to signin after 3 seconds
    setTimeout(() => {
      window.location.href = '/signin';
    }, 3000);
  };

  // Check API response for token errors
  const checkTokenError = (response: any) => {
    if (response && response.message && 
        (response.message.includes('Token has been invalidated') || 
         response.message.includes('Please login again') ||
         response.message.includes('Unauthorized') ||
         response.message.includes('Invalid token'))) {
      handleTokenExpiration(response.message);
      return true;
    }
    return false;
  };

  // Check API response for subscription errors
  const checkSubscriptionError = (response: any) => {
    if (response && 
        response.subscriptionStatus === 'inactive' && 
        response.message === 'Subscription required') {
      setSubscriptionMessage(response.message);
      setShowSubscriptionRequired(true);
      return true;
    }
    return false;
  };

  // Handle subscription navigation
  const handleSubscribeClick = () => {
    // Navigate to subscription section
    window.location.href = '/dashboard?tab=subscription';
  };

  useEffect(() => {
    loadChatHistory();
    initializeVoiceFeatures();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const initializeVoiceFeatures = () => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsRecording(false);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      setSpeechRecognition(recognition);
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await getChatHistory();
      
      // Check for subscription error first
      if (checkSubscriptionError(response)) {
        return;
      }
      
      // Check for token error in response
      if (checkTokenError(response)) {
        return;
      }
      
      setChatHistory(response.chats);
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      
      // Check if error response contains subscription error first
      if (error.response?.data && checkSubscriptionError(error.response.data)) {
        return;
      }
      
      // Check if error response contains token expiration message
      if (error.response?.data && checkTokenError(error.response.data)) {
        return;
      }
      
      // Handle other errors
      setTokenErrorMessage('Failed to load chat history. Please try again.');
      setShowTokenError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSpecificChat = async (chatId: string) => {
    try {
      setIsLoadingChat(true);
      const chatResponse = await getChat(chatId);
      
      // Check for subscription error first
      if (checkSubscriptionError(chatResponse)) {
        return;
      }
      
      // Check for token error in response
      if (checkTokenError(chatResponse)) {
        return;
      }
      
      setCurrentChat({
        id: chatResponse.id,
        messages: chatResponse.messages,
      });
      
      setShowChatHistory(false);
      setShowMobileMenu(false);
    } catch (error: any) {
      console.error('Error loading specific chat:', error);
      
      // Check if error response contains subscription error first
      if (error.response?.data && checkSubscriptionError(error.response.data)) {
        return;
      }
      
      // Check if error response contains token expiration message
      if (error.response?.data && checkTokenError(error.response.data)) {
        return;
      }
      
      setTokenErrorMessage('Failed to load chat. Please try again.');
      setShowTokenError(true);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage && !selectedPdf) return;

    try {
      setIsTyping(true);
      
      let response;
      let newMessages: ChatMessage[] = [];

      if (currentChat) {
        // Continue existing chat
        const continueResponse = await continueChat(
          currentChat.id, 
          message, 
          selectedImage || undefined, 
          selectedPdf || undefined
        );
        
        // Check for subscription error first (before token error)
        if (checkSubscriptionError(continueResponse)) {
          return;
        }
        
        // Check for token error in response
        if (checkTokenError(continueResponse)) {
          return;
        }
        
        // Add user message
        const userMessage: ChatMessage = {
          _id: Date.now().toString(),
          role: 'user',
          content: message,
          contentType: selectedImage ? 'image' : 'text',
          timestamp: new Date().toISOString(),
        };

        // Add AI response
        const aiMessage: ChatMessage = {
          _id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: continueResponse.response,
          contentType: 'text',
          timestamp: new Date().toISOString(),
        };

        newMessages = [...currentChat.messages, userMessage, aiMessage];
        
        setCurrentChat({
          id: continueResponse.chatId,
          messages: newMessages,
        });

        // Speak AI response if voice is enabled
        if (isVoiceEnabled && speechSynthesis) {
          speakText(continueResponse.response);
        }
      } else {
        // Start new chat
        const startResponse = await startChat(
          message, 
          selectedImage || undefined, 
          selectedPdf || undefined
        );
        
        // Check for subscription error first (before token error)
        if (checkSubscriptionError(startResponse)) {
          return;
        }
        
        // Check for token error in response
        if (checkTokenError(startResponse)) {
          return;
        }
        
        setCurrentChat({
          id: startResponse.chat.id,
          messages: startResponse.chat.messages,
        });

        // Speak AI response if voice is enabled
        if (isVoiceEnabled && speechSynthesis && startResponse.chat.messages.length > 0) {
          const lastMessage = startResponse.chat.messages[startResponse.chat.messages.length - 1];
          if (lastMessage.role === 'assistant') {
            speakText(lastMessage.content);
          }
        }
      }

      // Clear inputs
      setMessage('');
      setSelectedImage(null);
      setSelectedPdf(null);
      
      // Reload chat history
      await loadChatHistory();
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Check if error response contains subscription error first
      if (error.response?.data && checkSubscriptionError(error.response.data)) {
        return;
      }
      
      // Check if error response contains token expiration message
      if (error.response?.data && checkTokenError(error.response.data)) {
        return;
      }
      
      setTokenErrorMessage('Failed to send message. Please try again.');
      setShowTokenError(true);
    } finally {
      setIsTyping(false);
    }
  };

  const startVoiceRecording = () => {
    if (speechRecognition && isVoiceEnabled) {
      setIsRecording(true);
      speechRecognition.start();
    }
  };

  const stopVoiceRecording = () => {
    if (speechRecognition && isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
    }
  };

  const speakText = (text: string) => {
    if (!speechSynthesis || !isVoiceEnabled) return;

    // Stop any current speech
    speechSynthesis.cancel();

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings for female voice
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher pitch for female voice
    utterance.volume = 1.0;
    
    // Try to set a female voice
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('female') || voice.name.includes('Samantha') || voice.name.includes('Victoria'))
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    // Remove markdown formatting for speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/^[-*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^#+\s+/gm, '')
      .replace(/\n/g, ' ');

    utterance.text = cleanText;
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setSelectedPdf(null);
    }
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPdf(file);
      setSelectedImage(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedImage(null);
    setSelectedPdf(null);
  };

  const startNewChat = () => {
    setCurrentChat(null);
    setMessage('');
    setSelectedImage(null);
    setSelectedPdf(null);
    setShowChatHistory(false);
    setShowMobileMenu(false);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';
    
    return (
      <div
        key={msg._id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[85%]`}>
          {!isUser && (
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2 mb-1">
              <Bot className="h-4 w-4 text-white" />
            </div>
          )}
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
            }`}
          >
            {msg.contentType === 'image' ? (
              <div className="space-y-2">
                <p className="text-sm">📷 Image uploaded</p>
                {!isUser && (
                  <div className="text-sm">
                    <FormattedText text={msg.content} />
                  </div>
                )}
              </div>
            ) : (
              <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
                <FormattedText text={msg.content} />
              </div>
            )}
          </div>
          <span className={`text-xs mx-2 mb-1 ${isUser ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatTimestamp(msg.timestamp)}
          </span>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Stop voice features
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    if (speechRecognition && isRecording) {
      speechRecognition.stop();
    }
    
    // Redirect to signin
    window.location.href = '/signin';
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isVoiceEnabled 
        ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' 
        : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
    }`}>
      {/* Token Error Modal */}
      {showTokenError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Session Expired</h3>
                <p className="text-sm text-gray-600">Your session has expired</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {tokenErrorMessage}
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout Now</span>
              </button>
              <button
                onClick={() => setShowTokenError(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Wait
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Redirecting to login page in 3 seconds...
            </p>
          </div>
        </div>
      )}

      {/* Subscription Required Modal */}
      {showSubscriptionRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Subscription Required</h3>
                <p className="text-sm text-gray-600">Upgrade your plan to continue</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {subscriptionMessage || 'You need an active subscription to use AI Chat features. Please upgrade your plan to continue.'}
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSubscribeClick}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Subscribe Now</span>
              </button>
              <button
                onClick={() => setShowSubscriptionRequired(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Get access to unlimited AI conversations and features
            </p>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}>
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  {isVoiceEnabled ? 'Voice AI Assistant' : 'AI Tutor'}
                </h1>
                <p className="text-xs text-gray-500">
                  {isVoiceEnabled ? 'Speak naturally with AI' : 'Always here to help'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isVoiceEnabled ? 'Disable Voice Assistant' : 'Enable Voice Assistant'}
            >
              {isVoiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button
              onClick={startNewChat}
              className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 transition-colors"
            >
              <Plus className="h-5 w-5 text-purple-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isVoiceEnabled 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse shadow-lg' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isVoiceEnabled ? 'Voice AI Assistant' : 'AI Chat Assistant'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {isVoiceEnabled ? 'Your intelligent voice companion' : 'Your personal AI tutor'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleVoice}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isVoiceEnabled 
                    ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isVoiceEnabled ? 'Disable Voice Assistant' : 'Enable Voice Assistant'}
              >
                {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <span>{isVoiceEnabled ? 'Voice Active' : 'Voice Off'}</span>
              </button>
              <button
                onClick={() => setShowChatHistory(!showChatHistory)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </button>
              <button
                onClick={startNewChat}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>New Chat</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Mobile Menu Overlay */}
          {showMobileMenu && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)} />
              <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chatHistory.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => loadSpecificChat(chat.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900 truncate">
                            {chat.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 truncate">
                            {chat.lastMessage.content}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat History Sidebar - Desktop */}
          {showChatHistory && (
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-lg p-6 h-[calc(100vh-200px)]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat History</h3>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto h-full">
                    {chatHistory.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => loadSpecificChat(chat.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900 truncate">
                          {chat.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 truncate">
                          {chat.lastMessage.content}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div className={`${showChatHistory ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className={`rounded-2xl shadow-lg h-[calc(100vh-200px)] flex flex-col overflow-hidden transition-all duration-500 ${
              isVoiceEnabled 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200' 
                : 'bg-white'
            }`}>
              {/* Chat Header */}
              <div className={`p-4 border-b transition-all duration-500 ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200' 
                  : 'bg-gradient-to-r from-purple-50 to-pink-50 border-gray-100'
              }`}>
                <div className="flex items-center space-x-3">
                  {isVoiceEnabled ? (
                    <AnimatedCat 
                      isVoiceEnabled={isVoiceEnabled}
                      isSpeaking={isSpeaking}
                      isRecording={isRecording}
                      className="w-12 h-12"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isVoiceEnabled 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse shadow-lg' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {isVoiceEnabled ? 'Voice AI Assistant' : 'AI Tutor'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isVoiceEnabled 
                        ? currentChat ? 'Listening and responding...' : 'Ready to hear your voice'
                        : currentChat ? 'Continuing conversation...' : 'Ready to help with your studies'
                      }
                    </p>
                  </div>
                  {isVoiceEnabled && (
                    <div className="ml-auto flex items-center space-x-2">
                      {isRecording && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">Listening...</span>
                        </div>
                      )}
                      {isSpeaking && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">Speaking...</span>
                        </div>
                      )}
                      {!isRecording && !isSpeaking && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">Voice Ready</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className={`flex-1 overflow-y-auto p-4 transition-all duration-500 ${
                isVoiceEnabled ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gray-50'
              }`}>
                {isLoadingChat ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading conversation...</p>
                  </div>
                                 ) : currentChat?.messages.length === 0 ? (
                   <div className="text-center py-12">
                     <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
                       isVoiceEnabled 
                         ? 'bg-gradient-to-r from-blue-100 to-indigo-100 animate-pulse' 
                         : 'bg-gradient-to-r from-purple-100 to-pink-100'
                     }`}>
                       <Bot className="h-10 w-10 text-purple-600" />
                     </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {isVoiceEnabled ? 'Welcome to Voice AI Assistant!' : 'Welcome to AI Tutor!'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {isVoiceEnabled 
                        ? 'Start speaking or type your message to begin a conversation'
                        : 'Start a conversation or upload an image/PDF to get help'
                      }
                    </p>
                    
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                      {quickQuestions.slice(0, 4).map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickQuestion(question)}
                          className={`p-3 rounded-xl border transition-all duration-300 text-sm text-gray-700 text-left ${
                            isVoiceEnabled
                              ? 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md'
                              : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                          }`}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentChat?.messages.map(renderMessage)}
                  </div>
                )}

                                 {isTyping && (
                   <div className="flex justify-start mb-4">
                     <div className="flex items-end">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 mb-1 transition-all duration-300 ${
                         isVoiceEnabled 
                           ? 'bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse' 
                           : 'bg-gradient-to-r from-purple-500 to-pink-500'
                       }`}>
                         <Bot className="h-4 w-4 text-white" />
                       </div>
                      <div className={`px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border transition-all duration-300 ${
                        isVoiceEnabled 
                          ? 'bg-white border-blue-200 text-gray-800' 
                          : 'bg-white border-gray-100 text-gray-800'
                      }`}>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* File Upload Preview */}
              {(selectedImage || selectedPdf) && (
                <div className={`p-4 border-t transition-all duration-500 ${
                  isVoiceEnabled 
                    ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50' 
                    : 'border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedImage ? (
                        <>
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Image className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{selectedImage.name}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-red-600" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{selectedPdf?.name}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={removeSelectedFile}
                      className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className={`p-4 border-t transition-all duration-500 ${
                isVoiceEnabled 
                  ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-white' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={
                        isVoiceEnabled 
                          ? "Type your message or click the microphone to speak..." 
                          : "Type your message..."
                      }
                      className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:border-transparent resize-none transition-all duration-300 ${
                        isVoiceEnabled 
                          ? 'border-blue-200 focus:ring-blue-500 bg-white' 
                          : 'border-gray-200 focus:ring-purple-500'
                      }`}
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                  </div>
                  
                  {/* Voice and File Upload Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Voice Recording Button */}
                    {isVoiceEnabled && (
                      <button
                        onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                        className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                          isRecording 
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse shadow-lg' 
                            : 'bg-gradient-to-r from-green-400 to-blue-500 text-white hover:shadow-lg'
                        }`}
                        title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
                      >
                        {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </button>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                    
                    {/* Image Upload Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                        isVoiceEnabled 
                          ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white hover:shadow-lg' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      title="Upload Image"
                    >
                      <Image className="h-5 w-5" />
                    </button>
                    
                    {/* PDF Upload Button */}
                    <button
                      onClick={() => pdfInputRef.current?.click()}
                      className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                        isVoiceEnabled 
                          ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:shadow-lg' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                      title="Upload PDF"
                    >
                      <FileText className="h-5 w-5" />
                    </button>
                    
                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={(!message.trim() && !selectedImage && !selectedPdf) || isTyping}
                      className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isVoiceEnabled 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      }`}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Voice Status */}
                {isVoiceEnabled && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={`font-medium ${
                      isRecording ? 'text-red-600' : isSpeaking ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {isRecording ? 'Voice Recording Active' : isSpeaking ? 'AI Speaking' : 'Voice Assistant Ready'}
                    </span>
                    {isRecording && (
                      <span className="text-red-500 flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        Recording...
                      </span>
                    )}
                    {isSpeaking && (
                      <span className="text-green-500 flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Speaking...
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar - Desktop */}
          <div className="hidden lg:block space-y-6">
            {/* Quick Questions */}
            <div className={`rounded-2xl shadow-lg p-6 transition-all duration-500 ${
              isVoiceEnabled 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200' 
                : 'bg-white'
            }`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Questions</h3>
              <div className="space-y-3">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 text-sm text-gray-700 border hover:shadow-md ${
                      isVoiceEnabled
                        ? 'bg-white border-blue-200 hover:border-blue-400'
                        : 'border-gray-100 hover:border-purple-200'
                    }`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Features */}
            <div className={`rounded-2xl p-6 text-white transition-all duration-500 ${
              isVoiceEnabled 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}>
              <h3 className="text-lg font-semibold mb-4">AI Features</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-20 rounded-xl">
                  <div className="w-8 h-8 bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Smart Explanations</p>
                    <p className="text-xs opacity-80">Get detailed explanations</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-20 rounded-xl">
                  <div className="w-8 h-8 bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isVoiceEnabled ? 'Voice Interaction' : 'Voice Ready'}
                    </p>
                    <p className="text-xs opacity-80">
                      {isVoiceEnabled ? 'Speak and listen to responses' : 'Enable voice features'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-20 rounded-xl">
                  <div className="w-8 h-8 bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
                    <Image className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Image Analysis</p>
                    <p className="text-xs opacity-80">Upload images for help</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-20 rounded-xl">
                  <div className="w-8 h-8 bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">PDF Review</p>
                    <p className="text-xs opacity-80">Share documents for review</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 