const { sendJson, supabaseRequest } = require("./_supabase");

const pricesUrl = "https://api.uexcorp.uk/2.0/commodities_prices_all";
const terminalsUrl = "https://api.uexcorp.uk/2.0/terminals";
const commoditiesUrl = "https://api.uexcorp.uk/2.0/commodities";

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

const knownOrbitalStations = [
  "Baijini Point",
  "Everus Harbor",
  "Port Tressler",
  "Seraphim Station",
];

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

const fetchUexRows = async (url) => {
  const payload = await fetchUex(url);
  return Array.isArray(payload.data) ? payload.data : [];
};

const getLocationHaystack = (terminal) =>
  [
    "nickname",
    "displayname",
    "name",
    "fullname",
    "orbit_name",
    "space_station_name",
    "city_name",
    "planet_name",
  ]
    .map((key) => getUexString(terminal, key))
    .join(" ");

const getStationAlias = (terminal) => {
  const haystack = getLocationHaystack(terminal);
  const lPointMatch = haystack.match(/\b[A-Z]{2,4}-L[1-5]\b/i);

  if (lPointMatch) {
    return lPointMatch[0].toUpperCase();
  }

  return "";
};

const isLagrangeStation = (terminal) => {
  const haystack = getLocationHaystack(terminal);
  return /\b[A-Z]{2,4}-L[1-5]\b/i.test(haystack) || /lagrange point/i.test(haystack);
};

const isOrbitalStation = (terminal) => {
  const haystack = getLocationHaystack(terminal).toLowerCase();
  return knownOrbitalStations.some((station) => haystack.includes(station.toLowerCase()));
};

const getMajorTradeLocation = (terminal) => {
  const city = getUexString(terminal, "city_name");
  const stationName = getUexString(terminal, "space_station_name");
  const stationAlias = getStationAlias(terminal);

  if (city) {
    return city;
  }

  if (stationName) {
    return stationName;
  }

  if (isLagrangeStation(terminal)) {
    return stationAlias;
  }

  if (isOrbitalStation(terminal)) {
    return stationName || knownOrbitalStations.find((station) =>
      getLocationHaystack(terminal).toLowerCase().includes(station.toLowerCase()),
    );
  }

  return "";
};

const uniqueSorted = (values) =>
  [...new Set(values.filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));

const uniqueLocationRows = (rows) => {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.system}|${row.planet}|${row.location}`.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
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

async function handleHangarServices(request, response) {
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
}

async function handleMaterialOptions(request, response) {
  try {
    const [commodities, commodityPrices, terminals] = await Promise.all([
      fetchUexRows(commoditiesUrl),
      fetchUexRows(pricesUrl),
      fetchUexRows(terminalsUrl),
    ]);

    const materials = uniqueSorted(
      commodities
        .filter((commodity) => Number(commodity.is_visible ?? 1) === 1)
        .map((commodity) => getUexString(commodity, "name")),
    );
    const materialPrices = averageSellPrices(commodityPrices);

    const locations = uniqueLocationRows(
      terminals
        .filter((terminal) => Number(terminal.is_visible ?? 1) === 1)
        .map((terminal) => {
          const system = getUexString(terminal, "star_system_name") || "Unknown";
          const planet =
            getUexString(terminal, "planet_name") ||
            getUexString(terminal, "orbit_name") ||
            getUexString(terminal, "moon_name") ||
            getUexString(terminal, "city_name") ||
            "Deep Space";
          const location = getMajorTradeLocation(terminal);

          return {
            system,
            planet,
            location,
          };
        })
        .filter((location) => location.location),
    ).sort(
      (first, second) =>
        first.system.localeCompare(second.system) ||
        first.planet.localeCompare(second.planet) ||
        first.location.localeCompare(second.location),
    );

    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    response.status(200).json({
      materials,
      materialPrices,
      locations,
      source: {
        commodities: commoditiesUrl,
        commodityPrices: pricesUrl,
        terminals: terminalsUrl,
      },
    });
  } catch (error) {
    response.status(502).json({
      materials: [],
      materialPrices: {},
      locations: [],
      error: error instanceof Error ? error.message : "Unable to load UEX material options",
    });
  }
}

async function handleRatingStats(request, response) {
  try {
    const rows = await supabaseRequest("deal_ratings?select=reviewed_user_id,rating", { method: "GET" });
    const totals = rows.reduce((stats, row) => {
      const userId = row.reviewed_user_id;
      if (!userId) {
        return stats;
      }
      stats[userId] = stats[userId] || { total: 0, count: 0 };
      stats[userId].total += Number(row.rating || 0);
      stats[userId].count += 1;
      return stats;
    }, {});

    const stats = Object.fromEntries(
      Object.entries(totals).map(([userId, value]) => [
        userId,
        {
          averageRating: value.count ? value.total / value.count : 0,
          ratedDeals: value.count,
        },
      ]),
    );

    return sendJson(response, 200, { stats });
  } catch (error) {
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Rating stats request failed",
    });
  }
}

// Consolidated from the former hangar-services.js/material-options.js/rating-stats.js
// so the deployment stays under Vercel's Hobby-plan serverless function cap. All
// three are read-only lookups with no auth requirement; dispatch by ?type=.
module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  const type = new URL(request.url, "http://localhost").searchParams.get("type");

  if (type === "hangar-services") {
    return handleHangarServices(request, response);
  }
  if (type === "material-options") {
    return handleMaterialOptions(request, response);
  }
  if (type === "rating-stats") {
    return handleRatingStats(request, response);
  }

  return sendJson(response, 400, { error: "Unknown reference data type" });
};
