import test from "node:test";
import assert from "node:assert/strict";
import { nextTrafficSession, SESSION_IDLE_MS, isCustomerPath, trafficDateRange } from "../src/utils/traffic.js";

test("30 minutes is a session boundary, not a page-view deduplication window", () => {
  const existing = { id: "first", lastActivity: 1000 };
  assert.equal(nextTrafficSession(existing, 1000 + SESSION_IDLE_MS - 1, () => "new").id, "first");
  assert.equal(nextTrafficSession(existing, 1000 + SESSION_IDLE_MS, () => "new").id, "new");
  assert.equal(nextTrafficSession(null, 1000, () => "first").id, "first");
  assert.equal(nextTrafficSession(existing, 999, () => "new").id, "new");
});
test("public product and campaign routes count, internal routes do not", () => {
  for (const path of ["/", "/products/123", "/promo/123", "/login", "/search"]) assert.equal(isCustomerPath(path), true);
  for (const path of ["/Admin", "/superADMIN/orders", "/api/Stats", "/tests/preview", "//elsewhere"]) assert.equal(isCustomerPath(path), false);
});
test("selected end date includes the entire day in Baku time", () => {
  assert.deepEqual(trafficDateRange("2026-10-03", "2026-10-03"), { from: "2026-10-03T00:00:00+04:00", to: "2026-10-03T20:00:00.000Z" });
});
