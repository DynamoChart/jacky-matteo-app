// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  // If no token → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Has token → show the child routes (Sidebar + content)
  return <Outlet />;
}