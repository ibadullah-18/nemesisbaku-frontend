import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getPanelLoginPath,
  isPanelAuthenticated,
} from "../../api/admin/adminAuth";

export default function AdminProtectedRoute({ panel, children }) {
  const location = useLocation();
  const [, forceAuthCheck] = useState(0);

  useEffect(() => {
    const syncAuth = (event) => {
      if (!event?.detail?.panel || event.detail.panel === panel) {
        forceAuthCheck((value) => value + 1);
      }
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("nemesis_admin_auth_changed", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("nemesis_admin_auth_changed", syncAuth);
    };
  }, [panel]);

  if (!isPanelAuthenticated(panel)) {
    return (
      <Navigate
        to={getPanelLoginPath(panel)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
