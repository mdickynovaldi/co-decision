import type { StudentStatus } from "@/lib/eco/types";

export function getResumePath(status?: StudentStatus) {
  if (!status) return "/masuk";
  if (status === "completed") return "/selesai";
  if (status === "final") return "/solusi-akhir";
  if (status === "discussion") return "/diskusi";
  if (status === "role") return "/peran";
  if (status === "stimulus") return "/stimulus";
  if (status === "issue") return "/isu";

  return "/isu";
}

export function progressPercent(progressStep: number) {
  return Math.max(10, Math.min(100, Math.round((progressStep / 10) * 100)));
}

export function statusLabel(status: StudentStatus) {
  const labels: Record<StudentStatus, string> = {
    registered: "Terdaftar",
    issue: "Pilih isu",
    stimulus: "Stimulus",
    role: "Pilih peran",
    discussion: "Diskusi",
    final: "Solusi akhir",
    completed: "Selesai",
  };

  return labels[status];
}
