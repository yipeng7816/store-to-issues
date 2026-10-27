import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { logProductError, logProductEvent } from "../../../../lib/analytics";
import { prisma } from "../../../../lib/prisma";
import { allowRequest, clientIp, tooManyAttempts } from "../../../../lib/request-limit";
import { getSession } from "../../../../lib/session";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  const allowed = await allowRequest(
    `login:${clientIp(request)}:${email}`,
    10,
    15 * 60 * 1000,
  );
  if (!allowed) {
    logProductError("login_failed", null, "rate_limit");
    return NextResponse.json(tooManyAttempts(), { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logProductError("login_failed", null, "invalid_credentials");
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    logProductError("login_failed", user.id, "invalid_credentials");
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  await session.save();

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  logProductEvent("login", user.id);

  return NextResponse.json({ ok: true, email: user.email });
}
