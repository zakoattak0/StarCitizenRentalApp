const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// Vercel's Hobby plan caps a deployment at 12 serverless functions. Every
// .js file directly under api/ (including subdirectories) that does NOT
// start with an underscore becomes one function. A deploy that crosses this
// silently fails ("No more than 12 Serverless Functions...") while the site
// keeps serving whatever the last successful deploy was - see CLAUDE.md's
// "Known issues" for the incident this test exists to prevent.
const VERCEL_HOBBY_FUNCTION_LIMIT = 12;

function listApiRouteFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listApiRouteFiles(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.startsWith("_")) {
      return [fullPath];
    }
    return [];
  });
}

test("stays under Vercel's Hobby-plan serverless function limit", () => {
  const apiDir = path.join(__dirname, "..", "api");
  const routeFiles = listApiRouteFiles(apiDir);

  assert.ok(
    routeFiles.length <= VERCEL_HOBBY_FUNCTION_LIMIT,
    `Found ${routeFiles.length} api/*.js route files (limit ${VERCEL_HOBBY_FUNCTION_LIMIT}): ` +
      `${routeFiles.map((f) => path.relative(apiDir, f)).join(", ")}. ` +
      `Consolidate a route into an existing file (dispatch by method/?action=/?type=) instead of ` +
      `adding a new top-level file, or the next deploy will fail.`,
  );
});
