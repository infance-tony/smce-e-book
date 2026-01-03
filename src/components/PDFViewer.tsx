
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import { type Ebook } from '@/utils/databaseUtils';

interface PDFViewerProps {
  selectedBook: Ebook | null;
  pdfUrl: string | null;
  pdfLoading: boolean;
  pdfError: string | null;
  numPages: number | null;
  pageNumber: number;
  scale: number;
  onDownload: () => void;
  onRetryPdfLoad: () => void;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
  setPageNumber: (page: number) => void;
  setScale: (scale: number) => void;
}

export const PDFViewer = ({
  selectedBook,
  pdfUrl,
  pdfLoading,
  pdfError,
  numPages,
  pageNumber,
  scale,
  onDownload,
  onRetryPdfLoad,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  setPageNumber,
  setScale,
}: PDFViewerProps) => {
  const openInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const renderContent = () => {
    if (!selectedBook) {
      return (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Book Selected</h3>
          <p className="text-gray-500">Please select a book from the list to view it here.</p>
        </div>
      );
    }

    if (pdfLoading) {
      return (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Loading PDF</h3>
          <p className="text-gray-500">Please wait while we prepare your document...</p>
          <div className="mt-4 text-xs text-gray-400">
            This may take a moment for larger files
          </div>
        </div>
      );
    }

    if (pdfError) {
      return (
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-600 mb-2">Unable to Load PDF</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">{pdfError}</p>
          <div className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 p-2 rounded max-w-md mx-auto">
            File: {selectedBook.file_path}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">You can try the following options:</p>
            <div className="flex justify-center space-x-2 flex-wrap gap-2">
              <Button onClick={onRetryPdfLoad} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
              <Button onClick={onDownload} variant="outline" size="sm" disabled={!selectedBook}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              {pdfUrl && (
                <Button onClick={openInNewTab} variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (!pdfUrl) {
      return (
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Document Unavailable</h3>
          <p className="text-gray-500 mb-4">Unable to display this PDF in the browser.</p>
          <Button onClick={onDownload} variant="outline" disabled={!selectedBook}>
            <Download className="h-4 w-4 mr-2" />
            Download Instead
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* PDF Controls */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
              >
                Previous
              </Button>
              <span className="text-sm font-medium px-3 py-1 bg-white rounded border">
                Page {pageNumber} of {numPages || '?'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber(Math.min(numPages || pageNumber, pageNumber + 1))}
                disabled={pageNumber >= (numPages || pageNumber)}
              >
                Next
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            >
              -
            </Button>
            <span className="text-sm font-medium px-3 py-1 bg-white rounded border min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(Math.min(2.0, scale + 0.1))}
            >
              +
            </Button>
            
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Document with Enhanced Configuration */}
        <div className="flex justify-center border rounded-lg overflow-auto max-h-[80vh] bg-gray-50">
          <Document
            file={{
              url: pdfUrl,
              httpHeaders: {},
              withCredentials: false,
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
                <span>Loading document...</span>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">PDF Load Error</h3>
                <p className="text-gray-600 mb-4">This PDF cannot be displayed in the browser.</p>
                <div className="flex space-x-2">
                  <Button onClick={onDownload} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                  <Button onClick={openInNewTab} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            }
            options={{
              cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
              cMapPacked: true,
              standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
              verbosity: 1,
              isEvalSupported: false,
              disableRange: false,
              disableStream: false,
              disableAutoFetch: true,
              disableFontFace: false,
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                  <span className="text-sm">Rendering page...</span>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-sm text-gray-600">Page failed to render</p>
                  <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-2">
                    Reload Page
                  </Button>
                </div>
              }
            />
          </Document>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg mb-1">
              {selectedBook ? (selectedBook.title || 'Untitled Book') : 'Select a book to view'}
            </CardTitle>
            {selectedBook && selectedBook.author && (
              <p className="text-sm text-gray-600">by {selectedBook.author}</p>
            )}
          </div>
          {selectedBook && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                disabled={pdfLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};
