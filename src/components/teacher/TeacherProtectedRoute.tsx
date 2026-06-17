import { Navigate, Outlet } from 'react-router-dom';

export default function TeacherProtectedRoute() {
  const teacherLoggedIn = typeof window !== 'undefined' && localStorage.getItem('teacherLoggedIn') === 'true';

  if (!teacherLoggedIn) {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}
