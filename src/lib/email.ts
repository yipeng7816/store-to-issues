import "./env";

export function supportEmail(): string {
  return process.env.SUPPORT_EMAIL || "ymyjobp@163.com";
}

export function appBaseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Local only. Production must not return reset or verify links in JSON. */
export function includeDevLink(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send via Resend when RESEND_API_KEY is set.
 * Without a key: log the payload (dev) and return { ok:false, logged:true }.
 */
export async function sendEmail(
  args: SendArgs,
): Promise<{ ok: boolean; logged?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM || "StoreToIssues <onboarding@resend.dev>";

  if (!key) {
    console.info("[email:dev-fallback]", {
      to: args.to,
      subject: args.subject,
      text: args.text || args.html,
    });
    return { ok: false, logged: true, error: "RESEND_API_KEY not set" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error", res.status, body);
    return { ok: false, error: `Resend ${res.status}` };
  }
  return { ok: true };
}
