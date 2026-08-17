const { requestBody, sendJson, supabaseRequest } = require("./_supabase");
const { decodeSession, parseCookies, publicUser, sessionCookie } = require("./auth/_shared");

const dealTypes = new Set(["ship_rental", "crew_service", "material_order", "contract", "general"]);

function requireUser(request) {
  const session = decodeSession(parseCookies(request)[sessionCookie]);
  const user = publicUser(session);
  if (!user?.discordId && !String(user?.id || "").startsWith("discord:")) {
    return null;
  }
  return user;
}

function displayName(user) {
  return user?.profile?.rsiStatus === "verified" && user.profile.rsiHandle
    ? user.profile.rsiHandle
    : user?.username || user?.displayName || user?.email || "Account";
}

function toClient(row, myRating = null) {
  return {
    id: row.id,
    requesterUserId: row.requester_user_id,
    requesterName: row.requester_name || "Requester",
    providerUserId: row.provider_user_id,
    providerName: row.provider_name || "Provider",
    listingId: row.listing_id || "",
    listingType: row.listing_type || "",
    listingName: row.listing_name || "General service",
    dealType: row.deal_type || "general",
    status: row.status || "pending",
    requesterConfirmedComplete: Boolean(row.requester_confirmed_complete),
    providerConfirmedComplete: Boolean(row.provider_confirmed_complete),
    requesterConfirmedAt: row.requester_confirmed_at,
    providerConfirmedAt: row.provider_confirmed_at,
    completedAt: row.completed_at,
    requestedAt: row.created_at,
    updatedAt: row.updated_at,
    myRating,
  };
}

function isParticipant(deal, userId) {
  return deal?.requester_user_id === userId || deal?.provider_user_id === userId;
}

async function fetchDeal(id) {
  const rows = await supabaseRequest(`deals?id=eq.${encodeURIComponent(id)}&select=*`, { method: "GET" });
  return rows[0] || null;
}

async function fetchMyRatings(userId, dealIds) {
  if (!dealIds.length) {
    return new Map();
  }

  const rows = await supabaseRequest(
    `deal_ratings?reviewer_user_id=eq.${encodeURIComponent(userId)}&deal_id=in.(${dealIds.map(encodeURIComponent).join(",")})&select=deal_id,rating,comment,created_at`,
    { method: "GET" },
  );
  return new Map(rows.map((row) => [row.deal_id, row]));
}

async function listDeals(user) {
  const requesterFilter = `requester_user_id.eq.${encodeURIComponent(user.id)}`;
  const providerFilter = `provider_user_id.eq.${encodeURIComponent(user.id)}`;
  const rows = await supabaseRequest(
    `deals?or=(${requesterFilter},${providerFilter})&select=*&order=updated_at.desc`,
    { method: "GET" },
  );
  const ratingsByDeal = await fetchMyRatings(user.id, rows.map((row) => row.id));
  return rows.map((row) => toClient(row, ratingsByDeal.get(row.id) || null));
}

async function createDeal(user, deal) {
  if (!deal?.providerUserId) {
    throw new Error("This listing needs a provider account before a deal can be requested.");
  }
  if (deal.providerUserId === user.id) {
    throw new Error("You cannot create a deal with your own listing.");
  }

  const row = {
    requester_user_id: user.id,
    requester_name: displayName(user),
    provider_user_id: String(deal.providerUserId),
    provider_name: deal.providerName || "Provider",
    listing_id: deal.listingId || null,
    listing_type: deal.listingType || null,
    listing_name: deal.listingName || "General service",
    deal_type: deal.dealType || "general",
    status: "pending",
  };

  if (!dealTypes.has(row.deal_type)) {
    row.deal_type = "general";
  }

  const rows = await supabaseRequest("deals", {
    method: "POST",
    body: JSON.stringify(row),
  });
  return toClient(rows[0]);
}

async function updateDeal(user, action, dealId) {
  const deal = await fetchDeal(dealId);
  if (!deal || !isParticipant(deal, user.id)) {
    throw new Error("Deal not found.");
  }

  const now = new Date().toISOString();
  let patch = {};

  if (action === "accept") {
    if (deal.provider_user_id !== user.id || deal.status !== "pending") {
      throw new Error("Only the provider can accept a pending deal.");
    }
    patch = { status: "in_progress" };
  } else if (action === "reject") {
    if (deal.provider_user_id !== user.id || deal.status !== "pending") {
      throw new Error("Only the provider can reject a pending deal.");
    }
    patch = { status: "rejected" };
  } else if (action === "cancel") {
    if (deal.requester_user_id !== user.id || deal.status !== "pending") {
      throw new Error("Only the requester can cancel a pending deal.");
    }
    patch = { status: "cancelled" };
  } else if (action === "mark_complete") {
    if (!["in_progress", "completion_requested"].includes(deal.status)) {
      throw new Error("Only active deals can be marked complete.");
    }

    const requesterConfirmed = deal.requester_user_id === user.id ? true : Boolean(deal.requester_confirmed_complete);
    const providerConfirmed = deal.provider_user_id === user.id ? true : Boolean(deal.provider_confirmed_complete);
    patch = {
      requester_confirmed_complete: requesterConfirmed,
      provider_confirmed_complete: providerConfirmed,
      requester_confirmed_at: deal.requester_user_id === user.id ? now : deal.requester_confirmed_at,
      provider_confirmed_at: deal.provider_user_id === user.id ? now : deal.provider_confirmed_at,
      status: requesterConfirmed && providerConfirmed ? "completed" : "completion_requested",
      completed_at: requesterConfirmed && providerConfirmed ? now : null,
    };
  } else {
    throw new Error("Unsupported deal action.");
  }

  const rows = await supabaseRequest(`deals?id=eq.${encodeURIComponent(dealId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return toClient(rows[0]);
}

async function rateDeal(user, body) {
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be a whole number from 1 to 5.");
  }

  const deal = await fetchDeal(body.dealId);
  if (!deal || !isParticipant(deal, user.id)) {
    throw new Error("Deal not found.");
  }
  if (deal.status !== "completed" || !deal.requester_confirmed_complete || !deal.provider_confirmed_complete) {
    throw new Error("Ratings are only allowed after both parties complete the deal.");
  }

  const reviewedUserId = deal.requester_user_id === user.id ? deal.provider_user_id : deal.requester_user_id;
  const existing = await supabaseRequest(
    `deal_ratings?deal_id=eq.${encodeURIComponent(deal.id)}&reviewer_user_id=eq.${encodeURIComponent(user.id)}&select=id`,
    { method: "GET" },
  );
  if (existing.length) {
    throw new Error("You already rated this deal.");
  }

  const rows = await supabaseRequest("deal_ratings", {
    method: "POST",
    body: JSON.stringify({
      deal_id: deal.id,
      reviewer_user_id: user.id,
      reviewed_user_id: reviewedUserId,
      rating,
      comment: body.comment || null,
    }),
  });
  return rows[0];
}

module.exports = async function handler(request, response) {
  try {
    const user = requireUser(request);
    if (!user) {
      return sendJson(response, 401, { error: "Posting requires a linked Discord account." });
    }

    if (request.method === "GET") {
      return sendJson(response, 200, { deals: await listDeals(user) });
    }

    if (request.method === "POST") {
      const body = requestBody(request);
      if (body.action === "create") {
        return sendJson(response, 200, { deal: await createDeal(user, body.deal) });
      }
      if (body.action === "rate") {
        return sendJson(response, 200, { rating: await rateDeal(user, body) });
      }
      return sendJson(response, 200, { deal: await updateDeal(user, body.action, body.dealId) });
    }

    response.setHeader("allow", "GET, POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(response, 400, {
      error: error instanceof Error ? error.message : "Deal request failed",
    });
  }
};
