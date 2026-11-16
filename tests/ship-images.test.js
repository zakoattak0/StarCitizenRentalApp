const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const sharp = require("sharp");
const root = path.resolve(__dirname, "..");

function image(file, hash = "a/ab") {
  return `<figure><a href="/File:${file}" class="mw-file-description"><img /></a><a href="https://media.starcitizen.tools/${hash}/${file}" class="mw-file-source"></a></figure>`;
}

test("wiki selector uses the default exterior profile before paint and interior galleries", async () => {
  const { selectWikiShipImage } = await import("../scripts/lib/wiki-ship-images.mjs");
  const html = image("Cockpit.jpg") + '<h3 id="Ship_profile">Ship profile</h3>' + image("C2_in_space_-_Isometric.jpg") +
    '<h4 id="Interior">Interior</h4>' + image("Interior_Isometric.jpg") + '<h3 id="Paints">Paints</h3>' + image("Other_ship_Isometric.jpg");
  assert.equal(selectWikiShipImage(html).file, "C2 in space - Isometric.jpg");
  assert.equal(selectWikiShipImage(html).kind, "isometric");
});

test("wiki selector falls back to a landed isometric when the in-space profile is empty", async () => {
  const { selectWikiShipImage } = await import("../scripts/lib/wiki-ship-images.mjs");
  const html = '<h3 id="Ship_profile">Ship profile</h3><h4 id="Exterior">Exterior</h4><table><th>Isometric</th><td></td></table>' + image("Ship_landed_-_Isometric.jpg");
  assert.equal(selectWikiShipImage(html).file, "Ship landed - Isometric.jpg");
});

test("wiki selector rejects interior and placeholder infobox images", async () => {
  const { selectWikiShipImage } = await import("../scripts/lib/wiki-ship-images.mjs");
  for (const name of ["Cockpit.jpg", "Ship_interior.jpg", "Placeholderv2.png"]) {
    assert.equal(selectWikiShipImage(image(name) + '<div class="t-infobox-header-content"></div>'), null);
  }
});

test("wiki selector prefers an exterior photo over an isometric blueprint", async () => {
  const { selectWikiShipImage } = await import("../scripts/lib/wiki-ship-images.mjs");
  const html = image("Vulcan_flying.jpg") + '<div class="t-infobox-header-content"></div><h3 id="Ship_profile">Ship profile</h3>' + image("Vulcan_-_schematic_-_Isometric.png");
  assert.equal(selectWikiShipImage(html).file, "Vulcan flying.jpg");
  assert.equal(selectWikiShipImage(html).kind, "exterior-fallback");
});

test("wiki selector rejects cutaways even when their filenames say isometric", async () => {
  const { selectWikiShipImage } = await import("../scripts/lib/wiki-ship-images.mjs");
  for (const file of ["Ironclad cutout with black BG - Isometric.jpg", "Ship cutaway Isometric.png", "Ship cross-section Isometric.jpg"]) {
    const html = image("Ship_landed_in_hangar.jpg") + '<div class="t-infobox-header-content"></div><h3 id="Ship_profile">Ship profile</h3>' + image(file);
    assert.equal(selectWikiShipImage(html).file, "Ship landed in hangar.jpg");
  }
});

test("both Ironclad variants use their own intact exterior views", async () => {
  const { ships } = JSON.parse(await fs.readFile(path.join(root, "public", "ship-images.json"), "utf8"));
  for (const [id, file] of [[230, "Ironclad landed in hangar - Cropped.png"], [231, "Ironclad Assault landed in hangar - Cropped.png"]]) {
    assert.equal(ships.find((ship) => ship.id === id).sourceFile, file);
  }
  assert.notEqual(ships.find((ship) => ship.id === 230).sha256, ships.find((ship) => ship.id === 231).sha256);
});

test("every vehicle has a decoded local exterior image with matching provenance", async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "public", "ship-images.json"), "utf8"));
  const catalog = JSON.parse(await fs.readFile(path.join(root, "src", "data", "ships.json"), "utf8"));
  assert.equal(manifest.ships.length, catalog.length);
  for (const record of manifest.ships) {
    if (record.isAddon) { assert.equal(record.image, null); continue; }
    assert.equal(record.status, "resolved", record.name);
    assert.match(record.image, /^\/ships\/[^/]+\.webp$/);
    assert.match(record.sourceUrl, /^https:\/\/media\.starcitizen\.tools\//);
    assert.match(record.filePage, /^https:\/\/starcitizen\.tools\/File:/);
    assert.ok(["isometric", "exterior-fallback"].includes(record.kind));
    const buffer = await fs.readFile(path.join(root, "public", record.image.slice(1)));
    assert.equal(createHash("sha256").update(buffer).digest("hex"), record.sha256, record.name);
    const metadata = await sharp(buffer).metadata();
    assert.ok(metadata.width >= 200 && metadata.height >= 100, record.name);
    assert.equal(catalog.find((ship) => ship.id === record.id).image, record.image);
  }
});

test("MOLE special editions retain their own exterior paint images", async () => {
  const { ships } = JSON.parse(await fs.readFile(path.join(root, "public", "ship-images.json"), "utf8"));
  assert.match(ships.find((ship) => ship.id === 123).sourceFile, /Mole Carbon.*Isometric/);
  assert.match(ships.find((ship) => ship.id === 124).sourceFile, /Mole Talus.*Isometric/);
  assert.notEqual(ships.find((ship) => ship.id === 122).sha256, ships.find((ship) => ship.id === 123).sha256);
});
