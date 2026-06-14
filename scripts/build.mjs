import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "dist");

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

for (const filename of ["index.html", "app.js", "styles.css"]) {
  await fs.copyFile(path.join(rootDir, filename), path.join(outputDir, filename));
}

await fs.cp(path.join(rootDir, "public"), outputDir, { recursive: true });

console.log("Built static app in dist");
