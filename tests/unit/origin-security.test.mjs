import assert from "node:assert/strict";
import test from "node:test";

import {
  getSameOriginCandidates,
  validateSameOriginRequest,
} from "../../src/lib/server/origin.ts";

function request(url, headers = {}) {
  return new Request(url, {
    headers,
  });
}

test("same-origin validation accepts direct localhost requests", () => {
  assert.equal(
    validateSameOriginRequest(
      request("http://localhost:3000/api/upload/analyze", {
        origin: "http://localhost:3000",
      }),
    ),
    true,
  );
});

test("same-origin validation accepts LAN hosts reconstructed from the Host header", () => {
  assert.equal(
    validateSameOriginRequest(
      request("http://localhost:3000/api/upload/analyze", {
        host: "192.168.1.18:3000",
        origin: "http://192.168.1.18:3000",
      }),
    ),
    true,
  );
});

test("same-origin validation accepts forwarded production origins", () => {
  const uploadRequest = request("http://127.0.0.1:3000/api/upload/analyze", {
    host: "127.0.0.1:3000",
    origin: "https://qavelix.example",
    "x-forwarded-host": "qavelix.example",
    "x-forwarded-proto": "https",
  });

  assert.equal(validateSameOriginRequest(uploadRequest), true);
  assert.ok(getSameOriginCandidates(uploadRequest).has("https://qavelix.example"));
});

test("same-origin validation rejects missing and cross-origin sources", () => {
  assert.equal(validateSameOriginRequest(request("http://localhost:3000/api")), false);
  assert.equal(
    validateSameOriginRequest(
      request("http://localhost:3000/api", {
        host: "localhost:3000",
        origin: "https://attacker.example",
      }),
    ),
    false,
  );
});
