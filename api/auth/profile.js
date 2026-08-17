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
  const handle = String(value || "").trim().replace(/\s+/g, "-").slice(0, 40);
  return /^[A-Za-z0-9_-]+$/.test(handle) ? handle : "";
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function citizenProfileUrl(handle) {
  return `https://robertsspaceindustries.com/citizens/${encodeURIComponent(handle)}`;
}

async function fetchCitizenProfile(handle) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(citizenProfileUrl(handle), {
      headers: {
        "user-agent": "FSX-RSI-Verification/1.0",
        accept: "text/html",
      },
      signal: controller.signal,
    });

    if (response.status === 404) {
      throw new Error("That RSI handle profile was not found.");
    }
    if (!response.ok) {
      throw new Error(`RSI profile check failed with status ${response.status}.`);
    }

    return await response.text();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("RSI profile check timed out. Try again in a moment.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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
    if (profile.rsiStatus === "verified" && profile.rsiVerificationMethod !== "public_profile_code") {
      profile.rsiStatus = profile.rsiHandle && profile.rsiVerificationCode ? "pending" : "not_linked";
      profile.rsiVerifiedAt = "";
    }

    if (action === "start-rsi") {
      const rsiHandle = normalizeHandle(body.rsiHandle);
      if (!rsiHandle) {
        return sendJson(response, 400, { error: "Enter a valid RSI handle using letters, numbers, underscores, or hyphens." });
      }
      profile.rsiHandle = rsiHandle;
      profile.rsiStatus = "pending";
      profile.rsiVerificationCode = `FSX-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      profile.rsiVerifiedAt = "";
      profile.rsiVerificationMethod = "";
    } else if (action === "verify-rsi") {
      const code = normalizeCode(profile.rsiVerificationCode);
      if (!profile.rsiHandle || profile.rsiStatus !== "pending") {
        return sendJson(response, 400, { error: "Start RSI verification before checking the RSI profile." });
      }
      if (!code) {
        return sendJson(response, 400, { error: "Start RSI verification to generate a code first." });
      }

      const profileHtml = await fetchCitizenProfile(profile.rsiHandle);
      if (!profileHtml.toUpperCase().includes(code)) {
        return sendJson(response, 400, {
          error: `Could not find ${code} on the public RSI profile for ${profile.rsiHandle}. Add the code to the profile bio, save it, then try again.`,
        });
      }

      profile.rsiStatus = "verified";
      profile.rsiVerifiedAt = new Date().toISOString();
      profile.rsiVerificationMethod = "public_profile_code";
      profile.rsiVerificationCode = "";
    } else if (action === "clear-rsi") {
      profile.rsiHandle = "";
      profile.rsiStatus = "not_linked";
      profile.rsiVerificationCode = "";
      profile.rsiVerifiedAt = "";
      profile.rsiVerificationMethod = "";
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
