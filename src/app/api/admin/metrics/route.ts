import { NextResponse } from "next/server";
import { requireAdminUser } from "../../../../lib/admin";
import { fetchAdminMetrics } from "../../../../lib/admin-metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const metrics = await fetchAdminMetrics(30);
  return NextResponse.json({ metrics });
}
