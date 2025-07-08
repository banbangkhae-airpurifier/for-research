import RequireLogin from "@/components/RequireLogin";
import DevicesClient from "@/components/pages/devicesClient";

export default function Page() {
  return (
    <RequireLogin>
      <DevicesClient />
    </RequireLogin>
  );
}