import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // No token or role → clear storage and redirect to login
  if (!token || !role) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  // Token and role exist → allow access (page-level components will handle role-specific features)
  return children;
}
