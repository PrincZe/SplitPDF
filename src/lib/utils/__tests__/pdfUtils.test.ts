/**
 * Tests for PDF utility functions
 * These tests can be run manually or with a testing framework
 */

import { 
  validatePDFFile, 
  generateSplitFileName, 
  formatFileSize, 
  createPageRange, 
  validatePageSelection 
} from '../pdfUtils';

// Mock File class for testing
class MockFile implements Partial<File> {
  name: string;
  type: string;
  size: number;

  constructor(name: string, type: string, size: number) {
    this.name = name;
    this.type = type;
    this.size = size;
  }
}

/**
 * Test suite for PDF utilities
 */
export function runPDFUtilsTests() {
  console.log('Running PDF Utils Tests...');
  
  // Test validatePDFFile
  testValidatePDFFile();
  
  // Test generateSplitFileName
  testGenerateSplitFileName();
  
  // Test formatFileSize
  testFormatFileSize();
  
  // Test createPageRange
  testCreatePageRange();
  
  // Test validatePageSelection
  testValidatePageSelection();
  
  console.log('All PDF Utils Tests Completed!');
}

function testValidatePDFFile() {
  console.log('Testing validatePDFFile...');
  
  // Valid PDF
  const validPDF = new MockFile('test.pdf', 'application/pdf', 1024 * 1024) as File;
  const validResult = validatePDFFile(validPDF);
  console.assert(validResult.isValid === true, 'Valid PDF should pass validation');
  
  // Invalid file type
  const invalidType = new MockFile('test.txt', 'text/plain', 1024) as File;
  const invalidTypeResult = validatePDFFile(invalidType);
  console.assert(invalidTypeResult.isValid === false, 'Non-PDF should fail validation');
  console.assert(invalidTypeResult.error?.includes('PDF'), 'Error should mention PDF requirement');
  
  // File too large
  const largePDF = new MockFile('large.pdf', 'application/pdf', 200 * 1024 * 1024) as File;
  const largeResult = validatePDFFile(largePDF);
  console.assert(largeResult.isValid === false, 'Large file should fail validation');
  console.assert(largeResult.error?.includes('size'), 'Error should mention size limit');
  
  console.log('✓ validatePDFFile tests passed');
}

function testGenerateSplitFileName() {
  console.log('Testing generateSplitFileName...');
  
  // Single page
  const singlePage = generateSplitFileName('document.pdf', new Set([5]));
  console.assert(singlePage === 'document_page_5.pdf', 'Single page filename incorrect');
  
  // Multiple pages (few)
  const fewPages = generateSplitFileName('document.pdf', new Set([1, 3, 5]));
  console.assert(fewPages === 'document_pages_1_3_5.pdf', 'Few pages filename incorrect');
  
  // Many pages
  const manyPages = generateSplitFileName('document.pdf', new Set([1, 2, 3, 4, 5, 6]));
  console.assert(manyPages === 'document_6_pages.pdf', 'Many pages filename incorrect');
  
  // Empty selection
  const emptyPages = generateSplitFileName('document.pdf', new Set());
  console.assert(emptyPages === 'document_empty.pdf', 'Empty selection filename incorrect');
  
  console.log('✓ generateSplitFileName tests passed');
}

function testFormatFileSize() {
  console.log('Testing formatFileSize...');
  
  console.assert(formatFileSize(0) === '0 Bytes', 'Zero bytes formatting incorrect');
  console.assert(formatFileSize(1024) === '1 KB', 'KB formatting incorrect');
  console.assert(formatFileSize(1024 * 1024) === '1 MB', 'MB formatting incorrect');
  console.assert(formatFileSize(1536) === '1.5 KB', 'Decimal formatting incorrect');
  
  console.log('✓ formatFileSize tests passed');
}

function testCreatePageRange() {
  console.log('Testing createPageRange...');
  
  const range1 = createPageRange(1, 5);
  console.assert(JSON.stringify(range1) === JSON.stringify([1, 2, 3, 4, 5]), 'Range 1-5 incorrect');
  
  const range2 = createPageRange(3, 3);
  console.assert(JSON.stringify(range2) === JSON.stringify([3]), 'Single page range incorrect');
  
  console.log('✓ createPageRange tests passed');
}

function testValidatePageSelection() {
  console.log('Testing validatePageSelection...');
  
  // Valid selection
  const validSelection = validatePageSelection(new Set([1, 2, 3]), 5);
  console.assert(validSelection.isValid === true, 'Valid selection should pass');
  
  // Empty selection
  const emptySelection = validatePageSelection(new Set(), 5);
  console.assert(emptySelection.isValid === false, 'Empty selection should fail');
  console.assert(emptySelection.error?.includes('at least one'), 'Error should mention minimum requirement');
  
  // Invalid page numbers
  const invalidSelection = validatePageSelection(new Set([1, 6, 7]), 5);
  console.assert(invalidSelection.isValid === false, 'Invalid pages should fail');
  console.assert(invalidSelection.error?.includes('Invalid'), 'Error should mention invalid pages');
  
  console.log('✓ validatePageSelection tests passed');
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.addEventListener('load', () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Running PDF Utils Tests in Development Mode...');
      runPDFUtilsTests();
    }
  });
}
