const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const quality = require("../public/material-quality");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function fn(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.slice(start + 1).search(/\n(?:async )?function /);
  return source.slice(start, end < 0 ? undefined : start + 1 + end);
}

function controls() {
  const names = ["qualityMin", "qualityMax", "qualityMinSlider", "qualityMaxSlider", "quality"];
  const inputs = Object.fromEntries(names.map((name) => [name, {
    value: name.includes("Max") ? "1000" : "0", style: {}, attributes: {},
    setCustomValidity(value) { this.error = value; }, setAttribute(key, value) { this.attributes[key] = value; },
  }]));
  const error = { textContent: "", classList: { toggle(name, hidden) { this.hidden = hidden; } } };
  const selection = { style: {} };
  const row = { querySelector(selector) {
    if (selector === ".quality-range-error") return error;
    if (selector === ".quality-range-selection") return selection;
    return inputs[selector.match(/name='(\w+)'/)[1]];
  } };
  const context = { materialQuality: quality, updateMaterialPriceHint() {} };
  vm.createContext(context);
  vm.runInContext(fn("setMaterialQualityControls") + fn("syncMaterialQualityControls"), context);
  context.setMaterialQualityControls(row, { qualityMin: 0, qualityMax: 1000 });
  return { context, inputs, error, selection, row };
}

test("quality reads legacy minimums, exact values, ranges and unrestricted values", () => {
  for (const [input, expected] of [["735+", { min: 735, max: 1000 }], ["735", { min: 735, max: 735 }], ["735–900", { min: 735, max: 900 }], ["0", { min: 0, max: 0 }], ["Any", { min: 0, max: 1000 }], ["", { min: 0, max: 1000 }]]) {
    assert.deepEqual(quality.read(input), expected);
  }
  assert.deepEqual(quality.read({ qualityMin: 0, qualityMax: 900 }), { min: 0, max: 900 });
  for (const bounds of [[-1, 1000], [0, 1001], [900, 800], [1.5, 900], ["", 900]]) assert.throws(() => quality.bounds(...bounds));
});

test("typing min and max updates both slider handles and the saved range", () => {
  const { context, inputs, row, selection } = controls();
  inputs.qualityMin.value = "735";
  context.syncMaterialQualityControls(row, inputs.qualityMin);
  inputs.qualityMax.value = "900";
  context.syncMaterialQualityControls(row, inputs.qualityMax);
  assert.equal(inputs.qualityMinSlider.value, "735");
  assert.equal(inputs.qualityMaxSlider.value, "900");
  assert.equal(inputs.quality.value, "735–900");
  assert.equal(selection.style.left, "73.5%");
  assert.equal(selection.style.width, "16.5%");
});

test("clearing and retyping max preserves partial input instead of snapping it back", () => {
  const { context, inputs, row, error } = controls();
  context.setMaterialQualityControls(row, { qualityMin: 735, qualityMax: 1000 });
  for (const prefix of ["", "9", "90", "900"]) {
    inputs.qualityMax.value = prefix;
    context.syncMaterialQualityControls(row, inputs.qualityMax);
    assert.equal(inputs.qualityMax.value, prefix);
    if (prefix !== "900") assert.ok(inputs.qualityMin.error, "Invalid intermediate ranges cannot be submitted");
  }
  assert.equal(inputs.quality.value, "735–900");
  assert.equal(inputs.qualityMin.error, "");
  assert.equal(error.classList.hidden, true);
});

test("moving either handle updates number boxes and prevents the handles crossing", () => {
  const { context, inputs, row } = controls();
  inputs.qualityMinSlider.value = "400";
  context.syncMaterialQualityControls(row, inputs.qualityMinSlider);
  inputs.qualityMaxSlider.value = "800";
  context.syncMaterialQualityControls(row, inputs.qualityMaxSlider);
  assert.equal(inputs.qualityMin.value, "400");
  assert.equal(inputs.qualityMax.value, "800");
  inputs.qualityMinSlider.value = "900";
  context.syncMaterialQualityControls(row, inputs.qualityMinSlider);
  assert.equal(inputs.qualityMin.value, "800");
  inputs.qualityMaxSlider.value = "500";
  context.syncMaterialQualityControls(row, inputs.qualityMaxSlider);
  assert.equal(inputs.qualityMax.value, "800");
});

test("editing saved ranges and legacy minimums restores all controls independently per row", () => {
  const first = controls();
  const second = controls();
  first.context.setMaterialQualityControls(first.row, { quality: "735+" });
  second.context.setMaterialQualityControls(second.row, { qualityMin: 1000, qualityMax: 1000 });
  assert.equal(first.inputs.qualityMin.value, "735");
  assert.equal(first.inputs.qualityMaxSlider.value, "1000");
  assert.equal(second.inputs.quality.value, "1000");
  assert.equal(second.inputs.qualityMinSlider.style.zIndex, "4", "Lower handle remains accessible when both endpoints equal 1000");
});

test("quality filters match ranges that contain the requested quality; broad ranges do not fake a price band", () => {
  const context = { materialQuality: quality };
  vm.createContext(context);
  vm.runInContext(fn("materialItemMatchesFilters") + fn("materialQualityBucket"), context);
  const filters = { material: "", minQuality: 900, maxPrice: Infinity };
  assert.equal(context.materialItemMatchesFilters({}, { qualityMin: 850, qualityMax: 950 }, filters), true);
  assert.equal(context.materialItemMatchesFilters({}, { quality: "735" }, filters), false);
  assert.equal(context.materialQualityBucket("0–1000"), null);
  assert.equal(context.materialQualityBucket("735–900"), null);
  assert.equal(context.materialQualityBucket("750–799"), 750);
  assert.equal(context.materialQualityBucket("0"), 0);
});

test("material API saves numeric quality bounds and rejects invalid ranges without writing", async () => {
  const writes = [];
  const context = { module: { exports: {} }, URL, Error,
    require(name) {
      if (name === "../public/material-quality") return quality;
      if (name === "./_supabase") return {
        requirePostingAccount: () => ({ id: "discord:provider" }), checkRateLimit: async () => {}, requireOwnedRow: async () => {},
        requestBody: (req) => req.body, sendJson(res, status, body) { res.statusCode = status; res.body = body; },
        sendError(res, error) { res.statusCode = 500; res.body = { error: error.message }; },
        async supabaseRequest(url, options) { const row = JSON.parse(options.body); writes.push(row); return [{ id: "saved", ...row }]; },
      };
      throw Error(name);
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "api/material-requests.js"), "utf8"), context);
  for (const [min, max, expected] of [[735, 900, 200], [0, 1000, 200], [900, 800, 400], [0, 1001, 400]]) {
    const res = {};
    await context.module.exports({ method: "POST", body: { request: { materials: [{ material: "Atlasium", quantity: 10, qualityMin: min, qualityMax: max }] } } }, res);
    assert.equal(res.statusCode, expected);
    if (expected === 200) {
      const item = res.body.request.materials[0];
      assert.equal(item.qualityMin, min);
      assert.equal(item.qualityMax, max);
      assert.equal(item.quality, quality.label({ min, max }));
    }
  }
  assert.equal(writes.length, 2);
});
