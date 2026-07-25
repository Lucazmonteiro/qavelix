import { headers } from "next/headers";

import { getAuth } from "@/lib/server/auth/auth";

// Server-side session read for use inside Server Components (page.tsx). Wraps
// getAuth().api.getSession() so callers don't each need to know how to fetch/forward
// request headers. Returns null for a guest, or { session, user } for a signed-in
// visitor — safe to call from any page, not just the guest-only ones this milestone
// wires it into. This is the same function Milestone 3's dashboard should call to gate
// a real protected page — no new plumbing needed there.
export async function getOptionalSession() {
  const requestHeaders = await headers();

  return getAuth().api.getSession({ headers: requestHeaders });
}
