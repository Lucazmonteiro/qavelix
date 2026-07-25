import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/server/auth/auth";

export const runtime = "nodejs";

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler((request: Request) =>
  getAuth().handler(request),
);
