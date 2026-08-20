// Minimal stand-ins for the Vercel Node request/response objects, just
// enough surface for the api/*.js handlers to run against in tests.

function mockRequest({ method = "GET", url = "/", headers = {}, body = null } = {}) {
  return { method, url, headers, body };
}

function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    setHeader(name, value) {
      res.headers[String(name).toLowerCase()] = value;
      return res;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
    writeHead(code, headers = {}) {
      res.statusCode = code;
      Object.assign(res.headers, headers);
      return res;
    },
    end() {
      res.ended = true;
      return res;
    },
  };
  return res;
}

module.exports = { mockRequest, mockResponse };
