import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loader} />
        <p style={styles.loadingText}>Checking your session...</p>

        <style>{`
          @keyframes br30-public-route-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (isAuthenticated) {
    const requestedPath = location.state?.from;
    const destination = requestedPath?.pathname && requestedPath.pathname !== "/" && requestedPath.pathname !== "/register" && requestedPath.pathname !== "/verify-email" && requestedPath.pathname !== "/forgot-password" && requestedPath.pathname !== "/reset-password" ? requestedPath : "/dashboard";

    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    padding: "24px",
    background: "var(--crm-bg, var(--background, #f7f8fa))",
    color: "var(--crm-text, var(--text, #242936))",
    fontFamily: "Inter, Arial, sans-serif",
  },
  loader: {
    width: "32px",
    height: "32px",
    border: "3px solid var(--crm-border, #e2e5eb)",
    borderTopColor: "var(--crm-primary, #4f46e5)",
    borderRadius: "50%",
    animation: "br30-public-route-spin 0.8s linear infinite",
  },
  loadingText: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 400,
  },
};
