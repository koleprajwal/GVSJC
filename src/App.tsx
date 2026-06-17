import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";

// Public pages
import Index from "./pages/Index";
import About from "./pages/About";
import Academics from "./pages/Academics";
import Admissions from "./pages/Admissions";
import Faculty from "./pages/Faculty";
import Gallery from "./pages/Gallery";
import Events from "./pages/Events";
import StudentCorner from "./pages/StudentCorner";
import LoginPortal from "./pages/LoginPortal";
import Contact from "./pages/Contact";
import Toppers from "./pages/Toppers";
import NotFound from "./pages/NotFound";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import NoticeManager from "./pages/admin/NoticeManager";
import ContentManager from "./pages/admin/ContentManager";
import AdmissionsManager from "./pages/admin/AdmissionsManager";
import QueriesManager from "./pages/admin/QueriesManager";
import FeedbackManager from "./pages/admin/FeedbackManager";
import FacultyManager from "./pages/admin/FacultyManager";
import ToppersManager from "./pages/admin/ToppersManager";
import StudentsManager from "./pages/admin/StudentsManager";
import FeePaymentsAdmin from "./pages/admin/FeePayments";
import AdminDonations from "./pages/admin/Donations";
import GalleryManager from "./pages/admin/GalleryManager";

// Clerk
import ClerkLayout from "./components/clerk/ClerkLayout";
import ClerkProtectedRoute from "./components/clerk/ClerkProtectedRoute";
import ClerkLogin from "./pages/clerk/Login";
import ClerkDashboard from "./pages/clerk/Dashboard";
import ClerkAdmissions from "./pages/clerk/Admissions";
import ClerkEnrollment from "./pages/clerk/Enrollment";
import ClerkExams from "./pages/clerk/Exams";
import ClerkFeeCollection from "./pages/clerk/FeeCollection";
import ClerkBonafide from "./pages/clerk/Bonafide";
import ClerkLeavingCertificate from "./pages/clerk/LeavingCertificate";
import ClerkIdCard from "./pages/clerk/IdCard";
import ClerkDonations from "./pages/clerk/Donations";
import ClerkNotices from "./pages/clerk/Notices";
import ClerkApplications from "./pages/clerk/Applications";
import ClerkQueries from "./pages/clerk/Queries";
import ClerkFeedback from "./pages/clerk/Feedback";
import ClerkTeachers from "./pages/clerk/Teachers";
import ClerkLeaves from "./pages/clerk/Leaves";
import ClerkTeacherAssignments from "./pages/clerk/TeacherAssignments";

// Student Portal
import StudentLayout from "./components/student/StudentLayout";
import StudentProtectedRoute from "./components/student/StudentProtectedRoute";
import StudentDashboard from "./pages/student/Dashboard";

// Teacher Portal
import TeacherLayout from "./components/teacher/TeacherLayout";
import TeacherProtectedRoute from "./components/teacher/TeacherProtectedRoute";
import TeacherDashboard from "./pages/teacher/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/academics" element={<Academics />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/faculty" element={<Faculty />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/events" element={<Events />} />
              <Route path="/students" element={<StudentCorner />} />
              <Route path="/portal" element={<LoginPortal />} />
              <Route path="/parents" element={<LoginPortal />} />
              <Route path="/toppers" element={<Toppers />} />
              <Route path="/contact" element={<Contact />} />


              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="notices" element={<NoticeManager />} />
                  <Route path="admissions" element={<AdmissionsManager />} />
                  <Route path="queries" element={<QueriesManager />} />
                  <Route path="feedback" element={<FeedbackManager />} />
                  <Route path="faculty" element={<FacultyManager />} />
                  <Route path="toppers" element={<ToppersManager />} />
                  <Route path="students" element={<StudentsManager />} />
                  <Route path="fees" element={<FeePaymentsAdmin />} />
                  <Route path="donations" element={<AdminDonations />} />
                  <Route path="gallery" element={<GalleryManager />} />
                  <Route path="content" element={<ContentManager />} />
                </Route>
              </Route>

              {/* Clerk Routes */}
              <Route path="/clerk/login" element={<ClerkLogin />} />
              <Route path="/clerk" element={<ClerkProtectedRoute />}>
                <Route element={<ClerkLayout />}>
                  <Route index element={<ClerkDashboard />} />
                  <Route path="admissions" element={<ClerkAdmissions />} />
                  <Route path="enrollment" element={<ClerkEnrollment />} />
                  <Route path="teachers" element={<ClerkTeachers />} />
                  <Route path="assignments" element={<ClerkTeacherAssignments />} />
                  <Route path="exams" element={<ClerkExams />} />
                  <Route path="fees" element={<ClerkFeeCollection />} />
                  <Route path="bonafide" element={<ClerkBonafide />} />
                  <Route path="leaving-certificate" element={<ClerkLeavingCertificate />} />
                  <Route path="idcard" element={<ClerkIdCard />} />
                  <Route path="donations" element={<ClerkDonations />} />
                  <Route path="notices" element={<ClerkNotices />} />
                  <Route path="applications" element={<ClerkApplications />} />
                  <Route path="queries" element={<ClerkQueries />} />
                  <Route path="feedback" element={<ClerkFeedback />} />
                  <Route path="leaves" element={<ClerkLeaves />} />
                </Route>
              </Route>

              {/* Student Portal Routes */}
              <Route path="/student" element={<StudentProtectedRoute />}>
                <Route element={<StudentLayout />}>
                  <Route index element={<StudentDashboard />} />
                  <Route path="marks" element={<StudentDashboard />} />
                  <Route path="fees" element={<StudentDashboard />} />
                  <Route path="homework" element={<StudentDashboard />} />
                  <Route path="resources" element={<StudentDashboard />} />
                  <Route path="idcard" element={<StudentDashboard />} />
                  <Route path="leaves" element={<StudentDashboard />} />
                </Route>
              </Route>

              {/* Teacher Portal Routes */}
              <Route path="/teacher" element={<TeacherProtectedRoute />}>
                <Route element={<TeacherLayout />}>
                  <Route index element={<TeacherDashboard />} />
                  <Route path="students" element={<TeacherDashboard />} />
                  <Route path="attendance" element={<TeacherDashboard />} />
                  <Route path="marks" element={<TeacherDashboard />} />
                  <Route path="homework" element={<TeacherDashboard />} />
                  <Route path="resources" element={<TeacherDashboard />} />
                  <Route path="student-leaves" element={<TeacherDashboard />} />
                  <Route path="leaves" element={<TeacherDashboard />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
