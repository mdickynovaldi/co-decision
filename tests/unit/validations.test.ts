import { describe, expect, it } from "vitest";

import {
  discussionSchema,
  exportSchema,
  finalSolutionSchema,
  groupCodeSchema,
  loginSchema,
  registrationSchema,
  rubricSchema,
} from "@/lib/eco/validations";

describe("Eco-Decision validation schemas", () => {
  it("accepts a complete student registration", () => {
    const result = registrationSchema.safeParse({
      email: "SISWA@Sekolah.sch.id",
      password: "Password123!",
      studentName: "Siti Rahma",
      groupCode: "A",
      classCode: "ECO-DEMO",
      ready: true,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("siswa@sekolah.sch.id");
  });

  it("rejects incomplete registration readiness", () => {
    const result = registrationSchema.safeParse({
      email: "siswa@sekolah.sch.id",
      password: "Password123!",
      studentName: "A",
      groupCode: "A",
      classCode: "ECO-DEMO",
      ready: false,
    });

    expect(result.success).toBe(false);
  });

  it("accepts dynamic group codes", () => {
    expect(groupCodeSchema.parse("f")).toBe("F");
    expect(groupCodeSchema.parse("BIO-1")).toBe("BIO-1");
    expect(groupCodeSchema.safeParse("kelompok baru").success).toBe(false);
  });

  it("validates login payload", () => {
    expect(
      loginSchema.safeParse({ email: "guru@eco.test", password: "secret" }).success,
    ).toBe(true);
    expect(loginSchema.safeParse({ email: "x", password: "" }).success).toBe(false);
  });

  it("validates discussion and final solution boundaries", () => {
    expect(
      discussionSchema.safeParse({
        observationText: "Ada limbah terlihat di dekat sungai.",
        visibleProblemText: "Air sungai berubah warna.",
        roleOpinionText: "Sebagai ilmuwan, perlu uji kualitas air.",
        otherRolesOpinionText: "Warga ingin air bersih.",
        groupSolutionDraft: "Kelompok mengusulkan monitoring dan edukasi.",
        agreedRolesCount: 5,
      }).success,
    ).toBe(true);

    expect(
      finalSolutionSchema.safeParse({
        finalSolutionText: "Melakukan monitoring kualitas air secara berkala.",
        actionStepsText: "Membuat jadwal uji air dan forum warga.",
        personalCommitmentText: "Saya akan ikut menjaga sungai.",
      }).success,
    ).toBe(true);
  });

  it("validates rubric and export filters", () => {
    expect(
      rubricSchema.safeParse({
        studentSessionId: "00000000-0000-4000-8000-000000000000",
        problemUnderstandingScore: 4,
        roleAlignmentScore: 4,
        discussionQualityScore: 5,
        solutionQualityScore: 4,
        actionCommitmentScore: 5,
        feedbackText: "Solusi sudah kuat dan realistis.",
      }).success,
    ).toBe(true);

    expect(exportSchema.parse({ format: "xlsx", groupCode: "A", status: "completed" })).toEqual({
      format: "xlsx",
      groupCode: "A",
      status: "completed",
    });
  });
});
