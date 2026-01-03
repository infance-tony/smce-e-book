
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { type Department } from "@/utils/databaseUtils";

interface DepartmentsTabProps {
  departments: Department[];
  onCreateDepartment: () => void;
  onEditDepartment: (department: Department) => void;
  onDeleteDepartment: (department: Department) => void;
}

const DepartmentsTab = ({ departments, onCreateDepartment, onEditDepartment, onDeleteDepartment }: DepartmentsTabProps) => {
  const [departmentSearch, setDepartmentSearch] = useState("");

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(departmentSearch.toLowerCase()) ||
    dept.code.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Department Management</h3>
        <Button onClick={onCreateDepartment}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search departments..."
          value={departmentSearch}
          onChange={(e) => setDepartmentSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDepartments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-mono">{dept.code}</TableCell>
              <TableCell>{dept.name}</TableCell>
              <TableCell>{dept.description || "No description"}</TableCell>
              <TableCell>{new Date(dept.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditDepartment(dept)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDeleteDepartment(dept)}
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

export default DepartmentsTab;
