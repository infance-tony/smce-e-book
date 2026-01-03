
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Edit, Trash2, Book } from "lucide-react";
import { fetchDepartments, fetchSemestersByDepartment, fetchSubjectsBySemester, type Department, type Semester, type Subject } from "@/utils/databaseUtils";
import { createSubject, updateSubject, deleteSubject } from "@/utils/adminUtils";

const SubjectManager = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number>(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    credits: 3,
    subject_type: "core"
  });

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

  const handleCreateSubject = async () => {
    if (!formData.code || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Subject code and name are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dept = departments.find(d => d.id === selectedDepartment);
      if (!dept) {
        throw new Error("Department not found");
      }

      const success = await createSubject({
        code: formData.code,
        name: formData.name,
        department_code: dept.code,
        semester_number: selectedSemester,
        credits: formData.credits,
        description: formData.description,
        subject_type: formData.subject_type
      });

      if (success) {
        toast({
          title: "Success",
          description: "Subject created successfully",
        });
        setFormData({ code: "", name: "", description: "", credits: 3, subject_type: "core" });
        setShowCreateForm(false);
        loadSubjects();
      } else {
        throw new Error("Failed to create subject");
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({
        title: "Error",
        description: "Failed to create subject",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      description: subject.description || "",
      credits: subject.credits || 3,
      subject_type: subject.subject_type || "core"
    });
    setShowCreateForm(true);
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;

    setLoading(true);
    try {
      const success = await updateSubject(editingSubject.id, {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        credits: formData.credits,
        subject_type: formData.subject_type
      });

      if (success) {
        toast({
          title: "Success",
          description: "Subject updated successfully",
        });
        setFormData({ code: "", name: "", description: "", credits: 3, subject_type: "core" });
        setShowCreateForm(false);
        setEditingSubject(null);
        loadSubjects();
      } else {
        throw new Error("Failed to update subject");
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      toast({
        title: "Error",
        description: "Failed to update subject",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const success = await deleteSubject(subject.id);
      if (success) {
        toast({
          title: "Success",
          description: "Subject deleted successfully",
        });
        loadSubjects();
      } else {
        throw new Error("Failed to delete subject");
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: "Failed to delete subject",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "", credits: 3, subject_type: "core" });
    setShowCreateForm(false);
    setEditingSubject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy-900">Subject Management</h2>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Department and Semester Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Department & Semester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Subject Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSubject ? "Edit Subject" : "Create New Subject"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Subject Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., MA3151"
                />
              </div>
              
              <div>
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Matrices and Calculus"
                />
              </div>
              
              <div>
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="6"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Subject Type</Label>
                <Select value={formData.subject_type} onValueChange={(value) => setFormData({ ...formData, subject_type: value })}>
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
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Subject description..."
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={editingSubject ? handleUpdateSubject : handleCreateSubject}
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? "Processing..." : (editingSubject ? "Update Subject" : "Create Subject")}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject List */}
      {selectedDepartment && selectedSemester > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subjects</CardTitle>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-8">
                <Book className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No subjects found for this department and semester.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((subject) => (
                  <Card key={subject.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-navy-900">{subject.code}</h3>
                          <p className="text-sm text-navy-600">{subject.name}</p>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSubject(subject)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubject(subject)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary">{subject.credits} Credits</Badge>
                        <Badge variant="outline">{subject.subject_type}</Badge>
                      </div>
                      
                      {subject.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {subject.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubjectManager;
