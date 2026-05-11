import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminShell page="siswa-detail" studentId={id} />;
}
