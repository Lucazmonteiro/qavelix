import { z } from "zod";

const rawNodeEnv = process.env.NODE_ENV ?? "development";
const hasExplicitAppUrl = Boolean(process.env.NEXT_PUBLIC_APP_URL);
const localProductionHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_SUPPORT_EMAIL: z.email().optional(),
    NEXT_PUBLIC_APP_URL: z.url().superRefine((value, context) => {
      const url = new URL(value);

      if (rawNodeEnv !== "production") {
        return;
      }

      if (!hasExplicitAppUrl) {
        context.addIssue({
          code: "custom",
          message: "NEXT_PUBLIC_APP_URL is required in production.",
        });
        return;
      }

      if (url.protocol !== "https:" && !localProductionHosts.has(url.hostname)) {
        context.addIssue({
          code: "custom",
          message:
            "NEXT_PUBLIC_APP_URL must use HTTPS in production unless it targets localhost for local verification.",
        });
      }
    }),
  })
  .superRefine((value, context) => {
    const appUrl = new URL(value.NEXT_PUBLIC_APP_URL);
    const isLocalAppUrl = localProductionHosts.has(appUrl.hostname);

    if (
      value.NODE_ENV === "production" &&
      hasExplicitAppUrl &&
      !isLocalAppUrl &&
      !value.NEXT_PUBLIC_SUPPORT_EMAIL
    ) {
      context.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPPORT_EMAIL"],
        message: "NEXT_PUBLIC_SUPPORT_EMAIL is required for public production deployments.",
      });
    }
  });

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ??
    (rawNodeEnv === "production" ? undefined : "http://localhost:3000"),
});

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment configuration: ${z.prettifyError(parsedEnv.error)}`,
  );
}

export const env = parsedEnv.data;
