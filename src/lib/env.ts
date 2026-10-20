import { config } from "dotenv";
import path from "path";

/**
 * Local only: load `.env` and let it win over a stale shell GITHUB_TOKEN.
 * On Vercel, never override platform env with a stray file.
 */
if (!process.env.VERCEL) {
  config({ path: path.join(process.cwd(), ".env"), override: true });
}
