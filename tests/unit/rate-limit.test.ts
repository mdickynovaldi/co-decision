import { describe, expect, it } from "vitest";

import { isRateLimited, rateLimitWindowStart } from "@/lib/eco/rate-limit";

describe("rate-limit helper", () => {
  it("calculates the rolling window start", () => {
    expect(
      rateLimitWindowStart(new Date("2026-05-10T10:00:00.000Z"), 60_000).toISOString(),
    ).toBe("2026-05-10T09:59:00.000Z");
  });

  it("limits only matching events inside the window", () => {
    const now = new Date("2026-05-10T10:00:00.000Z");

    expect(
      isRateLimited({
        eventKey: "student-login",
        limit: 2,
        windowMs: 60_000,
        now,
        events: [
          { eventKey: "student-login", createdAt: "2026-05-10T09:59:10.000Z" },
          { eventKey: "student-login", createdAt: "2026-05-10T09:59:30.000Z" },
          { eventKey: "admin-login", createdAt: "2026-05-10T09:59:40.000Z" },
          { eventKey: "student-login", createdAt: "2026-05-10T09:58:30.000Z" },
        ],
      }),
    ).toBe(true);
  });
});
