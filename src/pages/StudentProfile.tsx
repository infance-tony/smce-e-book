import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, LogOut, User, ChevronDown, Edit2, Save, X, Mail, Phone, MapPin, GraduationCap, Calendar, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/components/UserProfile";
import Footer from "@/components/Footer";
const StudentProfile = () => {
  const navigate = useNavigate();
  const {
    profile,
    academicInfo,
    loading,
    error,
    updateProfile
  } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    address: ''
  });

  // Initialize edit form when profile loads
  useState(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  });
  const handleBack = () => {
    navigate("/departments");
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  const handleEdit = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
      setIsEditing(true);
    }
  };
  const handleSave = async () => {
    const result = await updateProfile(editForm);
    if (result.success) {
      setIsEditing(false);
    } else {
      console.error('Failed to update profile:', result.error);
    }
  };
  const handleCancel = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
    setIsEditing(false);
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex flex-col">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={handleBack} className="text-emerald-600 hover:text-emerald-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-emerald-900">Profile Error</h1>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 p-12 max-w-md">
            <User className="h-24 w-24 text-red-300 mx-auto" />
            <div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">
                Profile Error
              </h3>
              <p className="text-red-500 mb-4">
                {error}
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-4">
                  Don't worry! You can still access other features.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90">
                    Retry Loading Profile
                  </Button>
                  <Button onClick={handleBack} variant="outline">
                    Go to Departments
                  </Button>
                  <Button onClick={handleLogout} variant="outline">
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-emerald-600 hover:text-emerald-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <img src="/lovable-uploads/4654f30c-aa07-40bb-bc93-3018329fb8f8.png" alt="SMCE" className="h-8 w-auto" />
              
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">
                      {profile?.full_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-emerald-700">
                    {profile?.full_name || profile?.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-emerald-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white">
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
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Profile Header */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {profile?.full_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-3xl text-emerald-900">
                {profile?.full_name || profile?.email?.split('@')[0] || 'User'}
              </CardTitle>
              <p className="text-emerald-600 text-lg">{profile?.student_id}</p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Personal Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-emerald-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
                {!isEditing ? <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button> : <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>}
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center text-emerald-700">
                    <User className="h-4 w-4 mr-2" />
                    Full Name
                  </Label>
                  {isEditing ? <Input id="fullName" value={editForm.full_name} onChange={e => setEditForm({
                  ...editForm,
                  full_name: e.target.value
                })} className="border-emerald-200 focus:border-primary" /> : <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                      {profile?.full_name || 'Not provided'}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center text-emerald-700">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {profile?.email || 'Not provided'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center text-emerald-700">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone Number
                  </Label>
                  {isEditing ? <Input id="phone" value={editForm.phone} onChange={e => setEditForm({
                  ...editForm,
                  phone: e.target.value
                })} className="border-emerald-200 focus:border-primary" placeholder="Enter phone number" /> : <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                      {profile?.phone || 'Not provided'}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center text-emerald-700">
                    <MapPin className="h-4 w-4 mr-2" />
                    Address
                  </Label>
                  {isEditing ? <Input id="address" value={editForm.address} onChange={e => setEditForm({
                  ...editForm,
                  address: e.target.value
                })} className="border-emerald-200 focus:border-primary" placeholder="Enter address" /> : <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                      {profile?.address || 'Not provided'}
                    </p>}
                </div>

              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-emerald-900 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-2">
                  <Label className="flex items-center text-emerald-700">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Student ID
                  </Label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {profile?.student_id || 'Not assigned'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center text-emerald-700">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Department
                  </Label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {academicInfo?.department_name || 'Not assigned'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center text-emerald-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Current Semester
                  </Label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    Semester {academicInfo?.semester_number || 'N/A'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center text-emerald-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Academic Year
                  </Label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {academicInfo?.academic_year || 'Not assigned'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center text-emerald-700">
                    <Award className="h-4 w-4 mr-2" />
                    CGPA
                  </Label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {academicInfo?.cgpa?.toFixed(2) || '0.00'}
                  </p>
                </div>

              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      <Footer />
    </div>;
};
export default StudentProfile;