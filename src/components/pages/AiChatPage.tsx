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
  LogOut,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy
} from 'lucide-react';
import { startChat, getChatHistory, continueChat, getChat } from '../../api';
import { ChatMessage, ChatHistoryItem } from '../../types/api';
import { AnimatedBook } from '../AnimatedBook';

// Custom CSS for child-friendly animations
const customStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-20px) rotate(5deg); }
    50% { transform: translateY(-10px) rotate(-5deg); }
    75% { transform: translateY(-15px) rotate(3deg); }
  }
  
  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }
  
  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(5deg); }
    75% { transform: rotate(-5deg); }
  }
  
  @keyframes sparkle {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-rainbow { animation: rainbow 8s linear infinite; }
  .animate-wiggle { animation: wiggle 2s ease-in-out infinite; }
  .animate-sparkle { animation: sparkle 3s ease-in-out infinite; }
`;

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
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  
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
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  
  // Hold to speak states
  const [isHoldRecording, setIsHoldRecording] = useState(false);
  const [holdRecordingTimeout, setHoldRecordingTimeout] = useState<number | null>(null);
  
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

  // Close upload menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUploadMenu && !(event.target as Element).closest('.upload-menu-container')) {
        setShowUploadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUploadMenu]);

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
        setIsHoldRecording(false);
        
        // Clear the timeout
        if (holdRecordingTimeout) {
          clearTimeout(holdRecordingTimeout);
          setHoldRecordingTimeout(null);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsHoldRecording(false);
        
        // Clear the timeout
        if (holdRecordingTimeout) {
          clearTimeout(holdRecordingTimeout);
          setHoldRecordingTimeout(null);
        }
      };
      
      recognition.onend = () => {
        setIsRecording(false);
        setIsHoldRecording(false);
        
        // Clear the timeout
        if (holdRecordingTimeout) {
          clearTimeout(holdRecordingTimeout);
          setHoldRecordingTimeout(null);
        }
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
          speakText(continueResponse.response, aiMessage._id);
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
            speakText(lastMessage.content, lastMessage._id);
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

  // Hold to speak functionality
  const startHoldRecording = () => {
    if (speechRecognition && isVoiceEnabled) {
      setIsHoldRecording(true);
      setIsRecording(true);
      speechRecognition.start();
      
      // Set a timeout to automatically stop after 30 seconds
      const timeout = window.setTimeout(() => {
        stopHoldRecording();
      }, 30000);
      setHoldRecordingTimeout(timeout);
    }
  };

  const stopHoldRecording = () => {
    if (speechRecognition && isHoldRecording) {
      speechRecognition.stop();
      setIsHoldRecording(false);
      setIsRecording(false);
      
      // Clear the timeout
      if (holdRecordingTimeout) {
        clearTimeout(holdRecordingTimeout);
        setHoldRecordingTimeout(null);
      }
    }
  };

  const speakText = (text: string, messageId?: string) => {
    if (!speechSynthesis) return;

    // Stop any current speech
    speechSynthesis.cancel();
    setSpeakingMessageId(null);

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings for female voice
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.2; // Higher pitch for female voice
    utterance.volume = 1.0;
    
    // Try to set a female voice with priority order
    const voices = speechSynthesis.getVoices();
    let femaleVoice = voices.find(voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('Samantha') || voice.name.includes('Victoria') || voice.name.includes('female'))
    );
    
    // If no specific female voice found, try to find any English voice
    if (!femaleVoice) {
      femaleVoice = voices.find(voice => voice.lang.includes('en'));
    }
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (messageId) {
        setSpeakingMessageId(messageId);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
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
      .replace(/\n/g, ' ')
      .replace(/[^\w\s.,!?-]/g, ''); // Remove special characters

    utterance.text = cleanText;
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
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
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[90%] lg:max-w-[85%]`}>
          {!isUser && (
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-md">
              <Bot className="h-5 w-5 text-white" />
            </div>
          )}
          
          <div className="flex flex-col">
            <div
              className={`px-4 py-3 rounded-2xl shadow-sm ${
                isUser
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
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
            
            {/* Timestamp */}
            <span className={`text-xs mt-2 ${isUser ? 'text-right text-gray-500' : 'text-gray-400'}`}>
              {formatTimestamp(msg.timestamp)}
            </span>
            
                            {/* AI Message Interaction Buttons */}
            {!isUser && (
              <div className="flex items-center space-x-1 mt-2">
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105">
                  <ThumbsUp className="h-3.5 w-3.5 text-gray-600" />
                </button>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105">
                  <ThumbsDown className="h-3.5 w-3.5 text-gray-600" />
                </button>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105">
                  <Copy className="h-3.5 w-3.5 text-gray-600" />
                </button>
                
                {/* Stop Speaking Button - Shows when speaking */}
                {speakingMessageId === msg._id ? (
                  <button 
                    onClick={() => stopSpeaking()}
                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-all duration-200 hover:scale-105 group"
                    title="Stop speaking"
                  >
                    <div className="w-3.5 h-3.5 bg-red-600 rounded-full animate-pulse"></div>
                  </button>
                ) : (
                  <button 
                    onClick={() => speakText(msg.content, msg._id)}
                    className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 group-hover:text-blue-700 transition-all duration-200 hover:scale-105"
                    title="Listen to this response"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
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
    <>
      {/* Inject Custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      
      <div className="h-screen relative overflow-hidden flex flex-col">
      {/* Animated Background with Watermark Effect */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient Background */}
        <div className={`absolute inset-0 transition-all duration-1000 ${
          isVoiceEnabled 
            ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' 
            : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'
        }`} />
        
        {/* Floating Bubbles */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large Bubbles */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-300/30 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-pink-200/30 to-red-300/30 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          <div className="absolute bottom-40 left-20 w-28 h-28 bg-gradient-to-br from-green-200/30 to-blue-300/30 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
          <div className="absolute bottom-20 right-10 w-20 h-20 bg-gradient-to-br from-yellow-200/30 to-orange-300/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }} />
          
          {/* Medium Bubbles */}
          <div className="absolute top-60 left-1/4 w-16 h-16 bg-gradient-to-br from-indigo-200/20 to-purple-300/20 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
          <div className="absolute top-80 right-1/3 w-12 h-12 bg-gradient-to-br from-pink-200/20 to-rose-300/20 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }} />
          <div className="absolute bottom-60 left-1/3 w-14 h-14 bg-gradient-to-br from-emerald-200/20 to-teal-300/20 rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
          
          {/* Small Bubbles */}
          <div className="absolute top-32 left-1/2 w-8 h-8 bg-gradient-to-br from-blue-200/15 to-cyan-300/15 rounded-full animate-ping" style={{ animationDelay: '0.7s' }} />
          <div className="absolute top-96 right-1/4 w-6 h-6 bg-gradient-to-br from-purple-200/15 to-violet-300/15 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-80 left-1/2 w-10 h-10 bg-gradient-to-br from-green-200/15 to-emerald-300/15 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
        </div>
        
        {/* Floating Stars */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-16 left-1/3 text-yellow-400/40 animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
          <div className="absolute top-48 right-16 text-yellow-400/40 animate-pulse" style={{ animationDelay: '1.2s' }}>✨</div>
          <div className="absolute top-72 left-20 text-yellow-400/40 animate-pulse" style={{ animationDelay: '0.8s' }}>🌟</div>
          <div className="absolute bottom-32 right-1/3 text-yellow-400/40 animate-pulse" style={{ animationDelay: '1.5s' }}>💫</div>
          <div className="absolute bottom-64 left-1/4 text-yellow-400/40 animate-pulse" style={{ animationDelay: '0.3s' }}>⭐</div>
        </div>
        
        {/* Floating Hearts */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-24 right-1/4 text-pink-400/30 animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '2.5s' }}>💖</div>
          <div className="absolute top-64 left-16 text-red-400/30 animate-bounce" style={{ animationDelay: '1.1s', animationDuration: '3s' }}>💝</div>
          <div className="absolute bottom-48 right-20 text-rose-400/30 animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '2.8s' }}>💕</div>
        </div>
        
        {/* Floating Clouds */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-12 left-1/4 text-blue-300/20 animate-pulse" style={{ animationDelay: '0.4s' }}>☁️</div>
          <div className="absolute top-56 right-1/3 text-blue-300/20 animate-pulse" style={{ animationDelay: '1.3s' }}>☁️</div>
          <div className="absolute bottom-24 left-1/3 text-blue-300/20 animate-pulse" style={{ animationDelay: '0.9s' }}>☁️</div>
        </div>
        
        {/* Sparkles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-28 left-1/2 text-yellow-300/25 animate-spin" style={{ animationDelay: '0.1s', animationDuration: '4s' }}>✨</div>
          <div className="absolute top-88 right-1/4 text-yellow-300/25 animate-spin" style={{ animationDelay: '1.4s', animationDuration: '3.5s' }}>✨</div>
          <div className="absolute bottom-56 left-1/2 text-yellow-300/25 animate-spin" style={{ animationDelay: '0.7s', animationDuration: '4.2s' }}>✨</div>
        </div>
        
        {/* Rainbow Arcs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 border-8 border-transparent border-t-pink-300/20 border-r-purple-300/20 border-b-blue-300/20 border-l-green-300/20 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 border-8 border-transparent border-t-yellow-300/20 border-r-orange-300/20 border-b-red-300/20 border-l-pink-300/20 rounded-full animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
        </div>
        
        {/* Floating Emojis */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-36 left-1/2 text-4xl animate-float" style={{ animationDelay: '0.3s' }}>🚀</div>
          <div className="absolute top-80 right-1/4 text-3xl animate-float" style={{ animationDelay: '1.1s' }}>🎈</div>
          <div className="absolute bottom-72 left-1/4 text-3xl animate-float" style={{ animationDelay: '0.7s' }}>🎪</div>
          <div className="absolute bottom-40 right-1/2 text-4xl animate-float" style={{ animationDelay: '1.4s' }}>🌈</div>
        </div>
        
        {/* Floating Numbers and Letters */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-24 left-1/5 text-2xl font-bold text-blue-400/30 animate-float" style={{ animationDelay: '0.2s' }}>1</div>
          <div className="absolute top-64 right-1/5 text-2xl font-bold text-purple-400/30 animate-float" style={{ animationDelay: '0.9s' }}>2</div>
          <div className="absolute bottom-28 left-1/3 text-2xl font-bold text-green-400/30 animate-float" style={{ animationDelay: '1.3s' }}>3</div>
          <div className="absolute bottom-80 right-1/3 text-2xl font-bold text-pink-400/30 animate-float" style={{ animationDelay: '0.6s' }}>4</div>
        </div>
        
        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-44 left-1/6 w-6 h-6 bg-yellow-400/20 rotate-45 animate-float" style={{ animationDelay: '0.4s' }} />
          <div className="absolute top-76 right-1/6 w-4 h-4 bg-blue-400/20 rounded-full animate-float" style={{ animationDelay: '1.0s' }} />
          <div className="absolute bottom-52 left-1/6 w-5 h-5 bg-green-400/20 transform rotate-45 animate-float" style={{ animationDelay: '0.8s' }} />
        </div>
      </div>
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

      {/* Enhanced Mobile Header - Modern Child-Friendly Design */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md shadow-xl border-b border-purple-100/50 sticky top-0 z-40">
        <div className="flex items-center justify-between p-5">
          {/* Left Section - Menu & AI Info */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200/50 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <Menu className="h-6 w-6 text-purple-600" />
            </button>
            
            {/* AI Tutor Info with Enhanced Design */}
            <div className="flex items-center space-x-4">
              <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-110 ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse' 
                  : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'
              }`}>
                <Bot className="h-6 w-6 text-white" />
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-2xl blur-md transition-all duration-500 ${
                  isVoiceEnabled 
                    ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-50' 
                    : 'bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 opacity-50'
                }`} />
              </div>
              
              <div className="flex flex-col">
                <h1 className="font-bold text-gray-900 text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {isVoiceEnabled ? 'Voice AI' : 'AI Tutor'}
                </h1>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-600 font-medium">
                    {isVoiceEnabled ? '🎤 Speak naturally' : '💬 Always here to help'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Section - Voice Toggle & New Chat */}
          <div className="flex items-center space-x-3">
            {/* Voice Toggle Button */}
            <button
              onClick={toggleVoice}
              className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300 border border-gray-200'
              }`}
              title={isVoiceEnabled ? 'Disable Voice Assistant' : 'Enable Voice Assistant'}
            >
              {isVoiceEnabled ? (
                <div className="flex items-center space-x-1">
                  <Volume2 className="h-5 w-5" />
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </button>
            
            {/* New Chat Button */}
            <button
              onClick={startNewChat}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-purple-200/50"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header - Enhanced Modern Design */}
      <div className="hidden lg:block bg-white/95 backdrop-blur-md shadow-xl border-b border-purple-100/50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - AI Info */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-110 ${
                  isVoiceEnabled 
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse' 
                    : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'
                }`}>
                  <Bot className="h-7 w-7 text-white" />
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-2xl blur-md transition-all duration-500 ${
                    isVoiceEnabled 
                      ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-50' 
                      : 'bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 opacity-50'
                  }`} />
                </div>
                
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                    {isVoiceEnabled ? 'Voice AI Assistant' : 'AI Chat Assistant'}
                  </h1>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-base text-gray-600 font-medium">
                      {isVoiceEnabled ? 'Your intelligent voice companion' : 'Your personal AI tutor'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Section - Action Buttons */}
            <div className="flex items-center space-x-4">
              {/* Voice Toggle Button */}
              <button
                onClick={toggleVoice}
                className={`flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  isVoiceEnabled 
                    ? 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 text-white animate-pulse' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border border-gray-200'
                }`}
                title={isVoiceEnabled ? 'Disable Voice Assistant' : 'Enable Voice Assistant'}
              >
                {isVoiceEnabled ? (
                  <>
                    <Volume2 className="h-5 w-5" />
                    <span className="font-semibold">Voice Active</span>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-5 w-5" />
                    <span className="font-semibold">Voice Off</span>
                  </>
                )}
              </button>
              
              {/* Stop Speaking Button */}
              {isVoiceEnabled && isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  title="Stop speaking"
                >
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="font-semibold">Stop Speaking</span>
                </button>
              )}
              
              {/* History Button */}
              <button
                onClick={() => setShowChatHistory(!showChatHistory)}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 rounded-2xl transition-all duration-300 border border-purple-200/50 hover:shadow-lg transform hover:scale-105"
              >
                <History className="h-5 w-5" />
                <span className="font-semibold">History</span>
              </button>
              
              {/* New Chat Button */}
              <button
                onClick={startNewChat}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-2xl hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-purple-200/50"
              >
                <Plus className="h-5 w-5" />
                <span className="font-semibold">New Chat</span>
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-700 rounded-2xl transition-all duration-300 border border-red-200/50 hover:shadow-lg transform hover:scale-105"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 flex-1">
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
              <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[calc(100vh-320px)] lg:min-h-[calc(100vh-280px)] overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat History</h3>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto h-[calc(100%-3rem)]">
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

          {/* Enhanced Chat Interface - Full Page Coverage */}
          <div className={`${showChatHistory ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col`}>
            <div className={`rounded-2xl shadow-lg flex-1 flex flex-col overflow-hidden transition-all duration-500 min-h-[calc(100vh-320px)] lg:min-h-[calc(100vh-280px)] ${
              isVoiceEnabled 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200' 
                : 'bg-white'
            }`}>
              {/* Enhanced Chat Header - Modern AI Platform Design */}
              {/* <div className={`p-4 lg:p-5 border-b transition-all duration-500 ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200' 
                  : 'bg-gradient-to-r from-purple-50 to-pink-50 border-gray-100'
              }`}>
                <div className="flex items-center space-x-4">
                  {isVoiceEnabled ? (
                    <AnimatedBook 
                      isVoiceEnabled={isVoiceEnabled}
                      isSpeaking={isSpeaking}
                      isRecording={isRecording}
                      className="w-12 h-12 lg:w-14 lg:h-14"
                    />
                  ) : (
                    <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                      isVoiceEnabled 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                      <Bot className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg lg:text-xl">
                      {isVoiceEnabled ? 'Voice AI Assistant' : 'AI Tutor'}
                    </h3>
                    <p className="text-sm lg:text-base text-gray-600 font-medium">
                      {isVoiceEnabled 
                        ? currentChat ? '🎤 Listening and responding...' : '🎙️ Ready to hear your voice'
                        : currentChat ? '💬 Continuing conversation...' : '🚀 Ready to help with your studies'
                      }
                    </p>
                  </div>
                  {isVoiceEnabled && (
                    <div className="hidden lg:flex items-center space-x-3">
                      {isRecording && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 rounded-full">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-red-700">Listening...</span>
                        </div>
                      )}
                      {isSpeaking && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-700">Speaking...</span>
                        </div>
                      )}
                      {!isRecording && !isSpeaking && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 rounded-full">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-blue-700">Voice Ready</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div> */}

              {/* Chat Messages - Full Coverage Enhanced UI */}
              <div className={`flex-1 overflow-y-auto p-2 lg:p-3 transition-all duration-500 min-h-0 ${
                isVoiceEnabled ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gradient-to-br from-gray-50 to-white'
              }`}>
                {isLoadingChat ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading conversation...</p>
                  </div>
                ) : currentChat?.messages.length === 0 ? (
                  <div className="text-center py-6 lg:py-8 flex flex-col justify-center h-full">
                    <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 transition-all duration-500 shadow-lg ${
                      isVoiceEnabled 
                        ? 'bg-gradient-to-r from-blue-100 to-indigo-100 animate-pulse' 
                        : 'bg-gradient-to-r from-purple-100 to-pink-100'
                    }`}>
                      <Bot className="h-7 w-7 lg:h-8 lg:w-8 text-purple-600" />
                    </div>
                    
                    {/* Fun Welcome Animation */}
                    <div className="mb-4 animate-bounce">
                      <span className="text-4xl">👋</span>
                    </div>
                    
                    <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2">
                      {isVoiceEnabled ? 'Welcome to Voice AI Assistant!' : 'Welcome to AI Tutor!'}
                    </h3>
                    <p className="text-gray-600 mb-4 lg:mb-6 text-sm px-4 max-w-sm mx-auto">
                      {isVoiceEnabled 
                        ? '🎤 Start speaking or type your message to begin a conversation'
                        : '💬 Start a conversation or upload an image/PDF to get help'
                      }
                    </p>
                    
                    {/* Enhanced Quick Actions - Compact Full Coverage Design */}
                    <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto px-4 mb-3">
                      {quickQuestions.slice(0, 4).map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickQuestion(question)}
                          className={`p-2.5 rounded-lg border-2 transition-all duration-300 text-xs text-gray-700 text-left font-medium hover:shadow-md transform hover:scale-[1.02] ${
                            index === 0 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 hover:border-blue-400 hover:bg-blue-200' :
                            index === 1 ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-300 hover:border-green-400 hover:bg-green-200' :
                            index === 2 ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-300 hover:border-purple-400 hover:bg-purple-200' :
                            'bg-gradient-to-r from-pink-50 to-pink-100 border-pink-300 hover:border-pink-400 hover:bg-pink-200'
                          }`}
                        >
                          <span className="mr-2">
                            {index === 0 ? '🔬' : index === 1 ? '📐' : index === 2 ? '🧪' : '🧮'}
                          </span>
                          {question}
                        </button>
                      ))}
                    </div>
                    
                    {/* Additional Features Section - Compact */}
                    <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto px-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-center hover:scale-105 transition-transform duration-200">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                          <Image className="h-3 w-3 text-blue-600" />
                        </div>
                        <p className="text-xs font-medium text-blue-700">🖼️ Image Analysis</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-center hover:scale-105 transition-transform duration-200">
                        <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                          <FileText className="h-3 w-3 text-purple-600" />
                        </div>
                        <p className="text-xs font-medium text-purple-700">📄 PDF Review</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                          <span className="text-sm text-gray-600 mr-2">🤔 Thinking...</span>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Regenerate Response Button */}
              {/* {currentChat && currentChat.messages.length > 0 && (
                <div className="px-4 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <button
                    onClick={() => {
                      // Regenerate logic would go here
                      console.log('Regenerate response clicked');
                    }}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 rounded-2xl transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] group"
                  >
                    <RotateCcw className="h-5 w-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                    <span className="group-hover:text-purple-700">Regenerate response</span>
                  </button>
                </div>
              )} */}

              {/* Compact File Upload Preview */}
              {(selectedImage || selectedPdf) && (
                <div className={`p-3 border-t transition-all duration-500 ${
                  isVoiceEnabled 
                    ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50' 
                    : 'border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'
                }`}>
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {selectedImage ? (
                          <>
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Image className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800 truncate max-w-32">
                                {selectedImage.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-4 w-4 text-red-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800 truncate max-w-32">
                                {selectedPdf?.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {selectedPdf ? (selectedPdf.size / 1024 / 1024).toFixed(2) : '0'} MB
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={removeSelectedFile}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 group"
                        title="Remove file"
                      >
                        <X className="h-3.5 w-3.5 text-gray-500 group-hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Input - Enhanced Child-Friendly UI */}
              <div className={`p-4 lg:p-6 border-t transition-all duration-500 ${
                isVoiceEnabled 
                  ? 'border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-white' 
                  : 'border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-white'
              }`}>
                {/* Enhanced Input Container with Plus Button */}
                <div className="relative">
                  {/* Main Input Field */}
                  <div className="relative bg-white rounded-3xl border-2 border-purple-200 hover:border-purple-300 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100 transition-all duration-300 shadow-lg hover:shadow-xl">
                    {/* Enhanced Plus Button - Left Side */}
                    <button
                      onClick={() => setShowUploadMenu(!showUploadMenu)}
                      className="absolute left-4 bottom-4 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-purple-600 transition-all duration-300 transform hover:scale-105 z-10 shadow-md hover:shadow-lg border border-purple-200/50"
                      title="Upload files"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="💬 Type your message here..."
                      className="w-full pl-16 pr-28 py-5 text-base leading-relaxed resize-none border-0 focus:ring-0 focus:outline-none bg-transparent placeholder-purple-400 font-medium"
                      style={{ minHeight: '72px', maxHeight: '200px' }}
                      rows={1}
                    />
                    
                    {/* Enhanced Action Buttons Row - Full Coverage */}
                    <div className="absolute right-4 bottom-4 flex items-center space-x-3">
                      {/* Hold to Speak Button - Always Visible */}
                      <button
                        onMouseDown={isVoiceEnabled ? startHoldRecording : undefined}
                        onMouseUp={isVoiceEnabled ? stopHoldRecording : undefined}
                        onMouseLeave={isVoiceEnabled ? stopHoldRecording : undefined}
                        onTouchStart={isVoiceEnabled ? startHoldRecording : undefined}
                        onTouchEnd={isVoiceEnabled ? stopHoldRecording : undefined}
                        onClick={!isVoiceEnabled ? toggleVoice : undefined}
                        className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${
                          isHoldRecording 
                            ? 'bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white animate-pulse shadow-xl' 
                            : isVoiceEnabled
                            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-xl'
                            : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 hover:from-gray-400 hover:to-gray-500'
                        }`}
                        title={isHoldRecording 
                          ? '🎤 Recording... Release to stop' 
                          : isVoiceEnabled 
                          ? '🎤 Hold to speak' 
                          : '🎤 Click to enable voice features'
                        }
                      >
                        {isHoldRecording ? (
                          <div className="w-5 h-5 bg-white rounded-full animate-pulse" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </button>
                      
                      {/* Send Button */}
                      <button
                        onClick={handleSendMessage}
                        disabled={(!message.trim() && !selectedImage && !selectedPdf) || isTyping}
                        className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ${
                          message.trim() || selectedImage || selectedPdf
                            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 shadow-xl'
                            : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Upload Menu Dropdown */}
                  {showUploadMenu && (
                    <div className="upload-menu-container absolute left-0 bottom-full mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-20 min-w-[200px]">
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowUploadMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Image className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Upload Image</div>
                            <div className="text-xs text-gray-500">JPG, PNG, GIF</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            pdfInputRef.current?.click();
                            setShowUploadMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <FileText className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Upload PDF</div>
                            <div className="text-xs text-gray-500">PDF documents</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                  
                  {/* Hidden File Inputs */}
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
                
                {/* Compact Voice Status - Always Visible */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className={`font-medium px-2 py-1 rounded-full ${
                    isHoldRecording 
                      ? 'bg-red-100 text-red-700 animate-pulse' 
                      : isRecording 
                      ? 'bg-red-100 text-red-700' 
                      : isSpeaking 
                      ? 'bg-green-100 text-green-700'
                      : isVoiceEnabled
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isHoldRecording 
                      ? '🎤 Hold to Speak Active!' 
                      : isRecording 
                      ? '🎤 Recording' 
                      : isSpeaking 
                      ? '🔊 Speaking' 
                      : isVoiceEnabled 
                      ? '🎙️ Ready' 
                      : '🎤 Voice Disabled - Click mic to enable'
                    }
                  </span>
                  
                  {/* Compact Status Indicators */}
                  <div className="flex items-center space-x-1">
                    {isHoldRecording && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    )}
                    {isRecording && !isHoldRecording && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                    {isSpeaking && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    {!isRecording && !isSpeaking && !isHoldRecording && isVoiceEnabled && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                    {!isVoiceEnabled && (
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                {/* Compact Character Count and Tips */}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 px-1">
                  <span className="text-gray-600">
                    {isVoiceEnabled 
                      ? 'Hold 🎤 to speak, ENTER to send, SHIFT + ENTER for new line'
                      : 'Click 🎤 to enable voice, ENTER to send, SHIFT + ENTER for new line'
                    }
                  </span>
                  <span className="text-gray-600 font-medium">
                    {message.length}/2000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar - Desktop Only */}
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
    </>
  );
}; 