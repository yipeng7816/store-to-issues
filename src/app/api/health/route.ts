import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { billingConfigured, stripeConfigured } from "../../../lib/billing";
import { creemConfigured } from "../../../lib/creem";

export async function GET() {
  let db = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  return NextResponse.json({
    ok: db === "ok",
    db,
    billing: billingConfigured(),
    creem: creemConfigured(),
    stripe: stripeConfigured(),
    time: new Date().toISOString(),
  });
}
