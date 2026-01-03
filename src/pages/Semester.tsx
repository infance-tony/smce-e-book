import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, LogOut, User, ChevronDown, BookOpen, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchSemestersByDepartment, fetchDepartments, type Semester, type Department } from "@/utils/databaseUtils";
import { useAuth } from "@/hooks/useAuth";
const SemesterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    dept
  } = useParams<{
    dept: string;
  }>();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const loadData = async () => {
    if (!dept) return;
    try {
      console.log(`Loading data for department: ${dept}`);

      // Fetch department info and semesters
      const [departmentData, semesterData] = await Promise.all([fetchDepartments(), fetchSemestersByDepartment(dept)]);
      const currentDept = departmentData.find(d => d.code === dept);
      setDepartment(currentDept || null);
      setSemesters(semesterData);
      console.log('Semester data loaded:', {
        department: currentDept,
        semesters: semesterData.length
      });
    } catch (error) {
      console.error('Error loading semester data:', error);
    }
  };
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    initializeData();
  }, [dept]);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (profile) setUserProfile(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadUserProfile();
  }, [user]);

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
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  const handleSemesterSelect = (semNumber: number) => {
    navigate(`/subjects/${dept}/${semNumber}`);
  };
  const handleBack = () => {
    navigate("/departments");
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  const handleProfile = () => {
    navigate("/profile");
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading semesters...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      {/* Mobile-first Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-emerald-600 hover:text-emerald-900 p-1 sm:p-2">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              <img src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" alt="SMCE" className="h-6 sm:h-8 w-auto" />
              
              
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    <AvatarFallback className="bg-primary text-white text-xs sm:text-sm">{getInitials()}</AvatarFallback>
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
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Department Info */}
      <div className="bg-gradient-to-r from-primary to-accent text-white py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-2 sm:space-x-4 animate-fade-in">
            <div className="text-2xl sm:text-4xl font-bold">{dept}</div>
            <div className="h-8 sm:h-12 w-px bg-white/30" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">{department?.name || 'Department'}</h2>
              <p className="text-sm opacity-90">{semesters.length} Semesters Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h3 className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-2 sm:mb-4">
            Choose Your Semester
          </h3>
          <p className="text-base sm:text-lg text-emerald-600 max-w-2xl mx-auto px-4">
            Select the semester to access your subject materials, textbooks, and study resources.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
          {semesters.map((semester, index) => <Card key={semester.id} className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{
          animationDelay: `${index * 50}ms`
        }} onClick={() => handleSemesterSelect(semester.semester_number)}>
              <CardContent className="p-4 sm:p-6 lg:p-8 text-center space-y-3 sm:space-y-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg sm:text-2xl font-bold text-white group-hover:scale-110 transition-transform duration-300">
                  {semester.semester_number}
                </div>
                
                <div className="space-y-1 sm:space-y-3">
                  <h3 className="text-sm sm:text-lg font-semibold text-emerald-800 group-hover:text-primary transition-colors leading-tight">
                    {semester.name}
                  </h3>
                  
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-emerald-600">
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">View Subjects</span>
                  </div>
                </div>

                <div className="pt-1 sm:pt-2">
                  <div className="inline-flex items-center text-primary font-medium group-hover:underline text-xs sm:text-sm">
                    View Subjects
                    <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {semesters.length === 0 && <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-emerald-600 mb-2">No semesters found</h3>
            <p className="text-emerald-500 mb-4">
              No semesters are currently available for {dept} department.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>}

        {/* Progress Indicator */}
        {semesters.length > 0 && <div className="mt-12 sm:mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-semibold text-emerald-900">Academic Progress</h4>
              <p className="text-emerald-600 text-sm sm:text-base">Track your semester completion</p>
            </div>
            
            <div className="grid grid-cols-8 gap-1 sm:gap-2">
              {Array.from({
            length: 8
          }, (_, i) => i + 1).map(sem => {
            const hasSemester = semesters.some(s => s.semester_number === sem);
            return <div key={sem} className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${hasSemester ? 'bg-primary' : 'bg-gray-200'}`} title={`Semester ${sem}${hasSemester ? ' - Available' : ' - Not Available'}`} />;
          })}
            </div>
            
            <div className="flex justify-between text-xs text-emerald-600 mt-2">
              <span>Available</span>
              <span>Progress</span>
              <span>Coming Soon</span>
            </div>
          </div>}
      </div>
    </div>;
};
export default SemesterPage;