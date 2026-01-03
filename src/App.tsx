
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Department from "./pages/Department";
import Semester from "./pages/Semester";
import Subjects from "./pages/Subjects";
import BookViewer from "./pages/BookViewer";
import StudentProfile from "./pages/StudentProfile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/departments" element={
            <ProtectedRoute>
              <Department />
            </ProtectedRoute>
          } />
          <Route path="/semester/:dept" element={
            <ProtectedRoute>
              <Semester />
            </ProtectedRoute>
          } />
          <Route path="/subjects/:dept/:sem" element={
            <ProtectedRoute>
              <Subjects />
            </ProtectedRoute>
          } />
          <Route path="/book/:subjectCode" element={
            <ProtectedRoute>
              <BookViewer />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <StudentProfile />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          {/* Catch-all route for 404 - also protected */}
          <Route path="*" element={
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
