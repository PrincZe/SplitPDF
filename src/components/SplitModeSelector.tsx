'use client';

import React from 'react';
import { FileText, Layers, Minus, Scissors, FolderOpen } from 'lucide-react';

export type SplitMode = 'combined' | 'individual' | 'groups' | 'ranges' | 'remove';

interface SplitModeSelectorProps {
  selectedMode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  selectedPages: Set<number>;
  groupCount?: number;
}

const splitModes = [
  {
    id: 'combined' as SplitMode,
    name: 'Combined Pages',
    description: 'Combine selected pages into one PDF',
    icon: FileText,
    color: 'blue'
  },
  {
    id: 'individual' as SplitMode,
    name: 'Individual Pages',
    description: 'Each selected page becomes a separate PDF',
    icon: Layers,
    color: 'green'
  },
  {
    id: 'groups' as SplitMode,
    name: 'Custom Groups',
    description: 'Organize pages into custom groups for multiple PDFs',
    icon: FolderOpen,
    color: 'purple'
  },
  {
    id: 'ranges' as SplitMode,
    name: 'Page Ranges',
    description: 'Split by page ranges (coming soon)',
    icon: Scissors,
    color: 'orange',
    disabled: true
  },
  {
    id: 'remove' as SplitMode,
    name: 'Remove Pages',
    description: 'Remove selected pages, keep the rest',
    icon: Minus,
    color: 'red'
  }
];

export default function SplitModeSelector({ 
  selectedMode, 
  onModeChange, 
  selectedPages,
  groupCount = 0
}: SplitModeSelectorProps) {
  
  const getResultPreview = (mode: SplitMode) => {
    const pageCount = selectedPages.size;
    
    switch (mode) {
      case 'combined':
        return pageCount > 0 ? `1 PDF file (${pageCount} pages)` : 'Select pages to preview';
      case 'individual':
        return pageCount > 0 ? `${pageCount} PDF files (1 page each)` : 'Select pages to preview';
      case 'groups':
        return groupCount > 0 ? `${groupCount} PDF files (custom groups)` : 'Create groups to preview';
      case 'ranges':
        return 'Split by ranges - coming soon';
      case 'remove':
        return pageCount > 0 ? `1 PDF file (${pageCount} pages removed)` : 'Select pages to remove';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Scissors className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Split Mode</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {splitModes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          const isDisabled = mode.disabled;
          
          return (
            <button
              key={mode.id}
              onClick={() => !isDisabled && onModeChange(mode.id)}
              disabled={isDisabled}
              className={`
                relative p-4 text-left border-2 rounded-lg transition-all duration-200
                ${isSelected && !isDisabled
                  ? mode.color === 'blue' 
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : mode.color === 'green'
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : mode.color === 'purple'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : mode.color === 'orange'
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-red-500 bg-red-50 shadow-md'
                  : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
                }
              `}
            >
              {isDisabled && (
                <div className="absolute top-2 right-2 text-xs bg-gray-400 text-white px-2 py-1 rounded">
                  Soon
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected && !isDisabled
                    ? mode.color === 'blue' 
                      ? 'bg-blue-500 text-white'
                      : mode.color === 'green'
                        ? 'bg-green-500 text-white'
                        : mode.color === 'purple'
                          ? 'bg-purple-500 text-white'
                          : mode.color === 'orange'
                            ? 'bg-orange-500 text-white'
                            : 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                    {mode.name}
                  </h4>
                  <p className={`text-sm mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    {mode.description}
                  </p>
                  
                  {!isDisabled && (
                    <div className="mt-2 text-xs font-medium text-gray-500">
                      Result: {getResultPreview(mode.id)}
                    </div>
                  )}
                </div>
              </div>
              
              {isSelected && !isDisabled && (
                <div className="absolute top-2 right-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    mode.color === 'blue' 
                      ? 'bg-blue-500'
                      : mode.color === 'green'
                        ? 'bg-green-500'
                        : mode.color === 'purple'
                          ? 'bg-purple-500'
                          : mode.color === 'orange'
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                  }`}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedPages.size > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{selectedPages.size}</span>
            </div>
            <span className="font-medium">
              {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            {getResultPreview(selectedMode)}
          </p>
        </div>
      )}
    </div>
  );
}
