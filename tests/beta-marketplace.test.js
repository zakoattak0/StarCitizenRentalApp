const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
// Exercise the actual browser data loaders without booting unrelated DOM code.
const loaders = source.slice(source.indexOf("async function readJson("), source.indexOf("async function loadRatingStats("));

function createLoaderContext(fetch) {
  const context = {
    fetch,
    SHIP_LISTINGS_URL: "/ships", CREW_LISTINGS_URL: "/crew", MATERIAL_REQUESTS_URL: "/materials", DEALS_URL: "/deals",
    ships: [], crewListings: [], materialRequests: [], deals: [], authState: { user: { id: "discord:beta-reviewer" } },
    dataStatus: Object.fromEntries(["shipListings", "crewListings", "materialRequests", "deals"].map((name) => [name, { loading: false, error: "" }])),
    replaceCollection(target, rows) { target.splice(0, target.length, ...(rows || [])); },
  };
  for (const render of ["renderFleet", "renderShipMarketplace", "enrichShipListings", "renderCalendar", "renderOwnerSchedule", "renderCalendarFilterOptions", "updateFilterSummary", "renderAccountPanel", "renderPlayerSearch", "renderCrewMarketplace", "renderAccountServices", "renderAccountListings", "renderMaterialRequests", "updateMaterialPriceHints", "renderAccountDeals"]) context[render] = () => {};
  vm.createContext(context);
  vm.runInContext(loaders, context);
  return context;
}

async function loadAll(context) {
  await context.loadShipListings();
  await context.loadCrewListings();
  await context.loadMaterialRequests();
  await context.loadDeals();
}

test("empty backend responses stay empty across all marketplaces and deals", async () => {
  const context = createLoaderContext(async () => ({ ok: true, json: async () => ({ listings: [], requests: [], deals: [] }) }));
  await loadAll(context);
  for (const key of ["ships", "crewListings", "materialRequests", "deals"]) assert.equal(context[key].length, 0, key);
  for (const status of Object.values(context.dataStatus)) { assert.equal(status.loading, false); assert.equal(status.error, ""); }
});

test("backend failures remain visible and never create local listings or deals", async () => {
  const context = createLoaderContext(async () => { throw new Error("Backend unavailable"); });
  await loadAll(context);
  for (const key of ["ships", "crewListings", "materialRequests", "deals"]) assert.equal(context[key].length, 0, key);
  for (const status of Object.values(context.dataStatus)) { assert.equal(status.loading, false); assert.ok(status.error, "A failed request must retain an error for the UI"); }
});

test("real backend records load without additional injected entries", async () => {
  const record = { id: "saved-listing", ownerId: "discord:provider", ship: "C2 Hercules Starlifter", role: "Pilot" };
  const context = createLoaderContext(async () => ({ ok: true, json: async () => ({ listings: [record], requests: [record], deals: [record] }) }));
  await loadAll(context);
  for (const key of ["ships", "crewListings", "materialRequests", "deals"]) { assert.equal(context[key].length, 1, key); assert.equal(context[key][0].id, record.id); }
});

test("beta pages do not include simulated players or unfinished actions", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.doesNotMatch(source, /FAKE DEMO|TEST PLAYER|test-john-doe|test_accept|test_provider_complete|demoOnlyButton|createLocalTestDeal/);
  assert.doesNotMatch(html, /Test players|generate-request-button|calendar-mode/);
  assert.doesNotMatch(source, /disabled>Pause<\/button>/);
});
