import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { pdfjs } from 'react-pdf';
import { fetchEbooksBySubject, incrementDownloadCount, getCorrectFilePath, type Ebook } from '@/utils/databaseUtils';
import { supabase } from '@/integrations/supabase/client';
import { BookList } from '@/components/BookList';
import { PDFViewer } from '@/components/PDFViewer';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Enhanced PDF.js worker configuration with multiple fallbacks
const configurePdfWorker = () => {
  // Try to set worker with proper version matching
  const pdfVersion = pdfjs.version || '3.11.174';
  console.log('Setting up PDF.js worker for version:', pdfVersion);
  
  // Primary worker URL
  const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.js`;
  
  // Fallback worker URLs
  const fallbackWorkers = [
    `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.js`
  ];
  
  // Set primary worker URL
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  
  console.log('PDF.js worker configured:', workerUrl);
  console.log('Available fallback workers:', fallbackWorkers);
  
  // Test worker availability
  fetch(workerUrl, { method: 'HEAD' })
    .then(response => {
      if (!response.ok) {
        console.warn('Primary PDF worker not available, will use fallback');
        pdfjs.GlobalWorkerOptions.workerSrc = fallbackWorkers[0];
      }
    })
    .catch(error => {
      console.warn('PDF worker test failed, using fallback:', error);
      pdfjs.GlobalWorkerOptions.workerSrc = fallbackWorkers[0];
    });
};

// Configure PDF worker on module load
configurePdfWorker();

console.log('PDF.js version:', pdfjs.version);
console.log('PDF.js worker URL:', pdfjs.GlobalWorkerOptions.workerSrc);

const BookViewer = () => {
  const { subjectCode } = useParams<{ subjectCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [books, setBooks] = useState<Ebook[]>([]);
  const [selectedBook, setSelectedBook] = useState<Ebook | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (subjectCode) {
      loadBooks();
    }
  }, [subjectCode]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading books for subject:', subjectCode);
      const booksData = await fetchEbooksBySubject(subjectCode);
      console.log('📖 Books loaded:', booksData.length);
      setBooks(booksData);
      if (booksData.length > 0) {
        console.log('🎯 Auto-selecting first book:', booksData[0].title);
        setSelectedBook(booksData[0]);
        await loadPdf(booksData[0]);
      }
    } catch (error) {
      console.error('❌ Error loading books:', error);
      toast({
        title: "Error",
        description: "Failed to load books for this subject",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPdf = async (book: Ebook, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      setPdfLoading(true);
      setPdfError(null);
      console.log(`📄 Loading PDF for: ${book.title} (attempt ${retryCount + 1})`);
      console.log('📁 Original file path:', book.file_path);

      const correctPath = await getCorrectFilePath(book.file_path);
      console.log('🎯 Resolved file path:', correctPath);

      console.log('🔐 Creating signed URL...');
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('ebooks')
        .createSignedUrl(correctPath, 7200, { // Extended to 2 hours
          transform: {
            quality: 90 // Improved quality
          }
        });
        
      if (signedUrlError) {
        console.error('❌ Error creating signed URL:', signedUrlError);
        throw new Error(`File not found in storage: ${signedUrlError.message}`);
      }
      
      if (!signedUrlData?.signedUrl) {
        console.error('❌ No signed URL received');
        throw new Error('Unable to access file from storage');
      }
      
      console.log('✅ Signed URL created successfully');

      // Enhanced PDF accessibility test with better error handling
      console.log('🔍 Testing PDF accessibility...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(signedUrlData.signedUrl, { 
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'Accept': 'application/pdf,*/*',
          }
        });
        
        clearTimeout(timeoutId);
        
        console.log('📊 PDF response status:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`PDF not accessible (HTTP ${response.status}: ${response.statusText})`);
        }
        
        // Check content type
        const contentType = response.headers.get('content-type');
        console.log('📋 Content type:', contentType);
        
        if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
          console.warn('⚠️ Unexpected content type:', contentType);
        }
        
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('PDF accessibility test timed out');
        }
        
        console.warn('⚠️ HEAD request failed, trying alternative method:', fetchError.message);
        
        // Try a range request instead
        try {
          const rangeResponse = await fetch(signedUrlData.signedUrl, {
            headers: { 'Range': 'bytes=0-1024' } // Just get first 1KB
          });
          
          if (!rangeResponse.ok && rangeResponse.status !== 206) {
            throw new Error(`PDF not accessible via range request (HTTP ${rangeResponse.status})`);
          }
        } catch (rangeError) {
          throw new Error(`PDF file is not accessible: ${fetchError.message}`);
        }
      }
      
      console.log('✅ PDF is accessible, setting URL');
      setPdfUrl(signedUrlData.signedUrl);
      setPageNumber(1);
      
    } catch (error: any) {
      console.error(`❌ Error loading PDF (attempt ${retryCount + 1}):`, error);
      
      // Auto-retry with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Retrying in ${delay}ms...`);
        
        setTimeout(() => {
          loadPdf(book, retryCount + 1);
        }, delay);
        
        return;
      }
      
      // Final failure
      const errorMessage = error instanceof Error ? error.message : 'Failed to load PDF';
      setPdfError(errorMessage);
      setPdfUrl(null);
      
      toast({
        title: "Unable to Load PDF",
        description: errorMessage + ". You can try downloading the file instead.",
        variant: "destructive"
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedBook || !pdfUrl) return;
    try {
      console.log('💾 Starting download for:', selectedBook.title);
      await incrementDownloadCount(selectedBook.id);

      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${selectedBook.title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${selectedBook.title}`
      });
      console.log('✅ Download initiated successfully');
    } catch (error) {
      console.error('❌ Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file",
        variant: "destructive"
      });
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('✅ PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('❌ PDF document load error:', error);
    setPdfError('Unable to display this PDF. Please try downloading it instead.');
  };

  const retryPdfLoad = async () => {
    if (selectedBook) {
      console.log('🔄 Retrying PDF load...');
      await loadPdf(selectedBook);
    }
  };

  const handleBookSelect = async (book: Ebook) => {
    console.log('📖 Selecting book:', book.title);
    setSelectedBook(book);
    await loadPdf(book);
  };

  const handleBack = () => {
    if (subjectCode) {
      navigate(-1);
    } else {
      navigate('/departments');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading books...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-emerald-600 hover:text-emerald-900 p-1 sm:p-2">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              <img 
                src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
                alt="SMCE" 
                className="h-6 sm:h-8 w-auto"
              />
              
              <h1 className="text-lg sm:text-xl font-bold text-emerald-900">
                {subjectCode} - Books & Resources
              </h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Book List Sidebar */}
          <div className="lg:col-span-1">
            <BookList
              books={books}
              selectedBook={selectedBook}
              onBookSelect={handleBookSelect}
              onRefresh={loadBooks}
            />
          </div>

          {/* PDF Viewer */}
          <div className="lg:col-span-3">
            <PDFViewer
              selectedBook={selectedBook}
              pdfUrl={pdfUrl}
              pdfLoading={pdfLoading}
              pdfError={pdfError}
              numPages={numPages}
              pageNumber={pageNumber}
              scale={scale}
              onDownload={handleDownload}
              onRetryPdfLoad={retryPdfLoad}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              onDocumentLoadError={onDocumentLoadError}
              setPageNumber={setPageNumber}
              setScale={setScale}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookViewer;
