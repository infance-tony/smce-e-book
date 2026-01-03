
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  user_id: string;
  student_id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentAcademicInfo {
  id: string;
  user_id: string;
  department_id: string;
  semester_number: number;
  academic_year: string;
  cgpa: number | null;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  console.log('Fetching user profile for user:', userId);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  console.log('User profile fetched:', data);
  return data;
};

export const fetchStudentAcademicInfo = async (userId: string): Promise<StudentAcademicInfo | null> => {
  console.log('Fetching student academic info for user:', userId);
  
  const { data, error } = await supabase
    .from('student_academic_info')
    .select(`
      *,
      department:departments(
        id,
        code,
        name,
        description
      )
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching student academic info:', error);
    return null;
  }

  console.log('Student academic info fetched:', data);
  return data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<boolean> => {
  console.log('Updating user profile for user:', userId, updates);
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    return false;
  }

  console.log('User profile updated successfully');
  return true;
};

export const updateStudentAcademicInfo = async (userId: string, updates: Partial<StudentAcademicInfo>): Promise<boolean> => {
  console.log('Updating student academic info for user:', userId, updates);
  
  const { error } = await supabase
    .from('student_academic_info')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating student academic info:', error);
    return false;
  }

  console.log('Student academic info updated successfully');
  return true;
};

export const createUserProfile = async (
  userId: string, 
  profileData: {
    student_id: string;
    full_name: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
  }
): Promise<boolean> => {
  console.log('Creating user profile for user:', userId, profileData);
  
  const { error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      student_id: profileData.student_id,
      full_name: profileData.full_name,
      phone: profileData.phone || null,
      address: profileData.address || null,
      avatar_url: profileData.avatar_url || null
    });

  if (error) {
    console.error('Error creating user profile:', error);
    return false;
  }

  console.log('User profile created successfully');
  return true;
};

export const createStudentAcademicInfo = async (
  userId: string, 
  academicData: {
    department_id: string;
    semester_number: number;
    academic_year: string;
    cgpa?: number;
  }
): Promise<boolean> => {
  console.log('Creating student academic info for user:', userId, academicData);
  
  const { error } = await supabase
    .from('student_academic_info')
    .insert({
      user_id: userId,
      department_id: academicData.department_id,
      semester_number: academicData.semester_number,
      academic_year: academicData.academic_year,
      cgpa: academicData.cgpa || null
    });

  if (error) {
    console.error('Error creating student academic info:', error);
    return false;
  }

  console.log('Student academic info created successfully');
  return true;
};
