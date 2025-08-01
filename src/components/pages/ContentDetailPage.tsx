import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Download, FileText, Image, Video, BookOpen, ChevronRight, X, Maximize2, Minimize2, Eye, Star, Rocket, Heart, Sparkles, GraduationCap, Award, Crown, Lock, Gift } from 'lucide-react';
import { getSubcategories } from '../../api';
import { SubcategoriesResponse, User } from '../../types/api';

interface ContentDetailPageProps {
  subcategoryId: string;
  subcategoryName: string;
  onBack: () => void;
  userData: User;
  onNavigateToSubscription: () => void;
}

type ContentTab = 'images' | 'text' | 'video' | 'pdf';

export const ContentDetailPage: React.FC<ContentDetailPageProps> = ({ 
  subcategoryId, 
  subcategoryName, 
  onBack, 
  userData, 
  onNavigateToSubscription 
}) => {
  const [content, setContent] = useState<SubcategoriesResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedContent, setSelectedContent] = useState<{ id: string; name: string } | null>(null);
  const [deepContent, setDeepContent] = useState<SubcategoriesResponse[]>([]);
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepError, setDeepError] = useState('');
  const [navigationStack, setNavigationStack] = useState<Array<{ id: string; name: string }>>([]);
  const [focusedItem, setFocusedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>('images');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getSubcategories(subcategoryId);
        setContent(data);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [subcategoryId]);

  // Handle deep learning navigation
  const handleStartLearning = async (contentId: string, contentName: string) => {
    setNavigationStack(prev => [...prev, { id: contentId, name: contentName }]);
    setSelectedContent({ id: contentId, name: contentName });
    setDeepLoading(true);
    setDeepError('');
    
    try {
      const data = await getSubcategories(contentId);
      setDeepContent(data);
    } catch (err) {
      console.error('Error fetching deep content:', err);
      setDeepError('Failed to load learning content. Please try again.');
    } finally {
      setDeepLoading(false);
    }
  };

  // Handle back navigation from deep content
  const handleBackFromDeep = () => {
    if (navigationStack.length > 0) {
      const newStack = navigationStack.slice(0, -1);
      setNavigationStack(newStack);
      
      if (newStack.length === 0) {
        setSelectedContent(null);
        setDeepContent([]);
        setDeepError('');
      } else {
        const previousLevel = newStack[newStack.length - 1];
        setSelectedContent(previousLevel);
        fetchContentForLevel(previousLevel.id);
      }
    } else {
      setSelectedContent(null);
      setDeepContent([]);
      setDeepError('');
    }
  };

  // Fetch content for a specific level
  const fetchContentForLevel = async (levelId: string) => {
    setDeepLoading(true);
    setDeepError('');
    
    try {
      const data = await getSubcategories(levelId);
      setDeepContent(data);
    } catch (err) {
      console.error('Error fetching content for level:', err);
      setDeepError('Failed to load content for this level. Please try again.');
    } finally {
      setDeepLoading(false);
    }
  };

  const handleContentClick = (item: any) => {
    if (item.content?.pdfUrl) {
      window.open(item.content.pdfUrl, '_blank');
    } else if (item.content?.videoUrl) {
      window.open(item.content.videoUrl, '_blank');
    }
  };

  // Check if content has any media (images, PDFs, videos, text)
  const hasMediaContent = (item: any) => {
    return (
      (item.content?.imageUrls && item.content.imageUrls.length > 0) ||
      item.content?.pdfUrl ||
      item.content?.videoUrl ||
      item.content?.text
    );
  };

  // Check if content has study materials (for Study Materials button)
  const hasStudyMaterials = (item: any) => {
    return (
      (item.content?.imageUrls && item.content.imageUrls.length > 0) ||
      item.content?.pdfUrl ||
      item.content?.videoUrl ||
      item.content?.text
    );
  };

  // Handle focus on specific item
  const handleFocusItem = (item: any) => {
    setFocusedItem(item);
    // Set default tab based on available content
    if (item.content?.imageUrls && item.content.imageUrls.length > 0) {
      setActiveTab('images');
    } else if (item.content?.text) {
      setActiveTab('text');
    } else if (item.content?.videoUrl) {
      setActiveTab('video');
    } else if (item.content?.pdfUrl) {
      setActiveTab('pdf');
    }
  };

  // Handle back from focused view
  const handleBackFromFocus = () => {
    setFocusedItem(null);
    setActiveTab('images');
    setSelectedImage(null);
  };

  // Handle image selection for fullscreen view
  const handleImageClick = (imageUrl: string, allImages: string[] = [], index: number = 0) => {
    console.log('Image clicked:', imageUrl, 'Index:', index, 'Total images:', allImages.length);
    setSelectedImage(imageUrl);
    setImageUrls(allImages);
    setCurrentImageIndex(index);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle image navigation
  const handlePreviousImage = () => {
    if (imageUrls.length > 1) {
      const newIndex = currentImageIndex === 0 ? imageUrls.length - 1 : currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(imageUrls[newIndex]);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleNextImage = () => {
    if (imageUrls.length > 1) {
      const newIndex = currentImageIndex === imageUrls.length - 1 ? 0 : currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      setSelectedImage(imageUrls[newIndex]);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  // Handle zoom functionality
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage) {
        switch (e.key) {
          case 'Escape':
            setSelectedImage(null);
            break;
          case 'ArrowLeft':
            handlePreviousImage();
            break;
          case 'ArrowRight':
            handleNextImage();
            break;
          case '+':
          case '=':
            handleZoomIn();
            break;
          case '-':
            handleZoomOut();
            break;
          case '0':
            handleResetZoom();
            break;
        }
      }
      
      // PDF fullscreen keyboard support
      if (isFullscreen) {
        switch (e.key) {
          case 'Escape':
            handleFullscreenToggle();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentImageIndex, imageUrls, zoomLevel, isFullscreen]);

  // Enhanced Image Modal with zoom and carousel
  const ImageModal = () => {
    if (!selectedImage) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedImage(null);
          }
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-50 p-3 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Zoom Controls */}
          <div className="absolute top-4 left-4 z-20 flex space-x-2">
            <button
              onClick={handleZoomOut}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              title="Zoom Out"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-full hover:bg-opacity-70 transition-colors text-sm"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              title="Zoom In"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Image Container */}
          <div 
            className="relative overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={selectedImage}
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                cursor: zoomLevel > 1 ? 'grab' : 'default'
              }}
              onError={(e) => {
                console.error('Image failed to load:', selectedImage);
                e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', selectedImage);
              }}
            />
          </div>

          {/* Navigation Arrows */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={handlePreviousImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors z-20"
                title="Previous Image"
              >
                <ChevronRight className="h-6 w-6 rotate-180" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors z-20"
                title="Next Image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full z-20">
              {currentImageIndex + 1} / {imageUrls.length}
            </div>
          )}

          {/* Keyboard Shortcuts Help */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-xs z-20">
            <div>← → Navigate</div>
            <div>+ - Zoom</div>
            <div>0 Reset</div>
            <div>ESC Close</div>
          </div>
        </div>
      </div>
    );
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Custom PDF viewer component
  const CustomPDFViewer = ({ pdfUrl }: { pdfUrl: string }) => {
    const [pdfError, setPdfError] = useState(false);
    const [viewerType, setViewerType] = useState<'google' | 'direct' | 'mozilla'>('google');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [iframeKey, setIframeKey] = useState(0);
    const [loadingTimeout, setLoadingTimeout] = useState<number | null>(null);
    
    // Reset loading state when PDF URL changes
    useEffect(() => {
      setIsLoading(true);
      setPdfError(false);
      setViewerType('google');
      setIframeKey(prev => prev + 1);
      
      // Clear any existing timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      
      // Set a timeout to handle slow loading
      const timeout = setTimeout(() => {
        if (isLoading) {
          handleViewerError();
        }
      }, 15000); // 15 seconds timeout
      
      setLoadingTimeout(timeout);
      
      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }, [pdfUrl]);
    
    // Multiple PDF viewer options
    const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
    const mozillaViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;
    const directPdfUrl = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`;
    
    const getViewerUrl = () => {
      switch (viewerType) {
        case 'google':
          return googleDocsUrl;
        case 'direct':
          return directPdfUrl;
        case 'mozilla':
          return mozillaViewerUrl;
        default:
          return googleDocsUrl;
      }
    };
    
    const handleViewerError = () => {
      setIsLoading(false);
      
      // Clear timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
      
      if (viewerType === 'google') {
        setViewerType('direct');
        setIsLoading(true);
        setIframeKey(prev => prev + 1);
        
        // Set new timeout for next attempt
        const timeout = setTimeout(() => {
          if (isLoading) {
            handleViewerError();
          }
        }, 10000);
        setLoadingTimeout(timeout);
      } else if (viewerType === 'direct') {
        setViewerType('mozilla');
        setIsLoading(true);
        setIframeKey(prev => prev + 1);
        
        // Set new timeout for next attempt
        const timeout = setTimeout(() => {
          if (isLoading) {
            handleViewerError();
          }
        }, 10000);
        setLoadingTimeout(timeout);
      } else {
        setPdfError(true);
        setIsLoading(false);
      }
    };

    const handleViewerLoad = () => {
      setIsLoading(false);
      setPdfError(false);
      
      // Clear timeout on successful load
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    };

    const retryLoading = () => {
      setPdfError(false);
      setViewerType('google');
      setIsLoading(true);
      setIframeKey(prev => prev + 1);
      
      // Set timeout for retry
      const timeout = setTimeout(() => {
        if (isLoading) {
          handleViewerError();
        }
      }, 15000);
      setLoadingTimeout(timeout);
    };

    const handleFullscreenToggle = () => {
      setIsFullscreen(!isFullscreen);
    };

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full max-w-7xl max-h-full p-4">
            <button
              onClick={handleFullscreenToggle}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="bg-white rounded-lg shadow-2xl h-full overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">PDF Preview - Fullscreen</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">View Only</span>
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="h-full relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium">Loading PDF...</p>
                      <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your document</p>
                      {loadingTimeout && (
                        <p className="text-xs text-gray-400 mt-2">This may take a few moments</p>
                      )}
                    </div>
                  </div>
                )}
                {!pdfError ? (
                  <iframe
                    key={iframeKey}
                    src={getViewerUrl()}
                    title="PDF viewer"
                    className="w-full h-full"
                    frameBorder="0"
                    onError={handleViewerError}
                    onLoad={handleViewerLoad}
                    sandbox="allow-same-origin allow-scripts allow-forms"
                  ></iframe>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">PDF preview not available</p>
                      <div className="space-y-2">
                        <button
                          onClick={() => window.open(pdfUrl, '_blank')}
                          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                        >
                          <Download className="h-4 w-4" />
                          <span>Open PDF</span>
                        </button>
                        <button
                          onClick={retryLoading}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">PDF Preview</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">View Only</span>
              <Eye className="h-4 w-4 text-gray-400" />
              <button
                onClick={handleFullscreenToggle}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                title="Fullscreen view"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="aspect-[16/9] bg-gray-50 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <p className="text-gray-600 font-medium">Loading PDF...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your document</p>
                <div className="mt-4 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                {loadingTimeout && (
                  <p className="text-xs text-gray-400 mt-2">This may take a few moments</p>
                )}
              </div>
            </div>
          )}
          {!pdfError ? (
            <iframe
              key={iframeKey}
              src={getViewerUrl()}
              title="PDF viewer"
              className="w-full h-full"
              frameBorder="0"
              onError={handleViewerError}
              onLoad={handleViewerLoad}
              sandbox="allow-same-origin allow-scripts allow-forms"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">PDF preview not available</p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Download className="h-4 w-4" />
                    <span>Open PDF</span>
                  </button>
                  <button
                    onClick={retryLoading}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Color themes for different content cards
  const contentColorThemes = [
    { bg: 'from-pink-100 to-rose-100', border: 'border-pink-200', icon: 'bg-pink-500', text: 'text-pink-700', button: 'bg-pink-500 hover:bg-pink-600', accent: 'text-pink-600' },
    { bg: 'from-blue-100 to-indigo-100', border: 'border-blue-200', icon: 'bg-blue-500', text: 'text-blue-700', button: 'bg-blue-500 hover:bg-blue-600', accent: 'text-blue-600' },
    { bg: 'from-green-100 to-emerald-100', border: 'border-green-200', icon: 'bg-green-500', text: 'text-green-700', button: 'bg-green-500 hover:bg-green-600', accent: 'text-green-600' },
    { bg: 'from-orange-100 to-amber-100', border: 'border-orange-200', icon: 'bg-orange-500', text: 'text-orange-700', button: 'bg-orange-500 hover:bg-orange-600', accent: 'text-orange-600' },
    { bg: 'from-purple-100 to-violet-100', border: 'border-purple-200', icon: 'bg-purple-500', text: 'text-purple-700', button: 'bg-purple-500 hover:bg-purple-600', accent: 'text-purple-600' },
    { bg: 'from-teal-100 to-cyan-100', border: 'border-teal-200', icon: 'bg-teal-500', text: 'text-teal-700', button: 'bg-teal-500 hover:bg-teal-600', accent: 'text-teal-600' },
    { bg: 'from-yellow-100 to-orange-100', border: 'border-yellow-200', icon: 'bg-yellow-500', text: 'text-yellow-700', button: 'bg-yellow-500 hover:bg-yellow-600', accent: 'text-yellow-600' },
    { bg: 'from-red-100 to-pink-100', border: 'border-red-200', icon: 'bg-red-500', text: 'text-red-700', button: 'bg-red-500 hover:bg-red-600', accent: 'text-red-600' },
  ];

  // Fun icons for different content types
  const contentIcons = [BookOpen, Star, Rocket, Heart, Sparkles, GraduationCap, Play, Award];

  // Get theme and icon for content card
  const getContentTheme = (index: number) => {
    const themeIndex = index % contentColorThemes.length;
    const iconIndex = index % contentIcons.length;
    return {
      theme: contentColorThemes[themeIndex],
      IconComponent: contentIcons[iconIndex]
    };
  };

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    return userData?.subscription?.isActive === true;
  };

  // Check if content requires subscription
  const requiresSubscription = (item: any) => {
    return item.content && (
      (item.content.pdfUrl && item.content.pdfUrl.length > 0) ||
      (item.content.videoUrl && item.content.videoUrl.length > 0) ||
      (item.content.imageUrls && item.content.imageUrls.length > 0)
    );
  };

  // Subscription Prompt Component
  const SubscriptionPrompt = ({ item }: { item: any }) => {
    const { theme, IconComponent } = getContentTheme(0);
    
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
        <div className="text-center space-y-4">
          {/* Header */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Premium Content</h3>
              <p className="text-sm text-gray-600">Unlock amazing learning materials!</p>
            </div>
          </div>

          {/* Content Preview */}
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme.icon}`}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                <p className="text-xs text-gray-600">{item.type}</p>
              </div>
            </div>
            
            {/* Content Type Indicators */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
              {item.content?.pdfUrl && (
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>PDF</span>
                </div>
              )}
              {item.content?.videoUrl && (
                <div className="flex items-center space-x-1">
                  <Video className="h-3 w-3" />
                  <span>Video</span>
                </div>
              )}
              {item.content?.imageUrls && item.content.imageUrls.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Image className="h-3 w-3" />
                  <span>{item.content.imageUrls.length} Images</span>
                </div>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span>Access to all premium study materials</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Video className="h-4 w-4 text-blue-500" />
              <span>HD video lessons and tutorials</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <FileText className="h-4 w-4 text-green-500" />
              <span>Downloadable PDF study guides</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <Image className="h-4 w-4 text-purple-500" />
              <span>High-quality learning images</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onNavigateToSubscription}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <Gift className="h-5 w-5" />
            <span>Get Premium Access</span>
          </button>

          {/* Additional Info */}
          <p className="text-xs text-gray-500">
            Start your learning journey with premium content today!
          </p>
        </div>
      </div>
    );
  };

  // If focused item is selected, show the detailed tabbed view
  if (focusedItem) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setFocusedItem(null)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{focusedItem.name}</h2>
              <p className="text-gray-600">Study Materials</p>
            </div>
          </div>
          {/* Subscription Status */}
          <div className="flex items-center space-x-2">
            {hasActiveSubscription() ? (
              <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <Crown className="h-4 w-4" />
                <span>Premium Active</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                <Lock className="h-4 w-4" />
                <span>Free Plan</span>
              </div>
            )}
          </div>
        </div>

        {/* Check subscription for premium content */}
        {requiresSubscription(focusedItem) && !hasActiveSubscription() ? (
          <SubscriptionPrompt item={focusedItem} />
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {focusedItem.content.imageUrls && focusedItem.content.imageUrls.length > 0 && (
                  <button
                    onClick={() => setActiveTab('images')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'images'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Images ({focusedItem.content.imageUrls.length})
                  </button>
                )}
                {focusedItem.content.text && (
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'text'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Notes
                  </button>
                )}
                {focusedItem.content.videoUrl && (
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'video'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Video
                  </button>
                )}
                {focusedItem.content.pdfUrl && (
                  <button
                    onClick={() => setActiveTab('pdf')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'pdf'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    PDF
                  </button>
                )}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'images' && focusedItem.content.imageUrls && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {focusedItem.content.imageUrls.map((imageUrl: string, index: number) => (
                      <div key={index} className="relative group cursor-pointer">
                        <img
                          src={imageUrl}
                          alt={`Study image ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                          onClick={() => handleImageClick(imageUrl, focusedItem.content.imageUrls, index)}
                          onError={(e) => {
                            console.error('Image failed to load:', imageUrl);
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', imageUrl);
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                          Click to view
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'text' && focusedItem.content.text && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Notes</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{focusedItem.content.text}</p>
                  </div>
                </div>
              )}

              {activeTab === 'video' && focusedItem.content.videoUrl && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Video Lesson</h3>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(focusedItem.content.videoUrl)}`}
                      title="Video lesson"
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              {activeTab === 'pdf' && focusedItem.content.pdfUrl && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Study Guide (PDF)</h3>
                  <CustomPDFViewer pdfUrl={focusedItem.content.pdfUrl} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // If deep content is selected, show the detailed learning view
  if (selectedContent) {
    return (
      <div className="space-y-6">
        {/* Deep Content Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackFromDeep}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedContent.name}</h2>
              <p className="text-sm text-gray-600">Learning Materials</p>
            </div>
          </div>
        </div>

        {/* Navigation Breadcrumb */}
        {navigationStack.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Path:</span>
            {navigationStack.map((level, index) => (
              <React.Fragment key={level.id}>
                <span className="text-blue-600">{level.name}</span>
                {index < navigationStack.length - 1 && <ChevronRight className="h-4 w-4" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {deepLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading learning materials...</span>
          </div>
        )}

        {deepError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{deepError}</p>
          </div>
        )}

        {!deepLoading && !deepError && deepContent.length > 0 && (
          <div className="space-y-6">
            {deepContent.map((categoryData) =>
              categoryData.subcategories.map((item, index) => {
                const { theme, IconComponent } = getContentTheme(index);
                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Content Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme.icon}`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600">
                              {item.content?.text || 'No description available'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    {/* Content Media */}
                    {item.content && hasMediaContent(item) && (
                      <div className="p-6 space-y-4">
                        {/* Check subscription for premium content */}
                        {requiresSubscription(item) && !hasActiveSubscription() ? (
                          <SubscriptionPrompt item={item} />
                        ) : (
                          <>
                            {/* Images */}
                            {item.content.imageUrls && item.content.imageUrls.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                  <Image className="h-4 w-4 mr-2" />
                                  Images ({item.content.imageUrls.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {item.content.imageUrls.map((imageUrl, index) => (
                                    <div key={index} className="relative group cursor-pointer">
                                      <img
                                        src={imageUrl}
                                        alt={`Learning image ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
                                        onClick={() => handleImageClick(imageUrl, item.content.imageUrls, index)}
                                        onError={(e) => {
                                          console.error('Image failed to load:', imageUrl);
                                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-2 rounded-full transition-all duration-200">
                                          <Maximize2 className="h-4 w-4 text-gray-700" />
                                        </div>
                                      </div>
                                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                        Click to view
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Text Content */}
                            {item.content.text && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Description
                                </h4>
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <p className="text-gray-700 leading-relaxed">{item.content.text}</p>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                              {hasStudyMaterials(item) && (
                                <button 
                                  onClick={() => handleFocusItem(item)}
                                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <BookOpen className="h-4 w-4" />
                                  <span>Study Materials</span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* If no media content, show a message */}
                    {item.content && !hasMediaContent(item) && (
                      <div className="p-6">
                        <div className="text-center py-4">
                          <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">No media content available</p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                          <button 
                            onClick={() => handleStartLearning(item._id, item.name)}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span>Start Learning</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>ID: {item._id.slice(-8)}</span>
                        <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {!deepLoading && !deepError && deepContent.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No learning materials available for this section.</p>
          </div>
        )}

        {/* Fullscreen Image Modal */}
        {selectedImage && (
          <ImageModal />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{subcategoryName}</h2>
            <p className="text-sm text-gray-600">Learning Content</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading content...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && content.length > 0 && (
        <div className="space-y-6">
          {content.map((categoryData) =>
            categoryData.subcategories.map((item, index) => {
              const { theme, IconComponent } = getContentTheme(index);
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Content Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme.icon}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">
                            {item.content?.text || 'No description available'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {item.type}
                      </span>
                    </div>
                  </div>

                  {/* Content Media */}
                  {item.content && hasMediaContent(item) && (
                    <div className="p-6 space-y-4">
                      {/* Check subscription for premium content */}
                      {requiresSubscription(item) && !hasActiveSubscription() ? (
                        <SubscriptionPrompt item={item} />
                      ) : (
                        <>
                          {/* Images */}
                          {item.content.imageUrls && item.content.imageUrls.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                <Image className="h-4 w-4 mr-2" />
                                Images ({item.content.imageUrls.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {item.content.imageUrls.map((imageUrl, index) => (
                                  <div key={index} className="relative group cursor-pointer">
                                    <img
                                      src={imageUrl}
                                      alt={`Content image ${index + 1}`}
                                      className="w-full h-48 object-cover rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
                                      onClick={() => handleImageClick(imageUrl, item.content.imageUrls, index)}
                                      onError={(e) => {
                                        console.error('Image failed to load:', imageUrl);
                                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-2 rounded-full transition-all duration-200">
                                        <Maximize2 className="h-4 w-4 text-gray-700" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Text Content */}
                          {item.content.text && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                Description
                              </h4>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 leading-relaxed">{item.content.text}</p>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                            {/* {item.content.pdfUrl && (
                              <button
                                onClick={() => handleContentClick(item)}
                                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download PDF</span>
                              </button>
                            )} */}
                            
                            {/* {item.content.videoUrl && (
                              <button
                                onClick={() => handleContentClick(item)}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Video className="h-4 w-4" />
                                <span>Watch Video</span>
                              </button>
                            )} */}

                            {hasStudyMaterials(item) && (
                              <button 
                                onClick={() => handleFocusItem(item)}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <BookOpen className="h-4 w-4" />
                                <span>Study Materials</span>
                              </button>
                            )}

                            {/* <button 
                              onClick={() => handleStartLearning(item._id, item.name)}
                              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <ChevronRight className="h-4 w-4" />
                              <span>Start Learning</span>
                            </button> */}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* If no media content, show a message */}
                  {item.content && !hasMediaContent(item) && (
                    <div className="p-6">
                      <div className="text-center py-4">
                        <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">No media content available</p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                        <button 
                          onClick={() => handleStartLearning(item._id, item.name)}
                          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span>Start Learning</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>ID: {item._id.slice(-8)}</span>
                      <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {!loading && !error && content.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No content available for this section.</p>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <ImageModal />
      )}
    </div>
  );
}; 