import RequireLogin from "@/components/guard/RequireLogin";
import DashboardClient from "@/components/pages/dashboardClient";

export default function Page() {
  return (
    <RequireLogin>
      <DashboardClient />
    </RequireLogin>
  );
}