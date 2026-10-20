#!/usr/bin/env node
/**
 * Run a read-oriented SQL query against DATABASE_URL (Neon / local Postgres).
 *
 * Usage:
 *   node scripts/db-query.mjs "SELECT email, planStatus, isAdmin FROM \"User\" LIMIT 20"
 *   node scripts/db-query.mjs --file scripts/sql/list-users.sql
 *
 * Safety: refuses obvious destructive statements unless --allow-write is passed.
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

require("dotenv").config({ path: path.join(root, ".env"), override: true });

const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
let allowWrite = false;
let sql = "";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--allow-write") allowWrite = true;
  else if (args[i] === "--file") {
    sql = fs.readFileSync(args[++i], "utf8");
  } else if (!args[i].startsWith("-")) {
    sql = args[i];
  }
}

if (!sql.trim()) {
  console.error(
    'Usage: node scripts/db-query.mjs "SELECT ..." [--allow-write]\n' +
      "       node scripts/db-query.mjs --file path.sql [--allow-write]",
  );
  process.exit(1);
}

const dangerous =
  /\b(drop|delete|truncate|alter|update|insert|grant|revoke)\b/i.test(sql);
if (dangerous && !allowWrite) {
  console.error(
    "Refusing write/DDL without --allow-write. Re-run with that flag if intentional.",
  );
  process.exit(2);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing in .env");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const rows = await prisma.$queryRawUnsafe(sql);
  console.log(JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2));
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
