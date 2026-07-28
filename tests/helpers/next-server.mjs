import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const projectRoot = process.cwd();

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolve(address.port);
          return;
        }

        reject(new Error("Could not allocate a local test port."));
      });
    });
  });
}

async function waitForServer(baseUrl, getOutput) {
  const deadline = Date.now() + 60_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/en`);

      if (response.ok) {
        return;
      }

      lastError = new Error(`Server responded with ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(
    `Timed out waiting for Next test server.\n${getOutput()}\n${String(lastError)}`,
  );
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5000).then(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
      }
    }),
  ]);
}

export async function withNextServer(run) {
  const port = await getAvailablePort();
  const baseUrl = `http://localhost:${port}`;
  const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const hasProductionBuild = existsSync(path.join(projectRoot, ".next", "BUILD_ID"));
  const command = hasProductionBuild ? "start" : "dev";
  const output = [];
  const child = spawn(
    process.execPath,
    [nextBin, command, "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_APP_URL: baseUrl,
        NEXT_PUBLIC_SUPPORT_EMAIL:
          process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "qavelixhq@gmail.com",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));

  const getOutput = () => output.join("").slice(-6000);

  try {
    await waitForServer(baseUrl, getOutput);
    await run({ baseUrl, command, getOutput });
  } finally {
    await stopProcess(child);
  }
}

export async function fetchText(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();

  return { response, text };
}

export function assertStatus(response, expectedStatus, label) {
  assert.equal(
    response.status,
    expectedStatus,
    `${label} expected HTTP ${expectedStatus}, received ${response.status}`,
  );
}
