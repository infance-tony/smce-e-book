
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileData {
  id: string;
  user_id: string;
  full_name: string;
  student_id: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  email?: string;
}

interface AcademicInfo {
  department_id: string;
  semester_number: number;
  academic_year: string;
  cgpa: number;
  department_name?: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw new Error('Not authenticated');
        }

        if (!user) {
          throw new Error('User not found');
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          
          // If profile doesn't exist, create one
          if (profileError.code === 'PGRST116') {
            console.log('📝 UserProfile: Profile not found, creating new profile...');
            const newProfile = {
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              student_id: `STU${Date.now().toString().slice(-6)}`
            };

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select()
              .single();

            if (createError) {
              console.error('❌ UserProfile: Failed to create profile:', createError);
              throw new Error(`Failed to create profile: ${createError.message}`);
            }

            console.log('✅ UserProfile: Profile created successfully');
            setProfile({
              ...createdProfile,
              email: user.email
            });
          } else {
            throw new Error(`Failed to fetch profile: ${profileError.message}`);
          }
        } else {
          setProfile({
            ...profileData,
            email: user.email
          });
        }

        // Fetch academic info
        const { data: academicData, error: academicError } = await supabase
          .from('student_academic_info')
          .select(`
            *,
            departments:department_id (
              name
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (academicError) {
          console.error('Academic info fetch error:', academicError);
          
          // If academic info doesn't exist, try to create it with default department
          if (academicError.code === 'PGRST116') {
            const { data: defaultDept } = await supabase
              .from('departments')
              .select('id')
              .limit(1)
              .single();

            if (defaultDept) {
              const newAcademicInfo = {
                user_id: user.id,
                department_id: defaultDept.id,
                semester_number: 1,
                academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
                cgpa: 0.0
              };

              const { data: createdAcademic, error: createAcademicError } = await supabase
                .from('student_academic_info')
                .insert(newAcademicInfo)
                .select(`
                  *,
                  departments:department_id (
                    name
                  )
                `)
                .single();

              if (!createAcademicError && createdAcademic) {
                setAcademicInfo({
                  ...createdAcademic,
                  department_name: createdAcademic.departments?.name
                });
              }
            }
          }
        } else {
          setAcademicInfo({
            ...academicData,
            department_name: academicData.departments?.name
          });
        }

      } catch (error) {
        console.error('❌ UserProfile: Error fetching user profile:', error);
        let errorMsg = 'Failed to load profile';
        
        if (error instanceof Error) {
          if (error.message.includes('JWT') || error.message.includes('token')) {
            errorMsg = 'Your session has expired. Please sign in again to continue.';
          } else if (error.message.includes('Not authenticated')) {
            errorMsg = 'Authentication required. Please sign in to view your profile.';
          } else if (error.message.includes('Failed to create profile')) {
            errorMsg = 'We couldn\'t create your profile automatically. This may be a temporary issue. Please try again or contact support if the problem persists.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMsg = 'Network error. Please check your internet connection and try again.';
          } else {
            errorMsg = `${error.message}. You can still browse books and materials.`;
          }
        }
        
        console.error('Error details:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const updateProfile = async (updates: Partial<UserProfileData>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(prev => prev ? { ...prev, ...data } : null);
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  };

  return {
    profile,
    academicInfo,
    loading,
    error,
    updateProfile
  };
};
