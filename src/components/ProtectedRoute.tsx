
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, session, loading, error, isAdmin } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  // Handle authentication errors
  useEffect(() => {
    if (error) {
      console.error('🚫 Authentication error:', error);
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <img 
            src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
            alt="SMCE" 
            className="h-16 w-16 mx-auto animate-pulse"
          />
          <p className="mt-4 text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no valid user session
  if (!user || !session) {
    console.log('🚫 No valid session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin access if required
  if (requireAdmin) {
    if (!isAdmin(user.email)) {
      console.log('🚫 Admin access required, user is not admin:', user.email);
      toast({
        title: "Access Denied",
        description: "Administrator privileges required",
        variant: "destructive",
      });
      return <Navigate to="/departments" replace />;
    }
    console.log('✅ Admin access granted for:', user.email);
  }

  console.log('✅ Authentication verified for:', user.email);
  return <>{children}</>;
};

export default ProtectedRoute;
