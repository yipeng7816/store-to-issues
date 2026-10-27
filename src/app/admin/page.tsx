import { redirect } from "next/navigation";
import { AdminDashboard } from "../../components/AdminDashboard";
import { requireAdminUser } from "../../lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdminUser();
  if (!admin) redirect("/dashboard");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">实验看板</h1>
      <p className="mt-2 text-sm text-stone-600">
        流量与使用概况（仅管理员 {admin.email}）
      </p>
      <div className="mt-8">
        <AdminDashboard />
      </div>
    </main>
  );
}
