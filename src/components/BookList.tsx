
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, RefreshCw, Eye } from 'lucide-react';
import { type Ebook } from '@/utils/databaseUtils';

interface BookListProps {
  books: Ebook[];
  selectedBook: Ebook | null;
  onBookSelect: (book: Ebook) => void;
  onRefresh: () => void;
}

export const BookList = ({ books, selectedBook, onBookSelect, onRefresh }: BookListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center text-green-600">
          <FileText className="h-5 w-5 mr-2" />
          Available Books ({books.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {books.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No books available for this subject.</p>
            <Button variant="outline" onClick={onRefresh} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {books.map(book => (
              <div
                key={book.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedBook?.id === book.id 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onBookSelect(book)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm leading-tight">
                    {book.title || 'Untitled Book'}
                  </h3>
                  {selectedBook?.id === book.id && (
                    <Eye className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  {book.author || 'Unknown Author'}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {book.file_type?.toUpperCase() || 'PDF'}
                  </Badge>
                  {book.file_size && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(book.file_size / 1024 / 1024)}MB
                    </Badge>
                  )}
                  {book.download_count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {book.download_count} downloads
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
