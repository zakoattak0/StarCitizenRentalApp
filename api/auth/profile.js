const crypto = require("node:crypto");
const {
  cookieHeader,
  decodeSession,
  encodeSession,
  parseCookies,
  publicUser,
  sessionCookie,
} = require("./_shared");

function sendJson(response, statusCode, payload) {
  response.setHeader("content-type", "application/json");
  response.status(statusCode).json(payload);
}

function requestBody(request) {
  if (!request.body) {
    return {};
  }
  return typeof request.body === "string" ? JSON.parse(request.body) : request.body;
}

function normalizeHandle(value) {
  return String(value || "").trim().replace(/\s+/g, "-").slice(0, 40);
}

module.exports = async function handler(request, response) {
  try {
    if (request.method !== "POST") {
      response.setHeader("allow", "POST");
      return sendJson(response, 405, { error: "Method not allowed" });
    }

    const session = decodeSession(parseCookies(request)[sessionCookie]);
    if (!session?.user?.discordId) {
      return sendJson(response, 401, { error: "Posting requires a linked Discord account." });
    }

    const body = requestBody(request);
    const action = body.action;
    const profile = {
      rsiHandle: "",
      rsiStatus: "not_linked",
      rsiVerificationCode: "",
      publicName: session.user.displayName || session.user.username || "",
      ...(session.user.profile || {}),
    };

    if (action === "start-rsi") {
      const rsiHandle = normalizeHandle(body.rsiHandle);
      if (!rsiHandle) {
        return sendJson(response, 400, { error: "Enter an RSI handle to link." });
      }
      profile.rsiHandle = rsiHandle;
      profile.rsiStatus = "pending";
      profile.rsiVerificationCode = `FSX-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    } else if (action === "verify-rsi") {
      const code = String(body.code || "").trim().toUpperCase();
      if (!profile.rsiHandle || profile.rsiStatus !== "pending") {
        return sendJson(response, 400, { error: "Start RSI verification before entering a code." });
      }
      if (code !== String(profile.rsiVerificationCode || "").toUpperCase()) {
        return sendJson(response, 400, { error: "Verification code does not match." });
      }
      profile.rsiStatus = "verified";
    } else if (action === "clear-rsi") {
      profile.rsiHandle = "";
      profile.rsiStatus = "not_linked";
      profile.rsiVerificationCode = "";
    } else {
      return sendJson(response, 400, { error: "Unknown profile action." });
    }

    session.user.profile = profile;
    response.setHeader("Set-Cookie", cookieHeader(sessionCookie, encodeSession(session)));
    return sendJson(response, 200, { user: publicUser(session) });
  } catch (error) {
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Profile update failed",
    });
  }
};
