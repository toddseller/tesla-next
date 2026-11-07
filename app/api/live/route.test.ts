import { expect, test, vi } from "vitest";

vi.mock("pg", () => ({
  Client: class {
    on() {}
    connect() {
      return Promise.reject(new Error("database down"));
    }
  },
}));

const { GET } = await import("./route");

test("asks the browser to retry later when the database is unreachable", async () => {
  const response = await GET(new Request("http://localhost/api/live"));
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("retry: 5000\n\n");
});
