const { decodeSession, parseCookies, publicUser, sessionCookie } = require("./_shared");
const { upsertUser } = require("../_users");

module.exports = async function handler(request, response) {
  const session = decodeSession(parseCookies(request)[sessionCookie]);
  if (session?.user) {
    await upsertUser(session.user);
  }

  response.setHeader("Cache-Control", "no-store");
  response.status(200).json({
    authenticated: Boolean(session),
    user: publicUser(session),
  });
};
