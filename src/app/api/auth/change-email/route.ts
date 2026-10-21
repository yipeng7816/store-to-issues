import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { appBaseUrl, sendEmail } from "../../../../lib/email";
import { prisma } from "../../../../lib/prisma";
import { requireUserId } from "../../../../lib/session";
import { createEmailToken } from "../../../../lib/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    newEmail?: string;
    password?: string;
  };
  const newEmail = (body.newEmail || "").trim().toLowerCase();
  const password = body.password || "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Password is incorrect." }, { status: 400 });
  }

  if (newEmail === user.email) {
    return NextResponse.json({ error: "That is already your email." }, { status: 400 });
  }

  const taken = await prisma.user.findUnique({ where: { email: newEmail } });
  if (taken) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const raw = await createEmailToken(userId, "email_change", 24, newEmail);
  const link = `${appBaseUrl()}/verify-email?token=${raw}&type=email_change`;
  const sent = await sendEmail({
    to: newEmail,
    subject: "Confirm your new StoreToIssues email",
    text: `Confirm email change to ${newEmail}: ${link}\n\nLink expires in 24 hours.`,
    html: `<p>Confirm email change to <strong>${newEmail}</strong>:</p><p><a href="${link}">${link}</a></p><p>Link expires in 24 hours.</p>`,
  });

  return NextResponse.json({
    ok: true,
    emailSent: sent.ok,
    ...(sent.ok ? {} : { devLink: link }),
  });
}
