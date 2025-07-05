import RequireLogin from "@/components/RequireLogin";
import DevicesClient from "./devicesClient";

export default function Page() {
  return (
    <RequireLogin>
      <DevicesClient />
    </RequireLogin>
  );
}