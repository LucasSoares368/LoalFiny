import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-[#FF6A00]" />
      </div>
    );
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};
