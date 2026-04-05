import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  Image, 
  Camera,
  FileText, 
  History,
  Plus,
  X,
  Menu,
  Mic,
  Volume2,
  VolumeX,
  AlertCircle,
  LogOut,
  ThumbsUp,
  ThumbsDown,
  Copy
} from 'lucide-react';
import { startChat, getChatHistory, continueChat, getChat } from '../../api';
import { ChatMessage, ChatHistoryItem } from '../../types/api';

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
  
  /** Session/auth vs generic API errors — avoids labeling every failure as "Session Expired" */
  const [errorModal, setErrorModal] = useState<
    | { open: false }
    | { open: true; kind: 'session' | 'generic'; message: string }
  >({ open: false });
  
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

  const closeErrorModal = () => setErrorModal({ open: false });

  // Handle token expiration
  const handleTokenExpiration = (errorMessage: string = 'Token has been invalidated. Please login again.') => {
    setErrorModal({ open: true, kind: 'session', message: errorMessage });
    
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

  /**
   * Auth/session failures. Pass `httpStatus` from fetch errors (e.g. error.response.status).
   * Avoid matching broad "Unauthorized" on success JSON — many APIs reuse `message` for status text
   * and false positives showed "Session Expired" when sending chat.
   */
  const checkAuthFailure = (data: any, httpStatus?: number): boolean => {
    if (httpStatus === 401) {
      const msg =
        typeof data?.message === 'string'
          ? data.message
          : 'Your session has expired. Please login again.';
      handleTokenExpiration(msg);
      return true;
    }
    if (!data || typeof data.message !== 'string') return false;
    const m = data.message.toLowerCase();
    const sessionPhrases = [
      'token has been invalidated',
      'please login again',
      'invalid token',
      'jwt expired',
      'token expired',
      'session has expired',
      'session expired',
    ];
    if (sessionPhrases.some((p) => m.includes(p))) {
      handleTokenExpiration(data.message);
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
      if (checkAuthFailure(response)) {
        return;
      }
      
      setChatHistory(response.chats);
    } catch (error: any) {
      console.error('Error loading chat history:', error);
      
      // Check if error response contains subscription error first
      if (error.response?.data && checkSubscriptionError(error.response.data)) {
        return;
      }
      
      if (checkAuthFailure(error.response?.data, error.response?.status)) {
        return;
      }
      
      setErrorModal({
        open: true,
        kind: 'generic',
        message: 'Failed to load chat history. Please try again.',
      });
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
      
      if (checkAuthFailure(chatResponse)) {
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
      
      if (checkAuthFailure(error.response?.data, error.response?.status)) {
        return;
      }
      
      setErrorModal({
        open: true,
        kind: 'generic',
        message: 'Failed to load chat. Please try again.',
      });
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage && !selectedPdf) return;

    try {
      setIsTyping(true);
      
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
        
        if (checkAuthFailure(continueResponse)) {
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
        
        if (checkAuthFailure(startResponse)) {
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
      
      if (checkAuthFailure(error.response?.data, error.response?.status)) {
        return;
      }
      
      setErrorModal({
        open: true,
        kind: 'generic',
        message: 'Failed to send message. Please check your connection and try again.',
      });
    } finally {
      setIsTyping(false);
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
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 lg:mb-6`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[95%] lg:max-w-[85%] w-full`}>
          {!isUser && (
            <div className="hidden lg:flex w-10 h-10 bg-[#3b5998] rounded-full items-center justify-center mr-3 flex-shrink-0 shadow-md">
              <Bot className="h-5 w-5 text-white" />
            </div>
          )}
          
          <div className={`flex flex-col ${!isUser ? 'w-full max-lg:max-w-full' : ''}`}>
          <div
              className={`px-4 py-3 rounded-2xl shadow-sm max-lg:shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${
              isUser
                  ? 'bg-white border border-gray-200/80 text-[#2D3142] rounded-br-md'
                  : 'bg-white text-[#2D3142] rounded-2xl border border-gray-100 lg:bg-blue-600 lg:text-white lg:border-blue-500 lg:rounded-bl-md'
            }`}
          >
            {msg.contentType === 'image' ? (
              <div className="space-y-2">
                <p className="text-sm">📷 Image uploaded</p>
                {!isUser && (
                  <div className="text-sm prose prose-sm max-w-none text-[#2D3142] lg:text-white [&_strong]:lg:text-white">
                    <FormattedText text={msg.content} />
                  </div>
                )}
              </div>
            ) : (
                <div className={`text-sm leading-relaxed relative pb-6 lg:pb-0 ${isUser ? 'text-[#2D3142]' : 'text-[#2D3142] lg:text-white'}`}>
                <div className={!isUser ? 'max-lg:[&_strong]:text-[#2D3142] max-lg:[&_li]:text-[#2D3142]' : ''}>
                  <FormattedText text={msg.content} />
                </div>
                {!isUser && (
                  <div className="lg:hidden absolute bottom-0 right-0 flex items-center gap-0.5">
                    {speakingMessageId === msg._id ? (
                      <button
                        type="button"
                        onClick={() => stopSpeaking()}
                        className="p-2 rounded-xl text-[#3b5998] hover:bg-[#F0F0F8]"
                        title="Stop"
                      >
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => speakText(msg.content, msg._id)}
                        className="p-2 rounded-xl text-[#3b5998] hover:bg-[#F0F0F8]"
                        title="Listen"
                      >
                        <Volume2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
            
            <span className={`text-xs mt-1.5 ${isUser ? 'text-right text-[#3b5998]/70' : 'text-gray-400 lg:text-blue-200'}`}>
            {formatTimestamp(msg.timestamp)}
          </span>
            
            {!isUser && (
              <div className="hidden lg:flex items-center flex-wrap gap-1 mt-2">
                <button type="button" className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-all duration-200 hover:scale-105">
                  <ThumbsUp className="h-3.5 w-3.5 text-blue-600" />
                </button>
                <button type="button" className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-all duration-200 hover:scale-105">
                  <ThumbsDown className="h-3.5 w-3.5 text-blue-600" />
                </button>
                <button type="button" className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-all duration-200 hover:scale-105">
                  <Copy className="h-3.5 w-3.5 text-blue-600" />
                </button>
                {speakingMessageId === msg._id ? (
                  <button 
                    type="button"
                    onClick={() => stopSpeaking()}
                    className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-all duration-200 hover:scale-105"
                    title="Stop speaking"
                  >
                    <div className="w-3.5 h-3.5 bg-red-600 rounded-full animate-pulse" />
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => speakText(msg.content, msg._id)}
                    className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all duration-200 hover:scale-105"
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
      
      <div className="h-screen relative overflow-hidden flex flex-col bg-[#F3F3FA] lg:bg-transparent" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="fixed inset-0 -z-10 hidden lg:block bg-gradient-to-br from-slate-50 via-blue-50/80 to-slate-100" aria-hidden />
      {/* Session / generic error modal */}
      {errorModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  errorModal.kind === 'session' ? 'bg-red-100' : 'bg-amber-100'
                }`}
              >
                <AlertCircle
                  className={`h-6 w-6 ${errorModal.kind === 'session' ? 'text-red-600' : 'text-amber-700'}`}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {errorModal.kind === 'session' ? 'Session Expired' : 'Something went wrong'}
                </h3>
                {errorModal.kind === 'session' && (
                  <p className="text-sm text-gray-600">Your session has expired</p>
                )}
              </div>
            </div>

            <p className="text-gray-700 mb-6">{errorModal.message}</p>

            <div className="flex space-x-3">
              {errorModal.kind === 'session' ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout Now</span>
                  </button>
                  <button
                    onClick={closeErrorModal}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Wait
                  </button>
                </>
              ) : (
                <button
                  onClick={closeErrorModal}
                  className="flex-1 bg-[#3b5998] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
                >
                  OK
                </button>
              )}
            </div>

            {errorModal.kind === 'session' && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Redirecting to login page in 3 seconds...
              </p>
            )}
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

      {/* Mobile header — minimal, matches Ask AI mock */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-gray-200/60 bg-[#F4F5F9]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-3 py-2.5 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-xl text-[#3b5998] hover:bg-white/80 transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-[#2D3142] tracking-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Ask AI
          </h1>
          <button
            type="button"
            onClick={startNewChat}
            className="p-2 rounded-xl text-[#3b5998] hover:bg-white/80 transition-colors"
            aria-label="New chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header - Enhanced Modern Design */}
      <div className="hidden lg:block bg-white/95 backdrop-blur-md shadow-xl border-b border-blue-100/50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left Section - AI Info */}
            <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-110 ${
                  isVoiceEnabled 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700'
                }`}>
                  <Bot className="h-7 w-7 text-white" />
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-2xl blur-md transition-all duration-500 ${
                    isVoiceEnabled 
                      ? 'bg-gradient-to-r from-blue-400 to-blue-500 opacity-50' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 opacity-50'
                  }`} />
                </div>
                
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
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
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white animate-pulse' 
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
                    className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    title="Stop speaking"
                  >
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="font-semibold">Stop Speaking</span>
                </button>
              )}
              
              {/* History Button */}
              <button
                onClick={() => setShowChatHistory(!showChatHistory)}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-2xl transition-all duration-300 border border-blue-200/50 hover:shadow-lg transform hover:scale-105"
              >
                <History className="h-5 w-5" />
                <span className="font-semibold">History</span>
              </button>
              
              {/* New Chat Button */}
              <button
                onClick={startNewChat}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-blue-200/50"
              >
                <Plus className="h-5 w-5" />
                <span className="font-semibold">New Chat</span>
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 text-blue-700 rounded-2xl transition-all duration-300 border border-blue-200/50 hover:shadow-lg transform hover:scale-105"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 lg:py-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-6 flex-1 flex flex-col min-h-0 overflow-hidden max-lg:bg-[#F4F5F9]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 flex-1" style={{ height: '100%', overflow: 'hidden' }}>
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

          {/* Enhanced Chat Interface - Fixed Scrolling */}
          <div className={`${showChatHistory ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col min-h-0`} style={{ height: '100%', overflow: 'hidden' }}>
            <div className={`rounded-2xl shadow-lg flex-1 flex flex-col overflow-hidden transition-all duration-500 max-lg:rounded-none max-lg:shadow-none max-lg:bg-transparent ${
              isVoiceEnabled 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 max-lg:border-0' 
                : 'bg-white max-lg:bg-transparent'
            }`} style={{ height: '100%', overflow: 'hidden' }}>
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

              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Composer — bottom on mobile (messages scroll above); last on desktop */}
              <div className="order-2 lg:order-3 shrink-0 max-lg:bg-[#F4F5F9] max-lg:border-t max-lg:border-gray-200/70">
              {/* Compact File Upload Preview */}
              {(selectedImage || selectedPdf) && (
                <div className={`p-3 max-lg:pt-2 border-t transition-all duration-500 max-lg:border-0 ${
                  isVoiceEnabled 
                    ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 max-lg:bg-transparent' 
                    : 'border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 max-lg:bg-transparent'
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

              {/* Message Input — mock: white bar, mic right; desktop keeps full toolbar */}
              <div className={`p-3 lg:p-6 border-t transition-all duration-500 max-lg:border-0 ${
                isVoiceEnabled 
                  ? 'border-blue-200 bg-transparent lg:bg-gradient-to-r lg:from-blue-50 lg:via-blue-100 lg:to-white' 
                  : 'border-blue-200 bg-transparent lg:bg-gradient-to-r lg:from-blue-50 lg:via-blue-100 lg:to-white'
              }`}>
                <div className="relative w-full max-w-none mx-auto lg:mx-0">
                <div className="relative bg-white rounded-2xl border border-gray-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.08)] focus-within:ring-2 focus-within:ring-[#3b5998]/20 transition-all w-full">
                      <button
                        onClick={() => setShowUploadMenu(!showUploadMenu)}
                        className="hidden lg:flex absolute left-3 bottom-4 p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 z-10 border border-blue-200/50"
                        title="Upload files"
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder="Ask anything…"
                      className="w-full max-lg:pl-4 max-lg:pr-24 lg:pl-14 lg:pr-36 py-3.5 lg:py-6 text-[15px] leading-snug resize-none border-0 focus:ring-0 focus:outline-none bg-transparent placeholder:text-gray-400 text-[#2D3142]"
                      style={{ fontFamily: 'system-ui, sans-serif', minHeight: '52px', maxHeight: '200px' }}
                      rows={2}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      <button
                        type="button"
                        onMouseDown={isVoiceEnabled ? startHoldRecording : undefined}
                        onMouseUp={isVoiceEnabled ? stopHoldRecording : undefined}
                        onMouseLeave={isVoiceEnabled ? stopHoldRecording : undefined}
                        onTouchStart={isVoiceEnabled ? startHoldRecording : undefined}
                        onTouchEnd={isVoiceEnabled ? stopHoldRecording : undefined}
                        onClick={!isVoiceEnabled ? toggleVoice : undefined}
                        className={`p-2 rounded-xl transition-all ${
                          isHoldRecording 
                            ? 'bg-[#3b5998] text-white' 
                            : isVoiceEnabled
                            ? 'bg-[#3b5998] text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                        title="Voice"
                      >
                        {isHoldRecording ? (
                          <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={(!message.trim() && !selectedImage && !selectedPdf) || isTyping}
                        className={`hidden lg:inline-flex p-2 rounded-xl disabled:opacity-50 ${
                          message.trim() || selectedImage || selectedPdf
                            ? 'bg-[#3b5998] text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {showUploadMenu && (
                    <div className="upload-menu-container absolute left-0 bottom-full mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-20 min-w-[200px]">
                      <div className="space-y-1">
                      <button
                          type="button"
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
                          type="button"
                          onClick={() => {
                            pdfInputRef.current?.click();
                            setShowUploadMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <FileText className="h-5 w-5 text-blue-600" />
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
                <div className="mt-3 hidden lg:flex items-center justify-between text-sm">
                  <span className={`font-medium px-2 py-1 rounded-full ${
                    isHoldRecording ? 'bg-blue-100 text-blue-700 animate-pulse' : isRecording ? 'bg-blue-100 text-blue-700' : isSpeaking ? 'bg-blue-100 text-blue-700' : isVoiceEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isHoldRecording ? '🎤 Hold to speak' : isRecording ? '🎤 Recording' : isSpeaking ? '🔊 Speaking' : isVoiceEnabled ? '🎙️ Ready' : '🎤 Voice off'}
                    </span>
                  <span className="text-gray-600 text-xs">{message.length}/2000</span>
                </div>
              </div>

              {/* Mobile: Photo | Voice | Upload — same bottom section as input */}
              <div className="lg:hidden grid grid-cols-3 gap-2 px-3 pb-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl bg-white py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 active:scale-[0.98]"
                >
                  <Camera className="h-6 w-6 text-[#2E3A59] mb-1" />
                  <span className="text-xs font-medium text-[#2E3A59]" style={{ fontFamily: 'system-ui, sans-serif' }}>Photo</span>
                </button>
                <button
                  type="button"
                  onMouseDown={isVoiceEnabled ? startHoldRecording : undefined}
                  onMouseUp={isVoiceEnabled ? stopHoldRecording : undefined}
                  onMouseLeave={isVoiceEnabled ? stopHoldRecording : undefined}
                  onTouchStart={isVoiceEnabled ? startHoldRecording : undefined}
                  onTouchEnd={isVoiceEnabled ? stopHoldRecording : undefined}
                  onClick={!isVoiceEnabled ? toggleVoice : undefined}
                  className="flex flex-col items-center justify-center rounded-2xl bg-white py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 active:scale-[0.98]"
                >
                  <Mic className={`h-6 w-6 mb-1 ${isVoiceEnabled ? 'text-[#2E3A59]' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium text-[#2E3A59]" style={{ fontFamily: 'system-ui, sans-serif' }}>Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl bg-white py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 active:scale-[0.98]"
                >
                  <FileText className="h-6 w-6 text-[#2E3A59] mb-1" />
                  <span className="text-xs font-medium text-[#2E3A59]" style={{ fontFamily: 'system-ui, sans-serif' }}>Upload</span>
                </button>
              </div>
              </div>

              {/* Chat Messages - scrollable main area */}
              <div className={`order-1 lg:order-1 flex-1 flex flex-col min-h-0 overflow-hidden`}>
              <div className={`flex-1 overflow-y-auto min-h-0 p-3 lg:p-3 transition-all duration-500 ${
                isVoiceEnabled ? 'bg-gradient-to-br from-blue-50 to-blue-100 max-lg:from-[#F4F5F9] max-lg:to-[#F4F5F9]' : 'bg-gradient-to-br from-gray-50 to-white max-lg:from-[#F4F5F9] max-lg:to-[#F4F5F9]'
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
                        ? 'bg-gradient-to-r from-blue-100 to-blue-200 animate-pulse' 
                        : 'bg-gradient-to-r from-blue-100 to-blue-200'
                    }`}>
                      <Bot className="h-7 w-7 lg:h-8 lg:w-8 text-blue-600" />
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
                            index === 1 ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 hover:border-blue-400 hover:bg-blue-200' :
                            index === 2 ? 'bg-gradient-to-r from-white to-blue-50 border-blue-300 hover:border-blue-400 hover:bg-blue-100' :
                            'bg-gradient-to-r from-white to-blue-50 border-blue-300 hover:border-blue-400 hover:bg-blue-100'
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
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-center hover:scale-105 transition-transform duration-200">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                          <Image className="h-3 w-3 text-blue-600" />
                        </div>
                        <p className="text-xs font-medium text-blue-700">🖼️ Image Analysis</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-r from-white to-blue-50 border border-blue-200 text-center hover:scale-105 transition-transform duration-200">
                        <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                          <FileText className="h-3 w-3 text-blue-600" />
                        </div>
                        <p className="text-xs font-medium text-blue-700">📄 PDF Review</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {currentChat?.messages.map(renderMessage)}
                  </div>
                )}

                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-end">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 mb-1 transition-all duration-300 ${
                        isVoiceEnabled 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
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
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} style={{ height: '20px' }} />
              </div>
              </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar - Desktop Only */}
          <div className="hidden lg:block space-y-6">
            {/* Quick Questions */}
            <div className={`rounded-2xl shadow-lg p-6 transition-all duration-500 ${
              isVoiceEnabled 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200' 
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
                        : 'border-gray-100 hover:border-blue-200'
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
                ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
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