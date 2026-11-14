import { generateKeyPairSync, type KeyObject, sign } from "node:crypto";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

let requestHeaders = new Headers();
vi.mock("next/headers", () => ({ headers: async () => requestHeaders }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const TEAM = "owner.cloudflareaccess.com";
const AUD = "a1b2c3d4e5f6";
const NOW = Math.floor(Date.now() / 1000);

const keyPair = () => generateKeyPairSync("rsa", { modulusLength: 2048 });
const signing = keyPair();
const other = keyPair();
const jwk = (publicKey: KeyObject, kid: string) => ({ ...publicKey.export({ format: "jwk" }), kid, alg: "RS256", use: "sig" });

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = ({ claims = {}, header = {}, key = signing.privateKey }: { claims?: object; header?: object; key?: KeyObject } = {}) => {
  const unsigned = `${base64url({ alg: "RS256", kid: "k1", typ: "JWT", ...header })}.${base64url({
    iss: `https://${TEAM}`, aud: [AUD], email: "owner@example.com", iat: NOW, nbf: NOW, exp: NOW + 3600, ...claims,
  })}`;
  return `${unsigned}.${sign("sha256", Buffer.from(unsigned), key).toString("base64url")}`;
};

let certs: object[][];
const fetchCerts = vi.fn(async (url: string) => {
  expect(url).toBe(`https://${TEAM}/cdn-cgi/access/certs`);
  return new Response(JSON.stringify({ keys: certs.shift() ?? [] }));
});

const owner = async (assertion?: string) => {
  requestHeaders = new Headers(assertion ? { "Cf-Access-Jwt-Assertion": assertion } : {});
  return (await import("./access")).owner();
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("CF_ACCESS_TEAM_DOMAIN", TEAM);
  vi.stubEnv("CF_ACCESS_AUD", AUD);
  vi.stubGlobal("fetch", fetchCerts);
  fetchCerts.mockClear();
  certs = [[jwk(signing.publicKey, "k1")]];
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("a token Access signed for this application passes", async () => {
  await expect(owner(token())).resolves.toBeUndefined();
});

test("Access's keys are fetched once and kept", async () => {
  const { owner: check } = await import("./access");
  requestHeaders = new Headers({ "Cf-Access-Jwt-Assertion": token() });
  await check();
  await check();
  expect(fetchCerts).toHaveBeenCalledTimes(1);
});

test("a key Cloudflare rotated in is fetched once more and passes", async () => {
  certs = [[jwk(signing.publicKey, "k1")], [jwk(other.publicKey, "k2")]];
  const { owner: check } = await import("./access");
  requestHeaders = new Headers({ "Cf-Access-Jwt-Assertion": token() });
  await check();
  requestHeaders = new Headers({ "Cf-Access-Jwt-Assertion": token({ header: { kid: "k2" }, key: other.privateKey }) });
  await expect(check()).resolves.toBeUndefined();
  expect(fetchCerts).toHaveBeenCalledTimes(2);
});

test("an unknown key is looked up once more, then refused", async () => {
  certs = [[jwk(signing.publicKey, "k1")], [jwk(signing.publicKey, "k1")]];
  const { owner: check } = await import("./access");
  requestHeaders = new Headers({ "Cf-Access-Jwt-Assertion": token() });
  await check();
  requestHeaders = new Headers({ "Cf-Access-Jwt-Assertion": token({ header: { kid: "k9" } }) });
  await expect(check()).rejects.toThrow("NEXT_NOT_FOUND");
  expect(fetchCerts).toHaveBeenCalledTimes(2);
});

test.each([
  ["no token", undefined],
  ["not a token", "abc.def"],
  ["another application's audience", token({ claims: { aud: ["someone-else"] } })],
  ["another team's issuer", token({ claims: { iss: "https://other.cloudflareaccess.com" } })],
  ["an expired token", token({ claims: { exp: NOW - 60 } })],
  ["a token not valid yet", token({ claims: { nbf: NOW + 600 } })],
  ["a bad signature", token({ key: other.privateKey })],
  ["an algorithm other than RS256", token({ header: { alg: "HS256" } })],
])("%s is not found", async (_, assertion) => {
  await expect(owner(assertion)).rejects.toThrow("NEXT_NOT_FOUND");
});

test.each(["CF_ACCESS_TEAM_DOMAIN", "CF_ACCESS_AUD"])("without %s even a good token is not found, and nothing is fetched", async (name) => {
  vi.stubEnv(name, "");
  await expect(owner(token())).rejects.toThrow("NEXT_NOT_FOUND");
  expect(fetchCerts).not.toHaveBeenCalled();
});

test("a reply without keys is refused, and the next request fetches them again", async () => {
  fetchCerts.mockImplementationOnce(async () => new Response(JSON.stringify({ error: "rate limited" })));
  const { owner: check } = await import("./access");
  requestHeaders = new Headers({ "Cf-Access-Jwt-Assertion": token() });
  await expect(check()).rejects.toThrow("NEXT_NOT_FOUND");
  await expect(check()).resolves.toBeUndefined();
});

test("certs that can't be fetched fail closed", async () => {
  fetchCerts.mockRejectedValueOnce(new Error("network down"));
  await expect(owner(token())).rejects.toThrow("NEXT_NOT_FOUND");
});
