
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User, ChevronDown, RefreshCw, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchDepartments, getDashboardStats, type Department } from "@/utils/databaseUtils";
import { useAuth } from "@/hooks/useAuth";

const departmentIcons: {
  [key: string]: string;
} = {
  CSE: "💻",
  AIDS: "🤖",
  EEE: "⚡",
  ECE: "📡",
  MECH: "⚙️",
  CIVIL: "🏗️"
};

const departmentColors: {
  [key: string]: string;
} = {
  CSE: "from-emerald-500 to-green-600",
  AIDS: "from-teal-500 to-cyan-600",
  EEE: "from-yellow-500 to-orange-600",
  ECE: "from-green-500 to-emerald-600",
  MECH: "from-gray-500 to-gray-700",
  CIVIL: "from-orange-500 to-red-600"
};

const DepartmentPage = () => {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    departments: 0,
    semesters: 0,
    subjects: 0,
    ebooks: 0
  });

  const loadData = async () => {
    try {
      console.log('Loading departments and statistics...');
      const [departmentData, statsData] = await Promise.all([fetchDepartments(), getDashboardStats()]);
      setDepartments(departmentData);
      setStats(statsData);
      console.log('Data loaded successfully:', {
        departments: departmentData.length,
        stats: statsData
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!error && profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([loadData(), loadUserProfile()]);
      setLoading(false);
    };
    initializeData();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDepartmentSelect = (deptCode: string) => {
    navigate(`/semester/${deptCode}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleAdminPanel = () => {
    navigate("/admin");
  };

  // Get user display name and initials
  const getDisplayName = () => {
    if (userProfile?.full_name) return userProfile.full_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0].replace(/[._]/g, ' ');
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <img 
            src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
            alt="SMCE" 
            className="h-16 w-16 mx-auto animate-pulse"
          />
          <p className="mt-4 text-muted-foreground">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      {/* Mobile-first Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" alt="SMCE" className="h-8 sm:h-10 w-auto" />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    <AvatarFallback className="bg-primary text-white text-xs sm:text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-emerald-700">{getDisplayName()}</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white">
                <DropdownMenuItem onClick={handleProfile}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                {isAdmin(user?.email) && (
                  <DropdownMenuItem onClick={handleAdminPanel}>
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h2 className="text-2xl sm:text-4xl font-bold text-emerald-900 mb-2 sm:mb-4">
            Select Your Department
          </h2>
          <p className="text-base sm:text-xl text-emerald-600 max-w-2xl mx-auto px-4">
            Choose your engineering department to access semester-wise e-books
            and digital study resources tailored to your curriculum.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          {departments.map((dept, index) => (
            <Card 
              key={dept.id} 
              className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in" 
              style={{
                animationDelay: `${index * 100}ms`
              }} 
              onClick={() => handleDepartmentSelect(dept.code)}
            >
              <CardContent className="p-4 sm:p-6 lg:p-8 text-center space-y-4 sm:space-y-6">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br ${departmentColors[dept.code] || 'from-gray-500 to-gray-700'} flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300`}>
                  {departmentIcons[dept.code] || "📚"}
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-900 group-hover:text-primary transition-colors">
                    {dept.code}
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold text-emerald-800 leading-tight">
                    {dept.name}
                  </h3>
                  <p className="text-emerald-600 text-xs sm:text-sm leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                <div className="pt-2 sm:pt-4">
                  <div className="inline-flex items-center text-primary font-medium group-hover:underline text-sm sm:text-base">
                    View Materials
                    <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {departments.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-emerald-600 mb-2">No departments found</h3>
            <p className="text-emerald-500 mb-4">
              No departments are currently available in the database.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto">
          <div className="text-center p-4 sm:p-6 glass-effect rounded-xl">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">{stats.ebooks}+</div>
            <div className="text-emerald-600 text-sm sm:text-base">Study Materials</div>
          </div>
          <div className="text-center p-4 sm:p-6 glass-effect rounded-xl">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">{stats.subjects}</div>
            <div className="text-emerald-600 text-sm sm:text-base">Subjects</div>
          </div>
          <div className="text-center p-4 sm:p-6 glass-effect rounded-xl">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">{stats.departments}</div>
            <div className="text-emerald-600 text-sm sm:text-base">Departments</div>
          </div>
          <div className="text-center p-4 sm:p-6 glass-effect rounded-xl">
            <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-emerald-600 text-sm sm:text-base">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPage;
