import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LogOut, User, ChevronDown, Plus, Edit, Trash2, Users, BookOpen, GraduationCap, Building, Upload, FileText, Loader2, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { fetchDepartments, fetchSubjectsBySemester, fetchEbooksBySubjectId, Department, Subject, Ebook } from "@/utils/databaseUtils";
import { 
  fetchAllUsers, 
  deleteUser, 
  updateUser,
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  createSubject,
  updateSubject,
  deleteSubject,
  updateEbook,
  deleteEbook,
  getAdminDashboardStats,
  AdminUser
} from "@/utils/adminUtils";
import { createCommonSubject, fetchCommonSubjects, deleteCommonSubject } from "@/utils/commonSubjectUtils";
import EditDepartmentModal from "@/components/admin/EditDepartmentModal";
import EditSubjectModal from "@/components/admin/EditSubjectModal";
import EditEbookModal from "@/components/admin/EditEbookModal";
import EditUserModal from "@/components/admin/EditUserModal";
import CreateUserModal from "@/components/admin/CreateUserModal";
import UploadBookModal from "@/components/admin/UploadBookModal";
import StorageDiagnostic from "@/components/admin/StorageDiagnostic";
import AdminAuth from "@/components/AdminAuth";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [bookFilter, setBookFilter] = useState("all");
  const [bookSearch, setBookSearch] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (profile) setUserProfile(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadUserProfile();
  }, [user]);

  const getDisplayName = () => {
    if (userProfile?.full_name) return userProfile.full_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0].replace(/[._]/g, ' ');
    return 'Admin';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Edit modal states
  const [editDepartmentModal, setEditDepartmentModal] = useState<{ isOpen: boolean; department: Department | null }>({ isOpen: false, department: null });
  const [editSubjectModal, setEditSubjectModal] = useState<{ isOpen: boolean; subject: Subject | null }>({ isOpen: false, subject: null });
  const [editEbookModal, setEditEbookModal] = useState<{ isOpen: boolean; ebook: Ebook | null }>({ isOpen: false, ebook: null });
  const [editUserModal, setEditUserModal] = useState<{ isOpen: boolean; user: AdminUser | null }>({ isOpen: false, user: null });
  const [createUserModal, setCreateUserModal] = useState(false);
  const [uploadBookModal, setUploadBookModal] = useState<{ isOpen: boolean; subjectId: string | null }>({ isOpen: false, subjectId: null });

  // Form states for adding new items
  const [newUser, setNewUser] = useState({ name: "", email: "", department: "", semester: "" });
  const [newDepartment, setNewDepartment] = useState({ code: "", name: "", description: "" });
  const [newSubject, setNewSubject] = useState({ code: "", name: "", department: "", semester: "", credits: "", description: "", type: "", isCommon: false, commonSemester: "1" });

  // Data queries
  const { data: stats = { departments: 0, users: 0, subjects: 0, ebooks: 0 }, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminDashboardStats,
  });

  const { data: users = [], refetch: refetchUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAllUsers,
  });

  const { data: departments = [], refetch: refetchDepartments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const { data: commonSubjects = [], refetch: refetchCommonSubjects } = useQuery({
    queryKey: ['common-subjects'],
    queryFn: fetchCommonSubjects,
  });

  // Fetch all subjects from all departments and semesters
  const { data: allSubjects = [], refetch: refetchSubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['admin-all-subjects'],
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

  // Fetch all ebooks
  const { data: allEbooks = [], refetch: refetchEbooks, isLoading: ebooksLoading } = useQuery({
    queryKey: ['admin-all-ebooks'],
    queryFn: async () => {
      const allEbooks: Ebook[] = [];
      for (const subject of allSubjects) {
        const ebooks = await fetchEbooksBySubjectId(subject.id);
        allEbooks.push(...ebooks);
      }
      return allEbooks;
    },
    enabled: allSubjects.length > 0,
  });

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      navigate("/login");
    }
  };

  // User management functions
  const handleAddUser = async () => {
    // This is now handled by CreateUserModal
    setCreateUserModal(true);
  };

  // Department management functions
  const handleAddDepartment = async () => {
    if (newDepartment.code && newDepartment.name) {
      const success = await createDepartment({
        code: newDepartment.code,
        name: newDepartment.name,
        description: newDepartment.description
      });
      
      if (success) {
        setNewDepartment({ code: "", name: "", description: "" });
        refetchDepartments();
        refetchStats();
        toast({
          title: "Department Added",
          description: "New department has been successfully added.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add department. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditDepartment = async (id: string, updates: Partial<Department>) => {
    const success = await updateDepartment(id, updates);
    if (success) {
      refetchDepartments();
      refetchStats();
      toast({
        title: "Department Updated",
        description: "Department has been successfully updated.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update department. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    const success = await deleteDepartment(id);
    if (success) {
      refetchDepartments();
      refetchStats();
      toast({
        title: "Department Deleted",
        description: "Department has been successfully deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete department. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Subject management functions
  const handleAddSubject = async () => {
    if (newSubject.code && newSubject.name) {
      if (newSubject.isCommon) {
        // Create common subject
        const success = await createCommonSubject({
          code: newSubject.code,
          name: newSubject.name,
          semester_number: parseInt(newSubject.commonSemester),
          credits: newSubject.credits ? parseInt(newSubject.credits) : undefined,
          description: newSubject.description,
          subject_type: newSubject.type || 'core'
        });
        
        if (success) {
          setNewSubject({ code: "", name: "", department: "", semester: "", credits: "", description: "", type: "", isCommon: false, commonSemester: "1" });
          refetchSubjects();
          refetchCommonSubjects();
          refetchStats();
          toast({
            title: "Common Subject Added",
            description: `Common subject has been added to semester ${newSubject.commonSemester} of all departments.`,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add common subject. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Create regular subject
        if (newSubject.department && newSubject.semester) {
          const success = await createSubject({
            code: newSubject.code,
            name: newSubject.name,
            department_code: newSubject.department,
            semester_number: parseInt(newSubject.semester),
            credits: newSubject.credits ? parseInt(newSubject.credits) : undefined,
            description: newSubject.description,
            subject_type: newSubject.type || 'core'
          });
          
          if (success) {
            setNewSubject({ code: "", name: "", department: "", semester: "", credits: "", description: "", type: "", isCommon: false, commonSemester: "1" });
            refetchSubjects();
            refetchStats();
            toast({
              title: "Subject Added",
              description: "New subject has been successfully added.",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to add subject. Please try again.",
              variant: "destructive",
            });
          }
        }
      }
    }
  };

  const handleEditSubject = async (id: string, updates: Partial<Subject>) => {
    const success = await updateSubject(id, updates);
    if (success) {
      refetchSubjects();
      refetchStats();
      toast({
        title: "Subject Updated",
        description: "Subject has been successfully updated.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const success = await deleteSubject(id);
    if (success) {
      refetchSubjects();
      refetchStats();
      toast({
        title: "Subject Deleted",
        description: "Subject has been successfully deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete subject. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCommonSubject = async (id: string) => {
    const success = await deleteCommonSubject(id);
    if (success) {
      refetchSubjects();
      refetchCommonSubjects();
      refetchStats();
      toast({
        title: "Common Subject Deleted",
        description: "Common subject has been deleted from all departments.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete common subject. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Book management functions
  const handleEditEbook = async (id: string, updates: Partial<Ebook>) => {
    const success = await updateEbook(id, updates);
    if (success) {
      refetchEbooks();
      refetchStats();
      toast({
        title: "Book Updated",
        description: "Book has been successfully updated.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEbook = async (id: string) => {
    const success = await deleteEbook(id);
    if (success) {
      refetchEbooks();
      refetchStats();
      toast({
        title: "Book Deleted",
        description: "Book has been successfully deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async (userId: string, updates: any): Promise<boolean> => {
    const { updateUser } = await import("@/utils/adminUtils");
    const success = await updateUser(userId, updates);
    
    if (success) {
      toast({
        title: "User Updated",
        description: "User has been updated successfully",
      });
      refetchUsers();
      return true;
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update user",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteUser = async (id: string) => {
    const success = await deleteUser(id);
    if (success) {
      refetchUsers();
      refetchStats();
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUploadSuccess = () => {
    refetchEbooks();
    refetchStats();
  };

  // Find subject by book for upload modal
  const getSubjectForBook = (book: Ebook): Subject | undefined => {
    return allSubjects.find(subject => subject.id === book.subject_id);
  };

  // Filter books based on search and filter
  const filteredBooks = allEbooks.filter(book => {
    const subject = getSubjectForBook(book);
    const matchesSearch = book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
                         book.author?.toLowerCase().includes(bookSearch.toLowerCase()) ||
                         subject?.code.toLowerCase().includes(bookSearch.toLowerCase());
    
    if (bookFilter === "all") return matchesSearch;
    if (bookFilter === "common") return matchesSearch && subject?.is_common;
    if (bookFilter === "department") return matchesSearch && !subject?.is_common;
    
    return matchesSearch;
  });

  return (
    <AdminAuth>
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-emerald-900">Admin Dashboard</h1>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-emerald-700">{getDisplayName()}</span>
                  <ChevronDown className="h-4 w-4 text-emerald-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.users}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Building className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.departments}</p>
                  <p className="text-sm text-muted-foreground">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <GraduationCap className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.subjects}</p>
                  <p className="text-sm text-muted-foreground">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.ebooks}</p>
                  <p className="text-sm text-muted-foreground">Books</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Management Dashboard</CardTitle>
            <CardDescription>Manage users, departments, subjects, and books</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="departments">Departments</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
                <TabsTrigger value="common-subjects">Common Subjects</TabsTrigger>
                <TabsTrigger value="books">Books</TabsTrigger>
                <TabsTrigger value="storage">Storage</TabsTrigger>
              </TabsList>
              
              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">User Management</h3>
                  <Button onClick={() => setCreateUserModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Add New User</CardTitle>
                    <CardDescription>Note: Users should sign up through the login page for proper authentication</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <Input
                        placeholder="Full Name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      />
                      <Select value={newUser.department} onValueChange={(value) => setNewUser({...newUser, department: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.code} value={dept.code}>{dept.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Semester"
                        value={newUser.semester}
                        onChange={(e) => setNewUser({...newUser, semester: e.target.value})}
                      />
                      <Button onClick={handleAddUser}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {usersLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading users...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">
                            No users found. Users will appear here after they sign up.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.full_name}</TableCell>
                            <TableCell>{user.student_id}</TableCell>
                            <TableCell>{user.academic_info?.department?.name || 'N/A'}</TableCell>
                            <TableCell>{user.academic_info?.semester_number || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditUserModal({ isOpen: true, user })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.user_id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              
              {/* Departments Tab */}
              <TabsContent value="departments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Department Management</h3>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Input
                        placeholder="Department Code"
                        value={newDepartment.code}
                        onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value})}
                      />
                      <Input
                        placeholder="Department Name"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                      />
                      <Input
                        placeholder="Description"
                        value={newDepartment.description}
                        onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                      />
                      <Button onClick={handleAddDepartment}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {departmentsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading departments...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((department) => (
                        <TableRow key={department.id}>
                          <TableCell>{department.code}</TableCell>
                          <TableCell>{department.name}</TableCell>
                          <TableCell>{department.description || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditDepartmentModal({ isOpen: true, department })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteDepartment(department.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              
              {/* Subjects Tab */}
              <TabsContent value="subjects" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Subject Management</h3>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Subject</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isCommon"
                          checked={newSubject.isCommon}
                          onCheckedChange={(checked) => setNewSubject({...newSubject, isCommon: checked as boolean})}
                        />
                        <Label htmlFor="isCommon" className="text-sm font-medium">
                          Common for All Departments
                        </Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        <Input
                          placeholder="Subject Code"
                          value={newSubject.code}
                          onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                        />
                        <Input
                          placeholder="Subject Name"
                          value={newSubject.name}
                          onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                        />
                        {newSubject.isCommon ? (
                          <Select value={newSubject.commonSemester} onValueChange={(value) => setNewSubject({...newSubject, commonSemester: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Semester" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <>
                            <Select value={newSubject.department} onValueChange={(value) => setNewSubject({...newSubject, department: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.code} value={dept.code}>{dept.code}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Semester"
                              value={newSubject.semester}
                              onChange={(e) => setNewSubject({...newSubject, semester: e.target.value})}
                            />
                          </>
                        )}
                        <Input
                          placeholder="Credits"
                          value={newSubject.credits}
                          onChange={(e) => setNewSubject({...newSubject, credits: e.target.value})}
                        />
                        <Select value={newSubject.type} onValueChange={(value) => setNewSubject({...newSubject, type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="core">Core</SelectItem>
                            <SelectItem value="elective">Elective</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddSubject}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {subjectsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading subjects...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Common</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSubjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                            No subjects found. Add subjects using the form above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allSubjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell>{subject.code}</TableCell>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell>{subject.subject_type || 'core'}</TableCell>
                            <TableCell>{subject.credits || 'N/A'}</TableCell>
                            <TableCell>
                              {subject.is_common ? (
                                <Badge variant="secondary">Common</Badge>
                              ) : (
                                <Badge variant="outline">Department</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditSubjectModal({ isOpen: true, subject })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteSubject(subject.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* Common Subjects Tab */}
              <TabsContent value="common-subjects" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Common Subjects Management</h3>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Common Subjects</CardTitle>
                    <CardDescription>These subjects are automatically added to all departments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commonSubjects.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                              No common subjects found. Create common subjects in the Subjects tab.
                            </TableCell>
                          </TableRow>
                        ) : (
                          commonSubjects.map((subject) => (
                            <TableRow key={subject.id}>
                              <TableCell>{subject.subject_code}</TableCell>
                              <TableCell>{subject.subject_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">Semester {subject.semester_number}</Badge>
                              </TableCell>
                              <TableCell>{subject.subject_type}</TableCell>
                              <TableCell>{subject.credits || 'N/A'}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeleteCommonSubject(subject.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Books Tab */}
              <TabsContent value="books" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Book Management</h3>
                </div>

                {/* Book Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search books, authors, or subjects..."
                          value={bookSearch}
                          onChange={(e) => setBookSearch(e.target.value)}
                          className="w-64"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <Select value={bookFilter} onValueChange={setBookFilter}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Books</SelectItem>
                            <SelectItem value="common">Common Subject Books</SelectItem>
                            <SelectItem value="department">Department Books</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {ebooksLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading books...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>File Size</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBooks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center p-8 text-muted-foreground">
                            <div className="flex flex-col items-center space-y-4">
                              <BookOpen className="h-12 w-12" />
                              <p>No books found matching your criteria.</p>
                              <Button 
                                onClick={() => setUploadBookModal({ isOpen: true, subjectId: allSubjects[0]?.id || null })}
                                disabled={allSubjects.length === 0}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload First Book
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBooks.map((ebook) => {
                          const subject = getSubjectForBook(ebook);
                          return (
                            <TableRow key={ebook.id}>
                              <TableCell>{ebook.title}</TableCell>
                              <TableCell>{ebook.author || 'N/A'}</TableCell>
                              <TableCell>{subject?.code || 'Unknown'}</TableCell>
                              <TableCell>
                                {subject?.is_common ? (
                                  <Badge variant="secondary">Common</Badge>
                                ) : (
                                  <Badge variant="outline">Department</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {ebook.file_size ? `${(ebook.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                              </TableCell>
                              <TableCell>{ebook.download_count}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setEditEbookModal({ isOpen: true, ebook })}
                                    title="Edit Book"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setUploadBookModal({ isOpen: true, subjectId: ebook.subject_id })}
                                    title="Upload New PDF"
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDeleteEbook(ebook.id)}
                                    title="Delete Book"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}

                {/* Upload New Book Button */}
                {allSubjects.length > 0 && (
                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={() => setUploadBookModal({ isOpen: true, subjectId: allSubjects[0]?.id || null })}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Book
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Storage Tab */}
              <TabsContent value="storage" className="space-y-4">
                <StorageDiagnostic />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Modals */}
      <EditDepartmentModal
        isOpen={editDepartmentModal.isOpen}
        onClose={() => setEditDepartmentModal({ isOpen: false, department: null })}
        department={editDepartmentModal.department}
        onSave={handleEditDepartment}
      />
      
      <EditSubjectModal
        isOpen={editSubjectModal.isOpen}
        onClose={() => setEditSubjectModal({ isOpen: false, subject: null })}
        subject={editSubjectModal.subject}
        departments={departments}
        onSave={handleEditSubject}
      />
      
      <EditEbookModal
        isOpen={editEbookModal.isOpen}
        onClose={() => setEditEbookModal({ isOpen: false, ebook: null })}
        ebook={editEbookModal.ebook}
        onSave={handleEditEbook}
      />
      
      <EditUserModal
        isOpen={editUserModal.isOpen}
        onClose={() => setEditUserModal({ isOpen: false, user: null })}
        user={editUserModal.user}
        departments={departments}
        onSave={handleEditUser}
      />

      <CreateUserModal
        isOpen={createUserModal}
        onClose={() => setCreateUserModal(false)}
        departments={departments}
        onSuccess={() => {
          refetchUsers();
          refetchStats();
        }}
      />

      {/* Upload Book Modal */}
      <UploadBookModal
        isOpen={uploadBookModal.isOpen}
        onClose={() => setUploadBookModal({ isOpen: false, subjectId: null })}
        subjectId={uploadBookModal.subjectId || ""}
        onUploadSuccess={handleUploadSuccess}
      />
      
      <Footer />
    </div>
    </AdminAuth>
  );
};

export default AdminDashboard;
