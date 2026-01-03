
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createSubject } from "@/utils/adminUtils";
import { Department } from "@/utils/databaseUtils";

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onSuccess: () => void;
}

const CreateSubjectModal = ({ isOpen, onClose, departments, onSuccess }: CreateSubjectModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    department_code: "",
    semester_number: 1,
    credits: "",
    description: "",
    subject_type: "core"
  });

  const handleCreate = async () => {
    if (!formData.code || !formData.name || !formData.department_code) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await createSubject({
        ...formData,
        credits: formData.credits ? parseInt(formData.credits) : undefined
      });
      
      if (success) {
        toast({
          title: "Subject Created",
          description: "New subject has been created successfully",
        });
        onSuccess();
        onClose();
        setFormData({
          code: "",
          name: "",
          department_code: "",
          semester_number: 1,
          credits: "",
          description: "",
          subject_type: "core"
        });
      } else {
        throw new Error("Failed to create subject");
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create subject",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
          <DialogDescription>Add a new subject to a department</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Subject Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., CS101"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                placeholder="3"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="name">Subject Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Introduction to Programming"
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select 
                value={formData.department_code} 
                onValueChange={(value) => setFormData({ ...formData, department_code: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.code}>
                      {dept.code} - {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="semester">Semester *</Label>
              <Select 
                value={formData.semester_number.toString()} 
                onValueChange={(value) => setFormData({ ...formData, semester_number: parseInt(value) })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="type">Subject Type</Label>
            <Select 
              value={formData.subject_type} 
              onValueChange={(value) => setFormData({ ...formData, subject_type: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="elective">Elective</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Subject description"
              rows={3}
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Subject'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSubjectModal;
