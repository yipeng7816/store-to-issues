import { NextResponse } from "next/server";
import { appBaseUrl, sendEmail } from "../../../../lib/email";
import { prisma } from "../../../../lib/prisma";
import { getSession } from "../../../../lib/session";
import {
  consumeEmailToken,
  createEmailToken,
  type EmailTokenType,
} from "../../../../lib/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    resend?: boolean;
    type?: string;
  };

  if (body.resend) {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.emailVerifiedAt) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }
    const raw = await createEmailToken(user.id, "verify", 48);
    const link = `${appBaseUrl()}/verify-email?token=${raw}`;
    const sent = await sendEmail({
      to: user.email,
      subject: "Verify your StoreToIssues email",
      text: `Verify your email: ${link}`,
      html: `<p>Verify your email:</p><p><a href="${link}">${link}</a></p>`,
    });
    return NextResponse.json({
      ok: true,
      emailSent: sent.ok,
      ...(sent.ok ? {} : { devLink: link }),
    });
  }

  const tokenType: EmailTokenType =
    body.type === "email_change" ? "email_change" : "verify";
  const consumed = await consumeEmailToken(body.token || "", tokenType);
  if (!consumed) {
    return NextResponse.json(
      { error: "Invalid or expired verification link." },
      { status: 400 },
    );
  }

  if (tokenType === "email_change") {
    const newEmail = (consumed.payload || "").trim().toLowerCase();
    if (!newEmail) {
      return NextResponse.json({ error: "Invalid email change token." }, { status: 400 });
    }
    const taken = await prisma.user.findUnique({ where: { email: newEmail } });
    if (taken && taken.id !== consumed.userId) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    await prisma.user.update({
      where: { id: consumed.userId },
      data: { email: newEmail, emailVerifiedAt: new Date() },
    });
    return NextResponse.json({ ok: true, emailChanged: true, email: newEmail });
  }

  await prisma.user.update({
    where: { id: consumed.userId },
    data: { emailVerifiedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
