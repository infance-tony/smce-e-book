import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Search, Download, Trash2, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { fetchDepartments, fetchSemestersByDepartment, fetchSubjectsBySemester, fetchEbooksBySubjectId, verifyFileExists, type Department, type Semester, type Subject, type Ebook } from "@/utils/databaseUtils";
import { deleteEbook } from "@/utils/adminUtils";
import UploadBookModal from "./UploadBookModal";

const BookManager = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number>(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [books, setBooks] = useState<Ebook[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<Record<string, { exists: boolean; actualPath?: string }>>({});

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadSemesters();
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDepartment && selectedSemester > 0) {
      loadSubjects();
    }
  }, [selectedDepartment, selectedSemester]);

  useEffect(() => {
    if (selectedSubject) {
      loadBooks();
    }
  }, [selectedSubject]);

  useEffect(() => {
    // Verify file existence for all books
    verifyAllFiles();
  }, [books]);

  const loadDepartments = async () => {
    try {
      const depts = await fetchDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      });
    }
  };

  const loadSemesters = async () => {
    try {
      const dept = departments.find(d => d.id === selectedDepartment);
      if (dept) {
        const sems = await fetchSemestersByDepartment(dept.code);
        setSemesters(sems);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      toast({
        title: "Error",
        description: "Failed to load semesters",
        variant: "destructive",
      });
    }
  };

  const loadSubjects = async () => {
    try {
      const dept = departments.find(d => d.id === selectedDepartment);
      if (dept) {
        const subs = await fetchSubjectsBySemester(dept.code, selectedSemester);
        setSubjects(subs);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const booksData = await fetchEbooksBySubjectId(selectedSubject);
      setBooks(booksData);
    } catch (error) {
      console.error('Error loading books:', error);
      toast({
        title: "Error",
        description: "Failed to load books",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAllFiles = async () => {
    const statuses: Record<string, { exists: boolean; actualPath?: string }> = {};
    
    for (const book of books) {
      try {
        const status = await verifyFileExists(book.file_path);
        statuses[book.id] = status;
      } catch (error) {
        console.error('Error verifying file:', book.file_path, error);
        statuses[book.id] = { exists: false };
      }
    }
    
    setFileStatuses(statuses);
  };

  const handleDeleteBook = async (book: Ebook) => {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const success = await deleteEbook(book.id);
      if (success) {
        toast({
          title: "Success",
          description: "Book deleted successfully",
        });
        loadBooks();
      } else {
        throw new Error("Failed to delete book");
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBook = async (book: Ebook) => {
    try {
      const status = fileStatuses[book.id];
      if (!status?.exists) {
        toast({
          title: "File Not Found",
          description: "The file is not accessible in storage",
          variant: "destructive",
        });
        return;
      }

      const filePath = status.actualPath || book.file_path;
      const publicUrl = `https://ktiybnnrketqovmlizqs.supabase.co/storage/v1/object/public/ebooks/${encodeURIComponent(filePath)}`;
      
      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = `${book.title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading ${book.title}`,
      });
    } catch (error) {
      console.error('Error downloading book:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file",
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-navy-900">Book Management</h2>
          {selectedSubject && (
            <Button 
              onClick={() => setUploadModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Book
            </Button>
          )}
        </div>

        {/* Department, Semester, and Subject Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by Department, Semester & Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.code} - {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select 
                  value={selectedSemester.toString()} 
                  onValueChange={(value) => setSelectedSemester(parseInt(value))}
                  disabled={!selectedDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem.id} value={sem.semester_number.toString()}>
                        {sem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={selectedSubject} 
                  onValueChange={setSelectedSubject}
                  disabled={!selectedSemester}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book List */}
        {selectedSubject && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Books for {selectedSubjectData?.code} - {selectedSubjectData?.name}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading books...</p>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No books found for this subject.</p>
                  <Button 
                    onClick={() => setUploadModalOpen(true)}
                    className="mt-4 bg-primary hover:bg-primary/90"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Book
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBooks.map((book) => {
                    const fileStatus = fileStatuses[book.id];
                    return (
                      <Card key={book.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-navy-900">{book.title}</h3>
                                {fileStatus?.exists ? (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>File accessible</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>File missing or inaccessible</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <p>Author: {book.author || 'Unknown'}</p>
                                  <p>File Type: {book.file_type?.toUpperCase() || 'PDF'}</p>
                                  <p>Size: {book.file_size ? `${Math.round(book.file_size / 1024 / 1024)}MB` : 'Unknown'}</p>
                                </div>
                                <div>
                                  <p>Downloads: {book.download_count || 0}</p>
                                  <p>Status: {book.is_active ? 'Active' : 'Inactive'}</p>
                                  <p className="text-xs break-all">Path: {book.file_path}</p>
                                  {fileStatus?.actualPath && fileStatus.actualPath !== book.file_path && (
                                    <p className="text-xs text-green-600 break-all">Actual: {fileStatus.actualPath}</p>
                                  )}
                                </div>
                              </div>
                              
                              {book.description && (
                                <p className="text-sm text-gray-600 mt-2">{book.description}</p>
                              )}
                            </div>
                            
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadBook(book)}
                                disabled={!fileStatus?.exists}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBook(book)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-3">
                            <Badge variant={book.is_active ? "default" : "secondary"}>
                              {book.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{book.file_type?.toUpperCase() || 'PDF'}</Badge>
                            {fileStatus?.exists ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                File OK
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                File Missing
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Book Modal */}
        <UploadBookModal 
          isOpen={uploadModalOpen} 
          onClose={() => setUploadModalOpen(false)} 
          subjectId={selectedSubject} 
          onUploadSuccess={() => {
            loadBooks();
            toast({
              title: "Upload Complete",
              description: "Book uploaded successfully",
            });
          }} 
        />
      </div>
    </TooltipProvider>
  );
};

export default BookManager;
