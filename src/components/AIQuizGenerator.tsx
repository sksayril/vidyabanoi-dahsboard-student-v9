import React, { useState, useEffect } from 'react';
import { Brain, BookOpen, Star, Sparkles, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { generateAIQuiz, generateAINotes } from '../api';
import { QuizGenerationRequest, QuizGenerationResponse, EnhancedNotesResponse } from '../types/api';
import { JSONViewer } from './JSONViewer';

interface AIQuizGeneratorProps {
  subcategoryName: string;
  subcategoryId?: string;
  content?: string;
  onClose: () => void;
}

export const AIQuizGenerator: React.FC<AIQuizGeneratorProps> = ({
  subcategoryName,
  subcategoryId, // Available for future use
  content,
  onClose
}) => {
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizGenerationResponse | null>(null);
  const [generatedNotes, setGeneratedNotes] = useState<EnhancedNotesResponse | null>(null);
  const [error, setError] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState(40);

  // Parse notes object into readable format
  const parseNotesToReadableFormat = (notes: string | object): string => {
    if (typeof notes === 'string') {
      return notes;
    }

    if (typeof notes === 'object' && notes !== null) {
      let formattedContent = '';
      
      const parseObject = (obj: any, level: number = 0): string => {
        let result = '';
        const indent = '  '.repeat(level);
        
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            // Check if this looks like a chapter or section
            if (key.toLowerCase().includes('chapter') || key.toLowerCase().includes('section')) {
              result += `\n${indent}📚 ${key}\n`;
              result += `${indent}${'─'.repeat(key.length + 3)}\n`;
            } else {
              result += `\n${indent}📖 ${key}\n`;
            }
            result += parseObject(value, level + 1);
          } else if (typeof value === 'string') {
            // Format key-value pairs nicely
            const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            result += `${indent}• ${cleanKey}: ${value}\n`;
          } else {
            result += `${indent}• ${key}: ${String(value)}\n`;
          }
        }
        
        return result;
      };
      
      formattedContent = parseObject(notes);
      return formattedContent;
    }
    
    return String(notes || '');
  };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setError('');
    setGeneratedQuiz(null);

    try {
      const request: QuizGenerationRequest = {
        topic: subcategoryName,
        subject: 'NCERT Geography', // You can make this dynamic based on user data
        difficulty,
        questionCount
      };

      const response = await generateAIQuiz(request);
      setGeneratedQuiz(response);
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!content) {
      setError('No content available to generate notes from.');
      return;
    }

    setIsGeneratingNotes(true);
    setError('');
    setGeneratedNotes(null);

    try {
      const response = await generateAINotes(content, subcategoryName, 'NCERT Geography');
      setGeneratedNotes(response);
    } catch (err) {
      console.error('Error generating notes:', err);
      setError('Failed to generate notes. Please try again.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const downloadQuiz = () => {
    if (!generatedQuiz) return;

    const quizData = {
      title: generatedQuiz.quiz.title,
      topic: generatedQuiz.quiz.topic,
      subject: generatedQuiz.quiz.subject,
      difficulty: generatedQuiz.quiz.difficulty,
      totalQuestions: generatedQuiz.quiz.totalQuestions,
      estimatedDuration: generatedQuiz.quiz.estimatedDuration,
      questions: generatedQuiz.quiz.questions.map(q => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }))
    };

    const blob = new Blob([JSON.stringify(quizData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subcategoryName.replace(/\s+/g, '_')}_quiz.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDownloadDropdown) {
        const target = event.target as Element;
        if (!target.closest('.download-dropdown')) {
          setShowDownloadDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadDropdown]);

  const downloadNotes = async (format: 'json' | 'pdf' | 'docx' = 'json') => {
    if (!generatedNotes) return;

    const notesData = {
      topic: subcategoryName,
      subcategoryId: subcategoryId || 'unknown',
      subject: 'NCERT Geography',
      generatedAt: new Date().toISOString(),
      ...generatedNotes
    };

    const fileName = `${subcategoryName.replace(/\s+/g, '_')}_ai_notes`;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(notesData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      await downloadAsPDF(notesData, fileName);
    } else if (format === 'docx') {
      await downloadAsDOCX(notesData, fileName);
    }
  };

  // Download as PDF with watermark and pagination
  const downloadAsPDF = async (notesData: any, fileName: string) => {
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;
      let currentPage = 1;
      
      // Helper function to add watermark to current page
      const addWatermark = () => {
        doc.setFontSize(60);
        doc.setTextColor(200, 200, 200);
        doc.text('V', pageWidth / 2, pageHeight / 2, { angle: 45 });
        doc.setTextColor(0, 0, 0);
      };
      
      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          currentPage++;
          addWatermark();
          yPosition = margin;
          return true;
        }
        return false;
      };
      
      // Helper function to add text with pagination
      const addTextWithPagination = (text: string, fontSize: number, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont(undefined, 'bold');
        } else {
          doc.setFont(undefined, 'normal');
        }
        
        const lines = doc.splitTextToSize(text, contentWidth);
        const requiredSpace = lines.length * (fontSize * 0.4) + 5;
        
        if (checkNewPage(requiredSpace)) {
          // Add page header
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`${notesData.topic} - Page ${currentPage}`, margin, 15);
          doc.setTextColor(0, 0, 0);
        }
        
        doc.text(lines, margin, yPosition);
        yPosition += requiredSpace;
      };
      
      // Add watermark to first page
      addWatermark();
      
      // Add title
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(notesData.topic, margin, yPosition);
      yPosition += 15;
      
      // Add metadata
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Subject: ${notesData.subject || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Generated: ${new Date(notesData.generatedAt || new Date()).toLocaleDateString()}`, margin, yPosition);
      yPosition += 15;
      
      // Add summary
      if (notesData.summary) {
        addTextWithPagination('Summary:', 14, true);
        addTextWithPagination(notesData.summary, 10);
        yPosition += 10;
      }
      
      // Add key points
      if (notesData.keyPoints && notesData.keyPoints.length > 0) {
        addTextWithPagination('Key Points:', 14, true);
        yPosition += 5;
        
        notesData.keyPoints.forEach((point: string, index: number) => {
          addTextWithPagination(`${index + 1}. ${point}`, 10);
        });
        yPosition += 10;
      }
      
      // Add definitions
      if (notesData.definitions && notesData.definitions.length > 0) {
        addTextWithPagination('Important Definitions:', 14, true);
        yPosition += 5;
        
        notesData.definitions.forEach((def: any) => {
          addTextWithPagination(`${def.term}:`, 10, true);
          addTextWithPagination(def.definition, 10);
          yPosition += 5;
        });
        yPosition += 10;
      }
      
      // Add Q&A Notes
      if (notesData.qaNotes && notesData.qaNotes.length > 0) {
        addTextWithPagination('Question & Answer Notes:', 14, true);
        yPosition += 5;
        
        notesData.qaNotes.forEach((qa: any, index: number) => {
          addTextWithPagination(`Q${index + 1}: ${qa.question}`, 10, true);
          addTextWithPagination(`A: ${qa.answer}`, 10);
          if (qa.category) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Category: ${qa.category}`, margin, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 8;
          }
          yPosition += 10;
        });
        yPosition += 10;
      }
      
      // Add detailed notes
      if (notesData.notes) {
        addTextWithPagination('Detailed Notes:', 14, true);
        yPosition += 5;
        
        const notesText = typeof notesData.notes === 'string' 
          ? notesData.notes 
          : parseNotesToReadableFormat(notesData.notes);
        
        addTextWithPagination(notesText || '', 10);
      }
      
      // Add footer to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated by Vudywarani - Page ${i} of ${totalPages}`, margin, pageHeight - 10);
        doc.text(`Downloaded on: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, pageHeight - 10);
      }
      
      // Save the PDF
      doc.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      downloadNotes('json');
    }
  };

  // Download as DOCX with watermark
  const downloadAsDOCX = async (notesData: any, fileName: string) => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      const { saveAs } = await import('file-saver');
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: notesData.topic,
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            
            // Metadata
            new Paragraph({
              children: [
                new TextRun({
                  text: `Subject: ${notesData.subject}`,
                  size: 20,
                }),
              ],
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated: ${new Date(notesData.generatedAt).toLocaleDateString()}`,
                  size: 20,
                }),
              ],
            }),
            
            // Summary
            ...(notesData.summary ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Summary",
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: notesData.summary,
                    size: 20,
                  }),
                ],
              }),
            ] : []),
            
            // Key Points
            ...(notesData.keyPoints && notesData.keyPoints.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Key Points",
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
              }),
              ...notesData.keyPoints.map((point: string, index: number) => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${index + 1}. ${point}`,
                      size: 20,
                    }),
                  ],
                })
              ),
            ] : []),
            
            // Definitions
            ...(notesData.definitions && notesData.definitions.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Important Definitions",
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
              }),
              ...notesData.definitions.flatMap((def: any) => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${def.term}:`,
                      bold: true,
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: def.definition,
                      size: 20,
                    }),
                  ],
                }),
              ]),
            ] : []),
            
            // Q&A Notes
            ...(notesData.qaNotes && notesData.qaNotes.length > 0 ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Question & Answer Notes",
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
              }),
              ...notesData.qaNotes.flatMap((qa: any, index: number) => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Q${index + 1}: ${qa.question}`,
                      bold: true,
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `A: ${qa.answer}`,
                      size: 20,
                    }),
                  ],
                }),
                ...(qa.category ? [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Category: ${qa.category}`,
                        italics: true,
                        size: 18,
                        color: "666666",
                      }),
                    ],
                  }),
                ] : []),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "",
                      size: 20,
                    }),
                  ],
                }),
              ]),
            ] : []),
            
            // Detailed Notes
            ...(notesData.notes ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Detailed Notes",
                    bold: true,
                    size: 24,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: typeof notesData.notes === 'string' 
                      ? notesData.notes 
                      : parseNotesToReadableFormat(notesData.notes),
                    size: 20,
                  }),
                ],
              }),
            ] : []),
          ],
        }],
      });
      
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer.buffer.slice(0)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, `${fileName}.docx`);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      downloadNotes('json');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">AI Learning Assistant</h2>
                <p className="text-blue-100">Generate quizzes and notes for: {subcategoryName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Quiz Generation Section */}
          <div className="notebook-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Star className="h-6 w-6 text-yellow-500" />
              <h3 className="text-xl font-bold notebook-heading">Generate AI Quiz</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium notebook-text mb-2">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium notebook-text mb-2">Number of Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                  <option value={40}>40 Questions</option>
                  <option value={50}>50 Questions</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-200 flex items-center justify-center font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingQuiz ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3" />
                  Generate AI Quiz ({questionCount} Questions)
                </>
              )}
            </button>

            {/* Generated Quiz Display */}
            {generatedQuiz && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h4 className="font-bold text-green-800">Quiz Generated Successfully!</h4>
                  </div>
                  <button
                    onClick={downloadQuiz}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-700">Title:</span>
                    <p className="text-green-600">{generatedQuiz.quiz.title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Difficulty:</span>
                    <p className="text-green-600">{generatedQuiz.quiz.difficulty}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Questions:</span>
                    <p className="text-green-600">{generatedQuiz.quiz.totalQuestions}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Duration:</span>
                    <p className="text-green-600">{generatedQuiz.quiz.estimatedDuration}</p>
                  </div>
                </div>

                 {/* Sample Questions Preview */}
                 <div className="mt-4">
                   <h5 className="font-medium text-green-700 mb-2">Sample Questions Preview (showing 8 of {generatedQuiz.quiz.questions.length}):</h5>
                   <div className="space-y-3 max-h-80 overflow-y-auto">
                     {generatedQuiz.quiz.questions.slice(0, 8).map((question, index) => (
                      <div key={question.id} className="text-sm bg-white p-3 rounded border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-green-800">Q{index + 1}:</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                            {question.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-green-700 mb-2">{question.question}</p>
                        
                        {question.type === 'multiple_choice' && question.options && (
                          <div className="ml-4 space-y-1">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="text-xs text-green-600">
                                <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                                {optIndex === question.correctAnswer && (
                                  <span className="ml-2 text-green-500 font-bold">✓ Correct</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'short_answer' && (
                          <div className="ml-4 text-xs text-green-600">
                            <span className="font-medium">Expected Answer:</span> {question.correctAnswer}
                          </div>
                        )}
                        
                        {question.type === 'long_answer' && (
                          <div className="ml-4 text-xs text-green-600">
                            <span className="font-medium">Expected Answer:</span> {String(question.correctAnswer).substring(0, 100)}...
                          </div>
                        )}
                        
                        {question.explanation && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-600">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                   {generatedQuiz.quiz.questions.length > 8 && (
                     <div className="text-center mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                       <p className="text-sm text-green-700 font-medium">
                         Showing 8 of {generatedQuiz.quiz.questions.length} questions
                       </p>
                       <p className="text-xs text-green-600 mt-1">
                         All {generatedQuiz.quiz.questions.length} questions are available in the complete data structure below
                       </p>
                     </div>
                   )}
                </div>

                 {/* Enhanced Quiz Data Display */}
                 <div className="mt-4">
                   <h5 className="font-medium text-green-700 mb-2">Complete Quiz Data Structure:</h5>
                   <div className="bg-white p-3 rounded border max-h-60 overflow-y-auto">
                     <div className="space-y-3 text-sm">
                       {/* Quiz Metadata */}
                       <div className="border-l-4 border-green-300 pl-3">
                         <h6 className="font-semibold text-green-800 mb-1">📊 Quiz Information</h6>
                         <div className="grid grid-cols-2 gap-2 text-xs">
                           <div><span className="font-medium">Title:</span> {generatedQuiz.quiz.title}</div>
                           <div><span className="font-medium">Topic:</span> {generatedQuiz.quiz.topic}</div>
                           <div><span className="font-medium">Subject:</span> {generatedQuiz.quiz.subject}</div>
                           <div><span className="font-medium">Difficulty:</span> {generatedQuiz.quiz.difficulty}</div>
                           <div><span className="font-medium">Questions:</span> {generatedQuiz.quiz.totalQuestions}</div>
                           <div><span className="font-medium">Duration:</span> {generatedQuiz.quiz.estimatedDuration}</div>
                         </div>
                       </div>

                       {/* Question Types Breakdown */}
                       <div className="border-l-4 border-blue-300 pl-3">
                         <h6 className="font-semibold text-blue-800 mb-1">📝 Question Types Breakdown</h6>
                         <div className="space-y-1 text-xs">
                           {(() => {
                             const typeCounts = generatedQuiz.quiz.questions.reduce((acc: any, q: any) => {
                               acc[q.type] = (acc[q.type] || 0) + 1;
                               return acc;
                             }, {});
                             return Object.entries(typeCounts).map(([type, count]) => (
                               <div key={type} className="text-blue-600">
                                 <span className="font-medium">{type.replace('_', ' ').toUpperCase()}:</span> {count as number} questions
                               </div>
                             ));
                           })()}
                         </div>
                       </div>

                       {/* Sample Questions by Type */}
                       <div className="border-l-4 border-purple-300 pl-3">
                         <h6 className="font-semibold text-purple-800 mb-1">🎯 Sample Questions by Type</h6>
                         <div className="space-y-2 max-h-40 overflow-y-auto">
                           {(() => {
                             const questionsByType = generatedQuiz.quiz.questions.reduce((acc: any, q: any) => {
                               if (!acc[q.type]) acc[q.type] = [];
                               if (acc[q.type].length < 3) acc[q.type].push(q);
                               return acc;
                             }, {});
                             
                             return Object.entries(questionsByType).map(([type, questions]) => (
                               <div key={type} className="bg-purple-50 p-2 rounded border border-purple-200 hover:bg-purple-100 transition-colors">
                                 <div className="font-medium text-purple-800 text-xs mb-1">
                                   {type.replace('_', ' ').toUpperCase()} ({(questions as any[]).length} shown)
                                 </div>
                                 {(questions as any[]).map((q, index) => (
                                   <div key={index} className="text-purple-600 text-xs mb-1 leading-relaxed">
                                     <span className="font-medium">Q{q.id}:</span> {q.question.substring(0, 100)}...
                                   </div>
                                 ))}
                               </div>
                             ));
                           })()}
                         </div>
                         <p className="text-xs text-purple-600 mt-2 text-center">
                           Scroll to see all question types and samples
                         </p>
                       </div>

                       {/* Raw JSON Toggle */}
                       <details className="border-l-4 border-gray-300 pl-3">
                         <summary className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-gray-600">
                           🔧 Raw JSON Data (Click to expand)
                         </summary>
                         <div className="mt-2">
                           <JSONViewer 
                             data={generatedQuiz} 
                             title="Raw Quiz JSON Response" 
                             maxHeight="max-h-40"
                           />
                         </div>
                       </details>
                     </div>
                   </div>
                 </div>
              </div>
            )}
          </div>

          {/* Notes Generation Section */}
          <div className="notebook-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="h-6 w-6 text-blue-500" />
              <h3 className="text-xl font-bold notebook-heading">Generate Study Notes</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Generate comprehensive study notes and summaries from the content.
            </p>

            <button
              onClick={handleGenerateNotes}
              disabled={isGeneratingNotes || !content}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingNotes ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Generating Notes...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-3" />
                  Generate Study Notes
                </>
              )}
            </button>

            {/* Generated Notes Display */}
            {generatedNotes && (
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                    <h4 className="font-bold text-purple-800">Notes Generated Successfully!</h4>
                  </div>
                  <div className="relative download-dropdown">
                    <button
                      onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                      className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    {showDownloadDropdown && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              downloadNotes('json');
                              setShowDownloadDropdown(false);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Download as JSON</span>
                          </button>
                          <button
                            onClick={() => {
                              downloadNotes('pdf');
                              setShowDownloadDropdown(false);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Download as PDF</span>
                          </button>
                          <button
                            onClick={() => {
                              downloadNotes('docx');
                              setShowDownloadDropdown(false);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Download as DOCX</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                             <div key={index} className="border border-purple-100 rounded-lg p-3">
                               <div className="flex items-center justify-between mb-2">
                                 <span className="font-medium text-purple-800">Q{index + 1}:</span>
                                 <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                   {qa.category}
                                 </span>
                               </div>
                               <p className="text-purple-700 mb-2 font-medium">{qa.question}</p>
                               <p className="text-purple-600 text-xs">{qa.answer}</p>
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
                     <h5 className="font-medium text-purple-700 mb-2">Study Notes Preview:</h5>
                     <div className="text-purple-600 bg-white p-3 rounded border text-sm max-h-40 overflow-y-auto">
                       <pre className="whitespace-pre-wrap font-mono leading-relaxed">
                         {parseNotesToReadableFormat(generatedNotes.notes).substring(0, 500)}...
                       </pre>
                     </div>
                   </div>
                   
                   {/* Enhanced Notes Data Display */}
                   <div>
                     <h5 className="font-medium text-purple-700 mb-2">Complete Notes Data Structure:</h5>
                     <div className="bg-white p-3 rounded border max-h-60 overflow-y-auto">
                       <div className="space-y-3 text-sm">
                         {/* Notes Metadata */}
                         <div className="border-l-4 border-purple-300 pl-3">
                           <h6 className="font-semibold text-purple-800 mb-1">📋 Notes Information</h6>
                           <div className="grid grid-cols-2 gap-2 text-xs">
                             <div><span className="font-medium">Topic:</span> {subcategoryName}</div>
                             <div><span className="font-medium">Subject:</span> NCERT Geography</div>
                             <div><span className="font-medium">Key Points:</span> {generatedNotes.keyPoints?.length || 0}</div>
                             <div><span className="font-medium">Definitions:</span> {generatedNotes.definitions?.length || 0}</div>
                             <div><span className="font-medium">Q&A Pairs:</span> {generatedNotes.qaNotes?.length || 0}</div>
                             <div><span className="font-medium">Notes Length:</span> {typeof generatedNotes.notes === 'string' ? generatedNotes.notes.length : JSON.stringify(generatedNotes.notes).length} chars</div>
                           </div>
                         </div>

                         {/* Content Breakdown */}
                         <div className="border-l-4 border-blue-300 pl-3">
                           <h6 className="font-semibold text-blue-800 mb-1">📊 Content Breakdown</h6>
                           <div className="space-y-1 text-xs">
                             <div className="text-blue-600">
                               <span className="font-medium">Summary:</span> {generatedNotes.summary?.length || 0} characters
                             </div>
                             {generatedNotes.keyPoints && generatedNotes.keyPoints.length > 0 && (
                               <div className="text-blue-600">
                                 <span className="font-medium">Key Points:</span> {generatedNotes.keyPoints.length} items
                               </div>
                             )}
                             {generatedNotes.definitions && generatedNotes.definitions.length > 0 && (
                               <div className="text-blue-600">
                                 <span className="font-medium">Definitions:</span> {generatedNotes.definitions.length} terms
                               </div>
                             )}
                             {generatedNotes.qaNotes && generatedNotes.qaNotes.length > 0 && (
                               <div className="text-blue-600">
                                 <span className="font-medium">Q&A Pairs:</span> {generatedNotes.qaNotes.length} questions
                               </div>
                             )}
                           </div>
                         </div>

                         {/* Q&A Categories */}
                         {generatedNotes.qaNotes && generatedNotes.qaNotes.length > 0 && (
                           <div className="border-l-4 border-orange-300 pl-3">
                             <h6 className="font-semibold text-orange-800 mb-1">🏷️ Q&A Categories</h6>
                             <div className="space-y-1 text-xs">
                               {(() => {
                                 const categories = [...new Set(generatedNotes.qaNotes.map(qa => qa.category))];
                                 return categories.map(category => {
                                   const count = generatedNotes.qaNotes.filter(qa => qa.category === category).length;
                                   return (
                                     <div key={category} className="text-orange-600">
                                       <span className="font-medium">{category}:</span> {count} questions
                                     </div>
                                   );
                                 });
                               })()}
                             </div>
                           </div>
                         )}

                         {/* Raw JSON Toggle */}
                         <details className="border-l-4 border-gray-300 pl-3">
                           <summary className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-gray-600">
                             🔧 Raw JSON Data (Click to expand)
                           </summary>
                           <div className="mt-2">
                             <JSONViewer 
                               data={generatedNotes} 
                               title="Raw Notes JSON Response" 
                               maxHeight="max-h-40"
                             />
                           </div>
                         </details>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
