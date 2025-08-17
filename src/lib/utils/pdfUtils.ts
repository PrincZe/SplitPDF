/**
 * Utility functions for PDF operations
 */

/**
 * Validates if a file is a valid PDF
 */
export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'File must be a PDF' };
  }

  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File size must be less than ${maxSize / (1024 * 1024)}MB` 
    };
  }

  return { isValid: true };
}

/**
 * Generates a filename for split PDF
 */
export function generateSplitFileName(
  originalName: string, 
  selectedPages: Set<number>
): string {
  const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
  const pageArray = Array.from(selectedPages).sort((a, b) => a - b);
  
  if (pageArray.length === 0) {
    return `${nameWithoutExt}_empty.pdf`;
  }
  
  if (pageArray.length === 1) {
    return `${nameWithoutExt}_page_${pageArray[0]}.pdf`;
  } else if (pageArray.length <= 3) {
    return `${nameWithoutExt}_pages_${pageArray.join('_')}.pdf`;
  } else {
    return `${nameWithoutExt}_${pageArray.length}_pages.pdf`;
  }
}

/**
 * Formats file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Creates a range of page numbers
 */
export function createPageRange(start: number, end: number): number[] {
  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
}

/**
 * Validates page selection
 */
export function validatePageSelection(
  selectedPages: Set<number>,
  totalPages: number
): { isValid: boolean; error?: string } {
  if (selectedPages.size === 0) {
    return { isValid: false, error: 'Please select at least one page' };
  }

  const invalidPages = Array.from(selectedPages).filter(
    page => page < 1 || page > totalPages
  );

  if (invalidPages.length > 0) {
    return { 
      isValid: false, 
      error: `Invalid page numbers: ${invalidPages.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Generates filename for individual page split mode
 */
export function generateIndividualFileName(
  originalName: string,
  pageNumber: number
): string {
  const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
  return `${nameWithoutExt}_page_${pageNumber}.pdf`;
}

/**
 * Generates ZIP filename for multiple files
 */
export function generateZipFileName(
  originalName: string,
  fileCount: number
): string {
  const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
  return `${nameWithoutExt}_split_${fileCount}_files.zip`;
}
