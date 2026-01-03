
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, FileText } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    departments: number;
    semesters: number;
    subjects: number;
    ebooks: number;
  };
  userCount: number;
}

const DashboardStats = ({ stats, userCount }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{userCount}</p>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.departments}</p>
              <p className="text-sm text-muted-foreground">Departments</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.subjects}</p>
              <p className="text-sm text-muted-foreground">Subjects</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.ebooks}+</p>
              <p className="text-sm text-muted-foreground">E-Books</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
