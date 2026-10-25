import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { sessionPassword } from "./secrets";

export type SessionData = {
  userId?: string;
  email?: string;
};

const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

function sessionOptions(): SessionOptions {
  return {
    password: sessionPassword(),
    cookieName: "sti_session",
    cookieOptions: {
      secure: isProd,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function getSession() {
  await connection();
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

export async function requireUserId(): Promise<string | null> {
  const session = await getSession();
  return session.userId || null;
}
