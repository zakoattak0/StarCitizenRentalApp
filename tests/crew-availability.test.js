const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const availability = require("../public/crew-availability");
const HOUR = availability.HOUR;
const monday = Date.parse("2026-11-16T16:00:00Z");

test("24, 48 and 72 hour notice rolls forward for every new booking", () => {
  for (const noticeHours of [24, 48, 72]) {
    const a = { noticeHours, timeZone: "America/Chicago" };
    for (const now of [monday, monday + 24 * HOUR, monday + 48 * HOUR]) {
      assert.equal(availability.earliestStart(a, now), now + noticeHours * HOUR);
      assert.equal(availability.status(a, now), "Needs notice");
      assert.equal(availability.matches(a, new Date(now + (noticeHours - 1) * HOUR).toISOString(), null, now), false);
      assert.equal(availability.matches(a, new Date(now + noticeHours * HOUR).toISOString(), null, now), true);
    }
  }
});

test("Anytime, bounded dates, expired windows and notice all constrain availability", () => {
  assert.equal(availability.status({}, monday), "Available now");
  const a = { mode: "dates", timeZone: "UTC", noticeHours: 24, startAt: "2026-11-20T10:00:00Z", endAt: "2026-11-21T20:00:00Z" };
  assert.equal(availability.status(a, monday), "Scheduled");
  assert.equal(availability.earliestStart(a, monday), Date.parse(a.startAt), "Use later of date window and notice, not their sum");
  assert.equal(availability.matches(a, "2026-11-20T09:00:00Z", "2026-11-20T11:00:00Z", monday), false);
  assert.equal(availability.matches(a, a.startAt, a.endAt, monday), true);
  assert.equal(availability.matches(a, a.startAt, "2026-11-21T20:01:00Z", monday), false);
  assert.equal(availability.matches(a, a.endAt, null, monday), false);
  assert.equal(availability.status(a, Date.parse("2026-11-21T00:00:00Z")), "Unavailable");
  assert.throws(() => availability.normalize({ mode: "dates", startAt: a.endAt, endAt: a.startAt }), /end after/);
});

test("timezone input converts to UTC and back, including fractional offsets", () => {
  for (const [zone, expected] of [["America/Chicago", "2026-11-16T16:00:00.000Z"], ["Asia/Kathmandu", "2026-11-16T04:15:00.000Z"], ["Pacific/Auckland", "2026-11-15T21:00:00.000Z"]]) {
    assert.equal(availability.fromLocal("2026-11-16T10:00", zone), expected);
    assert.equal(availability.localInput(expected, zone), "2026-11-16T10:00");
  }
  assert.throws(() => availability.fromLocal("2026-02-30T10:00", "UTC"), /valid date/);
  assert.throws(() => availability.normalize({ timeZone: "Definitely/Not_A_Zone" }), /valid timezone/);
  assert.throws(() => availability.normalize({ noticeHours: 12 }), /24, 48 or 72/);
});

test("daylight-saving gaps are rejected and repeated times resolve consistently", () => {
  assert.throws(() => availability.fromLocal("2027-03-14T02:30", "America/Chicago"), /does not exist/);
  assert.equal(availability.fromLocal("2027-11-07T01:30", "America/Chicago"), "2027-11-07T06:30:00.000Z");
  const beforeSpring = Date.parse(availability.fromLocal("2027-03-13T10:00", "America/Chicago"));
  const nextStart = availability.earliestStart({ noticeHours: 24, timeZone: "America/Chicago" }, beforeSpring);
  assert.equal(nextStart - beforeSpring, 24 * HOUR, "Notice uses elapsed hours across clock changes");
  assert.equal(availability.localInput(nextStart, "America/Chicago"), "2027-03-14T11:00");
});

function apiHandler(file, rows, writes) {
  const user = { id: "discord:renter", discordId: "renter", username: "Renter" };
  const supabase = {
    checkRateLimit: async () => {}, requirePostingAccount: () => user, requireOwnedRow: async () => {},
    requestBody: (req) => req.body,
    sendJson(res, status, body) { res.statusCode = status; res.body = body; },
    sendError(res, error) { res.statusCode = error.statusCode || 500; res.body = { error: error.message }; },
    async supabaseRequest(url, options) {
      if (options.method === "GET") return rows;
      const body = JSON.parse(options.body);
      writes.push({ url, body });
      return [{ id: "saved", ...body }];
    },
  };
  const auth = { decodeSession: () => ({}), parseCookies: () => ({}), publicUser: () => user, sessionCookie: "session" };
  const context = { module: { exports: {} }, URL, Date, Map, Set, Error,
    require(name) {
      if (name === "./_supabase") return supabase;
      if (name === "./auth/_shared") return auth;
      if (name === "../public/crew-availability") return availability;
      throw new Error(name);
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "api", file), "utf8"), context);
  return context.module.exports;
}

test("crew API persists availability and timezone and defaults legacy records to Anytime", async () => {
  const writes = [];
  const handler = apiHandler("crew-listings.js", [{ id: "old", role: "Pilot" }], writes);
  const get = {};
  await handler({ method: "GET" }, get);
  assert.equal(get.body.listings[0].availability.mode, "anytime");
  const a = { mode: "anytime", noticeHours: 48, timeZone: "Europe/London" };
  const post = {};
  await handler({ method: "POST", body: { listing: { role: "Engineer", availability: a, price: 2000 } } }, post);
  assert.equal(post.statusCode, 200);
  assert.equal(writes[0].body.availability.noticeHours, 48);
  assert.equal(writes[0].body.availability.timeZone, "Europe/London");
  assert.equal(post.body.listing.availabilityStatus, "Needs notice");
  const invalid = {};
  await handler({ method: "POST", body: { listing: { role: "Gunner", availability: { noticeHours: 12 } } } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(writes.length, 1);
});

test("crew deal API rejects insufficient notice and keeps valid booking dates for both parties", async () => {
  const writes = [];
  const handler = apiHandler("deals.js", [{ id: "crew", owner_id: "discord:provider", provider_name: "Provider", role: "Pilot", availability: { noticeHours: 24, timeZone: "America/Chicago" } }], writes);
  const now = Date.now();
  const deal = { providerUserId: "discord:provider", listingId: "crew", listingType: "crew", dealType: "crew_service", scheduleTimeZone: "America/Chicago" };
  for (const lead of [23, 25]) {
    const response = {};
    await handler({ method: "POST", body: { action: "create", deal: { ...deal, scheduledStart: new Date(now + lead * HOUR).toISOString(), scheduledEnd: new Date(now + (lead + 2) * HOUR).toISOString() } } }, response);
    assert.equal(response.statusCode, lead === 23 ? 400 : 200);
    if (lead === 23) assert.match(response.body.error, /24 hours' notice/);
    else {
      assert.equal(response.body.deal.scheduledStart, new Date(now + 25 * HOUR).toISOString());
      assert.equal(response.body.deal.scheduleTimeZone, "America/Chicago");
    }
  }
  assert.equal(writes.length, 1, "Invalid requests never reach the deals insert");
  const missing = {};
  await handler({ method: "POST", body: { action: "create", deal } }, missing);
  assert.equal(missing.statusCode, 400);
  assert.equal(writes.length, 1);
});

test("crew booking requests cannot spoof a provider or bypass an expired date range", async () => {
  const writes = [];
  const now = Date.now();
  const handler = apiHandler("deals.js", [{ id: "crew", owner_id: "discord:provider", role: "Medic", availability: { mode: "dates", startAt: "2020-01-01T00:00:00Z", endAt: "2020-01-02T00:00:00Z" } }], writes);
  for (const providerUserId of ["discord:imposter", "discord:provider"]) {
    const response = {};
    await handler({ method: "POST", body: { action: "create", deal: { providerUserId, listingId: "crew", listingType: "crew", dealType: "crew_service", scheduledStart: new Date(now + HOUR).toISOString(), scheduledEnd: new Date(now + 2 * HOUR).toISOString(), scheduleTimeZone: "UTC" } } }, response);
    assert.equal(response.statusCode, 400);
  }
  assert.equal(writes.length, 0);
});

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
function browserFunction(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = app.slice(start + 1).search(/\n(?:async )?function /);
  return app.slice(start, end < 0 ? undefined : start + 1 + end);
}

test("posting dates and notice survive edit and collection for every crew role", () => {
  const names = ["role", "summary", "availabilityMode", "noticeHours", "timeZone", "availableFrom", "availableUntil"];
  const form = { elements: Object.fromEntries(names.map((name) => [name, { value: "" }])) };
  const context = { crewAvailability: availability, crewPostingForm: form, crewPostingName: {}, crewPostingPayType: {}, crewPostingPayValue: {}, crewPostingTitle: {}, crewPostingSubmitButton: {},
    authState: { user: {} }, updateCrewPostingPayUI() {}, preferredDisplayName: () => "Provider", formatCreditInputValue: String,
  };
  vm.createContext(context);
  vm.runInContext(browserFunction("populateCrewPostingForm") + browserFunction("collectCrewPostingAvailability"), context);
  for (const role of ["Pilot", "Gunner", "Engineer", "Box Jockey", "FPS Ground Team", "Medic"]) {
    const a = availability.normalize({ mode: "dates", noticeHours: 72, timeZone: "America/Chicago", startAt: "2026-11-20T16:00:00Z", endAt: "2026-11-22T16:00:00Z" });
    context.populateCrewPostingForm({ id: "crew", name: "Provider", role, availability: a });
    assert.equal(form.elements.role.value, role);
    assert.equal(form.elements.availableFrom.value, "2026-11-20T10:00");
    assert.deepEqual(JSON.parse(JSON.stringify(context.collectCrewPostingAvailability())), a);
  }
});

test("crew availability filters distinguish Anytime, available now and rolling notice", () => {
  const context = { crewAvailability: availability };
  vm.createContext(context);
  vm.runInContext(browserFunction("matchesCrewAvailabilityFilter"), context);
  const crew = { availability: { mode: "anytime", noticeHours: 24, timeZone: "America/Chicago" } };
  assert.equal(context.matchesCrewAvailabilityFilter(crew, "Anytime", "America/Chicago", monday), true);
  assert.equal(context.matchesCrewAvailabilityFilter(crew, "Available now", "America/Chicago", monday), false);
  assert.equal(context.matchesCrewAvailabilityFilter(crew, "Available today", "America/Chicago", monday), false);
  assert.equal(context.matchesCrewAvailabilityFilter(crew, "Needs notice", "America/Chicago", monday), true);
});

test("request form converts the selected timezone and checks the requested duration", () => {
  const start = Date.now() + 80 * HOUR;
  const a = { mode: "dates", noticeHours: 72, timeZone: "Asia/Kathmandu", startAt: new Date(start).toISOString(), endAt: new Date(start + 12 * HOUR).toISOString() };
  const fields = { timeZone: { value: "Asia/Kathmandu" }, startAt: { value: availability.localInput(start + HOUR, a.timeZone) }, endAt: { value: availability.localInput(start + 2 * HOUR, a.timeZone) } };
  const context = { crewAvailability: availability, pendingCrewRequest: { crew: { availability: a } }, crewRequestForm: { elements: fields } };
  vm.createContext(context);
  vm.runInContext(browserFunction("collectCrewRequestSchedule"), context);
  const schedule = context.collectCrewRequestSchedule();
  assert.equal(schedule.scheduleTimeZone, "Asia/Kathmandu");
  assert.equal(availability.localInput(schedule.scheduledStart, a.timeZone), fields.startAt.value);
  fields.endAt.value = availability.localInput(start + 13 * HOUR, a.timeZone);
  assert.throws(() => context.collectCrewRequestSchedule(), /outside/);
});
