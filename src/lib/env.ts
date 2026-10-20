import { config } from "dotenv";
import path from "path";

/** Prefer project `.env` over a stale GITHUB_TOKEN in the parent shell. */
config({ path: path.join(process.cwd(), ".env"), override: true });
