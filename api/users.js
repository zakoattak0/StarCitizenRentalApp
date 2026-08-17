const { sendError, sendJson } = require("./_supabase");
const { listUsers } = require("./_users");

module.exports = async function handler(request, response) {
  try {
    if (request.method !== "GET") {
      response.setHeader("allow", "GET");
      return sendJson(response, 405, { error: "Method not allowed" });
    }

    const users = await listUsers();
    return sendJson(response, 200, { users });
  } catch (error) {
    return sendError(response, error, "Users request failed");
  }
};
