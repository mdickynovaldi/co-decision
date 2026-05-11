import { StudentFlow } from "@/components/student/student-flow";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ roleSlug: string }>;
}) {
  const { roleSlug } = await params;

  return <StudentFlow page="detail-peran" roleSlug={roleSlug} />;
}
