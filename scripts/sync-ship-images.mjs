import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import pLimit from "p-limit";
import sharp from "sharp";
import { decodeHtml, selectWikiShipImage, wikiImageCandidates } from "./lib/wiki-ship-images.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = path.join(root, ".cache", "ship-images");
const shipsDir = path.join(root, "public", "ships");
const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const auditOnly = args.has("--audit-only");
const userAgent = "FSX-ShipImageSync/1.0 (Star Citizen fan marketplace; exterior image validation)";
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const concurrency = Math.min(6, Math.max(1, Number(limitArg?.split("=")[1]) || 3));
const limit = pLimit(concurrency);
const overrides = JSON.parse(await fs.readFile(path.join(root, "scripts", "ship-image-overrides.json"), "utf8"));

await fs.mkdir(cacheDir, { recursive: true });
await fs.mkdir(shipsDir, { recursive: true });
const vehicles = (await cachedJson("https://api.uexcorp.uk/2.0/vehicles", "vehicles.json")).data;
if (!Array.isArray(vehicles) || !vehicles.length) throw new Error("UEX returned no vehicles");
const oldMetadata = JSON.parse(await fs.readFile(path.join(root, "src", "data", "ships.json"), "utf8"));
let previousImages = [];
try { previousImages = JSON.parse(await fs.readFile(path.join(root, "public", "ship-images.json"), "utf8")).ships; } catch { /* First sync has no manifest. */ }
console.log(`Validating wiki exterior images for ${vehicles.length} catalog entries`);
let done = 0;
const records = await Promise.all(vehicles.map((vehicle) => limit(async () => {
  const override = overrides[String(vehicle.id)] || {};
  const title = override.title || decodeHtml(vehicle.name);
  const record = {
    id: vehicle.id, name: decodeHtml(vehicle.name), nameFull: decodeHtml(vehicle.name_full || vehicle.name),
    slug: vehicle.slug, aliases: [...new Set([
      ...oldMetadata.filter((old) => old.id === vehicle.id).flatMap((old) => [old.name, old.name_full, old.slug]),
      ...(previousImages.find((old) => old.id === vehicle.id)?.aliases || []),
    ].filter(Boolean))],
    wikiPage: `https://starcitizen.tools/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
    isConcept: Boolean(Number(vehicle.is_concept)), isAddon: Boolean(Number(vehicle.is_addon)),
  };
  if (record.isAddon) return { ...record, status: "not-a-vehicle", image: null };
  try {
    const html = await cachedText(record.wikiPage, `page-${hash(title).slice(0, 20)}.html`);
    let selected = override.file ? wikiImageCandidates(html).find((image) => image.file === override.file) : selectWikiShipImage(html);
    if (override.file && !selected) {
      const data = await cachedJson(`https://starcitizen.tools/api.php?${new URLSearchParams({ action: "query", titles: `File:${override.file}`, prop: "imageinfo", iiprop: "url", format: "json" })}`, `file-${hash(override.file).slice(0, 20)}.json`);
      const page = Object.values(data.query?.pages || {})[0];
      if (page?.imageinfo?.[0]?.url) selected = { file: override.file, url: page.imageinfo[0].url };
    }
    if (override.file && selected) selected = { ...selected, kind: override.kind || "isometric" };
    if (!selected) return { ...record, status: "missing-wiki-image", image: null };
    if (!/^https:\/\/media\.starcitizen\.tools\//.test(selected.url)) throw new Error("Unexpected wiki media host");
    return { ...record, status: "resolved", image: `/ships/${vehicle.slug}.webp`, kind: selected.kind, sourceFile: selected.file, sourceUrl: selected.url, filePage: `https://starcitizen.tools/File:${encodeURIComponent(selected.file.replaceAll(" ", "_"))}` };
  } catch (error) {
    return { ...record, status: "wiki-request-failed", image: null, error: error.message };
  } finally {
    done += 1;
    if (done % 25 === 0) console.log(`Wiki pages checked: ${done}`);
  }
})));
await fs.writeFile(path.join(cacheDir, "audit.json"), JSON.stringify(records, null, 2) + "\n");
printSummary(records);
if (auditOnly) process.exit(records.some((record) => record.status === "wiki-request-failed") ? 1 : 0);
if (records.some((record) => !["resolved", "not-a-vehicle"].includes(record.status))) {
  throw new Error("Some vehicles have no verified wiki exterior; resolve the audit before publishing");
}

const downloadCache = new Map();
let downloaded = 0;
await Promise.all(records.filter((record) => record.status === "resolved").map((record) => limit(async () => {
  try {
    let job = downloadCache.get(record.sourceUrl);
    if (!job) { job = downloadImage(record.sourceUrl); downloadCache.set(record.sourceUrl, job); }
    const buffer = await job;
    await fs.writeFile(path.join(root, "public", record.image.slice(1)), buffer);
    record.sha256 = hash(buffer);
    downloaded += 1;
    if (downloaded % 25 === 0) console.log(`Exterior images saved: ${downloaded}`);
  } catch (error) {
    record.status = "download-failed";
    record.image = null;
    record.error = error.message;
  }
})));
await fs.writeFile(path.join(cacheDir, "audit.json"), JSON.stringify(records, null, 2) + "\n");
if (records.some((record) => ["wiki-request-failed", "download-failed"].includes(record.status))) {
  printSummary(records);
  throw new Error("Image validation failed; inspect .cache/ship-images/audit.json before publishing");
}
const manifest = { source: "Star Citizen Wiki", sourceUrl: "https://starcitizen.tools/", checkedAt: new Date().toISOString(), ships: records };
await fs.writeFile(path.join(root, "public", "ship-images.json"), JSON.stringify(manifest, null, 2) + "\n");
await fs.writeFile(path.join(root, "src", "data", "ships.json"), JSON.stringify(vehicles.map((vehicle) => ({
  id: vehicle.id, name: vehicle.name, name_full: vehicle.name_full, slug: vehicle.slug, company_name: vehicle.company_name,
  is_spaceship: Number(vehicle.is_spaceship), is_ground_vehicle: Number(vehicle.is_ground_vehicle), is_concept: Number(vehicle.is_concept),
  game_version: vehicle.game_version, image: records.find((record) => record.id === vehicle.id)?.image || null,
})), null, 2) + "\n");
const usedFiles = new Set(records.filter((record) => record.image).map((record) => path.basename(record.image)));
for (const entry of await fs.readdir(shipsDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".webp") || usedFiles.has(entry.name)) continue;
  const obsolete = path.resolve(shipsDir, entry.name);
  if (path.dirname(obsolete) !== shipsDir) throw new Error("Image cleanup escaped the ship asset directory");
  await fs.unlink(obsolete);
}
printSummary(records);

function hash(value) { return createHash("sha256").update(value).digest("hex"); }

async function request(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(45000) });
    if (response.ok) return response;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) throw new Error(`HTTP ${response.status}: ${url}`);
    await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
  }
}

async function cachedText(url, filename) {
  const target = path.join(cacheDir, filename);
  if (!force) {
    try { const stat = await fs.stat(target); if (Date.now() - stat.mtimeMs < 86400000) return await fs.readFile(target, "utf8"); } catch { /* Fetch uncached pages. */ }
  }
  const text = await (await request(url)).text();
  await fs.writeFile(target, text);
  return text;
}

async function cachedJson(url, filename) { return JSON.parse(await cachedText(url, filename)); }

async function downloadImage(url) {
  const source = new URL(url);
  const imagePath = source.pathname.slice(1);
  const filename = imagePath.split("/").at(-1);
  const preview = `https://media.starcitizen.tools/thumb/${imagePath}/640px-${filename}.webp${source.search}`;
  const cacheFile = path.join(cacheDir, `image-${hash(url)}.webp`);
  if (!force) {
    try { const cached = await fs.readFile(cacheFile); await sharp(cached).metadata(); return cached; } catch { /* Re-fetch missing or invalid cache. */ }
  }
  let response;
  try { response = await request(preview); } catch { response = await request(url); }
  const buffer = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || metadata.width < 200 || !metadata.height || metadata.height < 100) throw new Error("Wiki image is too small or invalid");
  const output = await sharp(buffer).resize({ width: 640, height: 360, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  await fs.writeFile(cacheFile, output);
  return output;
}

function printSummary(rows) {
  console.log(JSON.stringify(rows.reduce((stats, row) => { const key = row.status === "resolved" ? row.kind : row.status; stats[key] = (stats[key] || 0) + 1; return stats; }, {})));
  const missing = rows.filter((row) => !["resolved", "not-a-vehicle"].includes(row.status));
  if (missing.length) console.log("Needs review: " + missing.map((row) => `${row.id} ${row.name} (${row.status})`).join(", "));
}
