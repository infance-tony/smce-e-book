
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log('✅ Index: User authenticated, redirecting to departments');
        navigate("/departments", { replace: true });
      } else {
        console.log('🚫 Index: No user found, redirecting to login');
        navigate("/login", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <img 
            src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
            alt="SMCE" 
            className="h-16 w-16 mx-auto animate-pulse"
          />
          <p className="mt-4 text-muted-foreground">Loading StudyPortal...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
