const test = require("node:test");
const assert = require("node:assert/strict");
const { mockRequest, mockResponse } = require("./helpers/http-mock");

// These exercise the auth gate on every write route WITHOUT touching Supabase
// or requiring any env vars: requirePostingAccount()/requireUser() reject a
// request with no session cookie before any network call happens. This is
// exactly the class of bug found and fixed on 2026-08-19 - DELETE routes had
// no auth check at all, and this test would have failed immediately on that
// code. If one of these starts passing "unauthenticated" as allowed, that's
// a real regression, not a flaky test.

const writeRouteCases = [
  { name: "ship-listings POST", module: "../api/ship-listings", method: "POST", url: "/api/ship-listings" },
  { name: "ship-listings DELETE", module: "../api/ship-listings", method: "DELETE", url: "/api/ship-listings?id=00000000-0000-0000-0000-000000000000" },
  { name: "crew-listings POST", module: "../api/crew-listings", method: "POST", url: "/api/crew-listings" },
  { name: "crew-listings DELETE", module: "../api/crew-listings", method: "DELETE", url: "/api/crew-listings?id=00000000-0000-0000-0000-000000000000" },
  { name: "material-requests POST", module: "../api/material-requests", method: "POST", url: "/api/material-requests" },
  { name: "material-requests DELETE", module: "../api/material-requests", method: "DELETE", url: "/api/material-requests?id=00000000-0000-0000-0000-000000000000" },
  { name: "deals GET", module: "../api/deals", method: "GET", url: "/api/deals" },
  { name: "deals POST", module: "../api/deals", method: "POST", url: "/api/deals", body: { action: "create", deal: {} } },
];

for (const testCase of writeRouteCases) {
  test(`${testCase.name} rejects an unauthenticated request with 401`, async () => {
    const handler = require(testCase.module);
    const request = mockRequest({
      method: testCase.method,
      url: testCase.url,
      headers: {},
      body: testCase.body ? JSON.stringify(testCase.body) : null,
    });
    const response = mockResponse();

    await handler(request, response);

    assert.equal(
      response.statusCode,
      401,
      `expected 401, got ${response.statusCode} with body ${JSON.stringify(response.body)}`,
    );
  });
}

test("auth/account POST (profile actions) rejects an unauthenticated request with 401", async () => {
  const handler = require("../api/auth/account");
  const request = mockRequest({
    method: "POST",
    url: "/api/auth/account",
    headers: {},
    body: JSON.stringify({ action: "start-rsi", rsiHandle: "someone" }),
  });
  const response = mockResponse();

  await handler(request, response);

  assert.equal(response.statusCode, 401);
});

test("auth/account GET (session check) does not require auth and reports authenticated: false", async () => {
  const handler = require("../api/auth/account");
  const request = mockRequest({ method: "GET", url: "/api/auth/account", headers: {} });
  const response = mockResponse();

  await handler(request, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.authenticated, false);
});
