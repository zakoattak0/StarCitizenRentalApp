const { checkRateLimit, requestBody, requireOwnedRow, requirePostingAccount, sendError, sendJson, supabaseRequest } = require("./_supabase");
const availability = require("../public/crew-availability");

function toClient(row) {
  return {
    id: row.id,
    ownerId: row.owner_id || "",
    name: row.provider_name || "",
    role: row.role || "",
    price: row.price || 0,
    payType: row.pay_type || "flat",
    rating: row.rating || 0,
    completedJobs: row.completed_jobs || 0,
    availability: availability.normalize(row.availability || {}),
    availabilityStatus: availability.status(row.availability || {}),
    summary: row.summary || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(listing) {
  return {
    owner_id: listing.ownerId || "",
    provider_name: listing.name || "Independent provider",
    role: listing.role || "",
    price: Number(listing.price || 0),
    pay_type: listing.payType || "flat",
    availability: availability.normalize(listing.availability || {}),
    availability_status: availability.status(listing.availability || {}),
    summary: listing.summary || "",
  };
}

module.exports = async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const rows = await supabaseRequest("crew_listings?select=*&order=updated_at.desc", {
        method: "GET",
      });
      return sendJson(response, 200, { listings: rows.map(toClient) });
    }

    if (request.method === "POST") {
      const user = requirePostingAccount(request);
      await checkRateLimit(`write:crew_listings:${user.id}`, 20, 600);
      const { listing } = requestBody(request);
      if (!listing?.role) {
        return sendJson(response, 400, { error: "Crew role is required" });
      }

      if (listing.id) {
        await requireOwnedRow("crew_listings", listing.id, "owner_id", user.id);
      }

      let row;
      try {
        row = toRow(listing);
        if (row.availability.endAt && Date.parse(row.availability.endAt) <= Date.now()) throw new Error("Choose availability that ends in the future.");
        if (row.availability.endAt && Date.parse(row.availability.endAt) <= availability.earliestStart(row.availability)) throw new Error("This date range ends before the required notice. Choose later dates or a shorter notice period.");
      } catch (error) {
        return sendJson(response, 400, { error: error.message });
      }
      row.owner_id = user.id;
      const path = listing.id
        ? `crew_listings?id=eq.${encodeURIComponent(listing.id)}`
        : "crew_listings";
      const rows = await supabaseRequest(path, {
        method: listing.id ? "PATCH" : "POST",
        body: JSON.stringify(row),
        useServiceRole: true,
      });
      return sendJson(response, 200, { listing: toClient(rows[0]) });
    }

    if (request.method === "DELETE") {
      const user = requirePostingAccount(request);
      await checkRateLimit(`write:crew_listings:${user.id}`, 20, 600);
      const id = new URL(request.url, "http://localhost").searchParams.get("id");
      if (!id) {
        return sendJson(response, 400, { error: "Crew listing id is required" });
      }

      await requireOwnedRow("crew_listings", id, "owner_id", user.id);
      await supabaseRequest(`crew_listings?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        useServiceRole: true,
      });
      return sendJson(response, 200, { ok: true });
    }

    response.setHeader("allow", "GET, POST, DELETE");
    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendError(response, error, "Crew listings request failed");
  }
};
