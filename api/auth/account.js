const crypto = require("node:crypto");
const {
  clearCookieHeader,
  cookieHeader,
  decodeSession,
  encodeSession,
  parseCookies,
  publicUser,
  sessionCookie,
} = require("./_shared");
const { upsertUser } = require("../_users");
const { checkRateLimit } = require("../_supabase");

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

async function handleLogout(request, response) {
  response.setHeader("Set-Cookie", clearCookieHeader(sessionCookie));
  response.writeHead(302, { Location: "/" });
  response.end();
}

async function handleSession(request, response) {
  const session = decodeSession(parseCookies(request)[sessionCookie]);
  if (session?.user) {
    await upsertUser(session.user);
  }

  response.setHeader("Cache-Control", "no-store");
  return sendJson(response, 200, {
    authenticated: Boolean(session),
    user: publicUser(session),
  });
}

async function handleProfile(request, response) {
  const session = decodeSession(parseCookies(request)[sessionCookie]);
  if (!session?.user?.discordId) {
    return sendJson(response, 401, { error: "Posting requires a linked Discord account." });
  }

  const body = requestBody(request);
  const action = body.action;

  await checkRateLimit(`profile:${session.user.id}`, 15, 600);
  if (action === "verify-rsi") {
    // Tighter limit: this hits an external RSI profile page per call.
    await checkRateLimit(`rsi-verify:${session.user.id}`, 5, 600);
  }

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
  await upsertUser(session.user);

  response.setHeader("Set-Cookie", cookieHeader(sessionCookie, encodeSession(session)));
  return sendJson(response, 200, { user: publicUser(session) });
}

// Consolidated from the former logout.js/profile.js/session.js so the deployment
// stays under Vercel's Hobby-plan serverless function cap. Dispatch by method +
// ?action= query so each previous route's URL-observable behavior is preserved:
// GET /api/auth/account            -> session check (was /api/auth/session)
// GET /api/auth/account?action=logout -> clears cookie + redirects (was /api/auth/logout)
// POST /api/auth/account           -> RSI profile actions (was /api/auth/profile)
module.exports = async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const action = new URL(request.url, "http://localhost").searchParams.get("action");
      if (action === "logout") {
        return handleLogout(request, response);
      }
      return handleSession(request, response);
    }

    if (request.method === "POST") {
      return await handleProfile(request, response);
    }

    response.setHeader("allow", "GET, POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return sendJson(response, error?.statusCode || 500, {
      error: error instanceof Error ? error.message : "Account request failed",
    });
  }
};
