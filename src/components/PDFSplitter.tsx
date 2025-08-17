'use client';

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { Download, FileText, Loader2, Package, Minus } from 'lucide-react';
import { generateSplitFileName, validatePageSelection, generateIndividualFileName, generateZipFileName } from '@/lib/utils/pdfUtils';
import SplitModeSelector, { SplitMode } from './SplitModeSelector';
import PageGrouping from './PageGrouping';

interface PageGroup {
  id: string;
  name: string;
  pages: number[];
  color: string;
}

interface PDFSplitterProps {
  originalFile: File;
  selectedPages: Set<number>;
  onReset: () => void;
  totalPages?: number;
}

export default function PDFSplitter({ originalFile, selectedPages, onReset, totalPages = 0 }: PDFSplitterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [splitMode, setSplitMode] = useState<SplitMode>('combined');
  const [pageGroups, setPageGroups] = useState<PageGroup[]>([]);



  const splitPDF = async () => {
    if (splitMode === 'groups') {
      if (pageGroups.filter(group => group.pages.length > 0).length === 0) {
        alert('Please create at least one group with pages to split.');
        return;
      }
    } else if (splitMode === 'remove') {
      if (selectedPages.size === 0) {
        alert('Please select at least one page to remove.');
        return;
      }
      if (selectedPages.size >= totalPages) {
        alert('Cannot remove all pages. At least one page must remain.');
        return;
      }
    } else if (selectedPages.size === 0) {
      alert('Please select at least one page to split.');
      return;
    }

    setIsProcessing(true);
    setProcessProgress(0);

    try {
      // Read the original PDF
      setProcessProgress(10);
      const arrayBuffer = await originalFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      
      setProcessProgress(20);

      if (splitMode === 'combined') {
        await splitCombinedMode(originalPdf);
      } else if (splitMode === 'individual') {
        await splitIndividualMode(originalPdf);
      } else if (splitMode === 'groups') {
        await splitGroupsMode(originalPdf);
      } else if (splitMode === 'remove') {
        await removePagesMode(originalPdf);
      }

    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('An error occurred while splitting the PDF. Please try again.');
      setIsProcessing(false);
      setProcessProgress(0);
    }
  };

  const splitCombinedMode = async (originalPdf: PDFDocument) => {
    try {
      // Create a new PDF document
      const newPdf = await PDFDocument.create();
      
      // Copy selected pages to the new document
      const pageArray = Array.from(selectedPages).sort((a, b) => a - b);
      const totalPages = pageArray.length;
      
      for (let i = 0; i < totalPages; i++) {
        const pageNumber = pageArray[i];
        
        try {
          // PDF-lib uses 0-based indexing, but our UI uses 1-based
          const copiedPages = await newPdf.copyPages(originalPdf, [pageNumber - 1]);
          newPdf.addPage(copiedPages[0]);
        } catch (error) {
          console.warn(`Could not copy page ${pageNumber}, adding blank page instead`);
          // Add a blank page as fallback
          const blankPage = newPdf.addPage();
          blankPage.drawText(`Page ${pageNumber} (from ${originalFile.name})`, {
            x: 50,
            y: 750,
            size: 20,
          });
        }
        
        // Update progress
        setProcessProgress(20 + (i + 1) / totalPages * 60);
      }

      setProcessProgress(90);

      // Generate the PDF bytes
      const pdfBytes = await newPdf.save();
      
      setProcessProgress(100);

      // Generate filename and download
      const fileName = generateSplitFileName(originalFile.name, selectedPages);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, fileName);

      // Reset progress after a short delay
      setTimeout(() => {
        setProcessProgress(0);
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Error in splitCombinedMode:', error);
      throw error;
    }
  };

  const splitIndividualMode = async (originalPdf: PDFDocument) => {
    const pageArray = Array.from(selectedPages).sort((a, b) => a - b);
    const totalPages = pageArray.length;
    const zip = new JSZip();
    
    // Process each page individually
    for (let i = 0; i < totalPages; i++) {
      const pageNumber = pageArray[i];
      
      // Create a new PDF for this page
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNumber - 1]);
      newPdf.addPage(copiedPage);
      
      // Generate PDF bytes
      const pdfBytes = await newPdf.save();
      
      // Add to ZIP with individual filename
      const fileName = generateIndividualFileName(originalFile.name, pageNumber);
      zip.file(fileName, pdfBytes);
      
      // Update progress
      setProcessProgress(20 + (i + 1) / totalPages * 70);
    }

    setProcessProgress(95);

    // Generate and download ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    setProcessProgress(100);

    const zipFileName = generateZipFileName(originalFile.name, totalPages);
    saveAs(zipBlob, zipFileName);

    // Reset progress after a short delay
    setTimeout(() => {
      setProcessProgress(0);
      setIsProcessing(false);
    }, 1000);
  };

  const splitGroupsMode = async (originalPdf: PDFDocument) => {
    if (pageGroups.length === 0) {
      alert('Please create at least one group to split the PDF.');
      return;
    }

    const zip = new JSZip();
    const totalGroups = pageGroups.filter(group => group.pages.length > 0).length;
    let processedGroups = 0;
    
    // Process each group
    for (const group of pageGroups) {
      if (group.pages.length === 0) continue; // Skip empty groups
      
      // Create a new PDF for this group
      const newPdf = await PDFDocument.create();
      
      // Add pages to the group PDF
      for (const pageNumber of group.pages.sort((a, b) => a - b)) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNumber - 1]);
        newPdf.addPage(copiedPage);
      }
      
      // Generate PDF bytes
      const pdfBytes = await newPdf.save();
      
      // Add to ZIP with group name
      const baseFileName = originalFile.name.replace(/\.pdf$/i, '');
      const fileName = `${baseFileName}_${group.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      zip.file(fileName, pdfBytes);
      
      processedGroups++;
      // Update progress
      setProcessProgress(20 + (processedGroups / totalGroups) * 70);
    }

    setProcessProgress(95);

    // Generate and download ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    setProcessProgress(100);

    const baseFileName = originalFile.name.replace(/\.pdf$/i, '');
    const zipFileName = `${baseFileName}_${totalGroups}_groups.zip`;
    saveAs(zipBlob, zipFileName);

    // Reset progress after a short delay
    setTimeout(() => {
      setProcessProgress(0);
      setIsProcessing(false);
    }, 1000);
  };

  const removePagesMode = async (originalPdf: PDFDocument) => {
    try {
      // Create a new PDF document
      const newPdf = await PDFDocument.create();
      
      // Get all pages that should be KEPT (not removed)
      const allPages = Array.from(Array(totalPages).keys()).map(i => i + 1); // [1, 2, 3, ..., totalPages]
      const pagesToKeep = allPages.filter(pageNum => !selectedPages.has(pageNum));
      
      if (pagesToKeep.length === 0) {
        alert('Cannot remove all pages. At least one page must remain.');
        setIsProcessing(false);
        setProcessProgress(0);
        return;
      }
      
      setProcessProgress(30);
      
      // Copy the pages that should be kept to the new document
      const totalPagesToKeep = pagesToKeep.length;
      
      for (let i = 0; i < totalPagesToKeep; i++) {
        const pageNumber = pagesToKeep[i];
        
        try {
          // PDF-lib uses 0-based indexing, but our UI uses 1-based
          const copiedPages = await newPdf.copyPages(originalPdf, [pageNumber - 1]);
          newPdf.addPage(copiedPages[0]);
        } catch (error) {
          console.warn(`Could not copy page ${pageNumber}, adding blank page instead`);
          // Add a blank page as fallback
          const blankPage = newPdf.addPage();
          blankPage.drawText(`Page ${pageNumber} (from ${originalFile.name})`, {
            x: 50,
            y: 750,
            size: 20,
          });
        }
        
        // Update progress
        setProcessProgress(30 + (i + 1) / totalPagesToKeep * 50);
      }

      setProcessProgress(85);

      // Generate PDF bytes
      const pdfBytes = await newPdf.save();

      setProcessProgress(95);

      // Generate filename
      const removedCount = selectedPages.size;
      const baseFileName = originalFile.name.replace(/\.pdf$/i, '');
      const fileName = `${baseFileName}_${removedCount}_pages_removed.pdf`;

      setProcessProgress(100);

      // Download the new PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, fileName);

      // Reset progress after a short delay
      setTimeout(() => {
        setProcessProgress(0);
        setIsProcessing(false);
      }, 1000);

    } catch (error) {
      console.error('Error in removePagesMode:', error);
      throw error;
    }
  };

  // Demo functions for testing without real PDF processing
  const createDemoSplitPDF = async () => {
    const newPdf = await PDFDocument.create();
    const pageArray = Array.from(selectedPages).sort((a, b) => a - b);
    
    setProcessProgress(30);
    
    // Create a page for each selected page
    for (let i = 0; i < pageArray.length; i++) {
      const pageNumber = pageArray[i];
      const page = newPdf.addPage();
      
      page.drawText(`Demo PDF - Page ${pageNumber}`, {
        x: 50,
        y: 750,
        size: 20,
      });
      
      page.drawText(`This is a demo of page ${pageNumber} from:`, {
        x: 50,
        y: 700,
        size: 14,
      });
      
      page.drawText(originalFile.name, {
        x: 50,
        y: 680,
        size: 12,
      });
      
      page.drawText(`Selected in "Combined Pages" mode`, {
        x: 50,
        y: 650,
        size: 12,
      });
      
      setProcessProgress(30 + (i + 1) / pageArray.length * 50);
    }
    
    setProcessProgress(90);
    
    const pdfBytes = await newPdf.save();
    const fileName = generateSplitFileName(originalFile.name, selectedPages);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, fileName);
    
    setProcessProgress(100);
    
    setTimeout(() => {
      setProcessProgress(0);
      setIsProcessing(false);
    }, 1000);
  };

  const createDemoIndividualPDFs = async () => {
    const pageArray = Array.from(selectedPages).sort((a, b) => a - b);
    const zip = new JSZip();
    
    for (let i = 0; i < pageArray.length; i++) {
      const pageNumber = pageArray[i];
      const newPdf = await PDFDocument.create();
      const page = newPdf.addPage();
      
      page.drawText(`Demo PDF - Individual Page ${pageNumber}`, {
        x: 50,
        y: 750,
        size: 20,
      });
      
      page.drawText(`This is a demo of individual page ${pageNumber}`, {
        x: 50,
        y: 700,
        size: 14,
      });
      
      const pdfBytes = await newPdf.save();
      const fileName = generateIndividualFileName(originalFile.name, pageNumber);
      zip.file(fileName, pdfBytes);
      
      setProcessProgress(30 + (i + 1) / pageArray.length * 50);
    }
    
    setProcessProgress(90);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFileName = generateZipFileName(originalFile.name, pageArray.length);
    saveAs(zipBlob, zipFileName);
    
    setProcessProgress(100);
    
    setTimeout(() => {
      setProcessProgress(0);
      setIsProcessing(false);
    }, 1000);
  };

  const createDemoGroupPDFs = async () => {
    const validGroups = pageGroups.filter(group => group.pages.length > 0);
    const zip = new JSZip();
    
    for (let i = 0; i < validGroups.length; i++) {
      const group = validGroups[i];
      const newPdf = await PDFDocument.create();
      
      for (const pageNumber of group.pages.sort((a, b) => a - b)) {
        const page = newPdf.addPage();
        
        page.drawText(`Demo PDF - Group: ${group.name}`, {
          x: 50,
          y: 750,
          size: 20,
        });
        
        page.drawText(`Page ${pageNumber} from group "${group.name}"`, {
          x: 50,
          y: 700,
          size: 14,
        });
      }
      
      const pdfBytes = await newPdf.save();
      const baseFileName = originalFile.name.replace(/\.pdf$/i, '');
      const fileName = `${baseFileName}_${group.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      zip.file(fileName, pdfBytes);
      
      setProcessProgress(30 + (i + 1) / validGroups.length * 50);
    }
    
    setProcessProgress(90);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const baseFileName = originalFile.name.replace(/\.pdf$/i, '');
    const zipFileName = `${baseFileName}_${validGroups.length}_groups.zip`;
    saveAs(zipBlob, zipFileName);
    
    setProcessProgress(100);
    
    setTimeout(() => {
      setProcessProgress(0);
      setIsProcessing(false);
    }, 1000);
  };

  const pageArray = Array.from(selectedPages).sort((a, b) => a - b);
  const isValidSelection = splitMode === 'groups' 
    ? pageGroups.filter(group => group.pages.length > 0).length > 0
    : splitMode === 'remove'
      ? selectedPages.size > 0 && selectedPages.size < totalPages
      : selectedPages.size > 0;

  const getDownloadButtonText = () => {
    if (isProcessing) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      );
    }
    
    if (splitMode === 'individual') {
      return (
        <>
          <Package className="w-4 h-4" />
          Download ZIP ({selectedPages.size} PDFs)
        </>
      );
    }
    
    if (splitMode === 'groups') {
      const validGroups = pageGroups.filter(group => group.pages.length > 0).length;
      return (
        <>
          <Package className="w-4 h-4" />
          Download ZIP ({validGroups} Groups)
        </>
      );
    }
    
    if (splitMode === 'remove') {
      return (
        <>
          <Minus className="w-4 h-4" />
          Remove Pages & Download
        </>
      );
    }
    
    return (
      <>
        <Download className="w-4 h-4" />
        Download Split PDF
      </>
    );
  };

  const getOutputPreview = () => {
    if (!isValidSelection) return 'Select pages to preview output';
    
    if (splitMode === 'combined') {
      return generateSplitFileName(originalFile.name, selectedPages);
    } else if (splitMode === 'individual') {
      return generateZipFileName(originalFile.name, selectedPages.size);
    } else if (splitMode === 'groups') {
      const validGroups = pageGroups.filter(group => group.pages.length > 0).length;
      const baseFileName = originalFile.name.replace(/\.pdf$/i, '');
      return validGroups > 0 ? `${baseFileName}_${validGroups}_groups.zip` : 'Create groups to preview output';
    } else if (splitMode === 'remove') {
      const removedCount = selectedPages.size;
      const baseFileName = originalFile.name.replace(/\.pdf$/i, '');
      return `${baseFileName}_${removedCount}_pages_removed.pdf`;
    }
    
    return 'Unknown mode';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Split Mode Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <SplitModeSelector
          selectedMode={splitMode}
          onModeChange={setSplitMode}
          selectedPages={selectedPages}
          groupCount={pageGroups.filter(group => group.pages.length > 0).length}
        />
      </div>

      {/* Page Grouping (only for groups mode) */}
      {splitMode === 'groups' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <PageGrouping
            totalPages={totalPages}
            selectedPages={selectedPages}
            onGroupsChange={setPageGroups}
          />
        </div>
      )}

      {/* Split Configuration & Download */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Split PDF
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Original file:</span>
                <span className="font-medium text-gray-900">{originalFile.name}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Selected pages:</span>
                <span className="font-medium text-gray-900">
                  {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''}
                </span>
              </div>
              
              {isValidSelection && (
                <div className="text-sm">
                  <span className="text-gray-600">Pages: </span>
                  <span className="font-medium text-gray-900">
                    {pageArray.length <= 10 
                      ? pageArray.join(', ')
                      : `${pageArray.slice(0, 10).join(', ')}... (+${pageArray.length - 10} more)`
                    }
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Output:</span>
                <span className="font-medium text-gray-900 text-right break-all">
                  {getOutputPreview()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Processing PDF...</span>
              <span>{Math.round(processProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onReset}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Upload New File
          </button>
          
          <button
            onClick={splitPDF}
            disabled={!isValidSelection || isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {getDownloadButtonText()}
          </button>
        </div>

        {/* Help Text */}
        {!isValidSelection && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              Select one or more pages from the preview above to create your split PDF.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
