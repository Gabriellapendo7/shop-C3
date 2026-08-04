import crypto from "node:crypto";

// Reads the admin token from either an Authorization: Bearer header or an
// admin_token cookie. The cookie path exists because the admin page fetches with
// credentials: "include"; parsing by hand avoids a cookie-parser dependency.
function presentedToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();

  const cookies = req.headers.cookie;
  if (!cookies) return null;

  for (const pair of cookies.split(";")) {
    const [name, ...rest] = pair.trim().split("=");
    if (name === "admin_token") return decodeURIComponent(rest.join("="));
  }
  return null;
}

// Constant-time comparison so a near-miss token leaks nothing through response
// timing. timingSafeEqual throws on length mismatch, so hash both sides first to
// get equal-length buffers regardless of input length.
function tokensMatch(presented, expected) {
  const a = crypto.createHash("sha256").update(presented).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// Fails closed: with ADMIN_API_TOKEN unset there is no token that can match, so
// every request is rejected rather than the endpoint falling open.
export function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) {
    console.error("ADMIN_API_TOKEN is not set — refusing all admin requests");
    return res.status(503).json({ error: "Admin API is not configured" });
  }

  const presented = presentedToken(req);
  if (!presented || !tokensMatch(presented, expected)) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  next();
}
