import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminAuthProps {
  children: React.ReactNode;
}

const AdminAuth = ({ children }: AdminAuthProps) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;
      
      if (!user) {
        console.log('🔒 AdminAuth: No user found, redirecting to login');
        navigate('/login', { 
          state: { 
            from: location,
            error: 'Please sign in to access the admin dashboard'
          },
          replace: true 
        });
        return;
      }

      try {
        console.log('🔍 AdminAuth: Checking admin status for user:', user.email);
        
        // Check if user is admin based on email
        const adminEmails = [
          'infancetony.cs22@stellamaryscoe.edu.in'
        ];
        
        const isAdminUser = adminEmails.includes(user.email?.toLowerCase() || '');
        console.log('✅ AdminAuth: Admin check result:', isAdminUser);
        setIsAdmin(isAdminUser);

        if (!isAdminUser) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin dashboard",
            variant: "destructive",
          });
          navigate('/departments', { replace: true });
        }
      } catch (error) {
        console.error('❌ AdminAuth: Failed to check admin status:', error);
        toast({
          title: "Authorization Error",
          description: "Failed to verify admin permissions",
          variant: "destructive",
        });
        navigate('/departments', { replace: true });
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading, navigate, location, toast]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || isAdmin !== true) {
    return null;
  }

  return <>{children}</>;
};

export default AdminAuth;