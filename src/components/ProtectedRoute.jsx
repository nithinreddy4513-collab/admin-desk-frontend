import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // No token or role → clear storage and redirect
  if (!token || !role) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  // Role check: superadmin only
  if (role !== "superadmin") {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  return children;
}
