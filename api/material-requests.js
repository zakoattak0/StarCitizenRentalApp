const { requestBody, sendJson, supabaseRequest } = require("./_supabase");

function toClient(row) {
  const materials = row.materials || [];
  const firstMaterial = materials[0] || {};
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
    materials,
    material: firstMaterial.material || row.material || "",
    quantity,
    quality: firstMaterial.quality || row.quality || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(request) {
  return {
    requester_id: request.requesterId || "",
    posted_by: request.postedBy || "Independent requester",
    location: request.location || "",
    needed_by: request.neededBy || "",
    price: request.price || "",
    materials: request.materials || [],
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
      const { request: materialRequest } = requestBody(request);
      if (!materialRequest?.materials?.length) {
        return sendJson(response, 400, { error: "At least one requested material is required" });
      }

      const rows = await supabaseRequest("material_requests", {
        method: "POST",
        body: JSON.stringify(toRow(materialRequest)),
      });
      return sendJson(response, 200, { request: toClient(rows[0]) });
    }

    if (request.method === "DELETE") {
      const id = new URL(request.url, "http://localhost").searchParams.get("id");
      if (!id) {
        return sendJson(response, 400, { error: "Material request id is required" });
      }

      await supabaseRequest(`material_requests?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return sendJson(response, 200, { ok: true });
    }

    response.setHeader("allow", "GET, POST, DELETE");
    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Material requests request failed",
    });
  }
};
