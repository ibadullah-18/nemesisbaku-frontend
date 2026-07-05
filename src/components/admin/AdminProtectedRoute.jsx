import { Navigate } from "react-router-dom";
import {
  getAdminAccessToken,
  getAdminRoles,
  getSuperAdminAccessToken,
  getSuperAdminRoles,
} from "../../api/admin/adminAuth";

export default function AdminProtectedRoute({ children, panel }) {
  if (panel === "super") {
    const token = getSuperAdminAccessToken();
    const roles = getSuperAdminRoles();

    if (!token || !roles.includes("SuperAdmin")) {
      return <Navigate to="/SuperAdmin/login" replace />;
    }

    return children;
  }

  if (panel === "admin") {
    const token = getAdminAccessToken();
    const roles = getAdminRoles();

    if (!token || !roles.includes("Admin")) {
      return <Navigate to="/Admin/login" replace />;
    }

    return children;
  }

  return <Navigate to="/" replace />;
}