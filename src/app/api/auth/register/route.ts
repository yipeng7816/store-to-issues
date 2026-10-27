import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { logProductEvent } from "../../../../lib/analytics";
import { defaultTrialEndsAt } from "../../../../lib/billing";
import { appBaseUrl, includeDevLink, sendEmail } from "../../../../lib/email";
import { prisma } from "../../../../lib/prisma";
import { allowRequest, clientIp, tooManyAttempts } from "../../../../lib/request-limit";
import { getSession } from "../../../../lib/session";
import { createEmailToken } from "../../../../lib/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const allowed = await allowRequest(`register:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(tooManyAttempts(), { status: 429 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      planStatus: "trialing",
      trialEndsAt: defaultTrialEndsAt(),
      settings: { create: {} },
    },
  });

  const raw = await createEmailToken(user.id, "verify", 48);
  const link = `${appBaseUrl()}/verify-email?token=${raw}`;
  const sent = await sendEmail({
    to: user.email,
    subject: "Verify your StoreToIssues email",
    text: `Welcome! Verify your email: ${link}`,
    html: `<p>Welcome to StoreToIssues.</p><p><a href="${link}">Verify email</a></p>`,
  });

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  await session.save();

  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: now },
  });
  void logProductEvent("register", user.id);

  return NextResponse.json({
    ok: true,
    email: user.email,
    emailSent: sent.ok,
    ...(sent.ok || !includeDevLink() ? {} : { devVerifyLink: link }),
  });
}
