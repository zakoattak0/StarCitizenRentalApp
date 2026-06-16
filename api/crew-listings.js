const { requestBody, sendJson, supabaseRequest } = require("./_supabase");

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
    availabilityStatus: row.availability_status || "Available now",
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
    availability_status: listing.availabilityStatus || "Available now",
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
      const { listing } = requestBody(request);
      if (!listing?.role) {
        return sendJson(response, 400, { error: "Crew role is required" });
      }

      const rows = await supabaseRequest("crew_listings", {
        method: "POST",
        body: JSON.stringify(toRow(listing)),
      });
      return sendJson(response, 200, { listing: toClient(rows[0]) });
    }

    if (request.method === "DELETE") {
      const id = new URL(request.url, "http://localhost").searchParams.get("id");
      if (!id) {
        return sendJson(response, 400, { error: "Crew listing id is required" });
      }

      await supabaseRequest(`crew_listings?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return sendJson(response, 200, { ok: true });
    }

    response.setHeader("allow", "GET, POST, DELETE");
    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Crew listings request failed",
    });
  }
};
