import RequireLogin from "@/components/guard/RequireLogin";
import DevicesClient from "@/components/pages/devicesClient";

export default function Page() {
  return (
    <RequireLogin>
      <DevicesClient />
    </RequireLogin>
  );
}