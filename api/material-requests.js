const { requestBody, requireOwnedRow, requirePostingAccount, sendError, sendJson, supabaseRequest } = require("./_supabase");

function toClient(row) {
  const materials = row.materials || [];
  const firstMaterial = materials[0] || {};
  const listingType = firstMaterial.listingType === "wts" ? "wts" : "wtb";
  const quantity = firstMaterial.anyQuantity || firstMaterial.quantity === "Any quantity"
    ? "Any quantity"
    : firstMaterial.quantity
      ? `${firstMaterial.quantity} SCU`
      : row.quantity || "";

  return {
    id: row.id,
    requesterId: row.requester_id || "",
    postedBy: row.posted_by || "",
    location: row.location || "",
    neededBy: row.needed_by || "",
    price: row.price || "",
    listingType,
    materials,
    material: firstMaterial.material || row.material || "",
    quantity,
    quality: firstMaterial.quality || row.quality || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(request) {
  const listingType = request.listingType === "wts" ? "wts" : "wtb";
  const materials = (request.materials || []).map((material) => ({
    ...material,
    listingType: material.listingType === "wts" ? "wts" : listingType,
  }));

  return {
    requester_id: request.requesterId || "",
    posted_by: request.postedBy || "Independent requester",
    location: request.location || "",
    needed_by: request.neededBy || null,
    price: request.price || "",
    materials,
  };
}

module.exports = async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const rows = await supabaseRequest("material_requests?select=*&order=updated_at.desc", {
        method: "GET",
      });
      return sendJson(response, 200, { requests: rows.map(toClient) });
    }

    if (request.method === "POST") {
      const user = requirePostingAccount(request);
      const { request: materialRequest } = requestBody(request);
      if (!materialRequest?.materials?.length) {
        return sendJson(response, 400, { error: "At least one requested material is required" });
      }

      const row = toRow(materialRequest);
      row.requester_id = user.id;
      const rows = await supabaseRequest("material_requests", {
        method: "POST",
        body: JSON.stringify(row),
        useServiceRole: true,
      });
      return sendJson(response, 200, { request: toClient(rows[0]) });
    }

    if (request.method === "DELETE") {
      const user = requirePostingAccount(request);
      const id = new URL(request.url, "http://localhost").searchParams.get("id");
      if (!id) {
        return sendJson(response, 400, { error: "Material request id is required" });
      }

      await requireOwnedRow("material_requests", id, "requester_id", user.id);
      await supabaseRequest(`material_requests?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        useServiceRole: true,
      });
      return sendJson(response, 200, { ok: true });
    }

    response.setHeader("allow", "GET, POST, DELETE");
    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendError(response, error, "Material requests request failed");
  }
};
