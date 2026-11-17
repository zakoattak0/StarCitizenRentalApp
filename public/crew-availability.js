(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CrewAvailability = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const HOUR = 3600000;

  function validTimeZone(value) {
    try { return Boolean(value) && Boolean(new Intl.DateTimeFormat("en-US", { timeZone: value })); }
    catch { return false; }
  }

  function normalize(value = {}) {
    const mode = value.mode || "anytime";
    const noticeHours = Number(value.noticeHours || 0);
    const timeZone = value.timeZone || "UTC";
    if (!["anytime", "dates"].includes(mode)) throw new Error("Choose Anytime or a date range.");
    if (![0, 24, 48, 72].includes(noticeHours)) throw new Error("Notice must be 0, 24, 48 or 72 hours.");
    if (!validTimeZone(timeZone)) throw new Error("Choose a valid timezone.");
    const startAt = mode === "dates" ? instant(value.startAt, "availability start") : null;
    const endAt = mode === "dates" ? instant(value.endAt, "availability end") : null;
    if (mode === "dates" && endAt <= startAt) throw new Error("Availability must end after it starts.");
    return { mode, noticeHours, timeZone, startAt, endAt };
  }

  function instant(value, label = "date and time") {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(String(value || ""))) {
      throw new Error(`Choose a valid ${label}.`);
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error(`Choose a valid ${label}.`);
    return date.toISOString();
  }

  function localInput(value, timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(value));
    const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }

  function fromLocal(value, timeZone) {
    if (!validTimeZone(timeZone)) throw new Error("Choose a valid timezone.");
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value || ""))) throw new Error("Choose a date and time.");
    const guess = Date.parse(value + ":00Z");
    if (!Number.isFinite(guess) || new Date(guess).toISOString().slice(0, 16) !== value) throw new Error("Choose a valid date and time.");
    // Sampling either side of a transition finds both possible UTC offsets.
    // During the repeated fall-back hour, use the earlier occurrence and show
    // its explicit timezone/offset in the confirmation preview.
    const offsets = new Set([-36, 0, 36].map((hours) => {
      const sample = guess + hours * HOUR;
      return Date.parse(localInput(sample, timeZone) + ":00Z") - sample;
    }));
    const matches = [...offsets].map((offset) => guess - offset)
      .filter((candidate) => localInput(candidate, timeZone) === value).sort((a, b) => a - b);
    if (!matches.length) throw new Error("That local time does not exist because the clocks change. Choose another time.");
    return new Date(matches[0]).toISOString();
  }

  function earliestStart(value, now = Date.now()) {
    const a = normalize(value);
    return Math.max(Number(now) + a.noticeHours * HOUR, a.startAt ? Date.parse(a.startAt) : -Infinity);
  }

  function status(value, now = Date.now()) {
    const a = normalize(value);
    const earliest = earliestStart(a, now);
    if (a.endAt && earliest >= Date.parse(a.endAt)) return "Unavailable";
    if (a.startAt && Date.parse(a.startAt) > Number(now) + a.noticeHours * HOUR) return "Scheduled";
    return a.noticeHours ? "Needs notice" : "Available now";
  }

  function validateRequest(value, startAt, endAt, now = Date.now()) {
    const a = normalize(value);
    const start = Date.parse(instant(startAt, "booking start"));
    const end = endAt ? Date.parse(instant(endAt, "booking end")) : null;
    if (end !== null && end <= start) throw new Error("Booking must end after it starts.");
    if (start < Number(now) + a.noticeHours * HOUR) {
      throw new Error(a.noticeHours ? `This provider needs at least ${a.noticeHours} hours' notice for every booking.` : "Choose a future booking start.");
    }
    if (a.startAt && start < Date.parse(a.startAt)) throw new Error("Booking starts before the provider is available.");
    if (a.endAt && (start >= Date.parse(a.endAt) || (end !== null && end > Date.parse(a.endAt)))) throw new Error("Booking is outside the provider's available dates.");
    return { startAt: new Date(start).toISOString(), endAt: end === null ? null : new Date(end).toISOString() };
  }

  function matches(value, startAt, endAt, now = Date.now()) {
    try { validateRequest(value, startAt, endAt, now); return true; } catch { return false; }
  }

  function format(value, timeZone) {
    return new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "shortOffset" }).format(new Date(value));
  }

  function summary(value) {
    const a = normalize(value);
    return `${a.mode === "anytime" ? "Anytime" : `${format(a.startAt, a.timeZone)} – ${format(a.endAt, a.timeZone)}`} · ${a.noticeHours ? `${a.noticeHours}-hour notice` : "No advance notice"} · ${a.timeZone}`;
  }

  return { HOUR, validTimeZone, normalize, instant, localInput, fromLocal, earliestStart, status, validateRequest, matches, format, summary };
});
