import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Download, FileText, Image, Video, BookOpen, ChevronRight, X, Maximize2, Minimize2, Eye, Star, Rocket, Heart, Sparkles, GraduationCap, Award, Crown, Lock, Gift, Check, Highlighter, Brain, Loader2, AlertCircle } from 'lucide-react';
import { getSubcategories, generateAINotes } from '../../api';
import { SubcategoriesResponse, User, EnhancedNotesResponse } from '../../types/api';
import { JSONViewer } from '../JSONViewer';

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
  const [highlights, setHighlights] = useState<{[key: string]: Array<{start: number, end: number, color: string, text: string}>}>({});
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#fef3c7'); // Default yellow
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<EnhancedNotesResponse | null>(null);
  const [notesError, setNotesError] = useState('');

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
    
    // Track learning activity in localStorage
    trackLearningActivity(contentId, contentName, 'opened');
    
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

  // Generate AI notes from content
  const handleGenerateAINotes = async () => {
    if (!focusedItem?.content?.text) {
      setNotesError('No text content available to generate notes from.');
      return;
    }

    setIsGeneratingNotes(true);
    setNotesError('');
    setGeneratedNotes(null);

    try {
      const response = await generateAINotes(
        focusedItem.content.text, 
        focusedItem.name, 
        'NCERT Geography'
      );
      setGeneratedNotes(response);
    } catch (err) {
      console.error('Error generating notes:', err);
      setNotesError('Failed to generate notes. Please try again.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // Download generated notes
  const downloadNotes = () => {
    if (!generatedNotes || !focusedItem) return;

    const notesData = {
      topic: focusedItem.name,
      subject: 'NCERT Geography',
      generatedAt: new Date().toISOString(),
      ...generatedNotes
    };

    const blob = new Blob([JSON.stringify(notesData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${focusedItem.name.replace(/\s+/g, '_')}_ai_notes.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Track learning activity in localStorage
  const trackLearningActivity = (contentId: string, contentName: string, action: 'opened' | 'completed' | 'bookmarked') => {
    try {
      const learningHistory = JSON.parse(localStorage.getItem('learningHistory') || '[]');
      const existingEntry = learningHistory.find((entry: any) => entry.contentId === contentId);
      
      if (existingEntry) {
        // Update existing entry
        existingEntry.lastAccessed = new Date().toISOString();
        existingEntry.accessCount = (existingEntry.accessCount || 0) + 1;
        if (action === 'completed') existingEntry.completed = true;
        if (action === 'bookmarked') existingEntry.bookmarked = !existingEntry.bookmarked;
      } else {
        // Create new entry
        learningHistory.push({
          contentId,
          contentName,
          subcategoryId,
          subcategoryName,
          mainCategory: (userData as any)?.parentCategory?.name || 'Unknown',
          firstAccessed: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          accessCount: 1,
          completed: action === 'completed',
          bookmarked: action === 'bookmarked',
          progress: 0
        });
      }
      
      // Keep only last 50 entries to prevent localStorage from getting too large
      if (learningHistory.length > 50) {
        learningHistory.splice(0, learningHistory.length - 50);
      }
      
      localStorage.setItem('learningHistory', JSON.stringify(learningHistory));
    } catch (error) {
      console.error('Error saving learning activity:', error);
    }
  };

  // Handle content focus with tracking
  const handleContentFocus = (item: any) => {
    setFocusedItem(item);
    // Track when user opens specific study material
    trackLearningActivity(item._id || item.id, item.name, 'opened');
  };

  // Mark content as completed
  const markContentCompleted = (contentId: string, contentName: string) => {
    trackLearningActivity(contentId, contentName, 'completed');
    // Update progress in localStorage
    updateProgress(contentId, 100);
  };

  // Update progress for content
  const updateProgress = (contentId: string, progress: number) => {
    try {
      const learningHistory = JSON.parse(localStorage.getItem('learningHistory') || '[]');
      const entry = learningHistory.find((entry: any) => entry.contentId === contentId);
      
      if (entry) {
        entry.progress = Math.max(entry.progress || 0, progress);
        entry.lastAccessed = new Date().toISOString();
        localStorage.setItem('learningHistory', JSON.stringify(learningHistory));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Update progress based on active tab
  const updateProgressForTab = (tab: ContentTab) => {
    if (!focusedItem) return;
    
    let progress = 0;
    switch (tab) {
      case 'images':
        progress = 25;
        break;
      case 'text':
        progress = 50;
        break;
      case 'video':
        progress = 75;
        break;
      case 'pdf':
        progress = 100;
        break;
    }
    
    updateProgress(focusedItem._id || focusedItem.id, progress);
  };

  // Track content interaction for better progress
  const trackContentInteraction = (contentId: string, interactionType: 'viewed' | 'read' | 'watched' | 'downloaded') => {
    try {
      const learningHistory = JSON.parse(localStorage.getItem('learningHistory') || '[]');
      const entry = learningHistory.find((entry: any) => entry.contentId === contentId);
      
      if (entry) {
        // Update progress based on interaction type
        let newProgress = entry.progress || 0;
        switch (interactionType) {
          case 'viewed':
            newProgress = Math.max(newProgress, 25);
            break;
          case 'read':
            newProgress = Math.max(newProgress, 50);
            break;
          case 'watched':
            newProgress = Math.max(newProgress, 75);
            break;
          case 'downloaded':
            newProgress = Math.max(newProgress, 90);
            break;
        }
        
        entry.progress = newProgress;
        entry.lastAccessed = new Date().toISOString();
        localStorage.setItem('learningHistory', JSON.stringify(learningHistory));
      }
    } catch (error) {
      console.error('Error tracking content interaction:', error);
    }
  };

  // Handle tab change with progress tracking
  const handleTabChange = (tab: ContentTab) => {
    setActiveTab(tab);
    updateProgressForTab(tab);
    
    // Track content interaction based on tab
    if (focusedItem) {
      const contentId = focusedItem._id || focusedItem.id;
      switch (tab) {
        case 'images':
          trackContentInteraction(contentId, 'viewed');
          break;
        case 'text':
          trackContentInteraction(contentId, 'read');
          break;
        case 'video':
          trackContentInteraction(contentId, 'watched');
          break;
        case 'pdf':
          trackContentInteraction(contentId, 'downloaded');
          break;
      }
    }
  };

  // Track content interaction when tab content is viewed
  useEffect(() => {
    if (focusedItem && activeTab) {
      const contentId = focusedItem._id || focusedItem.id;
      // Add a small delay to ensure the content is actually loaded
      const timer = setTimeout(() => {
        switch (activeTab) {
          case 'images':
            trackContentInteraction(contentId, 'viewed');
            break;
          case 'text':
            trackContentInteraction(contentId, 'read');
            break;
          case 'video':
            trackContentInteraction(contentId, 'watched');
            break;
          case 'pdf':
            trackContentInteraction(contentId, 'downloaded');
            break;
        }
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, focusedItem]);

  // Toggle bookmark for content
  const toggleBookmark = (contentId: string, contentName: string) => {
    trackLearningActivity(contentId, contentName, 'bookmarked');
  };

  // Get current progress for focused item
  const getCurrentProgress = (): number => {
    if (!focusedItem) return 0;
    
    try {
      const learningHistory = JSON.parse(localStorage.getItem('learningHistory') || '[]');
      const entry = learningHistory.find((entry: any) => entry.contentId === (focusedItem._id || focusedItem.id));
      return entry?.progress || 0;
    } catch (error) {
      return 0;
    }
  };

  // Load highlights from localStorage
  useEffect(() => {
    if (focusedItem) {
      const contentId = focusedItem._id || focusedItem.id;
      const savedHighlights = localStorage.getItem(`highlights_${contentId}`);
      if (savedHighlights) {
        try {
          setHighlights(JSON.parse(savedHighlights));
        } catch (error) {
          console.error('Error loading highlights:', error);
        }
      }
    }
  }, [focusedItem]);

  // Save highlights to localStorage
  const saveHighlights = (contentId: string, newHighlights: any) => {
    try {
      localStorage.setItem(`highlights_${contentId}`, JSON.stringify(newHighlights));
    } catch (error) {
      console.error('Error saving highlights:', error);
    }
  };

  // Toggle highlighting mode
  const toggleHighlighting = () => {
    setIsHighlighting(!isHighlighting);
  };

  // Handle text selection and highlighting
  const handleTextSelection = (sectionIndex: number, qaIndex: number, type: 'question' | 'answer') => {
    if (!isHighlighting || !focusedItem) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (selectedText.length === 0) return;

    console.log('Text selection:', { sectionIndex, qaIndex, type, selectedText });

    const contentId = focusedItem._id || focusedItem.id;
    const highlightKey = `${sectionIndex}_${qaIndex}_${type}`;
    
    // Get the original text content (without HTML)
    let originalText = '';
    if (type === 'question') {
      const qaItem = formatStudyNotes(focusedItem.content.text)[sectionIndex]?.qa?.[qaIndex];
      originalText = qaItem?.question || '';
    } else {
      const qaItem = formatStudyNotes(focusedItem.content.text)[sectionIndex]?.qa?.[qaIndex];
      originalText = qaItem?.answer || '';
    }

    console.log('Original text:', originalText);

    if (!originalText) {
      console.warn('No original text found');
      return;
    }

    // Find the position of selected text in the original text
    const startPos = originalText.indexOf(selectedText);
    if (startPos === -1) {
      console.warn('Selected text not found in original text');
      return;
    }

    const endPos = startPos + selectedText.length;

    // Check if this range overlaps with existing highlights
    const existingHighlights = highlights[highlightKey] || [];
    const hasOverlap = existingHighlights.some(highlight => 
      (startPos < highlight.end && endPos > highlight.start)
    );

    if (hasOverlap) {
      console.log('Highlight overlaps with existing highlight');
      selection.removeAllRanges();
      return;
    }

    // Create new highlight
    const newHighlight = {
      start: startPos,
      end: endPos,
      color: highlightColor,
      text: selectedText
    };

    console.log('Creating new highlight:', newHighlight);

    // Update highlights state
    const updatedHighlights = {
      ...highlights,
      [highlightKey]: [...existingHighlights, newHighlight]
    };

    setHighlights(updatedHighlights);
    saveHighlights(contentId, updatedHighlights);

    // Clear selection
    selection.removeAllRanges();
    console.log('Highlight added successfully');
  };

  // Handle cross-element text selection and highlighting
  const handleCrossElementSelection = () => {
    if (!isHighlighting || !focusedItem) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (selectedText.length === 0) return;

    console.log('Cross-element text selection:', selectedText);

    // Get the specific element where the selection started
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    console.log('Selection containers:', { startContainer, endContainer });
    
    // Find the closest question/answer container
    let targetElement: Element | null = null;
    let sectionIndex = -1;
    let qaIndex = -1;
    let type: 'question' | 'answer' = 'answer';
    
    // Traverse up the DOM to find the question/answer container
    let currentElement: Node | null = startContainer;
    let depth = 0;
    while (currentElement && currentElement !== document.body && depth < 10) {
      if (currentElement.nodeType === Node.ELEMENT_NODE) {
        const element = currentElement as Element;
        console.log(`Checking element at depth ${depth}:`, element.tagName, element.attributes);
        
        // Check if this is a question container
        if (element.hasAttribute('data-section') && element.hasAttribute('data-qa') && element.hasAttribute('data-type')) {
          sectionIndex = parseInt(element.getAttribute('data-section') || '-1');
          qaIndex = parseInt(element.getAttribute('data-qa') || '-1');
          type = element.getAttribute('data-type') as 'question' | 'answer';
          targetElement = element;
          console.log('Found Q&A container:', { sectionIndex, qaIndex, type });
          break;
        }
        
        // Check if this is a section content container
        if (element.hasAttribute('data-section') && element.hasAttribute('data-type') && element.getAttribute('data-type') === 'section-content') {
          sectionIndex = parseInt(element.getAttribute('data-section') || '-1');
          qaIndex = -1; // Section content
          type = 'answer';
          targetElement = element;
          console.log('Found section content container:', { sectionIndex, qaIndex, type });
          break;
        }
      }
      currentElement = currentElement.parentNode;
      depth++;
    }

    if (!targetElement || sectionIndex === -1) {
      console.log('Could not determine target element for highlighting');
      selection.removeAllRanges();
      return;
    }

    console.log('Target element found:', { sectionIndex, qaIndex, type });

    // Get the original text content for the specific element
    let originalText = '';
    if (qaIndex === -1) {
      // Section content
      const section = formatStudyNotes(focusedItem.content.text)[sectionIndex];
      originalText = section?.content || '';
      console.log('Section content text:', originalText);
    } else {
      // Question or answer
      const section = formatStudyNotes(focusedItem.content.text)[sectionIndex];
      const qaItem = section?.qa?.[qaIndex];
      console.log('QA item found:', qaItem);
      if (type === 'question') {
        originalText = qaItem?.question || '';
        console.log('Question text:', originalText);
      } else {
        originalText = qaItem?.answer || '';
        console.log('Answer text:', originalText);
      }
    }

    if (!originalText) {
      console.warn('No original text found for target element');
      selection.removeAllRanges();
      return;
    }

    // Find the position of selected text in the original text
    const startPos = originalText.indexOf(selectedText);
    if (startPos === -1) {
      console.warn('Selected text not found in original text');
      selection.removeAllRanges();
      return;
    }

    const endPos = startPos + selectedText.length;

    // Create highlight key for the specific element
    const contentId = focusedItem._id || focusedItem.id;
    const highlightKey = qaIndex === -1 
      ? `${sectionIndex}_section_${type}`
      : `${sectionIndex}_${qaIndex}_${type}`;

    // Check for overlaps with existing highlights
    const existingHighlights = highlights[highlightKey] || [];
    const hasOverlap = existingHighlights.some(highlight => 
      (startPos < highlight.end && endPos > highlight.start)
    );

    if (hasOverlap) {
      console.log('Highlight overlaps with existing highlight');
      selection.removeAllRanges();
      return;
    }

    // Create new highlight
    const newHighlight = {
      start: startPos,
      end: endPos,
      color: highlightColor,
      text: selectedText
    };

    console.log('Creating new highlight:', newHighlight);

    // Update highlights state for the specific element only
    const updatedHighlights = {
      ...highlights,
      [highlightKey]: [...existingHighlights, newHighlight]
    };

    setHighlights(updatedHighlights);
    saveHighlights(contentId, updatedHighlights);

    // Clear selection
    selection.removeAllRanges();
    console.log('Highlight added successfully to specific element');
  };

  // Remove specific highlight
  const removeHighlight = (sectionIndex: number, qaIndex: number, type: 'question' | 'answer', highlightIndex: number) => {
    if (!focusedItem) return;

    const contentId = focusedItem._id || focusedItem.id;
    const highlightKey = qaIndex === -1 
      ? `${sectionIndex}_section_${type}`
      : `${sectionIndex}_${qaIndex}_${type}`;
    
    const updatedHighlights = { ...highlights };
    if (updatedHighlights[highlightKey]) {
      updatedHighlights[highlightKey].splice(highlightIndex, 1);
      if (updatedHighlights[highlightKey].length === 0) {
        delete updatedHighlights[highlightKey];
      }
    }

    setHighlights(updatedHighlights);
    saveHighlights(contentId, updatedHighlights);
  };

  // Clear all highlights for current content
  const clearAllHighlights = () => {
    if (!focusedItem) return;

    const contentId = focusedItem._id || focusedItem.id;
    setHighlights({});
    localStorage.removeItem(`highlights_${contentId}`);
  };

  // Apply highlights to text
  const applyHighlights = (text: string | object, sectionIndex: number, qaIndex: number, type: 'question' | 'answer') => {
    // Ensure text is a string
    const textContent = typeof text === 'string' ? text : String(text || '');
    const highlightKey = `${sectionIndex}_${qaIndex}_${type}`;
    const contentHighlights = highlights[highlightKey] || [];
    
    console.log(`Applying highlights for ${highlightKey}:`, contentHighlights);
    console.log(`Text to highlight: "${textContent}"`);
    
    if (contentHighlights.length === 0) return textContent;

    // Sort highlights by start position
    const sortedHighlights = [...contentHighlights].sort((a, b) => a.start - b.start);
    
    let result = '';
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, highlightIndex) => {
      // Validate highlight positions
      if (highlight.start < 0 || highlight.end > textContent.length || highlight.start >= highlight.end) {
        console.warn('Invalid highlight positions:', highlight, 'for text length:', textContent.length);
        return;
      }

      // Add text before highlight
      result += textContent.slice(lastIndex, highlight.start);
      
      // Add highlighted text
      result += `<span class="highlighted-text" style="background-color: ${highlight.color}; padding: 1px 2px; border-radius: 3px; position: relative;" data-highlight-index="${highlightIndex}" data-highlight-type="${type}">`;
      result += textContent.slice(highlight.start, highlight.end);
      result += `<button class="remove-highlight-btn" onclick="removeHighlightFromText(${sectionIndex}, ${qaIndex}, '${type}', ${highlightIndex})" style="position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: none;">×</button>`;
      result += '</span>';
      
      lastIndex = highlight.end;
    });

    // Add remaining text
    result += textContent.slice(lastIndex);
    
    return result;
  };

  // Apply highlights to section content
  const applySectionHighlights = (text: string | object, sectionIndex: number) => {
    // Ensure text is a string
    const textContent = typeof text === 'string' ? text : String(text || '');
    const highlightKey = `${sectionIndex}_section_answer`;
    const contentHighlights = highlights[highlightKey] || [];
    
    if (contentHighlights.length === 0) return textContent;

    // Sort highlights by start position
    const sortedHighlights = [...contentHighlights].sort((a, b) => a.start - b.start);
    
    let result = '';
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, highlightIndex) => {
      // Validate highlight positions
      if (highlight.start < 0 || highlight.end > textContent.length || highlight.start >= highlight.end) {
        console.warn('Invalid highlight positions:', highlight, 'for text length:', textContent.length);
        return;
      }

      // Add text before highlight
      result += textContent.slice(lastIndex, highlight.start);
      
      // Add highlighted text
      result += `<span class="highlighted-text" style="background-color: ${highlight.color}; padding: 1px 2px; border-radius: 3px; position: relative;" data-highlight-index="${highlightIndex}" data-highlight-type="section-content">`;
      result += textContent.slice(highlight.start, highlight.end);
      result += `<button class="remove-highlight-btn" onclick="removeHighlightFromText(${sectionIndex}, -1, 'answer', ${highlightIndex})" style="position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: none;">×</button>`;
      result += '</span>';
      
      lastIndex = highlight.end;
    });

    // Add remaining text
    result += textContent.slice(lastIndex);
    
    return result;
  };

  // Highlight color options
  const highlightColors = [
    { color: '#fef3c7', name: 'Yellow' },
    { color: '#fecaca', name: 'Red' },
    { color: '#bbf7d0', name: 'Green' },
    { color: '#bfdbfe', name: 'Blue' },
    { color: '#e9d5ff', name: 'Purple' },
    { color: '#fed7aa', name: 'Orange' }
  ];

  // Add event listener for removing highlights
  useEffect(() => {
    const handleRemoveHighlight = (event: CustomEvent) => {
      const { sectionIndex, qaIndex, type, highlightIndex } = event.detail;
      removeHighlight(sectionIndex, qaIndex, type as 'question' | 'answer', highlightIndex);
    };

    window.addEventListener('removeHighlight', handleRemoveHighlight as EventListener);
    
    return () => {
      window.removeEventListener('removeHighlight', handleRemoveHighlight as EventListener);
    };
  }, []);

  // Add CSS styles for highlighted text
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .highlighted-text {
        position: relative;
        display: inline;
        border-radius: 3px;
        transition: all 0.2s ease;
        border: 1px solid rgba(0,0,0,0.1);
      }
      
      .highlighted-text:hover {
        transform: scale(1.02);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        border-color: rgba(0,0,0,0.2);
      }
      
      .highlighted-text:hover .remove-highlight-btn {
        display: block !important;
      }
      
      .remove-highlight-btn {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        font-size: 10px;
        cursor: pointer;
        display: none;
        z-index: 10;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .remove-highlight-btn:hover {
        background: #dc2626;
        transform: scale(1.1);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      
      /* Different highlight styles for different content types */
      .highlighted-text[data-highlight-type="question"] {
        border-left: 3px solid #3b82f6;
      }
      
      .highlighted-text[data-highlight-type="answer"] {
        border-left: 3px solid #10b981;
      }
      
      .highlighted-text[data-highlight-type="section-content"] {
        border-left: 3px solid #8b5cf6;
      }
      
      /* Hide scrollbar for mobile */
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      
      /* Mobile-specific improvements */
      @media (max-width: 640px) {
        .mobile-text-wrap {
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        
        .mobile-flex-wrap {
          flex-wrap: wrap;
        }
        
        .mobile-gap {
          gap: 0.5rem;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    // Track when user opens specific study material
    trackLearningActivity(item._id || item.id, item.name, 'opened');
    
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

  // Format study notes with regex parsing for Q&A structure
  const formatStudyNotes = (text: string | object) => {
    // Handle case where text might be an object instead of string
    let textContent = '';
    if (typeof text === 'string') {
      textContent = text;
    } else if (typeof text === 'object' && text !== null) {
      // If it's an object, try to extract text content
      if (Array.isArray(text)) {
        textContent = text.join('\n');
      } else {
        // Convert object to readable text format
        textContent = Object.entries(text).map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key}: ${value}`;
          } else if (typeof value === 'object' && value !== null) {
            return `${key}: ${JSON.stringify(value, null, 2)}`;
          }
          return `${key}: ${String(value)}`;
        }).join('\n');
      }
    } else {
      textContent = String(text || '');
    }
    const sections: Array<{
      title?: string;
      subtitle?: string;
      qa?: Array<{ question: string; answer: string }>;
      content?: string;
    }> = [];

    // Split text into lines and process
    const lines = textContent.split('\n').filter(line => line.trim());
    let currentSection: any = {};
    let currentQA: any = null;
    let isInQA = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for section titles (lines with dashes or main headings)
      if (line.includes('-') && line.includes('Questions') || line.includes('Democracy') || line.includes('Features')) {
        if (currentSection.title || currentSection.qa || currentSection.content) {
          sections.push({ ...currentSection });
        }
        currentSection = { title: line };
        isInQA = false;
        continue;
      }

      // Check for subtitles (lines that might be section descriptions)
      if (line.includes('Two Tales') || line.includes('Expansion')) {
        if (currentSection.title) {
          currentSection.subtitle = line;
        }
        continue;
      }

      // Check for questions (lines starting with Q or containing question marks)
      if (line.startsWith('Q') || line.includes('?') || (line.includes('Who') || line.includes('What') || line.includes('Describe') || line.includes('Trace'))) {
        if (currentQA) {
          if (currentSection.qa) {
            currentSection.qa.push(currentQA);
          } else {
            currentSection.qa = [currentQA];
          }
        }
        currentQA = { question: line, answer: '' };
        isInQA = true;
        continue;
      }

      // Check for answers (lines starting with Answer: or containing key information)
      if (isInQA && currentQA && (line.startsWith('Answer:') || line.startsWith('*') || line.includes('was the president') || line.includes('ruled by') || line.includes('form of government') || line.includes('1900:'))) {
        if (line.startsWith('Answer:')) {
          currentQA.answer = line.replace('Answer:', '').trim();
        } else if (line.startsWith('*')) {
          currentQA.answer = line.replace('*', '').trim();
        } else {
          currentQA.answer = line;
        }
        continue;
      }

      // If we're in QA mode and have a current question, append to answer
      if (isInQA && currentQA && currentQA.answer && line) {
        currentQA.answer += ' ' + line;
      }

      // If we're not in QA mode and have content, add to section content
      if (!isInQA && line && !currentSection.title) {
        if (currentSection.content) {
          currentSection.content += ' ' + line;
        } else {
          currentSection.content = line;
        }
      }
    }

    // Add the last QA item if exists
    if (currentQA && currentQA.question) {
      if (currentSection.qa) {
        currentSection.qa.push(currentQA);
      } else {
        currentSection.qa = [currentQA];
      }
    }

    // Add the last section
    if (currentSection.title || currentSection.qa || currentSection.content) {
      sections.push({ ...currentSection });
    }

    return sections;
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
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 px-2 sm:px-0">
        {/* Header - Fixed mobile layout */}
        <div className="space-y-3 sm:space-y-4">
          {/* Main Header Row */}
          <div className="flex items-start space-x-2 sm:space-x-3">
            <button
              onClick={() => setFocusedItem(null)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 mt-1"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight pr-2">{focusedItem.name}</h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">Study Materials</p>
            </div>
          </div>
          
          {/* Action Controls - Improved mobile stacking */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:space-x-3">
            {/* Left side controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Progress Indicator */}
              <div className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-lg flex-shrink-0">
                <span className="text-xs text-gray-600 font-medium hidden sm:inline">Progress</span>
                <span className="text-xs text-gray-600 font-medium sm:hidden">Prog</span>
                <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getCurrentProgress()}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{getCurrentProgress()}%</span>
              </div>
              
              {/* Bookmark Button */}
              <button
                onClick={() => toggleBookmark(focusedItem._id || focusedItem.id, focusedItem.name)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-yellow-50 transition-colors flex-shrink-0"
                title="Bookmark this content"
              >
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              {/* Mark as Complete Button */}
              <button
                onClick={() => markContentCompleted(focusedItem._id || focusedItem.id, focusedItem.name)}
                className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 flex-shrink-0"
                title="Mark as completed"
              >
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">Complete</span>
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Subscription Status */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {hasActiveSubscription() ? (
                  <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex-shrink-0">
                    <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Premium Active</span>
                    <span className="sm:hidden">Premium</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex-shrink-0">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Free Plan</span>
                    <span className="sm:hidden">Free</span>
                  </div>
                )}
              </div>
              
              {/* Highlighting Controls */}
              <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
                <button
                  onClick={toggleHighlighting}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    isHighlighting 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title={isHighlighting ? 'Exit highlighting mode' : 'Enter highlighting mode'}
                >
                  <Highlighter className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                
                {isHighlighting && (
                  <>
                    <div className="flex items-center space-x-1">
                      {highlightColors.map((colorOption) => (
                        <button
                          key={colorOption.color}
                          onClick={() => setHighlightColor(colorOption.color)}
                          className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 transition-all ${
                            highlightColor === colorOption.color 
                              ? 'border-gray-800 scale-110' 
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                          style={{ backgroundColor: colorOption.color }}
                          title={colorOption.name}
                        />
                      ))}
                    </div>
                    
                    <button
                      onClick={clearAllHighlights}
                      className="px-1.5 sm:px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Clear all highlights"
                    >
                      <span className="hidden sm:inline">Clear All</span>
                      <span className="sm:hidden">Clear</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Check subscription for premium content */}
        {requiresSubscription(focusedItem) && !hasActiveSubscription() ? (
          <SubscriptionPrompt item={focusedItem} />
        ) : (
          <>
            {/* Tab Navigation - Fixed mobile scrolling */}
            <div className="border-b border-gray-200">
              <div className="overflow-x-auto scrollbar-hide">
                <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 min-w-max px-2 py-1">
                  {focusedItem.content.imageUrls && focusedItem.content.imageUrls.length > 0 && (
                    <button
                      onClick={() => handleTabChange('images')}
                      className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        activeTab === 'images'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="hidden sm:inline">Images</span>
                      <span className="sm:hidden">Img</span>
                      <span className="ml-1">({focusedItem.content.imageUrls.length})</span>
                    </button>
                  )}
                  {focusedItem.content.text && (
                    <button
                      onClick={() => handleTabChange('text')}
                      className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
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
                      onClick={() => handleTabChange('video')}
                      className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
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
                      onClick={() => handleTabChange('pdf')}
                      className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
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
            </div>

            {/* Tab Content */}
            <div className="mt-3 sm:mt-4 lg:mt-6">
              {activeTab === 'images' && focusedItem.content.imageUrls && (
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                    {focusedItem.content.imageUrls.map((imageUrl: string, index: number) => (
                      <div key={index} className="relative group cursor-pointer">
                        <img
                          src={imageUrl}
                          alt={`Study image ${index + 1}`}
                          className="w-full h-32 sm:h-48 lg:h-64 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                          onClick={() => handleImageClick(imageUrl, focusedItem.content.imageUrls, index)}
                          onError={(e) => {
                            console.error('Image failed to load:', imageUrl);
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', imageUrl);
                          }}
                        />
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black bg-opacity-50 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          <span className="hidden sm:inline">Click to view</span>
                          <span className="sm:hidden">View</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'text' && focusedItem.content.text && (
                <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Study Notes</h3>
                    <button
                      onClick={handleGenerateAINotes}
                      disabled={isGeneratingNotes}
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingNotes ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          <span>AI Notes</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Error Display */}
                  {notesError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                      <p className="text-red-600 text-sm">{notesError}</p>
                    </div>
                  )}

                  {/* Generated AI Notes Display */}
                  {generatedNotes && (
                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Check className="h-5 w-5 text-purple-500" />
                          <h4 className="font-bold text-purple-800">AI Generated Notes</h4>
                        </div>
                        <button
                          onClick={downloadNotes}
                          className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-purple-700 mb-2">Summary:</h5>
                          <p className="text-purple-600 bg-white p-3 rounded border text-sm">
                            {generatedNotes.summary}
                          </p>
                        </div>
                        
                        {/* Key Points */}
                        {generatedNotes.keyPoints && generatedNotes.keyPoints.length > 0 && (
                          <div>
                            <h5 className="font-medium text-purple-700 mb-2">Key Points:</h5>
                            <div className="bg-white p-3 rounded border">
                              <ul className="space-y-1 text-sm text-purple-600">
                                {generatedNotes.keyPoints.map((point, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-purple-500 mr-2">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Definitions */}
                        {generatedNotes.definitions && generatedNotes.definitions.length > 0 && (
                          <div>
                            <h5 className="font-medium text-purple-700 mb-2">Important Definitions:</h5>
                            <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
                              <div className="space-y-2 text-sm">
                                {generatedNotes.definitions.map((def, index) => (
                                  <div key={index} className="border-l-2 border-purple-200 pl-3">
                                    <span className="font-medium text-purple-800">{def.term}:</span>
                                    <span className="text-purple-600 ml-2">{def.definition}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Q&A Notes */}
                        {generatedNotes.qaNotes && generatedNotes.qaNotes.length > 0 && (
                          <div>
                            <h5 className="font-medium text-purple-700 mb-2">Question & Answer Notes ({generatedNotes.qaNotes.length} total):</h5>
                            <div className="bg-white p-3 rounded border max-h-80 overflow-y-auto">
                              <div className="space-y-3 text-sm">
                                {generatedNotes.qaNotes.slice(0, 8).map((qa, index) => (
                                  <div key={index} className="border border-purple-100 rounded-lg p-3 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-purple-800">Q{index + 1}:</span>
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                        {qa.category}
                                      </span>
                                    </div>
                                    <p className="text-purple-700 mb-2 font-medium">{qa.question}</p>
                                    <p className="text-purple-600 text-xs leading-relaxed">{qa.answer}</p>
                                  </div>
                                ))}
                                {generatedNotes.qaNotes.length > 8 && (
                                  <div className="text-center mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <p className="text-sm text-purple-700 font-medium">
                                      Showing 8 of {generatedNotes.qaNotes.length} Q&A pairs
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1">
                                      All {generatedNotes.qaNotes.length} pairs are available in the complete data structure below
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h5 className="font-medium text-purple-700 mb-2">Detailed Notes:</h5>
                          <div className="text-purple-600 bg-white p-3 rounded border text-sm max-h-60 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{generatedNotes.notes}</pre>
                          </div>
                        </div>
                        
                        {/* Enhanced JSON Response Display */}
                        <div>
                          <h5 className="font-medium text-purple-700 mb-2">Complete AI Response Data:</h5>
                          <div className="bg-white p-3 rounded border max-h-60 overflow-y-auto">
                            <div className="space-y-3 text-sm">
                              {/* Summary Section */}
                              <div className="border-l-4 border-purple-300 pl-3">
                                <h6 className="font-semibold text-purple-800 mb-1">📋 Summary</h6>
                                <p className="text-purple-600 text-xs">{generatedNotes.summary}</p>
                              </div>

                              {/* Key Points Section */}
                              {generatedNotes.keyPoints && generatedNotes.keyPoints.length > 0 && (
                                <div className="border-l-4 border-blue-300 pl-3">
                                  <h6 className="font-semibold text-blue-800 mb-1">🔑 Key Points ({generatedNotes.keyPoints.length})</h6>
                                  <div className="space-y-1">
                                    {generatedNotes.keyPoints.map((point, index) => (
                                      <div key={index} className="text-blue-600 text-xs">
                                        <span className="font-medium">{index + 1}.</span> {point}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Definitions Section */}
                              {generatedNotes.definitions && generatedNotes.definitions.length > 0 && (
                                <div className="border-l-4 border-green-300 pl-3">
                                  <h6 className="font-semibold text-green-800 mb-1">📚 Definitions ({generatedNotes.definitions.length})</h6>
                                  <div className="space-y-2">
                                    {generatedNotes.definitions.map((def, index) => (
                                      <div key={index} className="text-green-600 text-xs">
                                        <span className="font-medium text-green-800">{def.term}:</span>
                                        <span className="ml-1">{def.definition}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Q&A Section */}
                              {generatedNotes.qaNotes && generatedNotes.qaNotes.length > 0 && (
                                <div className="border-l-4 border-orange-300 pl-3">
                                  <h6 className="font-semibold text-orange-800 mb-1">❓ Q&A Pairs ({generatedNotes.qaNotes.length})</h6>
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {generatedNotes.qaNotes.map((qa, index) => (
                                      <div key={index} className="bg-orange-50 p-2 rounded border border-orange-200 hover:bg-orange-100 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-orange-800 text-xs">Q{index + 1}</span>
                                          <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded">
                                            {qa.category}
                                          </span>
                                        </div>
                                        <p className="text-orange-700 text-xs font-medium mb-1 leading-relaxed">{qa.question}</p>
                                        <p className="text-orange-600 text-xs leading-relaxed">{qa.answer}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {generatedNotes.qaNotes.length > 5 && (
                                    <p className="text-xs text-orange-600 mt-2 text-center">
                                      Scroll to see all {generatedNotes.qaNotes.length} Q&A pairs
                                    </p>
                                  )}
                                </div>
                              )}

                              
                              {/* <details className="border-l-4 border-gray-300 pl-3">
                                <summary className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-gray-600">
                                  🔧 Raw JSON Data (Click to expand)
                                </summary>
                                <div className="mt-2">
                                  <JSONViewer 
                                    data={generatedNotes} 
                                    title="Raw JSON Response" 
                                    maxHeight="max-h-40"
                                  />
                                </div>
                              </details> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Highlighting Instructions */}
                  {isHighlighting && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-yellow-800">
                        <Highlighter className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm font-medium">Highlighting Mode Active</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Select text in any question, answer, or section content to highlight. Each element maintains its own unique highlights.
                      </p>
                      <div className="mt-2 flex items-center space-x-2 text-xs text-yellow-600">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></span>
                        <span>Individual element highlighting</span>
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></span>
                      </div>
                    </div>
                  )}
                  
                  <div 
                    className="space-y-3 sm:space-y-4 lg:space-y-6"
                    onMouseUp={() => handleCrossElementSelection()}
                  >
                    {formatStudyNotes(focusedItem.content?.text || '').map((section, sectionIndex) => (
                      <div key={sectionIndex} className="space-y-3 sm:space-y-4">
                        {/* Section Title */}
                        {section.title && (
                          <div className="border-b-2 border-blue-200 pb-2 sm:pb-3">
                            <h4 className="text-sm sm:text-base lg:text-lg font-bold text-blue-800 break-words leading-tight">{section.title}</h4>
                            {section.subtitle && (
                              <p className="text-xs sm:text-sm lg:text-base text-blue-600 mt-1 break-words leading-tight">{section.subtitle}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Questions and Answers */}
                        {section.qa && section.qa.length > 0 && (
                          <div className="space-y-3 sm:space-y-4">
                            {section.qa.map((item, qaIndex) => (
                              <div key={qaIndex} className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-5 border-l-4 border-blue-500">
                                {/* Question */}
                                <div className="mb-2 sm:mb-3">
                                  <div className="flex items-start space-x-2 sm:space-x-3">
                                    <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-full flex items-center justify-center mt-0.5">
                                      Q
                                    </span>
                                    <h5 
                                      className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 leading-tight break-words flex-1 cursor-text select-text"
                                      data-section={sectionIndex}
                                      data-qa={qaIndex}
                                      data-type="question"
                                      onMouseUp={() => handleCrossElementSelection()}
                                      dangerouslySetInnerHTML={{
                                        __html: applyHighlights(item.question, sectionIndex, qaIndex, 'question')
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                {/* Answer */}
                                <div className="ml-5 sm:ml-6 lg:ml-8">
                                  <div className="flex items-start space-x-2 sm:space-x-3">
                                    <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 text-white text-xs sm:text-sm font-bold rounded-full flex items-center justify-center mt-0.5">
                                      A
                                    </span>
                                    <div 
                                      className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed break-words flex-1 cursor-text select-text"
                                      data-section={sectionIndex}
                                      data-qa={qaIndex}
                                      data-type="answer"
                                      onMouseUp={() => handleCrossElementSelection()}
                                      dangerouslySetInnerHTML={{
                                        __html: applyHighlights(item.answer, sectionIndex, qaIndex, 'answer')
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Regular content (non-QA) */}
                        {section.content && (
                          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 lg:p-5 border border-blue-200">
                            <div 
                              className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed break-words cursor-text select-text"
                              data-section={sectionIndex}
                              data-type="section-content"
                              onMouseUp={() => handleCrossElementSelection()}
                              dangerouslySetInnerHTML={{
                                __html: applySectionHighlights(section.content, sectionIndex)
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'video' && focusedItem.content.videoUrl && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Video Lesson</h3>
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
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Study Guide (PDF)</h3>
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
              <h2 className="text-2xl font-bold text-white">{selectedContent.name}</h2>
              <p className="text-sm text-white">Learning Materials</p>
            </div>
          </div>
        </div>

        {/* Navigation Breadcrumb */}
        {navigationStack.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-white">
            <span>Path:</span>
            {navigationStack.map((level, index) => (
              <React.Fragment key={level.id}>
                <span className="text-white">{level.name}</span>
                {index < navigationStack.length - 1 && <ChevronRight className="h-4 w-4" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {deepLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-white">Loading learning materials...</span>
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
                                  Study Notes
                                </h4>
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                                  <div className="space-y-3 sm:space-y-4">
                                    {formatStudyNotes(item.content?.text || '').map((section, sectionIndex) => (
                                      <div key={sectionIndex} className="space-y-3">
                                        {/* Section Title */}
                                        {section.title && (
                                          <div className="border-b border-blue-200 pb-2">
                                            <h5 className="text-sm sm:text-base font-bold text-blue-800 break-words">{section.title}</h5>
                                            {section.subtitle && (
                                              <p className="text-xs sm:text-sm text-blue-600 mt-1 break-words">{section.subtitle}</p>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Questions and Answers */}
                                        {section.qa && section.qa.length > 0 && (
                                          <div className="space-y-3">
                                            {section.qa.map((qaItem, qaIndex) => (
                                              <div key={qaIndex} className="bg-gray-50 rounded-lg p-2 sm:p-3 border-l-3 border-blue-400">
                                                {/* Question */}
                                                <div className="mb-2">
                                                  <div className="flex items-start space-x-2">
                                                    <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                                                      Q
                                                    </span>
                                                    <h6 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight break-words flex-1">
                                                      {qaItem.question}
                                                    </h6>
                                                  </div>
                                                </div>
                                                
                                                {/* Answer */}
                                                <div className="ml-5 sm:ml-7">
                                                  <div className="flex items-start space-x-2">
                                                    <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                                                      A
                                                    </span>
                                                    <div className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words flex-1">
                                                      {qaItem.answer}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {/* Regular content (non-QA) */}
                                        {section.content && (
                                          <div className="bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-200">
                                            <div className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                                              {section.content}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
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
            <p className="text-white">No learning materials available for this section.</p>
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header - Fixed mobile layout */}
      <div className="space-y-3 sm:space-y-4">
        {/* Main Header Row */}
        <div className="flex items-start space-x-2 sm:space-x-4">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 mt-1"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-black break-words leading-tight pr-2 mobile-text-wrap">{subcategoryName}</h2>
            <p className="text-xs sm:text-sm text-black mt-1">Learning Content</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 sm:ml-3 text-white text-sm sm:text-base">Loading content...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-red-600 text-sm sm:text-base">{error}</p>
        </div>
      )}

      {!loading && !error && content.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {content.map((categoryData) =>
            categoryData.subcategories.map((item, index) => {
              const { theme, IconComponent } = getContentTheme(index);
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Content Header - Fixed mobile layout */}
                  <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100">
                    <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${theme.icon} flex-shrink-0`}>
                          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words leading-tight mobile-text-wrap">{item.name}</h3>
                        </div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full font-medium self-start sm:self-auto flex-shrink-0">
                        {item.type}
                      </span>
                    </div>
                  </div>

                  {/* Content Media */}
                  {item.content && hasMediaContent(item) && (
                    <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
                      {/* Check subscription for premium content */}
                      {requiresSubscription(item) && !hasActiveSubscription() ? (
                        <SubscriptionPrompt item={item} />
                      ) : (
                        <>
                          {/* Images */}
                          {item.content.imageUrls && item.content.imageUrls.length > 0 && (
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
                                <Image className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Images ({item.content.imageUrls.length})
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                                {item.content.imageUrls.map((imageUrl, index) => (
                                  <div key={index} className="relative group cursor-pointer">
                                    <img
                                      src={imageUrl}
                                      alt={`Content image ${index + 1}`}
                                      className="w-full h-32 sm:h-40 lg:h-48 object-cover rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
                                      onClick={() => handleImageClick(imageUrl, item.content.imageUrls, index)}
                                      onError={(e) => {
                                        console.error('Image failed to load:', imageUrl);
                                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 p-1.5 sm:p-2 rounded-full transition-all duration-200">
                                        <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons - Fixed mobile layout */}
                          <div className="flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100 mobile-flex-wrap mobile-gap">
                            {hasStudyMaterials(item) && (
                              <button 
                                onClick={() => handleFocusItem(item)}
                                className="flex items-center space-x-1.5 sm:space-x-2 bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm flex-shrink-0"
                              >
                                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
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
                    <div className="p-3 sm:p-4 lg:p-6">
                      <div className="text-center py-3 sm:py-4">
                        <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-xs sm:text-sm">No media content available</p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100 mobile-flex-wrap mobile-gap">
                        <button 
                          onClick={() => handleStartLearning(item._id, item.name)}
                          className="flex items-center space-x-1.5 sm:space-x-2 bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm flex-shrink-0"
                        >
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Start Learning</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0">
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
        <div className="text-center py-8 sm:py-12">
          <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <p className="text-white text-sm sm:text-base">No content available for this section.</p>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <ImageModal />
      )}
    </div>
  );
};

// Add this function to the global scope for the remove highlight button
if (typeof window !== 'undefined') {
  (window as any).removeHighlightFromText = function(sectionIndex: number, qaIndex: number, type: string, highlightIndex: number) {
    // This will be handled by the component's removeHighlight function
    // The button click will trigger a custom event that the component can listen to
    window.dispatchEvent(new CustomEvent('removeHighlight', {
      detail: { sectionIndex, qaIndex, type, highlightIndex }
    }));
  };
}

 