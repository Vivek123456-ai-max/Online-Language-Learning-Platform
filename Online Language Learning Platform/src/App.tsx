import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Code-split route components for instant (<50ms) initial load and response times
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const LanguagesPage = lazy(() => import('./pages/LanguagesPage').then((m) => ({ default: m.LanguagesPage })));
const CoursesPage = lazy(() => import('./pages/CoursesPage').then((m) => ({ default: m.CoursesPage })));
const CourseDetailsPage = lazy(() => import('./pages/CourseDetailsPage').then((m) => ({ default: m.CourseDetailsPage })));
const LessonViewerPage = lazy(() => import('./pages/LessonViewerPage').then((m) => ({ default: m.LessonViewerPage })));
const CertificatePage = lazy(() => import('./pages/CertificatePage').then((m) => ({ default: m.CertificatePage })));
const PathsPage = lazy(() => import('./pages/PathsPage').then((m) => ({ default: m.PathsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const BackendMonitorPage = lazy(() => import('./pages/BackendMonitorPage').then((m) => ({ default: m.BackendMonitorPage })));

// Privileged Workspace Pages
const InstructorDashboardPage = lazy(() => import('./pages/instructor/InstructorDashboardPage').then((m) => ({ default: m.InstructorDashboardPage })));
const CourseEditorPage = lazy(() => import('./pages/instructor/CourseEditorPage').then((m) => ({ default: m.CourseEditorPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));

// Components
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGuard } from './components/auth/RoleGuard';
import { DatabaseDiagnostic } from './components/diagnostics/DatabaseDiagnostic';

const PageFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
    <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    <span className="text-xs font-mono text-slate-400">Loading module...</span>
  </div>
);

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isLearningPage = location.pathname.startsWith('/learn');

  return (
    <div className="flex flex-col min-h-screen text-slate-100 selection:bg-indigo-600 selection:text-white relative overflow-x-hidden bg-transparent">
      {/* Global Futuristic EdTech Wallpaper Background Layer */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-45 md:opacity-55 bg-cover bg-center bg-fixed bg-no-repeat"
        style={{ backgroundImage: `url('/images/codeverse-wallpaper.jpg')` }}
      />
      {/* Soft atmospheric vignette for text clarity */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#07090e]/35 via-[#07090e]/55 to-[#07090e]/75" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageFallback />}>
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/languages" element={<LanguagesPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CourseDetailsPage />} />
          <Route path="/paths" element={<PathsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Certificate Verification (Public / Sharable) */}
          <Route path="/certificates/:enrollmentId" element={<CertificatePage />} />

          {/* Interactive Learning Experience (Monaco Workspace) */}
          <Route path="/learn/:courseSlug" element={<LessonViewerPage />} />
          <Route path="/learn/:courseSlug/:lessonSlug" element={<LessonViewerPage />} />

          {/* Diagnostics & Verification Panel */}
          <Route path="/diagnostics" element={<DatabaseDiagnostic />} />
          <Route path="/backend" element={<BackendMonitorPage />} />
          <Route path="/java-backend" element={<BackendMonitorPage />} />

          {/* Learner Protected Authenticated Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Instructor Workspace */}
          <Route
            path="/instructor"
            element={
              <RoleGuard requiredRole="instructor">
                <InstructorDashboardPage />
              </RoleGuard>
            }
          />
          <Route
            path="/instructor/courses/:courseId"
            element={
              <RoleGuard requiredRole="instructor">
                <CourseEditorPage />
              </RoleGuard>
            }
          />

          {/* Admin Platform Control Center */}
          <Route
            path="/admin"
            element={
              <RoleGuard requiredRole="admin">
                <AdminDashboardPage />
              </RoleGuard>
            }
          />

          {/* Error and Fallback Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </main>
        {!isLearningPage && <Footer />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
