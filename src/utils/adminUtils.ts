import { supabase } from "@/integrations/supabase/client";
import { Department, Subject, Ebook } from "./databaseUtils";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  student_id: string;
  phone?: string | null;
  address?: string | null;
  academic_info?: {
    department_id?: string;
    semester_number?: number;
    department?: {
      id: string;
      name: string;
    };
  };
}

// User Management Functions
export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  console.log('Fetching all users for admin...');
  
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
    console.error('Error fetching users:', error);
    return [];
  }

  console.log('Users fetched:', data);
  return data?.map(user => {
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
      email: user.user_id, // This would need to be mapped from auth.users if needed
      full_name: user.full_name,
      student_id: user.student_id,
      phone: user.phone,
      address: user.address,
      academic_info: academicInfo
    };
  }) || [];
};

export const updateUser = async (userId: string, updates: {
  full_name?: string;
  student_id?: string;
  phone?: string;
  address?: string;
  department_id?: string;
  semester_number?: number;
}): Promise<boolean> => {
  console.log('Updating user:', userId, updates);

  try {
    // Update profile data
    const profileUpdates = {
      full_name: updates.full_name,
      student_id: updates.student_id,
      phone: updates.phone,
      address: updates.address
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return false;
    }

    // Update academic info if provided
    if (updates.department_id || updates.semester_number) {
      const academicUpdates = {
        department_id: updates.department_id,
        semester_number: updates.semester_number
      };

      const { error: academicError } = await supabase
        .from('student_academic_info')
        .upsert({
          user_id: userId,
          academic_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 4),
          ...academicUpdates
        });

      if (academicError) {
        console.error('Error updating academic info:', academicError);
        return false;
      }
    }

    console.log('User updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  console.log('Deleting user:', userId);
  
  // Delete from auth.users (this will cascade to profiles and other tables)
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Error deleting user:', error);
    return false;
  }

  console.log('User deleted successfully');
  return true;
};

// Department Management Functions
export const createDepartment = async (departmentData: {
  code: string;
  name: string;
  description?: string;
}): Promise<boolean> => {
  console.log('Creating department:', departmentData);
  
  const { error } = await supabase
    .from('departments')
    .insert({
      code: departmentData.code,
      name: departmentData.name,
      description: departmentData.description || null
    });

  if (error) {
    console.error('Error creating department:', error);
    return false;
  }

  console.log('Department created successfully');
  return true;
};

export const updateDepartment = async (id: string, updates: Partial<Department>): Promise<boolean> => {
  console.log('Updating department:', id, updates);
  
  const { error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating department:', error);
    return false;
  }

  console.log('Department updated successfully');
  return true;
};

export const deleteDepartment = async (id: string): Promise<boolean> => {
  console.log('Deleting department:', id);
  
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting department:', error);
    return false;
  }

  console.log('Department deleted successfully');
  return true;
};

// Subject Management Functions
export const createSubject = async (subjectData: {
  code: string;
  name: string;
  department_code: string;
  semester_number: number;
  credits?: number;
  description?: string;
  subject_type?: string;
}): Promise<boolean> => {
  console.log('Creating subject:', subjectData);
  
  // First get department ID
  const { data: deptData, error: deptError } = await supabase
    .from('departments')
    .select('id')
    .eq('code', subjectData.department_code)
    .single();

  if (deptError || !deptData) {
    console.error('Error fetching department:', deptError);
    return false;
  }

  // Then get semester ID
  const { data: semData, error: semError } = await supabase
    .from('semesters')
    .select('id')
    .eq('department_id', deptData.id)
    .eq('semester_number', subjectData.semester_number)
    .single();

  if (semError || !semData) {
    console.error('Error fetching semester:', semError);
    return false;
  }

  // Create subject
  const { error } = await supabase
    .from('subjects')
    .insert({
      code: subjectData.code,
      name: subjectData.name,
      semester_id: semData.id,
      credits: subjectData.credits || null,
      description: subjectData.description || null,
      subject_type: subjectData.subject_type || 'core'
    });

  if (error) {
    console.error('Error creating subject:', error);
    return false;
  }

  console.log('Subject created successfully');
  return true;
};

export const updateSubject = async (id: string, updates: Partial<Subject>): Promise<boolean> => {
  console.log('Updating subject:', id, updates);
  
  const { error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating subject:', error);
    return false;
  }

  console.log('Subject updated successfully');
  return true;
};

export const deleteSubject = async (id: string): Promise<boolean> => {
  console.log('Deleting subject:', id);
  
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting subject:', error);
    return false;
  }

  console.log('Subject deleted successfully');
  return true;
};

// Ebook Management Functions
export const createEbook = async (ebookData: {
  title: string;
  author?: string;
  subject_code: string;
  description?: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
}): Promise<boolean> => {
  console.log('Creating ebook:', ebookData);
  
  // First get subject ID
  const { data: subjectData, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('code', ebookData.subject_code)
    .single();

  if (subjectError || !subjectData) {
    console.error('Error fetching subject:', subjectError);
    return false;
  }

  const { error } = await supabase
    .from('ebooks')
    .insert({
      title: ebookData.title,
      author: ebookData.author || null,
      subject_id: subjectData.id,
      description: ebookData.description || null,
      file_path: ebookData.file_path,
      file_size: ebookData.file_size || null,
      file_type: ebookData.file_type || 'pdf',
      download_count: 0,
      is_active: true
    });

  if (error) {
    console.error('Error creating ebook:', error);
    return false;
  }

  console.log('Ebook created successfully');
  return true;
};

export const updateEbook = async (id: string, updates: Partial<Ebook>): Promise<boolean> => {
  console.log('Updating ebook:', id, updates);
  
  const { error } = await supabase
    .from('ebooks')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating ebook:', error);
    return false;
  }

  console.log('Ebook updated successfully');
  return true;
};

export const deleteEbook = async (id: string): Promise<boolean> => {
  console.log('Deleting ebook:', id);
  
  const { error } = await supabase
    .from('ebooks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting ebook:', error);
    return false;
  }

  console.log('Ebook deleted successfully');
  return true;
};

// Get admin dashboard statistics
export const getAdminDashboardStats = async () => {
  console.log('Fetching admin dashboard statistics...');
  
  const [deptResult, userResult, subjectResult, ebookResult] = await Promise.all([
    supabase.from('departments').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('subjects').select('id', { count: 'exact', head: true }),
    supabase.from('ebooks').select('id', { count: 'exact', head: true }).eq('is_active', true)
  ]);

  return {
    departments: deptResult.count || 0,
    users: userResult.count || 0,
    subjects: subjectResult.count || 0,
    ebooks: ebookResult.count || 0
  };
};
