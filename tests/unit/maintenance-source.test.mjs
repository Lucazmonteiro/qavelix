import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isMaintenanceMode } from "../../src/lib/maintenance.ts";

test("maintenance mode fails closed: on unless explicitly set to off", () => {
  const original = process.env.QAVELIX_MAINTENANCE;

  try {
    delete process.env.QAVELIX_MAINTENANCE;
    assert.equal(isMaintenanceMode(), true);
    process.env.QAVELIX_MAINTENANCE = "";
    assert.equal(isMaintenanceMode(), true);
    process.env.QAVELIX_MAINTENANCE = "false";
    assert.equal(isMaintenanceMode(), true);
    process.env.QAVELIX_MAINTENANCE = "off";
    assert.equal(isMaintenanceMode(), false);
  } finally {
    if (original === undefined) {
      delete process.env.QAVELIX_MAINTENANCE;
    } else {
      process.env.QAVELIX_MAINTENANCE = original;
    }
  }
});

test("every compute/billing entry point is gated on isMaintenanceMode()", async () => {
  const gated = [
    "src/proxy.ts",
    "src/lib/server/compression-queue.ts",
    "src/lib/server/video-trimmer-queue.ts",
    "src/lib/server/stripe-client.ts",
    "src/lib/server/email.ts",
  ];

  for (const file of gated) {
    const source = await readFile(new URL(`../../${file}`, import.meta.url), "utf8");
    assert.match(source, /isMaintenanceMode\(\)/, `${file} must consult isMaintenanceMode()`);
  }

  const proxy = await readFile(new URL("../../src/proxy.ts", import.meta.url), "utf8");
  assert.ok(
    proxy.indexOf("isMaintenanceMode()") < proxy.indexOf("NextResponse.next()"),
    "the maintenance gate must run before the proxy passes any request through",
  );
});
