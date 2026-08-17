const commoditiesUrl = "https://api.uexcorp.uk/2.0/commodities";
const commodityPricesUrl = "https://api.uexcorp.uk/2.0/commodities_prices_all";
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

    const [commodities, commodityPrices, terminals] = await Promise.all([
      fetchUex(commoditiesUrl),
      fetchUex(commodityPricesUrl),
      fetchUex(terminalsUrl),
    ]);

    const materials = uniqueSorted(
      commodities
        .filter((commodity) => Number(commodity.is_visible ?? 1) === 1)
        .map((commodity) => getUexString(commodity, "name")),
    );
    const materialPrices = averageSellPrices(commodityPrices);

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
      materialPrices,
      locations,
      source: {
        commodities: commoditiesUrl,
        commodityPrices: commodityPricesUrl,
        terminals: terminalsUrl,
      },
    });
  } catch (error) {
    return response.status(502).json({
      materials: [],
      materialPrices: {},
      locations: [],
      error: error instanceof Error ? error.message : "Unable to load UEX material options",
    });
  }
};

function averageSellPrices(rows) {
  const totals = rows.reduce((prices, row) => {
    const name = getUexString(row, "commodity_name");
    const price = Number(row.price_sell || row.price_sell_avg || 0);

    if (!name || price <= 0 || Number(row.status_sell ?? 1) === 0) {
      return prices;
    }

    prices[name] = prices[name] || { total: 0, count: 0 };
    prices[name].total += price;
    prices[name].count += 1;
    return prices;
  }, {});

  return Object.fromEntries(
    Object.entries(totals).map(([name, value]) => [
      name,
      {
        averageSellPrice: Math.round(value.total / value.count),
        pricePoints: value.count,
      },
    ]),
  );
}
