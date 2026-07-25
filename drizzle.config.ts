import { defineConfig } from "drizzle-kit";

// drizzle-kit runs as a standalone CLI, outside the Next.js process, so it doesn't get
// .env.local loaded automatically the way `next dev`/`next build` do. Node's built-in
// loader covers that without adding a dependency; the CLI's own commands (generate,
// migrate, studio) still work if the file is absent — DATABASE_URL just won't resolve.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local — fall through and rely on whatever is already in the environment.
}

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  out: "./src/lib/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
