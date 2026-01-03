
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const signOut = useCallback(async () => {
    try {
      console.log('👋 useAuth: Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ useAuth: Sign out error:', error);
        throw error;
      }
      
      console.log('✅ useAuth: Sign out successful');
    } catch (error) {
      console.error('❌ useAuth: Sign out failed:', error);
      throw error;
    }
  }, []);

  const isAdmin = useCallback((userEmail: string | undefined): boolean => {
    if (!userEmail) {
      console.log('🔍 useAuth: No user email provided for admin check');
      return false;
    }
    
    const adminEmails = [
      'infancetony.cs22@stellamaryscoe.edu.in'
    ];
    
    const isAdminUser = adminEmails.includes(userEmail.toLowerCase());
    console.log('🔍 useAuth: Admin check for', userEmail, ':', isAdminUser);
    
    return isAdminUser;
  }, []);

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('🔐 useAuth: Initializing authentication...');
        
        // Failsafe timeout - if auth doesn't resolve in 10 seconds, force loading false
        loadingTimeout = setTimeout(() => {
          if (mounted && authState.loading) {
            console.warn('⚠️ useAuth: Auth initialization timeout, forcing loading false');
            setAuthState(prev => ({
              ...prev,
              loading: false,
              error: 'Authentication timeout - please refresh the page'
            }));
          }
        }, 10000);
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 useAuth: Auth state change:', event, session?.user?.email);
            
            if (!mounted) return;
            
            clearTimeout(loadingTimeout);
            
            // For new OAuth users, ensure profile is created
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('✅ useAuth: User signed in, checking profile...');
              try {
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .single();
                
                if (profileError && profileError.code === 'PGRST116') {
                  // Profile doesn't exist - trigger should have created it, wait and retry
                  console.log('📝 useAuth: Profile not found, waiting for trigger...');
                  
                  // Wait a moment for trigger to complete
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Check again
                  const { data: retryProfile, error: retryError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();
                  
                  if (retryError && retryError.code === 'PGRST116') {
                    console.log('📝 useAuth: Still no profile, trigger may have failed');
                  } else if (retryProfile) {
                    console.log('✅ useAuth: Profile found after retry');
                  }
                }
              } catch (error) {
                console.error('❌ useAuth: Error checking/creating profile:', error);
              }
            }
            
            setAuthState({
              user: session?.user || null,
              session: session,
              loading: false,
              error: null,
            });
          }
        );

        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(loadingTimeout);
        
        if (error) {
          console.error('❌ useAuth: Session check error:', error);
          if (mounted) {
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: 'Failed to check session',
            });
          }
        } else if (mounted) {
          console.log('✅ useAuth: Initial session check:', session?.user?.email);
          setAuthState({
            user: session?.user || null,
            session: session,
            loading: false,
            error: null,
          });
        }

        return () => {
          clearTimeout(loadingTimeout);
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('❌ useAuth: Initialization error:', error);
        clearTimeout(loadingTimeout);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: 'Authentication initialization failed',
          });
        }
      }
    };

    const cleanup = initializeAuth();

    return () => {
      mounted = false;
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  return {
    ...authState,
    signOut,
    isAdmin,
  };
};
