import { NextResponse } from "next/server";
import { recordPageView } from "../../../../lib/analytics";
import { allowRequest, clientIp, tooManyAttempts } from "../../../../lib/request-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const allowed = await allowRequest(
    `analytics:view:${clientIp(request)}`,
    120,
    60 * 1000,
  );
  if (!allowed) {
    return NextResponse.json(tooManyAttempts(), { status: 429 });
  }

  const body = (await request.json()) as {
    path?: string;
    visitorKey?: string;
    referrer?: string;
  };

  await recordPageView({
    path: body.path ?? "",
    visitorKey: body.visitorKey ?? "",
    referrer: body.referrer,
  });

  return NextResponse.json({ ok: true });
}
