import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { stripeConfigured } from "../../../lib/billing";

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
    stripe: stripeConfigured(),
    time: new Date().toISOString(),
  });
}
