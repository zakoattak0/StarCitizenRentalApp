const crypto = require("node:crypto");
const { cookieHeader, getBaseUrl, stateCookie } = require("./_shared");

module.exports = async function handler(request, response) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    response.writeHead(302, { Location: "/?auth_error=DISCORD_CLIENT_ID%20is%20not%20configured" });
    response.end();
    return;
  }

  const baseUrl = getBaseUrl(request);
  const state = crypto.randomBytes(24).toString("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/callback`,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "none",
  });

  response.setHeader("Set-Cookie", cookieHeader(stateCookie, state, 60 * 10));
  response.writeHead(302, { Location: `https://discord.com/api/oauth2/authorize?${params}` });
  response.end();
};
