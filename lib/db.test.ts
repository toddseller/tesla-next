import { expect, test } from "vitest";
import { db } from "./db";

test("every session starts read-only", () => {
  expect(db.options.options).toContain("-c default_transaction_read_only=on");
});
