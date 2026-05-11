import { describe, expect, it } from "vitest";

import { getResumePath, progressPercent, statusLabel } from "@/lib/eco/progress";

describe("student progress helpers", () => {
  it("maps status to resume route", () => {
    expect(getResumePath()).toBe("/masuk");
    expect(getResumePath("registered")).toBe("/isu");
    expect(getResumePath("discussion")).toBe("/diskusi");
    expect(getResumePath("completed")).toBe("/selesai");
  });

  it("bounds progress percentage", () => {
    expect(progressPercent(1)).toBe(10);
    expect(progressPercent(5)).toBe(50);
    expect(progressPercent(99)).toBe(100);
  });

  it("returns Indonesian status labels", () => {
    expect(statusLabel("final")).toBe("Solusi akhir");
    expect(statusLabel("completed")).toBe("Selesai");
  });
});
