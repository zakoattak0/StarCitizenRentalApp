(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MaterialQuality = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function bounds(min, max) {
    if (min === "" || max === "" || min == null || max == null) throw new Error("Enter minimum and maximum quality.");
    min = Number(min);
    max = Number(max);
    if (![min, max].every((value) => Number.isInteger(value) && value >= 0 && value <= 1000)) throw new Error("Quality must be a whole number from 0 to 1000.");
    if (min > max) throw new Error("Minimum quality cannot exceed maximum quality.");
    return { min, max };
  }

  function read(item) {
    if (item && typeof item === "object") {
      if (item.qualityMin != null || item.qualityMax != null) return bounds(item.qualityMin, item.qualityMax);
      return read(item.quality);
    }
    const text = String(item ?? "").replaceAll(",", "").trim();
    const values = text.match(/\d+(?:\.\d+)?/g);
    if (!values) return { min: 0, max: 1000 };
    return bounds(values[0], values[1] ?? (text.includes("+") ? 1000 : values[0]));
  }

  function label(range) {
    return range.min === range.max ? String(range.min) : `${range.min}–${range.max}`;
  }

  function fields(range) {
    return { qualityMin: range.min, qualityMax: range.max, quality: label(range) };
  }

  return { bounds, read, label, fields };
});
