
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, LogOut, User, ChevronDown, BookOpen, Search, Star, Download, Filter, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchSubjectsBySemester, fetchDepartments, fetchSemestersByDepartment, type Subject, type Department, type Semester } from "@/utils/databaseUtils";
import { useAuth } from "@/hooks/useAuth";

const departmentNames: { [key: string]: string } = {
  CSE: "Computer Science & Engineering",
  AIDS: "Artificial Intelligence & Data Science", 
  EEE: "Electrical & Electronics Engineering",
  ECE: "Electronics & Communication Engineering",
  MECH: "Mechanical Engineering",
  CIVIL: "Civil Engineering"
};

const SubjectsPage = () => {
  const navigate = useNavigate();
  const { dept, sem } = useParams<{ dept: string; sem: string }>();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('subject-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

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

  const loadData = async () => {
    if (!dept || !sem) return;
    
    try {
      console.log(`Loading data for department: ${dept}, semester: ${sem}`);
      
      const [departmentData, semesterData, subjectData] = await Promise.all([
        fetchDepartments(),
        fetchSemestersByDepartment(dept),
        fetchSubjectsBySemester(dept, parseInt(sem))
      ]);
      
      const currentDept = departmentData.find(d => d.code === dept);
      const currentSem = semesterData.find(s => s.semester_number === parseInt(sem));
      
      setDepartment(currentDept || null);
      setSemester(currentSem || null);
      setSubjects(subjectData);
      
      console.log('Subject data loaded:', {
        department: currentDept,
        semester: currentSem,
        subjects: subjectData.length
      });
    } catch (error) {
      console.error('Error loading subject data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dept, sem]);

  const toggleFavorite = (subjectCode: string) => {
    const newFavorites = favorites.includes(subjectCode)
      ? favorites.filter(code => code !== subjectCode)
      : [...favorites, subjectCode];
    
    setFavorites(newFavorites);
    localStorage.setItem('subject-favorites', JSON.stringify(newFavorites));
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFavorite = !showFavorites || favorites.includes(subject.code);
    return matchesSearch && matchesFavorite;
  });

  const handleViewBooks = (subjectCode: string) => {
    navigate(`/book/${subjectCode}`);
  };

  const handleBack = () => {
    navigate(`/semester/${dept}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const getTypeColor = (type: string | undefined) => {
    switch (type) {
      case 'core':
        return 'bg-emerald-100 text-emerald-800';
      case 'elective':
        return 'bg-blue-100 text-blue-800';
      case 'lab':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-emerald-600 hover:text-emerald-900 p-1 sm:p-2">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              <img 
                src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" 
                alt="SMCE" 
                className="h-6 sm:h-8 w-auto"
              />
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

      {/* Course Info */}
      <div className="bg-gradient-to-r from-primary to-accent text-white py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-2xl sm:text-3xl font-bold">{dept}</div>
              <div className="h-8 sm:h-10 w-px bg-white/30" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">
                  {semester?.name || `Semester ${sem}`}
                </h2>
                <p className="text-sm opacity-90">{subjects.length} Subjects Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-emerald-400" />
              <Input 
                placeholder="Search subjects..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 border-emerald-200 focus:border-primary" 
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant={showFavorites ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowFavorites(!showFavorites)} 
                className="flex items-center gap-2"
              >
                <Star className={`h-4 w-4 ${showFavorites ? 'fill-current' : ''}`} />
                Favorites
              </Button>
              
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Subjects List */}
        <div className="space-y-4">
          {filteredSubjects.map((subject, index) => (
            <Card 
              key={subject.code} 
              className="group hover:shadow-lg transition-all duration-300 animate-fade-in border border-emerald-100" 
              style={{animationDelay: `${index * 50}ms`}}
            >
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-6">
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleFavorite(subject.code)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Star 
                          className={`h-4 w-4 ${
                            favorites.includes(subject.code)
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300 hover:text-yellow-400'
                          }`} 
                        />
                      </button>
                      <div className="font-bold text-primary text-lg">
                        {subject.code}
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-5">
                    <h3 className="font-semibold text-emerald-900 text-lg group-hover:text-primary transition-colors">
                      {subject.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-emerald-600 text-sm mt-1">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>Study Materials</span>
                      </div>
                      {subject.credits && (
                        <div className="flex items-center space-x-1">
                          <Award className="h-4 w-4" />
                          <span>{subject.credits} Credits</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(subject.subject_type)}`}>
                      {subject.subject_type?.charAt(0).toUpperCase() + subject.subject_type?.slice(1) || 'Core'}
                    </div>
                  </div>
                  
                  <div className="md:col-span-3 flex justify-end space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleViewBooks(subject.code)} 
                      className="bg-primary hover:bg-primary/90"
                    >
                      View Books
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-emerald-600 mb-2">No subjects found</h3>
            <p className="text-emerald-500">
              {subjects.length === 0 
                ? `No subjects available for ${dept} Semester ${sem}` 
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        )}

        {/* Summary Cards */}
        {subjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            <Card className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-primary">
                  {subjects.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-600">Total Subjects</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-accent">
                  {subjects.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-600">Study Materials</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-yellow-600">
                  {favorites.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-600">Favorites</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-blue-600">
                  {subjects.reduce((sum, subject) => sum + (subject.credits || 0), 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-emerald-600">Total Credits</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectsPage;
