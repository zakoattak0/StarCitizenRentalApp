const {
  clearCookieHeader,
  cookieHeader,
  encodeSession,
  getBaseUrl,
  parseCookies,
  sessionCookie,
  stateCookie,
} = require("./_shared");

module.exports = async function handler(request, response) {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Discord OAuth environment variables are not configured");
    }

    const baseUrl = getBaseUrl(request);
    const url = new URL(request.url, baseUrl);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookies = parseCookies(request);

    if (!code || !state || state !== cookies[stateCookie]) {
      throw new Error("Discord sign-in state could not be verified");
    }

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${baseUrl}/api/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Discord token exchange failed with ${tokenResponse.status}`);
    }

    const token = await tokenResponse.json();
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error(`Discord profile request failed with ${userResponse.status}`);
    }

    const discordUser = await userResponse.json();
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
      : "";
    const displayName = discordUser.global_name || discordUser.username;
    const now = new Date();
    const session = {
      user: {
        id: `discord:${discordUser.id}`,
        discordId: discordUser.id,
        username: discordUser.username,
        displayName,
        avatarUrl,
        createdAt: now.toISOString(),
        profile: {
          rsiHandle: "",
          publicName: displayName,
        },
        stats: {
          rating: 0,
          completedContracts: 0,
          activeListings: 0,
          orgAffiliation: "None",
        },
      },
      expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    };

    response.setHeader("Set-Cookie", [
      cookieHeader(sessionCookie, encodeSession(session)),
      clearCookieHeader(stateCookie),
    ]);
    response.writeHead(302, { Location: "/account" });
    response.end();
  } catch (error) {
    response.writeHead(302, { Location: `/?auth_error=${encodeURIComponent(error.message || "Discord sign-in failed")}` });
    response.end();
  }
};
