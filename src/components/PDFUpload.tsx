'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { validatePDFFile, formatFileSize } from '@/lib/utils/pdfUtils';

interface PDFUploadProps {
  onPDFSelect: (file: File) => void;
  isLoading?: boolean;
}

interface UploadError {
  message: string;
  type: 'size' | 'type' | 'general';
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB as per requirements

export default function PDFUpload({ onPDFSelect, isLoading = false }: PDFUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file: File): UploadError | null => {
    const validation = validatePDFFile(file);
    
    if (!validation.isValid) {
      return {
        message: validation.error || 'Invalid file',
        type: validation.error?.includes('size') ? 'size' : 'type'
      };
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setUploadProgress(0);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Simulate upload progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    // Process the file
    setTimeout(() => {
      setUploadProgress(100);
      setTimeout(() => {
        onPDFSelect(file);
        setUploadProgress(0);
        clearInterval(progressInterval);
      }, 200);
    }, 1000);
  }, [onPDFSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const clearError = () => setError(null);



  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 text-sm font-medium">Upload Error</p>
            <p className="text-red-700 text-sm mt-1">{error.message}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg transition-all duration-200 
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label htmlFor="pdf-upload" className="block cursor-pointer">
          <div className="flex flex-col items-center justify-center p-8 py-12">
            {isLoading || uploadProgress > 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                  <div 
                    className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin"
                    style={{
                      borderRightColor: 'transparent',
                      borderTopColor: 'transparent'
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Processing PDF...</p>
                {uploadProgress > 0 && (
                  <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 p-3 bg-gray-100 rounded-full">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Upload your PDF file
                </h3>
                <p className="text-sm text-gray-500 mb-4 text-center max-w-sm">
                  Drag and drop your PDF file here, or click to browse and select
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Upload className="w-4 h-4" />
                  <span>PDF files only • Max size: 100MB</span>
                </div>
              </>
            )}
          </div>
        </label>

        <input
          id="pdf-upload"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />
      </div>

      {/* Upload Tips */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tips for best results:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Ensure your PDF is not password protected</li>
          <li>• Larger files may take longer to process</li>
          <li>• All processing happens in your browser - your files never leave your device</li>
        </ul>
      </div>
    </div>
  );
}
