const commoditiesUrl = "https://api.uexcorp.uk/2.0/commodities";
const terminalsUrl = "https://api.uexcorp.uk/2.0/terminals";

const getUexString = (row, key) => String(row?.[key] ?? "").trim();

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

  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
};

const getTerminalDisplayName = (terminal) => {
  const fullName = getUexString(terminal, "fullname");
  const displayName = getUexString(terminal, "displayname");
  const name = getUexString(terminal, "name");
  const stationName = getUexString(terminal, "space_station_name");
  const locationName = displayName || stationName;

  if (fullName) {
    return fullName;
  }

  if (
    locationName &&
    name &&
    locationName.toLowerCase() !== name.toLowerCase() &&
    !locationName.toLowerCase().includes(name.toLowerCase())
  ) {
    return `${locationName} - ${name}`;
  }

  return displayName || name || stationName || `Terminal ${terminal?.id ?? "Unknown"}`;
};

const uniqueSorted = (values) =>
  [...new Set(values.filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));

module.exports = async function handler(request, response) {
  try {
    if (request.method !== "GET") {
      response.setHeader("allow", "GET");
      return response.status(405).json({ error: "Method not allowed" });
    }

    const [commodities, terminals] = await Promise.all([
      fetchUex(commoditiesUrl),
      fetchUex(terminalsUrl),
    ]);

    const materials = uniqueSorted(
      commodities
        .filter((commodity) => Number(commodity.is_visible ?? 1) === 1)
        .map((commodity) => getUexString(commodity, "name")),
    );

    const locations = terminals
      .filter((terminal) => Number(terminal.is_visible ?? 1) === 1)
      .map((terminal) => {
        const system = getUexString(terminal, "star_system_name") || "Unknown";
        const planet =
          getUexString(terminal, "planet_name") ||
          getUexString(terminal, "orbit_name") ||
          getUexString(terminal, "moon_name") ||
          getUexString(terminal, "city_name") ||
          "Deep Space";
        const location = getTerminalDisplayName(terminal);

        return {
          system,
          planet,
          location,
        };
      })
      .filter((location) => location.location)
      .sort(
        (first, second) =>
          first.system.localeCompare(second.system) ||
          first.planet.localeCompare(second.planet) ||
          first.location.localeCompare(second.location),
      );

    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    return response.status(200).json({
      materials,
      locations,
      source: {
        commodities: commoditiesUrl,
        terminals: terminalsUrl,
      },
    });
  } catch (error) {
    return response.status(502).json({
      materials: [],
      locations: [],
      error: error instanceof Error ? error.message : "Unable to load UEX material options",
    });
  }
};
