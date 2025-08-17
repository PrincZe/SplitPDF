'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Grid, CheckSquare, Square, FileText, Eye, ImageIcon } from 'lucide-react';

interface VisualPDFPreviewProps {
  file: File;
  selectedPages: Set<number>;
  onPageSelect: (pageNumber: number) => void;
  onSelectAll: (totalPages: number) => void;
  onDeselectAll: () => void;
  onTotalPagesChange?: (totalPages: number) => void;
}

export default function VisualPDFPreview({ 
  file, 
  selectedPages, 
  onPageSelect, 
  onSelectAll, 
  onDeselectAll,
  onTotalPagesChange
}: VisualPDFPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageScale, setPageScale] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [pageImages, setPageImages] = useState<{ [key: number]: string }>({});
  const [renderingProgress, setRenderingProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadPDFWithThumbnails();
    }
  }, [file, isClient]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const loadPDFWithThumbnails = async () => {
    if (!isClient) return;
    
    setIsLoading(true);
    setError(null);
    setRenderingProgress(0);
    
    try {
      // Get basic file info
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      
      // Dynamic import to avoid SSR issues
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source to local file
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      setRenderingProgress(10);
      
      // Load the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;
      
      setNumPages(pageCount);
      onTotalPagesChange?.(pageCount);
      setRenderingProgress(20);
      
      // Render thumbnails for each page
      const images: { [key: number]: string } = {};
      const maxPages = Math.min(pageCount, 50); // Limit for performance
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.3 });
          
          // Create canvas for rendering
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          if (context) {
            // Render page to canvas
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            // Convert canvas to data URL
            images[pageNum] = canvas.toDataURL('image/jpeg', 0.8);
          }
          
          // Update progress
          const progress = 20 + (pageNum / maxPages) * 70;
          setRenderingProgress(Math.round(progress));
          
          // Batch update images every 3 pages for better UX
          if (pageNum % 3 === 0 || pageNum === maxPages) {
            setPageImages({ ...images });
          }
          
        } catch (pageError) {
          console.warn(`Could not render page ${pageNum}:`, pageError);
        }
      }
      
      // Handle remaining pages as placeholders if more than 50
      if (pageCount > maxPages) {
        for (let pageNum = maxPages + 1; pageNum <= pageCount; pageNum++) {
          images[pageNum] = 'placeholder';
        }
      }
      
      setPageImages(images);
      setRenderingProgress(100);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handlePageClick = (pageNumber: number) => {
    onPageSelect(pageNumber);
  };

  const handleZoomIn = () => {
    setPageScale(prev => Math.min(prev + 0.1, 1.0));
  };

  const handleZoomOut = () => {
    setPageScale(prev => Math.max(prev - 0.1, 0.2));
  };

  const toggleSelectAll = () => {
    if (selectedPages.size === numPages) {
      onDeselectAll();
    } else if (numPages) {
      onSelectAll(numPages);
    }
  };

  const isAllSelected = numPages ? selectedPages.size === numPages : false;

  if (!isClient) {
    return (
      <div className="w-full p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-r-transparent border-t-transparent"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Initializing...</h3>
          <p className="text-sm text-gray-600">Setting up PDF viewer</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 p-3 bg-red-100 rounded-full">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading PDF</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => loadPDFWithThumbnails()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-r-transparent border-t-transparent"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Generating Thumbnails...</h3>
          <p className="text-sm text-gray-600 mb-4">
            {renderingProgress < 20 ? 'Loading PDF...' : 
             renderingProgress < 100 ? `Rendering pages... ${renderingProgress}%` : 
             'Finalizing...'}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${renderingProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* File Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 truncate">{fileName}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{numPages} pages</span>
              <span>•</span>
              <span>{fileSize}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <Eye className="w-4 h-4" />
                Visual preview ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {numPages} pages
            </span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600">
              {selectedPages.size} selected
            </span>
          </div>
          
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-500" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-gray-200 rounded overflow-hidden">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 transition-colors"
              disabled={pageScale <= 0.2}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-sm bg-gray-50 border-x border-gray-200 min-w-[60px] text-center">
              {Math.round(pageScale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 transition-colors"
              disabled={pageScale >= 1.0}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center border border-gray-200 rounded overflow-hidden">
            <button className="p-2 bg-blue-100 text-blue-600">
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Page Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from(new Array(numPages), (el, index) => {
          const pageNumber = index + 1;
          const hasImage = pageImages[pageNumber] && pageImages[pageNumber] !== 'placeholder';
          
          return (
            <div
              key={`page_${pageNumber}`}
              className={`
                relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200
                ${selectedPages.has(pageNumber)
                  ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }
              `}
              onClick={() => handlePageClick(pageNumber)}
            >
              {/* Selection Indicator */}
              <div className={`
                absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                ${selectedPages.has(pageNumber)
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-gray-300'
                }
              `}>
                {selectedPages.has(pageNumber) && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Page Number */}
              <div className="absolute bottom-2 left-2 z-10 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                {pageNumber}
              </div>

              {/* Page Content */}
              <div className="p-2">
                {hasImage ? (
                  <div className="relative">
                    <img 
                      src={pageImages[pageNumber]} 
                      alt={`Page ${pageNumber}`}
                      className="w-full h-auto rounded border border-gray-200"
                      style={{ 
                        transform: `scale(${pageScale / 0.3})`, 
                        transformOrigin: 'top left',
                        maxHeight: '300px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                ) : pageImages[pageNumber] === 'placeholder' ? (
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded flex flex-col items-center justify-center border border-gray-200">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-xs text-gray-500">Page {pageNumber}</div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                    <div className="text-center">
                      <div className="w-6 h-6 mx-auto mb-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      <span className="text-xs text-gray-500">Loading...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Info */}
      {numPages && numPages > 50 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-900 mb-1">Large PDF Notice</h4>
              <p className="text-sm text-yellow-700">
                Only the first 50 pages show thumbnails for performance. All pages are still available for splitting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
