import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import sharp from "sharp";

const vehiclesUrl = "https://api.uexcorp.uk/2.0/vehicles";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const shipsDir = path.join(rootDir, "public", "ships");
const dataDir = path.join(rootDir, "src", "data");
const shipsJsonPath = path.join(dataDir, "ships.json");

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const concurrency = getNumberArg("--limit", 6);
const limit = pLimit(concurrency);

const stats = {
  downloaded: 0,
  skipped: 0,
  failed: 0,
  noPhoto: 0,
};

await main();

async function main() {
  console.log("Syncing Star Citizen ship images from UEX");
  console.log(`Source: ${vehiclesUrl}`);
  console.log(`Mode: ${force ? "force redownload" : "skip existing files"}`);
  console.log(`Concurrency: ${concurrency}`);

  await fs.mkdir(shipsDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });

  const vehicles = await fetchVehicles();
  console.log(`Vehicles returned: ${vehicles.length.toLocaleString()}`);

  const metadata = vehicles.map(toShipRecord);
  await fs.writeFile(shipsJsonPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  console.log(`Wrote metadata: ${path.relative(rootDir, shipsJsonPath)}`);

  const jobs = vehicles
    .filter((vehicle) => {
      if (!vehicle.url_photo) {
        stats.noPhoto += 1;
        return false;
      }

      if (!vehicle.slug) {
        stats.failed += 1;
        console.warn(`Failed: vehicle ${vehicle.id ?? "unknown"} has url_photo but no slug`);
        return false;
      }

      return true;
    })
    .map((vehicle) => limit(() => syncVehicleImage(vehicle)));

  await Promise.all(jobs);

  console.log("");
  console.log("Ship image sync complete");
  console.log(`Downloaded: ${stats.downloaded.toLocaleString()}`);
  console.log(`Skipped:    ${stats.skipped.toLocaleString()}`);
  console.log(`No photo:   ${stats.noPhoto.toLocaleString()}`);
  console.log(`Failed:     ${stats.failed.toLocaleString()}`);

  if (stats.failed > 0) {
    process.exitCode = 1;
  }
}

async function fetchVehicles() {
  const response = await fetch(vehiclesUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "StantonShipRentals",
    },
  });

  if (!response.ok) {
    throw new Error(`UEX vehicles request failed with ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.data)) {
    throw new Error("UEX vehicles response did not include a data array");
  }

  return payload.data;
}

async function syncVehicleImage(vehicle) {
  const filename = `${vehicle.slug}.webp`;
  const outputPath = path.join(shipsDir, filename);
  const displayName = vehicle.name_full || vehicle.name || vehicle.slug;

  if (!force && (await fileExists(outputPath))) {
    stats.skipped += 1;
    console.log(`Skipped: ${displayName}`);
    return;
  }

  try {
    const imageResponse = await fetch(vehicle.url_photo, {
      headers: {
        Accept: "image/*",
        "User-Agent": "StantonShipRentals",
      },
    });

    if (!imageResponse.ok) {
      throw new Error(`image request failed with ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const webpBuffer = await sharp(imageBuffer)
      .resize({ width: 640, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    await fs.writeFile(outputPath, webpBuffer);
    stats.downloaded += 1;
    console.log(`Downloaded: ${displayName}`);
  } catch (error) {
    stats.failed += 1;
    console.warn(`Failed: ${displayName} - ${error.message}`);
  }
}

function toShipRecord(vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name ?? "",
    name_full: vehicle.name_full ?? "",
    slug: vehicle.slug ?? "",
    company_name: vehicle.company_name ?? "",
    is_spaceship: Number(vehicle.is_spaceship ?? 0),
    is_ground_vehicle: Number(vehicle.is_ground_vehicle ?? 0),
    is_concept: Number(vehicle.is_concept ?? 0),
    game_version: vehicle.game_version ?? "",
    image: vehicle.url_photo && vehicle.slug ? `/ships/${vehicle.slug}.webp` : null,
  };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getNumberArg(name, fallback) {
  const rawArgs = process.argv.slice(2);
  const equalsArg = rawArgs.find((arg) => arg.startsWith(`${name}=`));
  if (equalsArg) {
    const value = Number(equalsArg.split("=")[1]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  const index = rawArgs.indexOf(name);
  if (index >= 0) {
    const value = Number(rawArgs[index + 1]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  return fallback;
}
