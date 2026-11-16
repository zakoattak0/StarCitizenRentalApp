const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
function fn(name) {
  const start = source.indexOf(`function ${name}(`);
  const following = source.slice(start + 1).search(/\n(?:async )?function /);
  assert.ok(start >= 0, name);
  return following < 0 ? source.slice(start) : source.slice(start, start + 1 + following);
}

function field(value = "") {
  return { value, selectionStart: null, setSelectionRange(start) { this.selectionStart = start; } };
}

// Native ranges clamp on assignment, including when loading saved adjustments.
function range() {
  let value = "0";
  return { min: "-100", max: "100", disabled: false,
    get value() { return value; },
    set value(next) { value = String(Math.min(Number(this.max), Math.max(Number(this.min), Number(next)))); },
  };
}

function calculator(basePeriod = "day", baseRate = "500,000") {
  const periods = ["hour", "day", "week"];
  const rows = Object.fromEntries(periods.map((period) => [period, { classList: { toggle() {} }, label: {} }]));
  for (const row of Object.values(rows)) row.querySelector = () => row.label;
  const context = {
    rateBasePeriodSelect: { value: basePeriod }, rateBaseInput: field(baseRate), rateFormula: {},
    rateInputs: Object.fromEntries(periods.map((period) => [period, field()])),
    rateOfferInputs: Object.fromEntries(periods.map((period) => [period, { checked: true }])),
    rateAdjustmentInputs: Object.fromEntries(periods.map((period) => [period, range()])),
    rateError: { classList: { add() {} } }, updateHangarFeeSummary() {},
    document: { querySelector: (selector) => rows[selector.match(/data-rate-period="(\w+)"/)[1]] },
  };
  vm.createContext(context);
  vm.runInContext(["parseCredits", "formatCreditInput", "formatCreditInputValue", "formatCredits", "updateRateCalculator", "syncManualRateInput", "setRateAdjustment", "calculateRates", "getRateAdjustments", "convertPeriodRate", "ratePeriodLabel", "formatAdjustment"].map(fn).join("\n"), context);
  context.updateRateCalculator();
  return context;
}

test("typing a weekly price digit by digit preserves every prefix and moves the slider", () => {
  const c = calculator();
  for (const digits of ["9", "90", "900", "9000", "90000", "900000"]) {
    c.rateInputs.week.value = digits;
    c.syncManualRateInput("week");
    assert.equal(c.parseCredits(c.rateInputs.week.value), Number(digits));
    assert.equal(c.calculateRates().week, Number(digits), "Submitted rate matches the typed rate");
    assert.ok(Math.abs(Number(c.rateAdjustmentInputs.week.value) - (Number(digits) / 3500000 - 1) * 100) < 1e-9);
  }
});

test("manual hourly, daily and weekly prices remain exact across all base periods", () => {
  for (const base of ["hour", "day", "week"]) {
    for (const period of ["hour", "day", "week"]) {
      const c = calculator(base, "123,456");
      c.rateInputs[period].value = "987,654";
      c.syncManualRateInput(period);
      assert.equal(c.rateInputs[period].value, "987,654", `${base} -> ${period}`);
      assert.equal(c.calculateRates()[period], 987654, `${base} -> ${period}`);
      if (base === period) {
        assert.equal(c.rateBaseInput.value, "987,654");
        assert.equal(c.rateAdjustmentInputs[period].value, "0");
      }
    }
  }
});

test("zero and clearing a non-base price remain editable without restoring the old price", () => {
  const c = calculator();
  for (const value of ["0", "", "1"]) {
    c.rateInputs.week.value = value;
    c.syncManualRateInput("week");
    assert.equal(c.rateInputs.week.value, value);
    assert.equal(c.calculateRates().week, Number(value));
  }
});

test("a markup above 100% survives serialization and restoring the saved adjustment", () => {
  const c = calculator("day", "1,000");
  c.rateInputs.week.value = "24,567";
  c.syncManualRateInput("week");
  assert.ok(Number(c.rateAdjustmentInputs.week.value) > 100);
  assert.ok(Number(c.rateAdjustmentInputs.week.max) >= Number(c.rateAdjustmentInputs.week.value));
  const saved = JSON.parse(JSON.stringify(c.getRateAdjustments()));
  const restored = calculator("day", "1,000");
  Object.entries(saved).forEach(([period, adjustment]) => restored.setRateAdjustment(period, adjustment));
  restored.updateRateCalculator();
  assert.equal(restored.rateInputs.week.value, "24,567");
  assert.equal(restored.calculateRates().week, 24567);
});

test("moving the slider after a manual price recalculates the field normally", () => {
  const c = calculator();
  c.rateInputs.week.value = "900,000";
  c.syncManualRateInput("week");
  c.rateAdjustmentInputs.week.value = "-50";
  c.updateRateCalculator();
  assert.equal(c.rateInputs.week.value, "1,750,000");
  assert.equal(c.calculateRates().week, 1750000);
});

test("formatting a manually edited amount preserves the caret instead of jumping to the end", () => {
  const c = calculator();
  c.rateInputs.week.value = "12345";
  c.rateInputs.week.selectionStart = 2;
  c.syncManualRateInput("week");
  assert.equal(c.rateInputs.week.value, "12,345");
  assert.equal(c.rateInputs.week.selectionStart, 2);
});

test("rate sliders accept fractional adjustments needed for exact manual prices", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  for (const period of ["Hour", "Day", "Week"]) assert.match(html, new RegExp(`name="adjustment${period}"[^>]*step="any"`));
});
