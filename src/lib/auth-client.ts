"use client";

import { createAuthClient } from "better-auth/react";

// No baseURL configured on purpose: it defaults to the relative "/api/auth", which is
// exactly our same-origin route (src/app/api/auth/[...all]/route.ts) — no cross-origin
// config needed, matching every other client-side call in this app (all same-origin
// fetches to /api/*).
export const authClient = createAuthClient();

export const useSession = authClient.useSession;
