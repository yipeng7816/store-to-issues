import { NextResponse } from "next/server";
import { logProductErrorWithContext } from "../../../lib/analytics";
import { settingsSnapshotFromBody } from "../../../lib/settings-debug";
import { encryptSecret } from "../../../lib/crypto";
import { prisma } from "../../../lib/prisma";
import { requireUserId } from "../../../lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return NextResponse.json({
    settings: {
      githubRepo: settings?.githubRepo || "",
      githubTokenSet: Boolean(settings?.githubToken),
      useMockReviews: settings?.useMockReviews ?? true,
      minRating: settings?.minRating ?? 3,
      ascAppId: settings?.ascAppId || "",
      ascIssuerId: settings?.ascIssuerId || "",
      ascKeyId: settings?.ascKeyId || "",
      ascPrivateKeySet: Boolean(settings?.ascPrivateKey),
      googlePlayPackageName: settings?.googlePlayPackageName || "",
      googlePlayServiceAccountJsonSet: Boolean(
        settings?.googlePlayServiceAccountJson,
      ),
    },
  });
}

export async function PUT(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  let existing: Awaited<
    ReturnType<typeof prisma.userSettings.findUnique>
  > = null;

  try {
    body = (await request.json()) as Record<string, unknown>;
    existing = await prisma.userSettings.findUnique({ where: { userId } });

    const pickSecret = (incoming: unknown, previous: string | undefined) => {
      if (typeof incoming === "string" && incoming.length > 0) {
        return encryptSecret(incoming);
      }
      return previous || "";
    };

    const data = {
      githubRepo: String(body.githubRepo ?? existing?.githubRepo ?? ""),
      useMockReviews: Boolean(
        body.useMockReviews ?? existing?.useMockReviews ?? true,
      ),
      minRating: Number(body.minRating ?? existing?.minRating ?? 3),
      ascAppId: String(body.ascAppId ?? existing?.ascAppId ?? ""),
      ascIssuerId: String(body.ascIssuerId ?? existing?.ascIssuerId ?? ""),
      ascKeyId: String(body.ascKeyId ?? existing?.ascKeyId ?? ""),
      googlePlayPackageName: String(
        body.googlePlayPackageName ?? existing?.googlePlayPackageName ?? "",
      ),
      githubToken: pickSecret(body.githubToken, existing?.githubToken),
      ascPrivateKey: pickSecret(body.ascPrivateKey, existing?.ascPrivateKey),
      googlePlayServiceAccountJson: pickSecret(
        body.googlePlayServiceAccountJson,
        existing?.googlePlayServiceAccountJson,
      ),
    };

    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logProductErrorWithContext("settings_error", userId, {
      reason: message.slice(0, 300),
      attempted: settingsSnapshotFromBody(body, existing),
    });
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}
