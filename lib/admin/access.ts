import { createPublicKey, type JsonWebKey, verify } from "node:crypto";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

// Cloudflare Access's signing keys, kept between requests. Cloudflare rotates them, so a token signed by a key not
// kept here fetches them once more before it is refused.
let keys: (JsonWebKey & { kid?: string })[] = [];

const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString());

const keyFor = async (team: string, kid: string) => {
  const kept = keys.find((key) => key.kid === kid);
  if (kept) return kept;
  // A reply without keys (an error or a rate limit) keeps none, so the next request fetches them again.
  keys = (await (await fetch(`https://${team}/cdn-cgi/access/certs`)).json()).keys ?? [];
  return keys.find((key) => key.kid === kid);
};

const signedByAccess = async (assertion: string, team: string, audience: string) => {
  const [header, payload, signature] = assertion.split(".");
  const { alg, kid } = decode(header);
  if (alg !== "RS256") return false;
  const key = await keyFor(team, kid);
  if (!key || !verify("sha256", Buffer.from(`${header}.${payload}`), createPublicKey({ key, format: "jwk" }), Buffer.from(signature, "base64url"))) {
    return false;
  }
  const { iss, aud, exp, nbf } = decode(payload);
  const now = Date.now() / 1000;
  return iss === `https://${team}` && [aud].flat().includes(audience) && now < exp && !(now < nbf);
};

// The admin page's only lock: Cloudflare Access guards /admin, but server actions can be posted through any path, so
// the page and every action check the token Access signed. Anything less is not found, keeping the page hidden.
export async function owner() {
  const team = process.env.CF_ACCESS_TEAM_DOMAIN;
  const audience = process.env.CF_ACCESS_AUD;
  const assertion = (await headers()).get("cf-access-jwt-assertion");
  if (!team || !audience || !assertion || !(await signedByAccess(assertion, team, audience).catch(() => false))) notFound();
}
