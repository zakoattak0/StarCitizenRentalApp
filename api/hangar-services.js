const pricesUrl = "https://api.uexcorp.uk/2.0/commodities_prices_all";
const terminalsUrl = "https://api.uexcorp.uk/2.0/terminals";

const serviceCommodities = new Map([
  ["Size 1 Ammo", ["Ship Ammunition - Size 1"]],
  ["Size 2 Ammo", ["Ship Ammunition - Size 2"]],
  ["Size 3 Ammo", ["Ship Ammunition - Size 3"]],
  ["Size 4 Ammo", ["Ship Ammunition - Size 4"]],
  ["Size 5 Ammo", ["Ship Ammunition - Size 5"]],
  ["Hydrogen Fuel", ["Hydrogen Fuel"]],
  ["Quantum Fuel", ["Quantum Fuel"]],
  ["Recycled Material Composite", ["Recycled Material Composite"]],
  ["Noise", ["Ship Noise Countermeasures"]],
  ["Decoys", ["Ship Decoy Countermeasures"]],
]);

const getUexString = (row, key) => String(row?.[key] ?? "").trim();

const getTerminalDisplayName = (terminal) => {
  const fullName = getUexString(terminal, "fullname");
  const displayName = getUexString(terminal, "displayname");
  const name = getUexString(terminal, "name");
  const priceName = getUexString(terminal, "terminal_name");
  const stationName = getUexString(terminal, "space_station_name");
  const locationName = displayName || stationName;
  const terminalName = name || priceName;

  if (fullName) {
    return fullName;
  }

  if (
    locationName &&
    terminalName &&
    locationName.toLowerCase() !== terminalName.toLowerCase() &&
    !locationName.toLowerCase().includes(terminalName.toLowerCase())
  ) {
    return `${locationName} - ${terminalName}`;
  }

  return displayName || name || priceName || stationName || `Terminal ${terminal?.id ?? "Unknown"}`;
};

const fetchUex = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "StantonShipRentals",
    },
  });

  if (!response.ok) {
    throw new Error(`UEX request failed with ${response.status}`);
  }

  return response.json();
};

module.exports = async function handler(request, response) {
  try {
    const [pricesPayload, terminalsPayload] = await Promise.all([fetchUex(pricesUrl), fetchUex(terminalsUrl)]);
    const terminalsById = new Map((terminalsPayload.data || []).map((terminal) => [Number(terminal.id), terminal]));
    const uexNames = new Map();

    serviceCommodities.forEach((names, label) => {
      names.forEach((name) => uexNames.set(name.toLowerCase(), label));
    });

    const rows = (pricesPayload.data || [])
      .map((row) => {
        const label = uexNames.get(String(row.commodity_name || "").toLowerCase());
        const price = Number(row.price_buy) || 0;

        if (!label || price <= 0) {
          return null;
        }

        const terminal = terminalsById.get(Number(row.id_terminal));

        return {
          label,
          uexName: row.commodity_name,
          price,
          system: getUexString(terminal, "star_system_name") || getUexString(row, "star_system_name") || "Unknown",
          planet:
            getUexString(terminal, "planet_name") ||
            getUexString(terminal, "orbit_name") ||
            getUexString(row, "planet_name") ||
            getUexString(row, "orbit_name") ||
            "Deep Space",
          terminal: terminal ? getTerminalDisplayName(terminal) : row.terminal_name,
          terminalId: Number(row.id_terminal),
        };
      })
      .filter(Boolean)
      .sort(
        (first, second) =>
          first.label.localeCompare(second.label) ||
          first.system.localeCompare(second.system) ||
          first.planet.localeCompare(second.planet) ||
          first.terminal.localeCompare(second.terminal),
      );

    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    response.status(200).json({
      rows,
      source: {
        prices: pricesUrl,
        terminals: terminalsUrl,
      },
    });
  } catch (error) {
    response.status(502).json({
      rows: [],
      error: error instanceof Error ? error.message : "Unable to load UEX hangar service prices",
    });
  }
};
