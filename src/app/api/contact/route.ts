import { NextResponse } from "next/server";
import { logProductError } from "../../../lib/analytics";
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

  const session = await getSession();
  const userId = session.userId || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    logProductError("contact_error", userId, "invalid_email");
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }
  if (message.length < 10) {
    logProductError("contact_error", userId, "message_too_short");
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
    logProductError("contact_error", userId, "rate_limit");
    return NextResponse.json(tooManyAttempts(), { status: 429 });
  }

  await prisma.contactMessage.create({
    data: {
      email,
      name,
      body: message,
      userId,
    },
  });

  const support = supportEmail();
  const sent = await sendEmail({
    to: support,
    subject: `[StoreToIssues contact] ${name || email}`,
    text: `From: ${name} <${email}>\nUserId: ${userId || "-"}\n\n${message}`,
    html: `<p><b>From:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><pre>${escapeHtml(message)}</pre>`,
  });

  if (!sent.ok) {
    logProductError("contact_error", userId, "email_send_failed");
    return NextResponse.json(
      { error: "Could not send message. Try email later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, supportEmail: support });
}
