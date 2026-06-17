import { Navigate, Outlet } from 'react-router-dom';

export default function StudentProtectedRoute() {
  const studentLoggedIn = typeof window !== 'undefined' && localStorage.getItem('studentLoggedIn') === 'true';

  if (!studentLoggedIn) {
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
}
