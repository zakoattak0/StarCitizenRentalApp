const { requestBody, sendJson, supabaseRequest } = require("./_supabase");

function toClient(row) {
  return {
    id: row.id,
    ownerId: row.owner_id || "",
    owner: row.owner_name || "",
    ship: row.ship_name || "",
    role: row.role || "General",
    rates: row.rates || {},
    offeredRates: row.offered_rates || [],
    rateBasePeriod: row.rate_base_period || "hour",
    rateBase: row.rate_base || 0,
    rateAdjustments: row.rate_adjustments || {},
    manufacturer: row.manufacturer || "",
    pilotIncluded: Boolean(row.pilot_included),
    pilotRate: row.pilot_rate || 0,
    hangarLoadCost: row.hangar_load_cost || 0,
    hangarLoadMode: row.hangar_load_mode || "flat",
    hangarLoadPercent: row.hangar_load_percent || 0,
    hangarFeeTreatment: row.hangar_fee_treatment || "add",
    notes: row.notes || "",
    dates: row.available_dates || [],
    shipConfig: row.ship_config || null,
    hangarServices: row.hangar_services || [],
    vehicle: row.vehicle || null,
    rating: row.rating || 0,
    completedJobs: row.completed_jobs || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(listing) {
  return {
    owner_id: listing.ownerId || "",
    owner_name: listing.owner || "Independent provider",
    ship_name: listing.ship || "",
    role: listing.role || "General",
    manufacturer: listing.manufacturer || listing.vehicle?.company || "",
    rates: listing.rates || {},
    offered_rates: listing.offeredRates || [],
    rate_base_period: listing.rateBasePeriod || "hour",
    rate_base: Number(listing.rateBase || 0),
    rate_adjustments: listing.rateAdjustments || {},
    pilot_included: Boolean(listing.pilotIncluded),
    pilot_rate: Number(listing.pilotRate || 0),
    hangar_load_cost: Number(listing.hangarLoadCost || 0),
    hangar_load_mode: listing.hangarLoadMode || "flat",
    hangar_load_percent: Number(listing.hangarLoadPercent || 0),
    hangar_fee_treatment: listing.hangarFeeTreatment || "add",
    notes: listing.notes || "",
    available_dates: listing.dates || [],
    ship_config: listing.shipConfig || null,
    hangar_services: listing.hangarServices || [],
    vehicle: listing.vehicle || null,
  };
}

module.exports = async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const rows = await supabaseRequest("ship_listings?select=*&order=updated_at.desc", {
        method: "GET",
      });
      return sendJson(response, 200, { listings: rows.map(toClient) });
    }

    if (request.method === "POST") {
      const { listing } = requestBody(request);
      if (!listing?.ship) {
        return sendJson(response, 400, { error: "Ship is required" });
      }

      const row = toRow(listing);
      const path = listing.id
        ? `ship_listings?id=eq.${encodeURIComponent(listing.id)}`
        : "ship_listings";
      const rows = await supabaseRequest(path, {
        method: listing.id ? "PATCH" : "POST",
        body: JSON.stringify(row),
      });

      return sendJson(response, 200, { listing: toClient(rows[0]) });
    }

    if (request.method === "DELETE") {
      const id = new URL(request.url, "http://localhost").searchParams.get("id");
      if (!id) {
        return sendJson(response, 400, { error: "Listing id is required" });
      }

      await supabaseRequest(`ship_listings?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return sendJson(response, 200, { ok: true });
    }

    response.setHeader("allow", "GET, POST, DELETE");
    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Ship listings request failed",
    });
  }
};
