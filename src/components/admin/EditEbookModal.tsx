
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ebook } from "@/utils/databaseUtils";
import { supabase } from "@/integrations/supabase/client";

interface EditEbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  ebook: Ebook | null;
  onSave: (id: string, updates: Partial<Ebook>) => Promise<void>;
}

const EditEbookModal = ({ isOpen, onClose, ebook, onSave }: EditEbookModalProps) => {
  const [formData, setFormData] = useState({
    title: ebook?.title || "",
    author: ebook?.author || "",
    description: ebook?.description || "",
    file: null as File | null
  });
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, file });
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ebooks')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }

      return filePath;
    } catch (error) {
      console.error('Error in file upload:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!ebook) return;

    setUploading(true);
    try {
      const updates: Partial<Ebook> = {
        title: formData.title,
        author: formData.author,
        description: formData.description
      };
      
      if (formData.file) {
        // Upload new file
        const filePath = await uploadFile(formData.file);
        if (filePath) {
          updates.file_path = filePath;
          updates.file_size = formData.file.size;
          updates.file_type = 'pdf';
        } else {
          throw new Error('Failed to upload file');
        }
      }
      
      await onSave(ebook.id, updates);
      onClose();
    } catch (error) {
      console.error('Error saving ebook:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Book</DialogTitle>
          <DialogDescription>Update book information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Book Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pdf-file">Replace PDF File (optional)</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
            {formData.file && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {formData.file.name} ({Math.round(formData.file.size / 1024 / 1024)}MB)
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEbookModal;
