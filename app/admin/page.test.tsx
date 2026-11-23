// The admin page as the server renders it, from its address.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToString } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ owner: vi.fn(), storedBill: vi.fn(), billYears: vi.fn(), vppDays: vi.fn(), latestPayout: vi.fn() }));
vi.mock("@/lib/admin/access", () => ({ owner: mocks.owner }));
vi.mock("@/lib/admin/statement", () => ({ storedBill: mocks.storedBill, billYears: mocks.billYears }));
vi.mock("@/lib/true-up/reads", () => ({
  trueUpEndYear: async () => 2027,
  trueUpLabel: (year: number) => `'${(year - 1) % 100} - '${year % 100}`,
}));
vi.mock("@/lib/admin/vpp", () => ({ currentSeason: () => 2026, vppDays: mocks.vppDays, latestPayout: mocks.latestPayout }));
vi.mock("@/lib/scene/replay", () => ({ siteToday: () => "2026-11-14" }));
vi.mock("@/app/admin/actions", () => ({ saveBill: vi.fn(), markVppDay: vi.fn(), unmarkVppDay: vi.fn(), savePayout: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const { default: Page, metadata } = await import("./page");

const served = async (searchParams: Record<string, string> = {}) => renderToString(await Page({ searchParams: Promise.resolve(searchParams) }));

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.billYears.mockResolvedValue([2025, 2026]);
  mocks.storedBill.mockResolvedValue({ cycles: [], amountDue: null });
  mocks.vppDays.mockResolvedValue([{ date: "2026-08-12", kwh: 21.4 }]);
  mocks.latestPayout.mockResolvedValue({ season: 2025, amount: 728.26, paid_on: "2026-04-15" });
});

test("without the owner it is not found, and nothing is read", async () => {
  mocks.owner.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
  await expect(served()).rejects.toThrow("NEXT_NOT_FOUND");
  for (const read of [mocks.storedBill, mocks.billYears, mocks.vppDays, mocks.latestPayout]) expect(read).not.toHaveBeenCalled();
});

test("for the owner it has its three sections", async () => {
  const html = await served();
  for (const heading of ["Bill figures", "VPP days, 2026 season", "VPP payout"]) expect(html).toContain(heading);
  expect(mocks.vppDays).toHaveBeenCalledWith(2026);
  expect(html).toContain("21.4 kWh");
  expect(html).toContain("Recorded for the 2025 season: $728.26, paid April 15, 2026.");
  expect(html).toContain('<option value="2024">2024</option>');
});

test("no page links to it", () => {
  const root = join(__dirname, "../..");
  const files = (dir: string): string[] =>
    readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? files(join(dir, entry.name)) : /\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name) ? [join(dir, entry.name)] : []);
  const linking = ["app", "components"].flatMap(files)
    .filter((file) => !file.startsWith("app/admin/") && !file.startsWith("components/admin/"))
    .filter((file) => /["'`]\/admin\b/.test(readFileSync(join(root, file), "utf8")));
  expect(linking).toEqual([]);
});

test("it starts at the current true-up year, offering it and every year with stored cycles, newest first", async () => {
  const html = await served();
  expect(mocks.storedBill).toHaveBeenCalledWith(2027);
  const picker = html.slice(html.indexOf('aria-label="True-up year"'), html.indexOf("</select>"));
  expect([...picker.matchAll(/<option value="(\d+)"/g)].map((match) => match[1])).toEqual(["2027", "2026", "2025"]);
  expect(html).toContain("No cycles stored for &#x27;26 - &#x27;27 yet.");
});

test("a picked year is read", async () => {
  await served({ year: "2025" });
  expect(mocks.storedBill).toHaveBeenCalledWith(2025);
});

test.each(["2019", "next", ""])("an unknown year (%s) falls back to the current one", async (year) => {
  await served({ year });
  expect(mocks.storedBill).toHaveBeenCalledWith(2027);
});

// dashboard-shell, "Each page's title".
test("the page's title names it", () => {
  expect(metadata.title).toBe("Admin");
});
