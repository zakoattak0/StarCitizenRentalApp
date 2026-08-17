const { sendJson, supabaseRequest } = require("./_supabase");

module.exports = async function handler(request, response) {
  try {
    if (request.method !== "GET") {
      response.setHeader("allow", "GET");
      return sendJson(response, 405, { error: "Method not allowed" });
    }

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
};
