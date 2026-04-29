import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const envPath = resolve(process.cwd(), "../.env");
  const envFile = readFileSync(envPath, "utf8");
  const match = envFile.match(/^DATABASE_URL=(.*)$/m);

  if (!match) {
    throw new Error("DATABASE_URL is not defined in .env");
  }

  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
}

export default defineConfig({
  schema: "../prisma/schema.prisma",
  datasource: {
    url: loadDatabaseUrl(),
  },
});