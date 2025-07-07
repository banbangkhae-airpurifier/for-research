import RequireLogin from "@/components/RequireLogin";
import DevicesClient from "../../../../components/devicesClient";

export default function Page() {
  return (
    <RequireLogin>
      <DevicesClient />
    </RequireLogin>
  );
}