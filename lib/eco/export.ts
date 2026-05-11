import type { AdminStudentRow, GroupCode, StudentStatus } from "@/lib/eco/types";
import { statusLabel } from "@/lib/eco/progress";

export type ExportFilters = {
  groupCode: GroupCode | "all";
  status: StudentStatus | "all";
};

export type ExportRow = {
  Nama: string;
  Kelompok: string;
  Isu: string;
  Peran: string;
  Status: string;
  Progress: string;
  "Klik Roblox": number;
  "Update Terakhir": string;
  Feedback: string;
};

export const exportHeaders: Array<keyof ExportRow> = [
  "Nama",
  "Kelompok",
  "Isu",
  "Peran",
  "Status",
  "Progress",
  "Klik Roblox",
  "Update Terakhir",
  "Feedback",
];

export function studentsToExportRows(
  students: AdminStudentRow[],
  filters: ExportFilters,
) {
  return students
    .filter((student) => filters.groupCode === "all" || student.groupCode === filters.groupCode)
    .filter((student) => filters.status === "all" || student.status === filters.status)
    .map((student) => ({
      Nama: student.studentName,
      Kelompok: student.groupCode,
      Isu: student.issueTitle,
      Peran: student.roleName,
      Status: statusLabel(student.status),
      Progress: `${student.progressPercent}%`,
      "Klik Roblox": student.robloxClicks,
      "Update Terakhir": student.updatedAt,
      Feedback: student.rubric?.feedbackText ?? "",
    }));
}

export function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function exportRowsToCsv(rows: ExportRow[]) {
  return [
    exportHeaders.map(csvEscape).join(","),
    ...rows.map((row) =>
      exportHeaders.map((key) => csvEscape(String(row[key] ?? ""))).join(","),
    ),
  ].join("\n");
}
