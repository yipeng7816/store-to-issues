import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { connection } from "next/server";

export type SessionData = {
  userId?: string;
  email?: string;
};

const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "store-to-issues-dev-secret-min-32-chars!!",
  cookieName: "sti_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  await connection();
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireUserId(): Promise<string | null> {
  const session = await getSession();
  return session.userId || null;
}
