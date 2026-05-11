import { describe, expect, it } from "vitest";

import { exportRowsToCsv, studentsToExportRows } from "@/lib/eco/export";
import type { AdminStudentRow } from "@/lib/eco/types";

const students: AdminStudentRow[] = [
  {
    id: "student-a",
    studentName: "Alya",
    groupCode: "A",
    issueTitle: "Sungai",
    roleName: "Ilmuwan",
    status: "completed",
    progressPercent: 100,
    robloxClicks: 2,
    updatedAt: "2026-05-10",
  },
  {
    id: "student-b",
    studentName: "Bima",
    groupCode: "B",
    issueTitle: "Pesisir",
    roleName: "Warga",
    status: "discussion",
    progressPercent: 70,
    robloxClicks: 1,
    updatedAt: "2026-05-10",
  },
];

describe("export transformer", () => {
  it("filters students by group and status", () => {
    const rows = studentsToExportRows(students, {
      groupCode: "A",
      status: "completed",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].Nama).toBe("Alya");
    expect(rows[0].Status).toBe("Selesai");
  });

  it("escapes csv cells", () => {
    const csv = exportRowsToCsv([
      {
        Nama: 'Alya "A"',
        Kelompok: "A",
        Isu: "Sungai",
        Peran: "Ilmuwan",
        Status: "Selesai",
        Progress: "100%",
        "Klik Roblox": 1,
        "Update Terakhir": "2026-05-10",
        Feedback: "Kuat",
      },
    ]);

    expect(csv).toContain('"Alya ""A"""');
  });
});
