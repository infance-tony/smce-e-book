
import { supabase } from "@/integrations/supabase/client";

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Semester {
  id: string;
  department_id: string;
  semester_number: number;
  name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester_id: string;
  credits?: number;
  description?: string;
  subject_type?: string;
  is_common?: boolean;
  created_at: string;
}

export interface Ebook {
  id: string;
  subject_id: string;
  title: string;
  author?: string;
  description?: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  download_count: number;
  is_active?: boolean;
  upload_date: string;
  created_at: string;
}

export const fetchDepartments = async (): Promise<Department[]> => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching departments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
};

export const fetchSemestersByDepartment = async (departmentCode: string): Promise<Semester[]> => {
  try {
    console.log(`Fetching semesters for department: ${departmentCode}`);
    
    const { data, error } = await supabase
      .from('semesters')
      .select(`
        *,
        departments!inner (
          code
        )
      `)
      .eq('departments.code', departmentCode)
      .order('semester_number');

    if (error) {
      console.error('Error fetching semesters:', error);
      return [];
    }

    console.log('Fetched semesters:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return [];
  }
};

export const fetchSubjectsBySemester = async (departmentCode: string, semesterNumber: number): Promise<Subject[]> => {
  try {
    console.log(`Fetching subjects for department: ${departmentCode}, semester: ${semesterNumber}`);
    
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        semesters!inner (
          semester_number,
          departments!inner (
            code
          )
        )
      `)
      .eq('semesters.departments.code', departmentCode)
      .eq('semesters.semester_number', semesterNumber)
      .order('code');

    if (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }

    console.log('Fetched subjects:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
};

export const fetchEbooksBySubjectId = async (subjectId: string): Promise<Ebook[]> => {
  try {
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('Error fetching ebooks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching ebooks:', error);
    return [];
  }
};

export const fetchEbooksBySubject = async (subjectCode: string): Promise<Ebook[]> => {
  try {
    console.log('📚 Fetching books for subject code:', subjectCode);
    
    const { data, error } = await supabase
      .from('ebooks')
      .select(`
        *,
        subjects!inner (
          code
        )
      `)
      .eq('subjects.code', subjectCode)
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('❌ Error fetching ebooks by subject:', error);
      return [];
    }

    console.log('📖 Found books:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching ebooks by subject:', error);
    return [];
  }
};

export const getDashboardStats = async () => {
  try {
    const [deptResult, semResult, subjectResult, ebookResult] = await Promise.all([
      supabase.from('departments').select('id', { count: 'exact', head: true }),
      supabase.from('semesters').select('id', { count: 'exact', head: true }),
      supabase.from('subjects').select('id', { count: 'exact', head: true }),
      supabase.from('ebooks').select('id', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    return {
      departments: deptResult.count || 0,
      semesters: semResult.count || 0,
      subjects: subjectResult.count || 0,
      ebooks: ebookResult.count || 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      departments: 0,
      semesters: 0,
      subjects: 0,
      ebooks: 0
    };
  }
};

export const verifyFileExists = async (filePath: string): Promise<{ exists: boolean; actualPath?: string }> => {
  try {
    console.log('🔍 Verifying file exists:', filePath);
    
    // Try the exact path first
    const { data: exactData, error: exactError } = await supabase.storage
      .from('ebooks')
      .list('', { search: filePath.split('/').pop() });
    
    if (!exactError && exactData?.some(file => file.name === filePath || file.name === filePath.split('/').pop())) {
      return { exists: true, actualPath: filePath };
    }

    // Try alternative paths
    const alternatives = [
      filePath.startsWith('books/') ? filePath.substring(6) : `books/${filePath}`,
      filePath.replace(/^books\//, ''),
      `books/${filePath.replace(/^books\//, '')}`
    ];
    
    for (const altPath of alternatives) {
      const { data, error } = await supabase.storage
        .from('ebooks')
        .list('', { search: altPath.split('/').pop() });
      
      if (!error && data?.some(file => file.name === altPath || file.name === altPath.split('/').pop())) {
        return { exists: true, actualPath: altPath };
      }
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error verifying file exists:', error);
    return { exists: false };
  }
};

export const getCorrectFilePath = async (originalPath: string): Promise<string> => {
  try {
    const verification = await verifyFileExists(originalPath);
    return verification.actualPath || originalPath;
  } catch (error) {
    console.error('Error getting correct file path:', error);
    return originalPath;
  }
};

export const checkStorageBucket = async () => {
  try {
    const { data: files, error } = await supabase.storage
      .from('ebooks')
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Storage check error:', error);
      return { files: [], error: error.message };
    }

    return { files: files || [], error: null };
  } catch (error) {
    console.error('Storage check failed:', error);
    return { files: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const uploadPdfFile = async (file: File): Promise<string> => {
  try {
    console.log('📤 Starting file upload process...');
    
    // Generate a unique filename
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    
    console.log('📁 Generated filename:', fileName);
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('ebooks')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Storage upload error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error('Upload successful but no file path returned');
    }

    console.log('✅ File uploaded successfully:', data.path);
    return data.path;
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};

export const downloadPdfFile = async (filePath: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('ebooks')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const incrementDownloadCount = async (ebookId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_download_count', {
      ebook_id: ebookId
    });

    if (error) {
      console.error('Error incrementing download count:', error);
    }
  } catch (error) {
    console.error('Error incrementing download count:', error);
  }
};
