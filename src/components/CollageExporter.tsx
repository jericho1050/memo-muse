import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export type ExportFormat = 'png' | 'jpeg' | 'pdf';

interface CollageExporterProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  filename?: string;
  className?: string;
}

// Define the options type for html2canvas-pro
type Html2CanvasOptions = Partial<{
  backgroundColor: string;
  scale: number;
  logging: boolean;
  allowTaint: boolean;
  useCORS: boolean;
  removeContainer: boolean;
  foreignObjectRendering: boolean;
  imageTimeout: number;
  filter: (node: HTMLElement) => boolean;
}>;

function CollageExporter({ targetRef, filename = 'collage', className = '' }: CollageExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  const generatePreview = async () => {
    if (!targetRef.current) {
      console.error('Target element not found');
      alert('Unable to find the collage to export. Please try again.');
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Add a class to the container during export
      targetRef.current.classList.add('exporting');
      
      // Create canvas from the collage element using html2canvas-pro
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2, // Higher resolution
        logging: false,
        allowTaint: true,
        useCORS: true,
        removeContainer: true,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        filter: (node: HTMLElement) => {
          // Skip elements with specific classes that we don't want in the export
          const classNames = node.className || '';
          const skipClasses = [
            'react-resizable-handle',
            'handle',
            'export-hide', // Generic class for elements to hide during export
            'controls',
            'icon'
          ];
          
          // Skip if the element has any of the excluded classes
          if (typeof classNames === 'string' && skipClasses.some(cls => classNames.includes(cls))) {
            return false;
          }
          
          // Skip buttons and other UI controls
          const skipTags = ['BUTTON', 'INPUT', 'SELECT'];
          if (skipTags.includes(node.tagName)) {
            return false;
          }
          
          // Include the element in the export
          return true;
        }
      } as Html2CanvasOptions);
      
      const imageUrl = canvas.toDataURL(`image/${exportFormat === 'pdf' ? 'png' : exportFormat}`, 1.0);
      setPreviewUrl(imageUrl);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview. This might be due to image loading issues or browser limitations. Please try again.');
    } finally {
      // Remove the exporting class
      if (targetRef.current) {
        targetRef.current.classList.remove('exporting');
      }
      setIsExporting(false);
    }
  };
  
  const handleExport = async () => {
    if (!previewUrl) return;
    
    try {
      if (exportFormat === 'pdf') {
        // Create PDF from the preview image
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
        });
        
        // Calculate aspect ratio and fit to page
        const img = new Image();
        img.src = previewUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        
        const pageWidth = 280;
        const pageHeight = 200;
        const imgAspectRatio = img.width / img.height;
        
        let imgWidth = pageWidth;
        let imgHeight = pageWidth / imgAspectRatio;
        
        if (imgHeight > pageHeight) {
          imgHeight = pageHeight;
          imgWidth = pageHeight * imgAspectRatio;
        }
        
        const x = (pageWidth - imgWidth) / 2 + 10;
        const y = (pageHeight - imgHeight) / 2 + 10;
        
        pdf.addImage(previewUrl, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`${filename}.pdf`);
      } else {
        // For PNG/JPEG, just download the image
        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = `${filename}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Close the preview after successful download
      closePreview();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export. Please try again.');
    }
  };
  
  const closePreview = () => {
    setShowPreview(false);
    setPreviewUrl(null);
  };
  
  return (
    <div className={className}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Format
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              value="png"
              checked={exportFormat === 'png'}
              onChange={() => setExportFormat('png')}
            />
            <span className="ml-2">PNG</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              value="jpeg"
              checked={exportFormat === 'jpeg'}
              onChange={() => setExportFormat('jpeg')}
            />
            <span className="ml-2">JPEG</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              value="pdf"
              checked={exportFormat === 'pdf'}
              onChange={() => setExportFormat('pdf')}
            />
            <span className="ml-2">PDF</span>
          </label>
        </div>
      </div>
      
      <button
        onClick={generatePreview}
        disabled={isExporting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center"
      >
        {isExporting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Preview...
          </>
        ) : (
          'Generate Export Preview'
        )}
      </button>
      
      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" ref={previewRef}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Export Preview</h3>
              <button 
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-auto p-4 flex-grow">
              <img 
                src={previewUrl} 
                alt="Export preview" 
                className="max-w-full mx-auto border"
              />
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button
                onClick={closePreview}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download as {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollageExporter; 