import { randomUUID } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/server/db/client";
import { usageCounter, usageEvent, userEntitlement } from "@/lib/server/db/schema";
import type { EntitlementCheck, EntitlementReservation } from "@/lib/server/entitlements/errors";
import {
  ANONYMOUS_POOL_TOOL_ID,
  getAnonymousLimits,
  getToolLimits,
  isPlanType,
  type PlanType,
  type ToolId,
  type ToolLimits,
} from "@/lib/server/entitlements/policy";
import { getClientFingerprint } from "@/lib/server/security";
import { getOptionalSession } from "@/lib/server/auth/session";
import { logSecurityEvent } from "@/lib/server/security";

export type Actor = { type: "user"; id: string; plan: PlanType } | { type: "anonymous"; id: string };

function dailyPeriodKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Defaults to "free" whenever a row is missing (every new user — no row is created at
// sign-up; the first read simply treats absence as the default plan) or unrecognized
// (data corruption / an in-progress future migration) — the most restrictive plan, never
// a crash and never silently granting more access than confirmed.
export async function getPlan(userId: string): Promise<PlanType> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ plan: userEntitlement.plan })
      .from(userEntitlement)
      .where(eq(userEntitlement.userId, userId))
      .limit(1);

    if (!row) {
      return "free";
    }

    if (!isPlanType(row.plan)) {
      logSecurityEvent("warn", "entitlement_invalid_plan_value", { userId });
      return "free";
    }

    return row.plan;
  } catch (error) {
    logSecurityEvent("error", "entitlement_plan_lookup_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return "free";
  }
}

// The write side of the plan, added in Milestone 5 — called only from the Stripe
// subscription lifecycle hooks in auth.ts, never from a route directly (plan changes are
// a consequence of a verified webhook event, not a client request). Unlike getPlan()'s
// fail-safe default and confirmUsage()/releaseUsage()'s swallow-on-error behavior, this
// deliberately rethrows: a failed write here means a paying user's access silently didn't
// update, which must surface as a non-2xx webhook response so Stripe retries delivery,
// not disappear into a log line.
export async function setUserPlan(userId: string, plan: PlanType): Promise<void> {
  try {
    const db = getDb();

    await db
      .insert(userEntitlement)
      .values({ userId, plan })
      .onConflictDoUpdate({
        target: userEntitlement.userId,
        set: { plan, updatedAt: new Date() },
      });

    logSecurityEvent("info", "entitlement_plan_updated", { userId, plan });
  } catch (error) {
    logSecurityEvent("error", "entitlement_plan_update_failed", {
      userId,
      plan,
      message: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

// The authenticated session (never a client-supplied value) is the sole source of
// identity here. An anonymous visitor is identified the same way every other rate-limit
// in this app already does — getClientFingerprint()'s IP hash — so this introduces no
// new attribution mechanism.
export async function resolveActor(request: Request): Promise<Actor> {
  const session = await getOptionalSession();

  if (session) {
    const plan = await getPlan(session.user.id);

    return { type: "user", id: session.user.id, plan };
  }

  return { type: "anonymous", id: getClientFingerprint(request) };
}

type ResolvedLimits = {
  effectiveToolId: string;
  plan: PlanType | "anonymous";
  limits: ToolLimits;
};

// Anonymous actors always resolve to the shared "any" pool key regardless of which tool
// was requested — see ANONYMOUS_POOL_TOOL_ID's comment in policy.ts.
function resolveLimits(actor: Actor, toolId: ToolId): ResolvedLimits {
  if (actor.type === "anonymous") {
    return { effectiveToolId: ANONYMOUS_POOL_TOOL_ID, plan: "anonymous", limits: getAnonymousLimits() };
  }

  return { effectiveToolId: toolId, plan: actor.plan, limits: getToolLimits(actor.plan, toolId) };
}

async function readRemaining(
  actor: Actor,
  effectiveToolId: string,
  periodKey: string,
  limit: number,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: usageCounter.count })
    .from(usageCounter)
    .where(
      and(
        eq(usageCounter.actorType, actor.type),
        eq(usageCounter.actorId, actor.id),
        eq(usageCounter.toolId, effectiveToolId),
        eq(usageCounter.periodKey, periodKey),
      ),
    )
    .limit(1);

  return Math.max(0, limit - (row?.count ?? 0));
}

// Read-only: does not reserve anything, safe to call as often as needed (e.g. rendering
// the dashboard). A single indexed read against usage_counter — never touches FFmpeg or
// any tool-processing code.
export async function checkEntitlement(actor: Actor, toolId: ToolId): Promise<EntitlementCheck> {
  const { effectiveToolId, plan, limits } = resolveLimits(actor, toolId);
  const periodKey = limits.period === "day" ? dailyPeriodKey() : "lifetime";
  const context = { plan, toolId, limit: limits.maxUsesPerPeriod, period: limits.period };

  try {
    const remaining = await readRemaining(actor, effectiveToolId, periodKey, limits.maxUsesPerPeriod);

    if (remaining <= 0) {
      return {
        allowed: false,
        reason: actor.type === "anonymous" ? "account_required" : "usage_limit_reached",
        ...context,
      };
    }

    return { allowed: true, remaining, ...context };
  } catch (error) {
    logSecurityEvent("error", "entitlement_check_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });

    return { allowed: false, reason: "usage_service_unavailable", ...context };
  }
}

// Atomically claims one usage slot, or denies the request — the only function in this
// module that mutates state. Must be called before any FFmpeg/tool work starts, not
// after. `idempotencyKey` must be stable for a given logical attempt (the compression
// job id; a per-request id for the synchronous Extract Audio flow) so a network retry or
// duplicate submission replays the same outcome instead of reserving a second slot.
export async function reserveUsage(
  actor: Actor,
  toolId: ToolId,
  idempotencyKey: string,
): Promise<EntitlementReservation> {
  const { effectiveToolId, plan, limits } = resolveLimits(actor, toolId);
  const periodKey = limits.period === "day" ? dailyPeriodKey() : "lifetime";
  const limit = limits.maxUsesPerPeriod;
  const context = { plan, toolId, limit, period: limits.period };

  try {
    const db = getDb();

    // Idempotency guard first: if this exact key was already used, replay its outcome
    // rather than reserving (and counting) a second time. The UNIQUE constraint on
    // idempotency_key makes this race-safe under genuinely concurrent duplicate
    // submissions, not just safe against sequential retries.
    const eventId = randomUUID();
    const [insertedEvent] = await db
      .insert(usageEvent)
      .values({
        id: eventId,
        actorType: actor.type,
        actorId: actor.id,
        toolId: effectiveToolId,
        periodKey,
        status: "reserved",
        idempotencyKey,
      })
      .onConflictDoNothing({ target: usageEvent.idempotencyKey })
      .returning({ id: usageEvent.id });

    if (!insertedEvent) {
      const [existing] = await db
        .select({ id: usageEvent.id, status: usageEvent.status })
        .from(usageEvent)
        .where(eq(usageEvent.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existing && (existing.status === "reserved" || existing.status === "confirmed")) {
        const remaining = await readRemaining(actor, effectiveToolId, periodKey, limit);

        return { allowed: true, remaining, usageEventId: existing.id, ...context };
      }

      // The original attempt was rejected or released — a retry of a request that was
      // already correctly denied should stay denied, not get a second attempt at the
      // same key.
      return { allowed: false, reason: "usage_limit_reached", ...context };
    }

    // Atomic "increment only if still under the limit" — a single statement, not a
    // read-then-write, so concurrent reservations for the same actor/tool/period
    // serialize correctly instead of racing past the limit.
    const [counterRow] = await db
      .insert(usageCounter)
      .values({
        id: randomUUID(),
        actorType: actor.type,
        actorId: actor.id,
        toolId: effectiveToolId,
        periodKey,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [usageCounter.actorType, usageCounter.actorId, usageCounter.toolId, usageCounter.periodKey],
        set: { count: sql`${usageCounter.count} + 1`, updatedAt: new Date() },
        setWhere: sql`${usageCounter.count} < ${limit}`,
      })
      .returning({ count: usageCounter.count });

    if (!counterRow) {
      // Limit reached. The ledger row from above is marked rejected — never counted —
      // rather than left as "reserved", so the audit trail distinguishes "attempted and
      // denied" from "attempted and later failed".
      await db
        .update(usageEvent)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(usageEvent.id, eventId));

      return {
        allowed: false,
        reason: actor.type === "anonymous" ? "account_required" : "usage_limit_reached",
        ...context,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - counterRow.count),
      usageEventId: eventId,
      ...context,
    };
  } catch (error) {
    logSecurityEvent("error", "entitlement_reserve_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });

    return { allowed: false, reason: "usage_service_unavailable", ...context };
  }
}

// Marks a reservation as successfully completed. Never changes the counter — the slot
// was already counted at reservation time; confirming just records that the work this
// slot paid for actually succeeded. Failure to write this is logged but never thrown:
// the work already succeeded, and a bookkeeping write failing must not turn into a
// user-facing error for a request that otherwise completed correctly.
export async function confirmUsage(usageEventId: string): Promise<void> {
  try {
    const db = getDb();

    await db
      .update(usageEvent)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(and(eq(usageEvent.id, usageEventId), eq(usageEvent.status, "reserved")));
  } catch (error) {
    logSecurityEvent("error", "entitlement_confirm_failed", {
      usageEventId,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

// Gives back a reserved slot after the work it paid for failed or was cancelled.
// Idempotent: the WHERE status = 'reserved' guard means a second release call for an
// already-released (or already-confirmed) event matches no row and safely no-ops,
// rather than double-decrementing the counter.
export async function releaseUsage(usageEventId: string): Promise<void> {
  try {
    const db = getDb();

    await db.transaction(async (tx) => {
      const [event] = await tx
        .update(usageEvent)
        .set({ status: "released", updatedAt: new Date() })
        .where(and(eq(usageEvent.id, usageEventId), eq(usageEvent.status, "reserved")))
        .returning({
          actorType: usageEvent.actorType,
          actorId: usageEvent.actorId,
          toolId: usageEvent.toolId,
          periodKey: usageEvent.periodKey,
        });

      if (!event) {
        return;
      }

      // GREATEST(count - 1, 0): never let the counter go negative even under an
      // unexpected sequencing of operations.
      await tx
        .update(usageCounter)
        .set({ count: sql`GREATEST(${usageCounter.count} - 1, 0)`, updatedAt: new Date() })
        .where(
          and(
            eq(usageCounter.actorType, event.actorType),
            eq(usageCounter.actorId, event.actorId),
            eq(usageCounter.toolId, event.toolId),
            eq(usageCounter.periodKey, event.periodKey),
          ),
        );
    });
  } catch (error) {
    logSecurityEvent("error", "entitlement_release_failed", {
      usageEventId,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
