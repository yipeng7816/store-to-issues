import { BillingBanner } from "../../components/BillingBanner";
import { DashboardHeader } from "../../components/DashboardHeader";
import { SyncPanel } from "../../components/SyncPanel";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-12">
      <DashboardHeader />
      <BillingBanner />
      <SyncPanel />
    </div>
  );
}
