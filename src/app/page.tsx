'use client';

import React, { useState } from 'react';
import PDFUpload from '@/components/PDFUpload';
import VisualPDFPreview from '@/components/VisualPDFPreview';
import PDFSplitter from '@/components/PDFSplitter';

import { FileText, Scissors, Shield } from 'lucide-react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setSelectedPages(new Set()); // Reset selection when new file is uploaded
    setIsLoading(false);
  };

  const handlePageSelect = (pageNumber: number) => {
    setSelectedPages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(pageNumber)) {
        newSelection.delete(pageNumber);
      } else {
        newSelection.add(pageNumber);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (totalPages: number) => {
    if (!selectedFile) return;
    
    const allPages = new Set<number>();
    for (let i = 1; i <= totalPages; i++) {
      allPages.add(i);
    }
    setSelectedPages(allPages);
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedPages(new Set());
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PDF Splitter</h1>
                <p className="text-sm text-gray-500">Split your PDFs with ease</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>100% Private</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedFile ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Split PDF Files Instantly
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Upload your PDF and select the pages you want to extract. 
                All processing happens in your browser - your files never leave your device.
              </p>
            </div>

            {/* Upload Component */}
            <PDFUpload onPDFSelect={handleFileSelect} isLoading={isLoading} />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">100% Private</h3>
                <p className="text-sm text-gray-600">
                  All processing happens in your browser. Your files never leave your device.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Easy Splitting</h3>
                <p className="text-sm text-gray-600">
                  Select pages with a simple click. Visual preview makes it easy to choose.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">High Quality</h3>
                <p className="text-sm text-gray-600">
                  Maintain original PDF quality. No compression or quality loss.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    ✓
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">Upload PDF</span>
                </div>
                <div className="w-8 h-px bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">Select Pages</span>
                </div>
                <div className="w-8 h-px bg-gray-300"></div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedPages.size > 0 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">Download</span>
                </div>
              </div>
            </div>

            {/* PDF Preview */}
            <VisualPDFPreview
              file={selectedFile}
              selectedPages={selectedPages}
              onPageSelect={handlePageSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onTotalPagesChange={setTotalPages}
            />

            {/* PDF Splitter */}
            <div className="w-full flex justify-center">
              <PDFSplitter
                originalFile={selectedFile}
                selectedPages={selectedPages}
                onReset={handleReset}
                totalPages={totalPages}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>PDF Splitter - Built by William Wong (PSD) • All processing happens locally in your browser</p>
          </div>
        </div>
        </footer>
      </div>
    );
  }
