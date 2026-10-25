import { NextResponse } from "next/server";
import { appBaseUrl, includeDevLink, sendEmail } from "../../../../lib/email";
import { prisma } from "../../../../lib/prisma";
import { allowRequest, clientIp, tooManyAttempts } from "../../../../lib/request-limit";
import { createEmailToken } from "../../../../lib/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = (body.email || "").trim().toLowerCase();

  // Always return ok to avoid email enumeration
  const generic = {
    ok: true,
    message: "If that email is registered, a reset link was sent.",
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(generic);
  }

  const allowed = await allowRequest(
    `forgot:${clientIp(request)}:${email}`,
    5,
    60 * 60 * 1000,
  );
  if (!allowed) {
    return NextResponse.json(tooManyAttempts(), { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(generic);
  }

  const raw = await createEmailToken(user.id, "reset", 2);
  const link = `${appBaseUrl()}/reset-password?token=${raw}`;
  const sent = await sendEmail({
    to: user.email,
    subject: "Reset your StoreToIssues password",
    text: `Reset your password: ${link}\n\nThis link expires in 2 hours.`,
    html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 2 hours.</p>`,
  });

  return NextResponse.json({
    ...generic,
    emailSent: sent.ok,
    ...(sent.ok || !includeDevLink() ? {} : { devLink: link }),
  });
}
