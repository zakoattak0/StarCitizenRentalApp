const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crewAvailability = require("../public/crew-availability");
const { publicUser } = require("../api/auth/_shared");
const root = path.resolve(__dirname, "..");

function userStore() {
  let row = { id: "discord:owner", display_name: "Owner", region: "EU", time_zone: "Europe/Paris" };
  const writes = [];
  const context = { module: { exports: {} }, console, Error,
    require(name) {
      assert.equal(name, "./_supabase");
      return { async supabaseRequest(url, options) {
        if (options.method === "GET") return [row];
        const body = JSON.parse(options.body);
        writes.push({ url, method: options.method, body });
        row = { ...row, ...body };
        return [row];
      } };
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "api/_users.js"), "utf8"), context);
  return { api: context.module.exports, writes, row: () => row };
}

test("identity sync and fresh logins preserve preferences saved in the database", async () => {
  const store = userStore();
  const freshLogin = { id: "discord:owner", username: "Owner", profile: {} };
  const saved = await store.api.upsertUser(freshLogin);
  store.api.applyUserPreferences(freshLogin, saved);
  assert.equal(freshLogin.profile.region, "EU");
  assert.equal(freshLogin.profile.timeZone, "Europe/Paris");
  await store.api.saveUserPreferences(freshLogin, { region: "AUS", timeZone: "Australia/Sydney" });
  await store.api.upsertUser({ id: "discord:owner", username: "Owner", profile: { region: "USA", timeZone: "America/Chicago" } });
  assert.equal(store.row().region, "AUS");
  assert.equal(store.row().time_zone, "Australia/Sydney");
  for (const write of store.writes.filter((entry) => entry.method === "POST")) {
    assert.equal(Object.hasOwn(write.body, "region"), false);
    assert.equal(Object.hasOwn(write.body, "time_zone"), false);
  }
});

test("preference writes target only the signed-in user's row and can clear optional fields", async () => {
  const store = userStore();
  const saved = await store.api.saveUserPreferences({ id: "discord:owner", username: "Owner" }, { region: "", timeZone: "" });
  const patch = store.writes.find((entry) => entry.method === "PATCH");
  assert.equal(patch.url, "users?id=eq.discord%3Aowner");
  assert.deepEqual(patch.body, { region: null, time_zone: null });
  assert.equal(saved.region, "");
  assert.equal(saved.timeZone, "");
});

function accountHandler({ authenticated = true, failSave = false } = {}) {
  const writes = [];
  const session = { user: { id: "discord:owner", discordId: "owner", username: "Owner", profile: { rsiHandle: "Pilot", rsiStatus: "verified", rsiVerificationMethod: "public_profile_code", region: "USA", timeZone: "America/Chicago" } } };
  const context = { module: { exports: {} }, URL, Error,
    require(name) {
      if (name === "node:crypto") return require(name);
      if (name === "../../public/crew-availability") return crewAvailability;
      if (name === "../_supabase") return { checkRateLimit: async () => {} };
      if (name === "../_users") return {
        upsertUser: async () => ({ region: "EU", timeZone: "Europe/Paris" }),
        applyUserPreferences(user, saved) { user.profile = { ...user.profile, region: saved.region, timeZone: saved.timeZone }; },
        async saveUserPreferences(user, values) { if (failSave) throw new Error("Database unavailable"); writes.push({ id: user.id, ...values }); return values; },
      };
      if (name === "./_shared") return { decodeSession: () => authenticated ? session : null, parseCookies: () => ({}), publicUser, sessionCookie: "session", encodeSession: () => "signed-fixture", cookieHeader: () => "session=signed-fixture", clearCookieHeader: () => "" };
      throw Error(name);
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "api/auth/account.js"), "utf8"), context);
  return { handler: context.module.exports, writes };
}

function response() {
  return { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
}

test("account preferences accept all four regions without changing RSI verification", async () => {
  for (const region of ["USA", "EU", "AUS", "ASIA"]) {
    const api = accountHandler();
    const res = response();
    await api.handler({ method: "POST", body: { action: "save-preferences", region, timeZone: "Asia/Tokyo", userId: "discord:someone-else" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.user.profile.region, region);
    assert.equal(res.body.user.profile.timeZone, "Asia/Tokyo");
    assert.equal(res.body.user.profile.rsiStatus, "verified");
    assert.equal(api.writes[0].id, "discord:owner");
    assert.ok(res.headers["Set-Cookie"]);
  }
});

test("invalid regions, invalid timezones and unsigned requests cannot save preferences", async () => {
  for (const [authenticated, region, timeZone, expected] of [[true, "MARS", "UTC", 400], [true, "EU", "Mars/Olympus", 400], [false, "USA", "UTC", 401]]) {
    const api = accountHandler({ authenticated });
    const res = response();
    await api.handler({ method: "POST", body: { action: "save-preferences", region, timeZone } }, res);
    assert.equal(res.statusCode, expected);
    assert.equal(api.writes.length, 0);
    assert.equal(res.headers["Set-Cookie"], undefined);
  }
});

test("session checks restore saved preferences over stale cookie values", async () => {
  const api = accountHandler();
  const res = response();
  await api.handler({ method: "GET", url: "/api/auth/account" }, res);
  assert.equal(res.body.user.profile.region, "EU");
  assert.equal(res.body.user.profile.timeZone, "Europe/Paris");
});

test("a failed preference save returns an error and never reports a refreshed session", async () => {
  const api = accountHandler({ failSave: true });
  const res = response();
  await api.handler({ method: "POST", body: { action: "save-preferences", region: "USA", timeZone: "UTC" } }, res);
  assert.equal(res.statusCode, 500);
  assert.match(res.body.error, /Database unavailable/);
  assert.equal(res.headers["Set-Cookie"], undefined);
});

test("saved timezone supplies scheduling defaults without changing an existing search", () => {
  const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
  function fn(name) {
    const start = source.indexOf(`function ${name}(`);
    const end = source.slice(start + 1).search(/\n(?:async )?function /);
    return source.slice(start, start + 1 + end);
  }
  const fields = { startAt: { value: "" }, endAt: { value: "" }, timeZone: { value: "UTC" } };
  const context = { crewAvailability, Intl, authState: { user: { profile: { timeZone: "Asia/Tokyo" } } }, crewMarketForm: { elements: fields }, setTimeZoneSelection(select, value) { select.value = value; } };
  vm.createContext(context);
  vm.runInContext(fn("preferredTimeZone") + fn("applyPreferredTimeZoneToSearch"), context);
  assert.equal(context.preferredTimeZone(), "Asia/Tokyo");
  context.applyPreferredTimeZoneToSearch("UTC");
  assert.equal(fields.timeZone.value, "Asia/Tokyo");
  fields.startAt.value = "2026-11-21T10:00";
  fields.timeZone.value = "UTC";
  context.applyPreferredTimeZoneToSearch("UTC");
  assert.equal(fields.timeZone.value, "UTC");
});
