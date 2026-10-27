import type { UserSettings } from "@prisma/client";
import { prisma } from "./prisma";

/** Non-secret fields + flags for whether secrets are stored (never log secret values). */
export type SettingsDebugSnapshot = {
  githubRepo: string;
  useMockReviews: boolean;
  minRating: number;
  ascAppId: string;
  ascIssuerId: string;
  ascKeyId: string;
  googlePlayPackageName: string;
  githubTokenSet: boolean;
  ascPrivateKeySet: boolean;
  googlePlayServiceAccountJsonSet: boolean;
};

export function settingsSnapshotFromRow(
  row: UserSettings | null | undefined,
): SettingsDebugSnapshot | null {
  if (!row) return null;
  return {
    githubRepo: row.githubRepo || "",
    useMockReviews: row.useMockReviews,
    minRating: row.minRating,
    ascAppId: row.ascAppId || "",
    ascIssuerId: row.ascIssuerId || "",
    ascKeyId: row.ascKeyId || "",
    googlePlayPackageName: row.googlePlayPackageName || "",
    githubTokenSet: Boolean(row.githubToken),
    ascPrivateKeySet: Boolean(row.ascPrivateKey),
    googlePlayServiceAccountJsonSet: Boolean(row.googlePlayServiceAccountJson),
  };
}

export function settingsSnapshotFromBody(
  body: Record<string, unknown>,
  existing?: UserSettings | null,
): SettingsDebugSnapshot {
  const str = (key: string, fallback = "") =>
    String(body[key] ?? existing?.[key as keyof UserSettings] ?? fallback);
  const secretProvided = (key: string) =>
    typeof body[key] === "string" && (body[key] as string).length > 0;
  return {
    githubRepo: str("githubRepo"),
    useMockReviews: Boolean(
      body.useMockReviews ?? existing?.useMockReviews ?? true,
    ),
    minRating: Number(body.minRating ?? existing?.minRating ?? 3),
    ascAppId: str("ascAppId"),
    ascIssuerId: str("ascIssuerId"),
    ascKeyId: str("ascKeyId"),
    googlePlayPackageName: str("googlePlayPackageName"),
    githubTokenSet:
      secretProvided("githubToken") || Boolean(existing?.githubToken),
    ascPrivateKeySet:
      secretProvided("ascPrivateKey") || Boolean(existing?.ascPrivateKey),
    googlePlayServiceAccountJsonSet:
      secretProvided("googlePlayServiceAccountJson") ||
      Boolean(existing?.googlePlayServiceAccountJson),
  };
}

export type UserDebugContext = {
  planStatus: string;
  emailVerified: boolean;
  trialEndsAt: string | null;
  settings: SettingsDebugSnapshot | null;
};

export async function loadUserDebugContext(
  userId: string,
): Promise<UserDebugContext | null> {
  try {
    const [user, settings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { planStatus: true, emailVerifiedAt: true, trialEndsAt: true },
      }),
      prisma.userSettings.findUnique({ where: { userId } }),
    ]);
    if (!user) return null;
    return {
      planStatus: user.planStatus,
      emailVerified: user.emailVerifiedAt != null,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
      settings: settingsSnapshotFromRow(settings),
    };
  } catch {
    return null;
  }
}
