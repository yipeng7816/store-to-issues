import { NextResponse } from "next/server";
import { appBaseUrl, sendEmail } from "../../../../lib/email";
import { prisma } from "../../../../lib/prisma";
import { getSession } from "../../../../lib/session";
import { consumeEmailToken, createEmailToken } from "../../../../lib/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string; resend?: boolean };

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

  const consumed = await consumeEmailToken(body.token || "", "verify");
  if (!consumed) {
    return NextResponse.json(
      { error: "Invalid or expired verification link." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: consumed.userId },
    data: { emailVerifiedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
