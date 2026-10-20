import type { UserSettings } from "@prisma/client";
import { decryptSecret } from "./crypto";

export type SyncCredentials = {
  githubToken: string;
  githubRepo: string;
  useMockReviews: boolean;
  minRating: number;
  ascIssuerId: string;
  ascKeyId: string;
  ascPrivateKey: string;
  ascAppId: string;
  googlePlayPackageName: string;
  googlePlayServiceAccountJson: string;
};

export function credentialsFromSettings(
  settings: UserSettings | null | undefined,
): SyncCredentials {
  return {
    githubToken:
      decryptSecret(settings?.githubToken || "") ||
      process.env.GITHUB_TOKEN ||
      "",
    githubRepo: settings?.githubRepo || process.env.GITHUB_REPO || "",
    useMockReviews:
      settings?.useMockReviews ?? process.env.USE_MOCK_REVIEWS !== "false",
    minRating: settings?.minRating ?? Number(process.env.MIN_RATING || "3"),
    ascIssuerId: settings?.ascIssuerId || process.env.ASC_ISSUER_ID || "",
    ascKeyId: settings?.ascKeyId || process.env.ASC_KEY_ID || "",
    ascPrivateKey:
      decryptSecret(settings?.ascPrivateKey || "") ||
      process.env.ASC_PRIVATE_KEY ||
      "",
    ascAppId: settings?.ascAppId || process.env.ASC_APP_ID || "",
    googlePlayPackageName:
      settings?.googlePlayPackageName ||
      process.env.GOOGLE_PLAY_PACKAGE_NAME ||
      "",
    googlePlayServiceAccountJson:
      decryptSecret(settings?.googlePlayServiceAccountJson || "") ||
      process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ||
      "",
  };
}

/** Apply credentials into process.env for existing store fetch helpers. */
export function applyCredentialsEnv(creds: SyncCredentials) {
  process.env.GITHUB_TOKEN = creds.githubToken;
  process.env.GITHUB_REPO = creds.githubRepo;
  process.env.USE_MOCK_REVIEWS = creds.useMockReviews ? "true" : "false";
  process.env.MIN_RATING = String(creds.minRating);
  process.env.ASC_ISSUER_ID = creds.ascIssuerId;
  process.env.ASC_KEY_ID = creds.ascKeyId;
  process.env.ASC_PRIVATE_KEY = creds.ascPrivateKey;
  process.env.ASC_APP_ID = creds.ascAppId;
  process.env.GOOGLE_PLAY_PACKAGE_NAME = creds.googlePlayPackageName;
  process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON =
    creds.googlePlayServiceAccountJson;
}
