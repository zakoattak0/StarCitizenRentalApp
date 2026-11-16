const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const snapshot = JSON.parse(fs.readFileSync(path.join(root, "public/vehicles.json"), "utf8"));
const supplements = JSON.parse(fs.readFileSync(path.join(root, "scripts/vehicle-supplements.json"), "utf8")).vehicles;

function fn(name) {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0, name);
  const following = source.slice(start + 1).search(/\n(?:async )?function /);
  return following < 0 ? source.slice(start) : source.slice(start, start + 1 + following);
}

function browserContext(extra = {}) {
  const context = { console, AbortSignal, ...extra };
  vm.createContext(context);
  vm.runInContext(["normalizeShipName", "normalizeConfigShipName", "stripManufacturer", "escapeRegExp", "inferVehicleRole", "normalizeVehicle", "findVehicle"].map(fn).join("\n"), context);
  return context;
}

test("bundled catalog includes IAE launches and earlier releases with exterior coverage", async () => {
  const { mergeVehicleCatalogs } = await import("../public/vehicle-catalog.mjs");
  assert.equal(mergeVehicleCatalogs(snapshot.vehicles).length, snapshot.vehicles.length);
  const images = JSON.parse(fs.readFileSync(path.join(root, "public/ship-images.json"), "utf8")).ships;
  for (const name of ["Galaxy", "Liberator", "Skylark", "Marauder", "Hyūn", "Tyilui", "Salvation", "MOTH", "Constellation Mk V Centaurus"]) {
    const ship = snapshot.vehicles.find((row) => row.name === name);
    assert.ok(ship, name);
    assert.equal(Number(ship.is_concept), 0, name);
    assert.ok(images.find((image) => image.id === ship.id && image.status === "resolved"), name);
  }
  assert.ok(snapshot.vehicles.filter((row) => row.is_addon).length > 0, "Addons retained as reference data, excluded by browser loader");
});

test("UEX adoption of a supplemented ship preserves its real ID and updated specifications", async () => {
  const { mergeVehicleCatalogs } = await import("../public/vehicle-catalog.mjs");
  const live = { ...supplements.find((row) => row.slug === "hyun"), id: 999, name: "Hyun", slug: "gatac-hyun", scu: 40 };
  const rows = mergeVehicleCatalogs(snapshot.vehicles, [live], supplements);
  assert.equal(rows.length, snapshot.vehicles.length);
  const ship = rows.find((row) => row.id === 999);
  assert.equal(ship.scu, 40, "Unknown supplemental SCU cannot overwrite a known live value");
  assert.ok(ship.aliases.includes("Hyun"));
  assert.equal(rows.filter((row) => /hy[uū]n/i.test(row.name)).length, 1);
  const editions = mergeVehicleCatalogs([{ id: 1, name: "Edition", slug: "edition" }, { id: 2, name: "Edition", slug: "edition-two" }]);
  assert.equal(editions.length, 2, "Distinct UEX IDs must not collapse because they share a name");
});

test("Hyun aliases select the hybrid loadout and both mining and salvage remain searchable", () => {
  const context = browserContext({ ownerManufacturerSelect: { value: "" }, vehicleCatalog: [] });
  vm.runInContext(fn("getShipConfigurationType"), context);
  for (const name of ["Hyun", "Hyūn", "Gatac Hyun", "Gatac Manufacture Hyūn"]) assert.equal(context.getShipConfigurationType(name), "hybrid");
  const ship = context.normalizeVehicle(supplements.find((row) => row.slug === "hyun"));
  assert.equal(ship.role, "Mining / Salvage");
  context.vehicleCatalog.push(ship);
  for (const query of ["Hyun", "Hyūn", "Gatac Hyun", "wiki:hyun", "mining", "salvage"]) assert.equal(context.findVehicle(query)?.slug, "hyun", query);
});

test("offline UEX uses the complete bundled catalog without concepts or addon modules", async () => {
  const catalogModule = await import("../public/vehicle-catalog.mjs");
  const context = browserContext({ catalogModule, VEHICLE_CATALOG_URL: "/vehicles.json", UEX_VEHICLES_URL: "/uex", shipApiStatus: {}, vehicleCatalog: [],
    fetch: async (url) => { if (url === "/uex") throw new Error("Offline"); return { ok: true, json: async () => snapshot }; },
  });
  for (const name of ["enrichShipListings", "renderManufacturerOptions", "renderShipOptions", "renderFleet", "renderCalendar", "renderShipMarketplace", "renderCrewMarketplace", "renderMaterialRequests", "renderOwnerSchedule", "renderCalendarFilterOptions", "updateFilterSummary"]) context[name] = () => {};
  vm.runInContext(fn("readJson") + "\n" + fn("loadVehicles").replace('await import("/vehicle-catalog.mjs")', "catalogModule"), context);
  await context.loadVehicles();
  assert.ok(context.vehicleCatalog.length > 200);
  assert.ok(context.vehicleCatalog.find((row) => row.slug === "hyun"));
  assert.ok(context.vehicleCatalog.every((row) => !row.isConcept && !row.isAddon));
  assert.match(context.shipApiStatus.textContent, /saved ship catalog/);
});

test("hybrid equipment survives saving, editing and renter detail rendering", () => {
  const fields = source.slice(source.indexOf("const hybridLoadoutFields ="), source.indexOf("const miningHeads ="));
  const ownerForm = { elements: {} };
  const context = browserContext({ ownerForm });
  vm.runInContext(fields + ["getShipConfigurationType", "collectShipConfiguration", "applyShipConfiguration", "shipConfigurationLines", "configurationSummary", "escapeHtml"].map(fn).join("\n"), context);
  const values = {
    hybridMiningHeads: "Custom mining head x1", hybridMiningModules: "Module A, module B",
    hybridMiningAvailable: "Spare mining head x1", hybridSalvageHeads: "Custom scraper x1",
    hybridSalvageAvailable: "Spare scraper x2", hybridSwitchingNotes: "Switch at the hangar. <confirm with owner>",
  };
  for (const [field, value] of Object.entries(values)) ownerForm.elements[field] = { value: ` ${value} ` };
  const saved = JSON.parse(JSON.stringify(context.collectShipConfiguration({ name: "Hyūn" })));
  assert.equal(saved.type, "hybrid");
  assert.equal(saved.mining.heads, values.hybridMiningHeads);
  assert.equal(saved.salvage.heads, values.hybridSalvageHeads);
  for (const element of Object.values(ownerForm.elements)) element.value = "";
  context.applyShipConfiguration(saved);
  for (const [field, value] of Object.entries(values)) assert.equal(ownerForm.elements[field].value, value, field);
  assert.equal(context.shipConfigurationLines(saved).length, 6);
  const html = context.configurationSummary({ shipConfig: saved });
  assert.match(html, /Custom mining head x1/);
  assert.match(html, /Custom scraper x1/);
  assert.match(html, /&lt;confirm with owner&gt;/);
  assert.doesNotMatch(html, /<confirm with owner>/);
});
