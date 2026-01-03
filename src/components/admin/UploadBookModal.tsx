
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { uploadPdfFile, fetchDepartments, fetchSubjectsBySemester, Department, Subject } from "@/utils/databaseUtils";
import { fetchCommonSubjects } from "@/utils/commonSubjectUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface UploadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  onUploadSuccess: () => void;
}

const UploadBookModal = ({ isOpen, onClose, subjectId, onUploadSuccess }: UploadBookModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    selectedSubjectId: subjectId || "",
    file: null as File | null
  });
  const [uploading, setUploading] = useState(false);

  // Fetch all departments and subjects for selection
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const { data: commonSubjects = [] } = useQuery({
    queryKey: ['common-subjects'],
    queryFn: fetchCommonSubjects,
  });

  const { data: allSubjects = [] } = useQuery({
    queryKey: ['all-subjects-for-upload'],
    queryFn: async () => {
      const allSubjects: Subject[] = [];
      for (const dept of departments) {
        for (let sem = 1; sem <= 8; sem++) {
          const subjects = await fetchSubjectsBySemester(dept.code, sem);
          allSubjects.push(...subjects);
        }
      }
      return allSubjects;
    },
    enabled: departments.length > 0,
  });

  // Update selected subject when subjectId prop changes
  useEffect(() => {
    if (subjectId) {
      setFormData(prev => ({ ...prev, selectedSubjectId: subjectId }));
    }
  }, [subjectId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        author: "",
        description: "",
        selectedSubjectId: subjectId || "",
        file: null
      });
    }
  }, [isOpen, subjectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, file });
      console.log('📁 File selected:', file.name, 'Size:', Math.round(file.size / 1024 / 1024) + 'MB');
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    if (!formData.file) {
      toast({
        title: "Missing File",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a book title",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.selectedSubjectId) {
      toast({
        title: "Missing Subject",
        description: "Please select a subject for the book",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setUploading(true);
    
    try {
      console.log('📤 Starting book upload process...');
      console.log('📁 File:', formData.file!.name, 'Size:', formData.file!.size);
      console.log('📚 Subject ID:', formData.selectedSubjectId);
      console.log('📖 Title:', formData.title);

      // Check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Auth session:', session ? 'Found' : 'Not found');

      // Upload file to storage with better error handling
      let filePath: string;
      try {
        filePath = await uploadPdfFile(formData.file!);
        if (!filePath) {
          throw new Error('File upload returned empty path');
        }
        console.log('✅ File uploaded to storage:', filePath);
      } catch (uploadError) {
        console.error('❌ File upload error:', uploadError);
        throw new Error(`File upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown storage error'}`);
      }

      // Save ebook record to database with comprehensive error handling
      try {
        const { data, error } = await supabase
          .from('ebooks')
          .insert({
            subject_id: formData.selectedSubjectId,
            title: formData.title.trim(),
            author: formData.author.trim() || 'Unknown Author',
            description: formData.description.trim() || '',
            file_path: filePath,
            file_size: formData.file!.size,
            file_type: 'pdf',
            download_count: 0,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Database insert error:', error);
          // If database insert fails, try to clean up the uploaded file
          try {
            await supabase.storage.from('ebooks').remove([filePath]);
            console.log('🧹 Cleaned up uploaded file after database error');
          } catch (cleanupError) {
            console.error('⚠️ Failed to cleanup file:', cleanupError);
          }
          throw new Error(`Database error: ${error.message}`);
        }

        console.log('✅ Book record saved to database:', data);
      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
        throw dbError;
      }

      // Success
      toast({
        title: "Upload Successful",
        description: `"${formData.title}" has been uploaded successfully`,
      });

      // Reset form and close modal
      setFormData({ 
        title: "", 
        author: "", 
        description: "", 
        selectedSubjectId: subjectId || "", 
        file: null 
      });
      
      onUploadSuccess();
      onClose();

    } catch (error) {
      console.error('❌ Complete upload error:', error);
      
      let errorMessage = 'Failed to upload the book. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const selectedSubject = allSubjects.find(s => s.id === formData.selectedSubjectId);

  // Group subjects by type (common vs department-specific)
  const commonSubjectOptions = allSubjects.filter(s => s.is_common);
  const departmentSubjectOptions = allSubjects.filter(s => !s.is_common);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload New Book</DialogTitle>
          <DialogDescription>
            Upload a PDF book to the selected subject
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Select 
              value={formData.selectedSubjectId} 
              onValueChange={(value) => setFormData({ ...formData, selectedSubjectId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {commonSubjectOptions.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                      Common Subjects
                    </div>
                    {commonSubjectOptions.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center space-x-2">
                          <span>{subject.code} - {subject.name}</span>
                          <Badge variant="secondary" className="text-xs">Common</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                
                {departmentSubjectOptions.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                      Department Subjects
                    </div>
                    {departmentSubjectOptions.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center space-x-2">
                          <span>{subject.code} - {subject.name}</span>
                          <Badge variant="outline" className="text-xs">Department</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {selectedSubject && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {selectedSubject.code} - {selectedSubject.name}
                {selectedSubject.is_common && (
                  <Badge variant="secondary" className="ml-2 text-xs">Common Subject</Badge>
                )}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="title">Book Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter book title"
              disabled={uploading}
            />
          </div>
          
          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Enter author name"
              disabled={uploading}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter book description"
              rows={3}
              disabled={uploading}
            />
          </div>
          
          <div>
            <Label htmlFor="pdf-file">PDF File *</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {formData.file && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {formData.file.name} ({Math.round(formData.file.size / 1024 / 1024)}MB)
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Book'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadBookModal;
