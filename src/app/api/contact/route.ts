import { NextResponse } from "next/server";
import { escapeHtml, sendEmail, supportEmail } from "../../../lib/email";
import { prisma } from "../../../lib/prisma";
import { allowRequest, clientIp, tooManyAttempts } from "../../../lib/request-limit";
import { getSession } from "../../../lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    name?: string;
    message?: string;
  };
  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim().replace(/[\r\n]/g, " ").slice(0, 80);
  const message = (body.message || "").trim().slice(0, 4000);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json(
      { error: "Message is too short." },
      { status: 400 },
    );
  }

  const allowed = await allowRequest(
    `contact:${clientIp(request)}:${email}`,
    5,
    60 * 60 * 1000,
  );
  if (!allowed) {
    return NextResponse.json(tooManyAttempts(), { status: 429 });
  }

  const session = await getSession();
  await prisma.contactMessage.create({
    data: {
      email,
      name,
      body: message,
      userId: session.userId || null,
    },
  });

  const support = supportEmail();
  await sendEmail({
    to: support,
    subject: `[StoreToIssues contact] ${name || email}`,
    text: `From: ${name} <${email}>\nUserId: ${session.userId || "-"}\n\n${message}`,
    html: `<p><b>From:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><pre>${escapeHtml(message)}</pre>`,
  });

  return NextResponse.json({ ok: true, supportEmail: support });
}
