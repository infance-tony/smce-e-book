
import { supabase } from "@/integrations/supabase/client";

export interface CommonSubject {
  id: string;
  subject_code: string;
  subject_name: string;
  semester_number: number;
  credits?: number;
  description?: string;
  subject_type: string;
  created_at: string;
  updated_at: string;
}

export const createCommonSubject = async (subjectData: {
  code: string;
  name: string;
  semester_number: number;
  credits?: number;
  description?: string;
  subject_type: string;
}): Promise<boolean> => {
  try {
    console.log('Creating common subject:', subjectData);
    
    // Use the database function to create common subject across all departments
    const { error } = await supabase.rpc('replicate_common_subject_to_all_departments', {
      p_subject_code: subjectData.code,
      p_subject_name: subjectData.name,
      p_semester_number: subjectData.semester_number,
      p_credits: subjectData.credits || null,
      p_description: subjectData.description || null,
      p_subject_type: subjectData.subject_type
    });

    if (error) {
      console.error('Error creating common subject:', error);
      return false;
    }

    console.log('Common subject created successfully');
    return true;
  } catch (error) {
    console.error('Error creating common subject:', error);
    return false;
  }
};

export const fetchCommonSubjects = async (): Promise<CommonSubject[]> => {
  try {
    const { data, error } = await supabase
      .from('common_subjects')
      .select('*')
      .order('subject_code');

    if (error) {
      console.error('Error fetching common subjects:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching common subjects:', error);
    return [];
  }
};

export const deleteCommonSubject = async (id: string): Promise<boolean> => {
  try {
    // First get the subject details
    const { data: commonSubject, error: fetchError } = await supabase
      .from('common_subjects')
      .select('subject_code')
      .eq('id', id)
      .single();

    if (fetchError || !commonSubject) {
      console.error('Error fetching common subject:', fetchError);
      return false;
    }

    // Delete from common_subjects table
    const { error: deleteError } = await supabase
      .from('common_subjects')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting common subject:', deleteError);
      return false;
    }

    // Delete all instances of this common subject from subjects table
    const { error: deleteSubjectsError } = await supabase
      .from('subjects')
      .delete()
      .eq('code', commonSubject.subject_code)
      .eq('is_common', true);

    if (deleteSubjectsError) {
      console.error('Error deleting subject instances:', deleteSubjectsError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting common subject:', error);
    return false;
  }
};
