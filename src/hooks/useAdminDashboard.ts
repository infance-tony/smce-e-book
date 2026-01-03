
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDashboardStats } from "@/utils/databaseUtils";
import { fetchCommonSubjects, deleteCommonSubject, type CommonSubject } from "@/utils/commonSubjectUtils";
import { fetchDepartments, fetchSemestersByDepartment, fetchSubjectsBySemester, fetchEbooksBySubjectId, type Department, type Semester, type Subject, type Ebook } from "@/utils/databaseUtils";
import { deleteDepartment, deleteSubject, deleteEbook } from "@/utils/adminUtils";
import { type UserProfile, type StudentAcademicInfo, updateUserProfile, updateStudentAcademicInfo } from "@/utils/profileUtils";

interface DashboardStats {
  departments: number;
  semesters: number;
  subjects: number;
  ebooks: number;
}

interface EnhancedUserProfile extends UserProfile {
  academic_info?: StudentAcademicInfo & {
    department?: {
      id: string;
      code: string;
      name: string;
    };
  };
}

export const useAdminDashboard = () => {
  const { toast } = useToast();
  
  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    departments: 0,
    semesters: 0,
    subjects: 0,
    ebooks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [users, setUsers] = useState<EnhancedUserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [books, setBooks] = useState<Ebook[]>([]);
  const [commonSubjects, setCommonSubjects] = useState<CommonSubject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const loadDashboardStats = async () => {
    try {
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          student_academic_info (
            *,
            departments (
              id,
              code,
              name
            )
          )
        `);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Raw user data:', data);

      const enhancedUsers: EnhancedUserProfile[] = data?.map(user => {
        console.log('Processing user:', user);
        
        // Handle student_academic_info - it comes as an array from the join
        let academicInfo = null;
        if (user.student_academic_info && Array.isArray(user.student_academic_info) && user.student_academic_info.length > 0) {
          const rawAcademicInfo = user.student_academic_info[0];
          academicInfo = {
            ...rawAcademicInfo,
            department: rawAcademicInfo.departments || undefined
          };
        }

        return {
          id: user.id,
          user_id: user.user_id,
          student_id: user.student_id,
          full_name: user.full_name,
          phone: user.phone,
          address: user.address,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at,
          academic_info: academicInfo
        };
      }) || [];

      console.log('Enhanced users:', enhancedUsers);
      setUsers(enhancedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

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

  const loadSubjects = async (selectedDeptId: string, selectedSemester: number) => {
    try {
      if (selectedDeptId && selectedSemester > 0) {
        const dept = departments.find(d => d.id === selectedDeptId);
        if (dept) {
          const subs = await fetchSubjectsBySemester(dept.code, selectedSemester);
          setSubjects(subs);
        }
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

  const loadBooks = async (selectedSubjectId: string) => {
    try {
      if (selectedSubjectId) {
        const booksData = await fetchEbooksBySubjectId(selectedSubjectId);
        setBooks(booksData);
      }
    } catch (error) {
      console.error('Error loading books:', error);
      toast({
        title: "Error",
        description: "Failed to load books",
        variant: "destructive",
      });
    }
  };

  const loadCommonSubjects = async () => {
    try {
      const subjects = await fetchCommonSubjects();
      setCommonSubjects(subjects);
    } catch (error) {
      console.error("Error fetching common subjects:", error);
      toast({
        title: "Error",
        description: "Failed to load common subjects",
        variant: "destructive",
      });
    }
  };

  const loadSemesters = async (selectedDeptId: string) => {
    try {
      if (selectedDeptId) {
        const dept = departments.find(d => d.id === selectedDeptId);
        if (dept) {
          const sems = await fetchSemestersByDepartment(dept.code);
          setSemesters(sems);
        }
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadDashboardStats(), loadUsers(), loadDepartments(), loadCommonSubjects()]);
      toast({
        title: "Dashboard Refreshed",
        description: "Dashboard data has been updated.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Delete handlers
  const handleDeleteUser = async (user: EnhancedUserProfile) => {
    try {
      console.log('Deleting user:', user);
      
      const { error } = await supabase.auth.admin.deleteUser(user.user_id);
      if (error) throw error;

      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      });
      await loadUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete user",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleUpdateUser = async (userId: string, updates: {
    full_name?: string;
    student_id?: string;
    phone?: string;
    address?: string;
    department_id?: string;
    semester_number?: number;
  }) => {
    try {
      console.log('Updating user:', userId, updates);

      // Update profile data
      const profileUpdates = {
        full_name: updates.full_name,
        student_id: updates.student_id,
        phone: updates.phone,
        address: updates.address
      };

      const profileSuccess = await updateUserProfile(userId, profileUpdates);
      if (!profileSuccess) throw new Error('Failed to update profile');

      // Update academic info if provided
      if (updates.department_id || updates.semester_number) {
        const academicUpdates = {
          department_id: updates.department_id,
          semester_number: updates.semester_number
        };
        const academicSuccess = await updateStudentAcademicInfo(userId, academicUpdates);
        if (!academicSuccess) throw new Error('Failed to update academic info');
      }

      toast({
        title: "User Updated",
        description: "User has been updated successfully",
      });
      
      await loadUsers();
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update user",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteDepartment = async (department: Department) => {
    try {
      const success = await deleteDepartment(department.id);
      if (success) {
        toast({
          title: "Department Deleted",
          description: "Department has been deleted successfully",
        });
        loadDepartments();
      }
      return success;
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete department",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    try {
      const success = await deleteSubject(subject.id);
      if (success) {
        toast({
          title: "Subject Deleted",
          description: "Subject has been deleted successfully",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete subject",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteBook = async (book: Ebook) => {
    try {
      const success = await deleteEbook(book.id);
      if (success) {
        toast({
          title: "Book Deleted",
          description: "Book has been deleted successfully",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete book",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteCommonSubject = async (subject: CommonSubject) => {
    try {
      await deleteCommonSubject(subject.id);
      toast({
        title: "Common Subject Deleted",
        description: "Common subject has been deleted successfully",
      });
      loadCommonSubjects();
      return true;
    } catch (error) {
      console.error('Error deleting common subject:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete common subject",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadDashboardStats(),
          loadUsers(),
          loadDepartments(),
          loadCommonSubjects()
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    // State
    stats,
    loading,
    refreshing,
    users,
    departments,
    subjects,
    books,
    commonSubjects,
    semesters,
    
    // Actions
    loadDepartments,
    loadSubjects,
    loadBooks,
    loadSemesters,
    loadUsers,
    handleRefresh,
    handleDeleteUser,
    handleUpdateUser,
    handleDeleteDepartment,
    handleDeleteSubject,
    handleDeleteBook,
    handleDeleteCommonSubject
  };
};
