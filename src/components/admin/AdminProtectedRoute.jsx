import { Navigate } from "react-router-dom";
import { getAdminAccessToken, isSuperAdmin } from "../../api/admin/adminAuth";

export default function AdminProtectedRoute({ children }) {
  const token = getAdminAccessToken();

  if (!token || !isSuperAdmin()) {
    return <Navigate to="/SuperAdmin" replace />;
  }

  return children;
}