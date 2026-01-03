
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createDepartment } from "@/utils/adminUtils";

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDepartmentModal = ({ isOpen, onClose, onSuccess }: CreateDepartmentModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: ""
  });

  const handleCreate = async () => {
    if (!formData.code || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in code and name fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await createDepartment(formData);
      if (success) {
        toast({
          title: "Department Created",
          description: "New department has been created successfully",
        });
        onSuccess();
        onClose();
        setFormData({ code: "", name: "", description: "" });
      } else {
        throw new Error("Failed to create department");
      }
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create department",
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
          <DialogTitle>Create New Department</DialogTitle>
          <DialogDescription>Add a new department to the system</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="code">Department Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., CSE, ECE, ME"
              disabled={loading}
            />
          </div>
          
          <div>
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Computer Science & Engineering"
              disabled={loading}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Department description"
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
            {loading ? 'Creating...' : 'Create Department'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDepartmentModal;
