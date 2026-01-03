
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";

interface EnhancedUserProfile {
  id: string;
  user_id: string;
  full_name: string;
  student_id: string;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  academic_info?: {
    semester_number?: number;
    department?: {
      id: string;
      code: string;
      name: string;
    };
  };
}

interface UsersTabProps {
  users: EnhancedUserProfile[];
  onCreateUser: () => void;
  onEditUser: (user: EnhancedUserProfile) => void;
  onDeleteUser: (user: EnhancedUserProfile) => void;
}

const UsersTab = ({ users, onCreateUser, onEditUser, onDeleteUser }: UsersTabProps) => {
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.student_id.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.user_id.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">User Management</h3>
        <Button onClick={onCreateUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.student_id}</TableCell>
              <TableCell className="text-sm">{user.user_id}</TableCell>
              <TableCell>
                {user.academic_info?.department?.code || "Not Assigned"}
              </TableCell>
              <TableCell>
                {user.academic_info?.semester_number || "N/A"}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDeleteUser(user)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTab;
