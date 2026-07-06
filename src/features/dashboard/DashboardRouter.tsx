import { useAuth } from "../../contexts/AuthContext";
import { UserDashboard } from "./UserDashboard";
import { BusinessDashboard } from "./BusinessDashboard";

export function DashboardRouter() {
  const { user } = useAuth();

  if (user?.role === "BUSINESS") {
    return <BusinessDashboard />;
  }

  return <UserDashboard />;
}
