"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegisterReturn,
} from "react-hook-form";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  Leaf,
  Lock,
  LogIn,
  MessageSquareText,
  PenLine,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createIssueContent,
  createReflectionQuestion,
  createRoleCard,
  createStimulusAsset,
  deleteContentItem,
  deleteGroupContent,
  deleteStudentAnswers,
  getAdminDataset,
  saveIssueContent,
  saveReflectionQuestion,
  saveRoleCard,
  saveRubric,
  saveStimulusAsset,
  signInAdmin,
} from "@/lib/eco/client-api";
import type { AdminDataset } from "@/lib/eco/server/data";
import { groupCodes as fallbackGroupCodes, rubricCriteria } from "@/lib/eco/mock-data";
import type {
  AdminStudentRow,
  GroupCode,
  StudentStatus,
} from "@/lib/eco/types";
import {
  issueContentSchema,
  issueCreateSchema,
  loginSchema,
  reflectionQuestionContentSchema,
  reflectionQuestionCreateSchema,
  roleCardContentSchema,
  roleCardCreateSchema,
  rubricSchema,
  stimulusAssetContentSchema,
  stimulusAssetCreateSchema,
  type IssueCreateFormValues,
  type IssueContentFormValues,
  type LoginFormValues,
  type ReflectionQuestionContentFormValues,
  type ReflectionQuestionCreateFormValues,
  type RoleCardContentFormValues,
  type RoleCardCreateFormValues,
  type RubricFormValues,
  type StimulusAssetContentFormValues,
  type StimulusAssetCreateFormValues,
} from "@/lib/eco/validations";
import { statusLabel } from "@/lib/eco/progress";
import { cn } from "@/lib/utils";

type AdminPage =
  | "login"
  | "dashboard"
  | "siswa"
  | "siswa-detail"
  | "jawaban-stimulus"
  | "diskusi-roblox"
  | "solusi-akhir"
  | "rubrik"
  | "konten"
  | "export"
  | "audit-log";

type StudentSortBy =
  | "studentName"
  | "groupCode"
  | "status"
  | "progressPercent"
  | "updatedAt";

const navItems = [
  { href: "/admin/dashboard", label: "Overview", icon: Gauge },
  { href: "/admin/siswa", label: "Data Siswa", icon: Users },
  {
    href: "/admin/jawaban-stimulus",
    label: "Jawaban Stimulus",
    icon: FileText,
  },
  {
    href: "/admin/diskusi-roblox",
    label: "Diskusi Roblox",
    icon: MessageSquareText,
  },
  { href: "/admin/solusi-akhir", label: "Solusi Akhir", icon: ClipboardCheck },
  { href: "/admin/rubrik", label: "Rubrik", icon: BookOpenCheck },
  { href: "/admin/konten", label: "Konten", icon: Settings },
  { href: "/admin/export", label: "Export", icon: FileSpreadsheet },
  { href: "/admin/audit-log", label: "Audit Log", icon: ShieldCheck },
];

type AdminBackendState = Awaited<ReturnType<typeof getAdminDataset>>;

export function AdminShell({
  page,
  studentId,
}: {
  page: AdminPage;
  studentId?: string;
}) {
  const [data, setData] = useState<AdminBackendState | undefined>();
  const [loading, setLoading] = useState(page !== "login");
  const [error, setError] = useState("");

  useEffect(() => {
    if (page === "login") return;
    let active = true;
    getAdminDataset()
      .then((dataset) => {
        if (!active) return;
        setData(dataset);
        setError("");
      })
      .catch((requestError: Error) => {
        if (!active) return;
        setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  if (page === "login") return <AdminLoginPage onData={setData} />;

  return (
    <AdminLayout>
      {loading ? <AdminLoading /> : null}
      {!loading && error ? <AdminError message={error} /> : null}
      {!loading && !error && data ? (
        <>
          {page === "dashboard" ? <DashboardPage data={data} /> : null}
          {page === "siswa" ? (
            <StudentsPage data={data} onData={setData} />
          ) : null}
          {page === "siswa-detail" ? (
            <StudentDetailPage
              data={data}
              studentId={studentId}
              onData={setData}
            />
          ) : null}
          {page === "jawaban-stimulus" ? (
            <StimulusAnswersPage data={data} onData={setData} />
          ) : null}
          {page === "diskusi-roblox" ? (
            <RobloxDiscussionPage data={data} onData={setData} />
          ) : null}
          {page === "solusi-akhir" ? (
            <FinalSolutionsAdminPage data={data} onData={setData} />
          ) : null}
          {page === "rubrik" ? (
            <RubricPage data={data} onData={setData} />
          ) : null}
          {page === "konten" ? (
            <ContentPage data={data} onData={setData} />
          ) : null}
          {page === "export" ? <ExportPage data={data} /> : null}
          {page === "audit-log" ? <AuditLogPage data={data} /> : null}
        </>
      ) : null}
    </AdminLayout>
  );
}

function AdminLoginPage({
  onData,
}: {
  onData: (data: AdminBackendState) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError("");
    try {
      const dataset = await signInAdmin(values);
      onData(dataset);
      router.push("/admin/dashboard");
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Login belum berhasil.",
      );
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#F6FAF8_0%,#E8F4FB_100%)] px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Lock className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Login Guru/Admin</CardTitle>
          <CardDescription>
            Masuk memakai Supabase Auth. Akun harus memiliki role teacher,
            admin, atau super_admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                className="h-11 rounded-xl"
                placeholder="guru@sekolah.sch.id"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              <FieldError message={form.formState.errors.email?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                className="h-11 rounded-xl"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FieldError message={form.formState.errors.password?.message} />
            </div>
            {serverError ? (
              <Alert className="border-amber-300 bg-amber-50">
                <ShieldAlert
                  className="size-4 text-amber-700"
                  aria-hidden="true"
                />
                <AlertTitle>Login belum berhasil.</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" className="h-11 w-full rounded-xl">
              <LogIn className="size-4" aria-hidden="true" />
              {form.formState.isSubmitting ? "Memeriksa..." : "Masuk dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F6FAF8] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-border bg-white lg:border-b-0 lg:border-r">
          <div className="sticky top-0 flex flex-col gap-5 p-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Leaf className="size-5" aria-hidden="true" />
              </span>
              Eco-Decision
            </Link>
            <nav className="grid gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className="h-10 justify-start rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <Link href={item.href}>
                    <item.icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>
            {/* <Alert className="border-emerald-200 bg-emerald-50">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              <AlertTitle>Supabase aktif</AlertTitle>
              <AlertDescription>
                Dashboard membaca data dari Supabase dan dilindungi RLS.
              </AlertDescription>
            </Alert> */}
          </div>
        </aside>
        <section className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</section>
      </div>
    </main>
  );
}

function AdminLoading() {
  return (
    <AdminSection
      eyebrow="Memuat"
      title="Mengambil data dashboard"
      description="Data sedang dibaca dari Supabase."
    >
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Memuat...
        </CardContent>
      </Card>
    </AdminSection>
  );
}

function AdminError({ message }: { message: string }) {
  return (
    <AdminSection
      eyebrow="Terjadi kendala"
      title="Dashboard belum bisa dimuat"
      description="Periksa konfigurasi Supabase, login admin, atau RLS."
    >
      <Alert className="border-amber-300 bg-amber-50">
        <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
        <AlertTitle>Data belum tersedia.</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </AdminSection>
  );
}

function DashboardPage({ data }: { data: AdminDataset }) {
  const total = data.students.length;
  const completed = data.students.filter(
    (student) => student.status === "completed",
  ).length;
  const clicks = data.students.reduce(
    (sum, student) => sum + student.robloxClicks,
    0,
  );
  const avgProgress = total
    ? Math.round(
        data.students.reduce(
          (sum, student) => sum + student.progressPercent,
          0,
        ) / total,
      )
    : 0;

  return (
    <AdminSection
      eyebrow="Dashboard guru"
      title="Overview pembelajaran"
      description="Pantau progres kelas, klik Map Roblox, dan status pengumpulan solusi."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Total siswa" value={String(total)} />
        <MetricCard
          icon={ClipboardCheck}
          label="Siswa selesai"
          value={String(completed)}
        />
        <MetricCard
          icon={BarChart3}
          label="Rata-rata progress"
          value={`${avgProgress}%`}
        />
        <MetricCard
          icon={Download}
          label="Klik Roblox Map"
          value={String(clicks)}
        />
      </div>
      <StudentsTable rows={data.students.slice(0, 5)} />
    </AdminSection>
  );
}

function StudentsPage({
  data,
  onData,
}: {
  data: AdminDataset;
  onData: (data: AdminBackendState) => void;
}) {
  const availableGroupCodes = data.groupCodes.length
    ? data.groupCodes
    : fallbackGroupCodes;
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | GroupCode>("all");
  const [status, setStatus] = useState<"all" | StudentStatus>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<StudentSortBy>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    const pending = window.setTimeout(() => {
      if (active) setIsRefreshing(true);
    }, 0);
    getAdminDataset({
      query,
      groupCode: group,
      status,
      page,
      pageSize: data.studentPage.pageSize,
      sortBy,
      sortDir,
    })
      .then((dataset) => {
        if (active) onData(dataset);
      })
      .finally(() => {
        window.clearTimeout(pending);
        if (active) setIsRefreshing(false);
      });

    return () => {
      active = false;
      window.clearTimeout(pending);
    };
  }, [
    data.studentPage.pageSize,
    group,
    onData,
    page,
    query,
    sortBy,
    sortDir,
    status,
  ]);

  function toggleSort(nextSortBy: typeof sortBy) {
    if (nextSortBy === sortBy) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(nextSortBy);
      setSortDir("asc");
    }
    setPage(1);
  }

  return (
    <AdminSection
      eyebrow="Data siswa"
      title="Monitoring siswa dan kelompok"
      description="Gunakan filter untuk melihat status dan progres siswa."
      actions={
        <StudentFilters
          query={query}
          groupCodes={availableGroupCodes}
          group={group}
          status={status}
          onQuery={(value) => {
            setQuery(value);
            setPage(1);
          }}
          onGroup={(value) => {
            setGroup(value);
            setPage(1);
          }}
          onStatus={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
      }
    >
      {isRefreshing ? (
        <p className="text-sm font-medium text-primary">
          Memperbarui filter...
        </p>
      ) : null}
      <StudentsTable
        rows={data.students}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={toggleSort}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Halaman {data.studentPage.page} dari {data.studentPage.pageCount} -{" "}
          {data.studentPage.total} siswa
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            disabled={page <= 1 || isRefreshing}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Sebelumnya
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            disabled={page >= data.studentPage.pageCount || isRefreshing}
            onClick={() => setPage((current) => current + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </AdminSection>
  );
}

function StudentDetailPage({
  data,
  studentId,
  onData,
}: {
  data: AdminDataset;
  studentId?: string;
  onData: (data: AdminBackendState) => void;
}) {
  const student =
    data.students.find((item) => item.id === studentId) ?? data.students[0];
  const [serverMessage, setServerMessage] = useState("");
  const form = useForm<RubricFormValues>({
    resolver: zodResolver(rubricSchema),
    values: {
      studentSessionId: student?.id ?? "",
      problemUnderstandingScore:
        student?.rubric?.problemUnderstandingScore ?? 4,
      roleAlignmentScore: student?.rubric?.roleAlignmentScore ?? 4,
      discussionQualityScore: student?.rubric?.discussionQualityScore ?? 4,
      solutionQualityScore: student?.rubric?.solutionQualityScore ?? 4,
      actionCommitmentScore: student?.rubric?.actionCommitmentScore ?? 4,
      feedbackText:
        student?.rubric?.feedbackText ??
        "Tambahkan alasan mengapa solusi ini realistis.",
    },
  });

  async function onSubmit(values: RubricFormValues) {
    setServerMessage("");
    try {
      const nextData = await saveRubric(values);
      onData(nextData);
      setServerMessage("Feedback sudah tersimpan.");
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error
          ? requestError.message
          : "Feedback belum tersimpan.",
      );
    }
  }

  if (!student) return <EmptyState title="Belum ada siswa" />;

  const reflections = data.reflectionSummaries.filter(
    (item) => item.studentSessionId === student.id,
  );
  const discussion = data.discussions.find(
    (item) => item.studentSessionId === student.id,
  );
  const final = data.finalSolutions.find(
    (item) => item.studentSessionId === student.id,
  );

  return (
    <AdminSection
      eyebrow="Detail siswa"
      title={student.studentName}
      description={`${student.issueTitle} - Peran ${student.roleName}`}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Jawaban dan progres</CardTitle>
            <CardDescription>
              Ringkasan refleksi, diskusi Roblox, dan solusi akhir dari
              Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {reflections.length ? (
              reflections.map((answer) => (
                <DetailBlock
                  key={`${answer.studentSessionId}-${answer.questionText}`}
                  title={answer.questionText}
                  body={answer.answerText}
                />
              ))
            ) : (
              <DetailBlock
                title="Refleksi stimulus"
                body="Belum ada jawaban refleksi."
              />
            )}
            <DetailBlock
              title="Hasil diskusi Roblox"
              body={discussion?.observationText ?? "Belum ada hasil diskusi."}
            />
            <DetailBlock
              title="Solusi akhir"
              body={final?.finalSolutionText ?? "Belum ada solusi akhir."}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Feedback guru</CardTitle>
            <CardDescription>
              Simpan skor dan feedback untuk siswa ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <RubricScoreGrid form={form} />
              <Textarea
                className="min-h-32 rounded-xl"
                {...form.register("feedbackText")}
              />
              <FieldError
                message={form.formState.errors.feedbackText?.message}
              />
              {serverMessage ? (
                <p className="text-sm font-medium text-primary">
                  {serverMessage}
                </p>
              ) : null}
              <Button type="submit" className="h-11 rounded-xl">
                {form.formState.isSubmitting
                  ? "Menyimpan..."
                  : "Simpan feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminSection>
  );
}

function useRowSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setAll(ids: string[], checked: boolean) {
    setSelected(checked ? new Set(ids) : new Set());
  }

  function clear() {
    setSelected(new Set());
  }

  return { selected, toggle, setAll, clear };
}

function BulkDeleteControl({
  count,
  description,
  onConfirm,
  label = "Hapus terpilih",
}: {
  count: number;
  description: string;
  onConfirm: () => Promise<void>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function changeOpen(next: boolean) {
    if (busy) return;
    setOpen(next);
    if (!next) setError("");
  }

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      setOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal menghapus.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="h-10 rounded-xl"
        disabled={count === 0}
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {label} ({count})
      </Button>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>Hapus {count} data terpilih?</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => changeOpen(false)}
              disabled={busy}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={confirm}
              disabled={busy}
            >
              {busy ? "Menghapus..." : "Ya, hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StimulusAnswersPage({
  data,
  onData,
}: {
  data: AdminDataset;
  onData: (data: AdminBackendState) => void;
}) {
  const { selected, toggle, setAll, clear } = useRowSelection();
  const ids = data.reflectionSummaries.map((answer) => answer.id);
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id));

  async function handleDelete() {
    const nextData = await deleteStudentAnswers(
      "reflection",
      Array.from(selected),
    );
    onData(nextData);
    clear();
  }

  return (
    <AdminSection
      eyebrow="Jawaban stimulus"
      title="Refleksi siswa"
      description="Jawaban refleksi siswa yang tersimpan di Supabase."
      actions={
        <BulkDeleteControl
          count={selected.size}
          description="Semua jawaban refleksi dari siswa terpilih dihapus permanen, dan progresnya dikembalikan ke tahap stimulus agar bisa mengisi ulang."
          onConfirm={handleDelete}
        />
      }
    >
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={(checked) => setAll(ids, checked === true)}
                    aria-label="Pilih semua jawaban"
                    disabled={ids.length === 0}
                  />
                </TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Pertanyaan</TableHead>
                <TableHead>Jawaban</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reflectionSummaries.map((answer) => (
                <TableRow key={answer.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(answer.id)}
                      onCheckedChange={() => toggle(answer.id)}
                      aria-label={`Pilih jawaban ${answer.studentName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {answer.studentName}
                  </TableCell>
                  <TableCell className="min-w-64">
                    {answer.questionText}
                  </TableCell>
                  <TableCell className="min-w-96 text-muted-foreground">
                    {answer.answerText}
                  </TableCell>
                </TableRow>
              ))}
              {!data.reflectionSummaries.length ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState title="Belum ada jawaban refleksi" />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminSection>
  );
}

function RobloxDiscussionPage({
  data,
  onData,
}: {
  data: AdminDataset;
  onData: (data: AdminBackendState) => void;
}) {
  const { selected, toggle, clear } = useRowSelection();

  async function handleDelete() {
    const nextData = await deleteStudentAnswers(
      "discussion",
      Array.from(selected),
    );
    onData(nextData);
    clear();
  }

  return (
    <AdminSection
      eyebrow="Diskusi Roblox"
      title="Hasil observasi dan klik map"
      description="Melihat event Roblox dan hasil diskusi kelompok."
      actions={
        <BulkDeleteControl
          count={selected.size}
          description="Hasil diskusi terpilih dihapus permanen. Progres siswa terkait dikembalikan ke tahap diskusi agar bisa mengisi ulang."
          onConfirm={handleDelete}
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {data.discussions.map((discussion) => (
          <Card key={discussion.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1"
                    checked={selected.has(discussion.id)}
                    onCheckedChange={() => toggle(discussion.id)}
                    aria-label={`Pilih hasil diskusi ${discussion.studentName}`}
                  />
                  <div>
                    <CardTitle>{discussion.studentName}</CardTitle>
                    <CardDescription>{discussion.issueTitle}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-lg">
                  {discussion.robloxClicks} klik
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>{discussion.observationText}</p>
              <p className="font-medium text-foreground">Solusi sementara:</p>
              <p>{discussion.groupSolutionDraft}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {!data.discussions.length ? (
        <EmptyState title="Belum ada hasil diskusi" />
      ) : null}
    </AdminSection>
  );
}

function FinalSolutionsAdminPage({
  data,
  onData,
}: {
  data: AdminDataset;
  onData: (data: AdminBackendState) => void;
}) {
  const { selected, toggle, clear } = useRowSelection();

  async function handleDelete() {
    const nextData = await deleteStudentAnswers("final", Array.from(selected));
    onData(nextData);
    clear();
  }

  return (
    <AdminSection
      eyebrow="Solusi akhir"
      title="Rekap solusi dan komitmen"
      description="Ringkasan solusi akhir untuk ditinjau guru."
      actions={
        <BulkDeleteControl
          count={selected.size}
          description="Solusi akhir terpilih dihapus permanen. Status siswa terkait dikembalikan dari 'selesai' ke tahap solusi akhir agar bisa mengisi ulang."
          onConfirm={handleDelete}
        />
      }
    >
      <div className="grid gap-4">
        {data.finalSolutions.map((solution) => (
          <Card key={solution.id}>
            <CardContent className="grid gap-4 p-5 md:grid-cols-[24px_240px_1fr]">
              <Checkbox
                className="mt-1"
                checked={selected.has(solution.id)}
                onCheckedChange={() => toggle(solution.id)}
                aria-label={`Pilih solusi akhir ${solution.studentName}`}
              />
              <div>
                <h2 className="font-semibold text-eco-ink">
                  {solution.studentName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kelompok {solution.groupCode} - {solution.roleName}
                </p>
              </div>
              <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>{solution.finalSolutionText}</p>
                <p>
                  <span className="font-medium text-foreground">Komitmen:</span>{" "}
                  {solution.personalCommitmentText}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!data.finalSolutions.length ? (
        <EmptyState title="Belum ada solusi akhir" />
      ) : null}
    </AdminSection>
  );
}

function RubricPage({
  data,
  onData,
}: {
  data: AdminDataset;
  onData: (data: AdminBackendState) => void;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    data.students[0]?.id ?? "",
  );
  const selectedStudent =
    data.students.find((student) => student.id === selectedStudentId) ??
    data.students[0];
  const { selected, toggle, setAll, clear } = useRowSelection();
  const scoredStudents = data.rubricScores;
  const scoredIds = scoredStudents.map((score) => score.studentSessionId);
  const allScoredChecked =
    scoredIds.length > 0 && scoredIds.every((id) => selected.has(id));

  async function handleDeleteScores() {
    const nextData = await deleteStudentAnswers("rubric", Array.from(selected));
    onData(nextData);
    clear();
  }

  return selectedStudent ? (
    <>
      <AdminSection
        eyebrow="Rubrik penilaian"
        title="Pilih siswa untuk dinilai"
        description="Semua siswa yang sudah terdaftar di Supabase bisa dipilih dari daftar ini."
      >
        <Card>
          <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_320px] md:items-center">
            <div>
              <p className="text-sm font-medium text-eco-ink">
                {data.students.length} siswa tersedia
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Saat ini menilai {selectedStudent.studentName} dari Kelompok{" "}
                {selectedStudent.groupCode}.
              </p>
            </div>
            <Select
              value={selectedStudent.id}
              onValueChange={setSelectedStudentId}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.studentName} - Kelompok {student.groupCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </AdminSection>
      <AdminSection
        eyebrow="Hapus penilaian"
        title="Skor rubrik tersimpan"
        description="Pilih siswa untuk menghapus skor dan feedback rubriknya. Siswa tetap ada dan bisa dinilai ulang."
        actions={
          <BulkDeleteControl
            count={selected.size}
            label="Hapus skor terpilih"
            description="Skor dan feedback rubrik untuk siswa terpilih akan dihapus permanen. Siswa tetap ada dan bisa dinilai ulang."
            onConfirm={handleDeleteScores}
          />
        }
      >
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allScoredChecked}
                      onCheckedChange={(checked) =>
                        setAll(scoredIds, checked === true)
                      }
                      aria-label="Pilih semua skor"
                      disabled={scoredIds.length === 0}
                    />
                  </TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Kelompok</TableHead>
                  <TableHead>Status skor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoredStudents.map((score) => (
                  <TableRow key={score.studentSessionId}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(score.studentSessionId)}
                        onCheckedChange={() => toggle(score.studentSessionId)}
                        aria-label={`Pilih skor ${score.studentName}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {score.studentName}
                    </TableCell>
                    <TableCell>Kelompok {score.groupCode}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {score.status === "saved" ? "Tersimpan" : "Draft"}
                    </TableCell>
                  </TableRow>
                ))}
                {!scoredStudents.length ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyState title="Belum ada skor rubrik tersimpan" />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AdminSection>
      <StudentDetailPage
        key={selectedStudent.id}
        data={data}
        studentId={selectedStudent.id}
        onData={onData}
      />
    </>
  ) : (
    <AdminSection
      eyebrow="Rubrik penilaian"
      title="Skor dan feedback"
      description="Pilih siswa setelah data registrasi tersedia."
    >
      <EmptyState title="Belum ada siswa untuk dinilai" />
    </AdminSection>
  );
}

function ContentPage({
  data,
  onData,
}: {
  data: AdminDataset;
  onData: (data: AdminBackendState) => void;
}) {
  const [selectedIssueId, setSelectedIssueId] = useState(
    data.issues[0]?.id ?? "",
  );
  const selectedIssue =
    data.issues.find((issue) => issue.id === selectedIssueId) ?? data.issues[0];
  const [serverMessage, setServerMessage] = useState("");
  const [deleteArmedGroup, setDeleteArmedGroup] = useState<string | null>(null);
  const form = useForm<IssueContentFormValues>({
    resolver: zodResolver(issueContentSchema),
    values: selectedIssue
      ? {
          issueId: selectedIssue.id,
          title: selectedIssue.title,
          description: selectedIssue.description,
          content: selectedIssue.content,
          robloxMapUrl: selectedIssue.robloxMapUrl ?? "",
          isPublished: selectedIssue.isPublished,
        }
      : undefined,
  });

  async function onSubmit(values: IssueContentFormValues) {
    setServerMessage("");
    try {
      const nextData = await saveIssueContent(values);
      onData(nextData);
      setServerMessage("Konten tersimpan di Supabase.");
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error
          ? requestError.message
          : "Konten belum tersimpan.",
      );
    }
  }

  async function onDeleteSelectedGroup() {
    if (!selectedIssue) return;
    if (deleteArmedGroup !== selectedIssue.groupCode) {
      setDeleteArmedGroup(selectedIssue.groupCode);
      setServerMessage(
        `Klik sekali lagi untuk menghapus Kelompok ${selectedIssue.groupCode} beserta isi isunya.`,
      );
      return;
    }

    setServerMessage("");
    try {
      const nextData = await deleteGroupContent(selectedIssue.groupCode);
      onData(nextData);
      setDeleteArmedGroup(null);
      setServerMessage(`Kelompok ${selectedIssue.groupCode} sudah dihapus.`);
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error
          ? requestError.message
          : "Kelompok belum dihapus.",
      );
    }
  }

  if (!selectedIssue) {
    return <EmptyState title="Belum ada konten isu" />;
  }

  return (
    <AdminSection
      eyebrow="Pengaturan konten"
      title="Kelola isu, stimulus, role, dan link Roblox"
      description="Perubahan tersimpan di Supabase dan langsung dipakai alur siswa."
    >
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Daftar isu</CardTitle>
            <CardDescription>Pilih isu untuk diedit.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {data.issues.map((issue) => (
              <Button
                key={issue.id}
                type="button"
                variant={selectedIssue.id === issue.id ? "secondary" : "ghost"}
                className="h-auto justify-start rounded-xl py-3 text-left"
                onClick={() => setSelectedIssueId(issue.id)}
              >
                Kelompok {issue.groupCode} - {issue.title}
              </Button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-lg">
                Kelompok {selectedIssue.groupCode}
              </Badge>
              <Badge
                variant={selectedIssue.robloxMapUrl ? "secondary" : "outline"}
                className="rounded-lg"
              >
                {selectedIssue.robloxMapUrl
                  ? "Link Roblox tersedia"
                  : "Link kosong"}
              </Badge>
            </div>
            <CardTitle>Edit konten isu</CardTitle>
            <CardDescription>
              Link kosong akan menampilkan safe state di halaman siswa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <LabeledInput
                label="Judul"
                id="issueTitle"
                register={form.register("title")}
              />
              <LabeledInput
                label="Deskripsi"
                id="issueDescription"
                register={form.register("description")}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="issueContent">
                  Narasi kasus
                </label>
                <Textarea
                  id="issueContent"
                  className="min-h-36 rounded-xl"
                  {...form.register("content")}
                />
              </div>
              <LabeledInput
                label="URL Roblox"
                id="robloxUrl"
                register={form.register("robloxMapUrl")}
              />
              <Controller
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <Select
                    value={field.value ? "published" : "draft"}
                    onValueChange={(value) =>
                      field.onChange(value === "published")
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {serverMessage ? (
                <p className="text-sm font-medium text-primary">
                  {serverMessage}
                </p>
              ) : null}
              <Button type="submit" className="h-11 rounded-xl">
                <PenLine className="size-4" aria-hidden="true" />
                {form.formState.isSubmitting ? "Menyimpan..." : "Simpan konten"}
              </Button>
            </form>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-sm font-medium text-eco-ink">
                Hapus kelompok daftar isu
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Menghapus Kelompok {selectedIssue.groupCode} akan menghapus semua
                isu, stimulus, dan pertanyaan refleksi yang memakai kode kelompok
                ini.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  className="h-10 rounded-xl"
                  onClick={onDeleteSelectedGroup}
                >
                  {deleteArmedGroup === selectedIssue.groupCode
                    ? "Konfirmasi hapus"
                    : "Hapus kelompok & isi"}
                </Button>
                {deleteArmedGroup === selectedIssue.groupCode ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl"
                    onClick={() => {
                      setDeleteArmedGroup(null);
                      setServerMessage("");
                    }}
                  >
                    Batal
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <CreateIssueCard onData={onData} />
        <ReflectionQuestionManager data={data} onData={onData} />
        <StimulusAssetManager data={data} onData={onData} />
        <RoleCardManager data={data} onData={onData} />
      </div>
    </AdminSection>
  );
}

function CreateIssueCard({
  onData,
}: {
  onData: (data: AdminBackendState) => void;
}) {
  const [serverMessage, setServerMessage] = useState("");
  const form = useForm<IssueCreateFormValues>({
    resolver: zodResolver(issueCreateSchema),
    defaultValues: {
      groupCode: "A",
      slug: "isu-baru",
      title: "Isu baru",
      description: "Deskripsi singkat isu baru.",
      content: "Tuliskan narasi kasus lingkungan untuk siswa di sini.",
      thumbnailTone: "from-emerald-100 via-sky-100 to-white",
      robloxMapUrl: "",
      isPublished: false,
    },
  });

  async function onSubmit(values: IssueCreateFormValues) {
    setServerMessage("");
    try {
      const nextData = await createIssueContent(values);
      onData(nextData);
      setServerMessage("Isu baru dibuat.");
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error
          ? requestError.message
          : "Isu belum dibuat.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah isu</CardTitle>
        <CardDescription>
          Buat skenario baru untuk kelompok atau kelas lain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <LabeledInput
            label="Kode kelompok"
            id="newIssueGroupCode"
            register={form.register("groupCode")}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Pakai kode baru seperti F atau BIO-1 untuk membuat kelompok baru.
          </p>
          <LabeledInput
            label="Slug"
            id="newIssueSlug"
            register={form.register("slug")}
          />
          <LabeledInput
            label="Judul"
            id="newIssueTitle"
            register={form.register("title")}
          />
          <LabeledInput
            label="Deskripsi"
            id="newIssueDescription"
            register={form.register("description")}
          />
          <Textarea
            className="min-h-24 rounded-xl"
            {...form.register("content")}
          />
          <Controller
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <Select
                value={field.value ? "published" : "draft"}
                onValueChange={(value) => field.onChange(value === "published")}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {serverMessage ? (
            <p className="text-sm font-medium text-primary">{serverMessage}</p>
          ) : null}
          <Button type="submit" className="h-11 rounded-xl">
            Buat isu
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ReflectionQuestionManager({
  data,
  onData,
}: {
  data: AdminDataset;
  onData: (data: AdminBackendState) => void;
}) {
  const [selectedId, setSelectedId] = useState(
    data.reflectionQuestions[0]?.id ?? "",
  );
  const selected =
    data.reflectionQuestions.find((question) => question.id === selectedId) ??
    data.reflectionQuestions[0];
  const [serverMessage, setServerMessage] = useState("");
  const form = useForm<ReflectionQuestionContentFormValues>({
    resolver: zodResolver(reflectionQuestionContentSchema),
    values: selected
      ? {
          questionId: selected.id,
          issueId: selected.issueId ?? "",
          questionText: selected.questionText,
          orderIndex: selected.orderIndex,
          isRequired: selected.isRequired,
          isPublished: selected.isPublished,
        }
      : undefined,
  });
  const createForm = useForm<ReflectionQuestionCreateFormValues>({
    resolver: zodResolver(reflectionQuestionCreateSchema),
    defaultValues: {
      issueId: "",
      questionText: "Pertanyaan refleksi baru?",
      orderIndex: data.reflectionQuestions.length + 1,
      isRequired: true,
      isPublished: true,
    },
  });

  async function save(values: ReflectionQuestionContentFormValues) {
    setServerMessage("");
    try {
      const nextData = await saveReflectionQuestion(values);
      onData(nextData);
      setServerMessage("Pertanyaan diperbarui.");
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error
          ? requestError.message
          : "Gagal menyimpan.",
      );
    }
  }

  async function create(values: ReflectionQuestionCreateFormValues) {
    setServerMessage("");
    try {
      const nextData = await createReflectionQuestion(values);
      onData(nextData);
      setServerMessage("Pertanyaan baru dibuat.");
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error ? requestError.message : "Gagal membuat.",
      );
    }
  }

  async function remove() {
    if (!selected) return;
    const nextData = await deleteContentItem("question", selected.id);
    onData(nextData);
    setSelectedId(nextData.reflectionQuestions[0]?.id ?? "");
    setServerMessage("Pertanyaan dihapus.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pertanyaan refleksi</CardTitle>
        <CardDescription>
          Edit, publish/unpublish, tambah, atau hapus pertanyaan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {selected ? (
          <form className="space-y-3" onSubmit={form.handleSubmit(save)}>
            <Select value={selected.id} onValueChange={setSelectedId}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.reflectionQuestions.map((question) => (
                  <SelectItem key={question.id} value={question.id}>
                    {question.questionText}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              className="min-h-20 rounded-xl"
              {...form.register("questionText")}
            />
            <LabeledInput
              label="Urutan"
              id="questionOrder"
              register={form.register("orderIndex", { valueAsNumber: true })}
            />
            <PublishSelect control={form.control} name="isPublished" />
            {serverMessage ? (
              <p className="text-sm font-medium text-primary">
                {serverMessage}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="h-10 rounded-xl">
                Simpan pertanyaan
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={remove}
              >
                Hapus
              </Button>
            </div>
          </form>
        ) : null}
        <form
          className="grid gap-3 border-t border-border pt-4"
          onSubmit={createForm.handleSubmit(create)}
        >
          <Textarea
            className="min-h-20 rounded-xl"
            {...createForm.register("questionText")}
          />
          <Button type="submit" variant="outline" className="h-10 rounded-xl">
            Tambah pertanyaan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StimulusAssetManager({
  data,
  onData,
}: {
  data: AdminDataset;
  onData: (data: AdminBackendState) => void;
}) {
  const [selectedId, setSelectedId] = useState(
    data.stimulusAssets[0]?.id ?? "",
  );
  const selected =
    data.stimulusAssets.find((asset) => asset.id === selectedId) ??
    data.stimulusAssets[0];
  const [serverMessage, setServerMessage] = useState("");
  const firstIssueId = data.issues[0]?.id ?? "";
  const form = useForm<StimulusAssetContentFormValues>({
    resolver: zodResolver(stimulusAssetContentSchema),
    values: selected
      ? {
          assetId: selected.id,
          issueId: selected.issueId,
          assetType: selected.assetType,
          title: selected.title,
          url: selected.url,
          description: selected.description ?? "",
          orderIndex: selected.orderIndex,
          isPublished: selected.isPublished,
        }
      : undefined,
  });
  const createForm = useForm<StimulusAssetCreateFormValues>({
    resolver: zodResolver(stimulusAssetCreateSchema),
    defaultValues: {
      issueId: firstIssueId,
      assetType: "link",
      title: "Stimulus baru",
      url: "https://www.roblox.com/",
      description: "",
      orderIndex: data.stimulusAssets.length + 1,
      isPublished: true,
    },
  });

  async function save(values: StimulusAssetContentFormValues) {
    setServerMessage("");
    try {
      const nextData = await saveStimulusAsset(values);
      onData(nextData);
      setServerMessage("Aset stimulus diperbarui.");
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error
          ? requestError.message
          : "Gagal menyimpan.",
      );
    }
  }

  async function create(values: StimulusAssetCreateFormValues) {
    setServerMessage("");
    try {
      const nextData = await createStimulusAsset(values);
      onData(nextData);
      setServerMessage("Aset stimulus baru dibuat.");
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error ? requestError.message : "Gagal membuat.",
      );
    }
  }

  async function remove() {
    if (!selected) return;
    const nextData = await deleteContentItem("asset", selected.id);
    onData(nextData);
    setSelectedId(nextData.stimulusAssets[0]?.id ?? "");
    setServerMessage("Aset stimulus dihapus.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aset stimulus</CardTitle>
        <CardDescription>
          Kelola tautan, gambar, video, atau dokumen stimulus.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {selected ? (
          <form className="space-y-3" onSubmit={form.handleSubmit(save)}>
            <Select value={selected.id} onValueChange={setSelectedId}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.stimulusAssets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <IssueSelect
              control={form.control}
              issues={data.issues}
              name="issueId"
            />
            <AssetTypeSelect control={form.control} name="assetType" />
            <LabeledInput
              label="Judul"
              id="assetTitle"
              register={form.register("title")}
            />
            <LabeledInput
              label="URL"
              id="assetUrl"
              register={form.register("url")}
            />
            <Textarea
              className="min-h-20 rounded-xl"
              {...form.register("description")}
            />
            <LabeledInput
              label="Urutan"
              id="assetOrder"
              register={form.register("orderIndex", { valueAsNumber: true })}
            />
            <PublishSelect control={form.control} name="isPublished" />
            {serverMessage ? (
              <p className="text-sm font-medium text-primary">
                {serverMessage}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="h-10 rounded-xl">
                Simpan aset
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={remove}
              >
                Hapus
              </Button>
            </div>
          </form>
        ) : null}
        <form
          className="grid gap-3 border-t border-border pt-4"
          onSubmit={createForm.handleSubmit(create)}
        >
          <IssueSelect
            control={createForm.control}
            issues={data.issues}
            name="issueId"
          />
          <AssetTypeSelect control={createForm.control} name="assetType" />
          <LabeledInput
            label="Judul"
            id="newAssetTitle"
            register={createForm.register("title")}
          />
          <LabeledInput
            label="URL"
            id="newAssetUrl"
            register={createForm.register("url")}
          />
          <Button type="submit" variant="outline" className="h-10 rounded-xl">
            Tambah aset
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function buildUniqueSlug(base: string, takenSlugs: Iterable<string>) {
  const taken = new Set(takenSlugs);
  const root = base.trim().toLowerCase() || "peran";
  if (!taken.has(root)) return root;
  let counter = 2;
  while (taken.has(`${root}-${counter}`)) counter += 1;
  return `${root}-${counter}`;
}

function RoleCardManager({
  data,
  onData,
}: {
  data: AdminDataset;
  onData: (data: AdminBackendState) => void;
}) {
  const [selectedId, setSelectedId] = useState(data.roleCards[0]?.id ?? "");
  const selected =
    data.roleCards.find((role) => role.id === selectedId) ?? data.roleCards[0];
  const [serverMessage, setServerMessage] = useState("");
  const form = useForm<RoleCardContentFormValues>({
    resolver: zodResolver(roleCardContentSchema),
    values: selected
      ? {
          roleCardId: selected.id,
          name: selected.name,
          slug: selected.slug,
          avatar: selected.avatar,
          shortDescription: selected.shortDescription,
          mission: selected.mission,
          interest: selected.interest,
          alternatives: selected.alternatives,
          decisionCriteria: selected.decisionCriteria,
          checklist: selected.checklist,
          isPublished: selected.isPublished,
        }
      : undefined,
  });
  const createForm = useForm<RoleCardCreateFormValues>({
    resolver: zodResolver(roleCardCreateSchema),
    defaultValues: {
      name: "Peran baru",
      slug: "peran-baru",
      avatar: "PB",
      shortDescription: "Deskripsi singkat peran baru.",
      mission: "Misi peran baru dalam diskusi kelompok.",
      interest: "Kepentingan utama yang perlu diwakili peran ini.",
      alternatives: ["Usulan alternatif pertama."],
      decisionCriteria: ["Kriteria keputusan pertama."],
      checklist: ["Langkah observasi pertama."],
      isPublished: false,
    },
  });

  async function save(values: RoleCardContentFormValues) {
    setServerMessage("");
    try {
      const nextData = await saveRoleCard(values);
      onData(nextData);
      setServerMessage("Role card diperbarui.");
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error
          ? requestError.message
          : "Gagal menyimpan.",
      );
    }
  }

  async function create(values: RoleCardCreateFormValues) {
    setServerMessage("");
    const uniqueSlug = buildUniqueSlug(
      values.slug,
      data.roleCards.map((role) => role.slug),
    );
    try {
      const nextData = await createRoleCard({ ...values, slug: uniqueSlug });
      onData(nextData);
      const created = nextData.roleCards.find((role) => role.slug === uniqueSlug);
      if (created) setSelectedId(created.id);
      setServerMessage(
        uniqueSlug === values.slug
          ? "Role card baru dibuat."
          : `Role card baru dibuat dengan slug "${uniqueSlug}".`,
      );
    } catch (requestError) {
      setServerMessage(
        requestError instanceof Error ? requestError.message : "Gagal membuat.",
      );
    }
  }

  async function remove() {
    if (!selected) return;
    const nextData = await deleteContentItem("role", selected.id);
    onData(nextData);
    setSelectedId(nextData.roleCards[0]?.id ?? "");
    setServerMessage("Role card dihapus.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role card</CardTitle>
        <CardDescription>
          Edit peran stakeholder, publish/unpublish, atau tambah peran.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {selected ? (
          <form className="space-y-3" onSubmit={form.handleSubmit(save)}>
            <Select value={selected.id} onValueChange={setSelectedId}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.roleCards.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid gap-3 sm:grid-cols-3">
              <LabeledInput
                label="Nama"
                id="roleName"
                register={form.register("name")}
              />
              <LabeledInput
                label="Slug"
                id="roleSlug"
                register={form.register("slug")}
              />
              <LabeledInput
                label="Avatar"
                id="roleAvatar"
                register={form.register("avatar")}
              />
            </div>
            <Textarea
              className="min-h-20 rounded-xl"
              {...form.register("shortDescription")}
            />
            <Textarea
              className="min-h-20 rounded-xl"
              {...form.register("mission")}
            />
            <Textarea
              className="min-h-20 rounded-xl"
              {...form.register("interest")}
            />
            <PublishSelect control={form.control} name="isPublished" />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="h-10 rounded-xl">
                Simpan role
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={remove}
              >
                Hapus
              </Button>
            </div>
          </form>
        ) : null}
        <form
          className="grid gap-3 border-t border-border pt-4"
          onSubmit={createForm.handleSubmit(create)}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <LabeledInput
              label="Nama"
              id="newRoleName"
              register={createForm.register("name")}
            />
            <LabeledInput
              label="Slug"
              id="newRoleSlug"
              register={createForm.register("slug")}
            />
            <LabeledInput
              label="Avatar"
              id="newRoleAvatar"
              register={createForm.register("avatar")}
            />
          </div>
          <Button type="submit" variant="outline" className="h-10 rounded-xl">
            Tambah role
          </Button>
        </form>
        {serverMessage ? (
          <p className="text-sm font-medium text-primary">{serverMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ExportPage({ data }: { data: AdminDataset }) {
  const availableGroupCodes = data.groupCodes.length
    ? data.groupCodes
    : fallbackGroupCodes;
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [groupCode, setGroupCode] = useState<"all" | GroupCode>("all");
  const [status, setStatus] = useState<"all" | StudentStatus>("all");
  const [exported, setExported] = useState(false);

  function exportData() {
    const params = new URLSearchParams({
      format,
      groupCode,
      status,
    });
    window.location.href = `/api/export?${params.toString()}`;
    setExported(true);
  }

  return (
    <AdminSection
      eyebrow="Export data"
      title="Unduh data pembelajaran"
      description="Export CSV/XLSX dari Supabase sesuai filter."
    >
      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-4">
          <FilterSelect
            label="Kelompok"
            value={groupCode}
            onValue={(value) => setGroupCode(value as "all" | GroupCode)}
          >
            <SelectItem value="all">Semua kelompok</SelectItem>
            {availableGroupCodes.map((code) => (
              <SelectItem key={code} value={code}>
                Kelompok {code}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Status"
            value={status}
            onValue={(value) => setStatus(value as typeof status)}
          >
            <SelectItem value="all">Semua status</SelectItem>
            {(
              [
                "registered",
                "issue",
                "stimulus",
                "role",
                "discussion",
                "final",
                "completed",
              ] as StudentStatus[]
            ).map((item) => (
              <SelectItem key={item} value={item}>
                {statusLabel(item)}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Format"
            value={format}
            onValue={(value) => setFormat(value as typeof format)}
          >
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="xlsx">XLSX</SelectItem>
          </FilterSelect>
          <div className="flex items-end">
            <Button
              type="button"
              className="h-11 rounded-xl"
              onClick={exportData}
            >
              <Download className="size-4" aria-hidden="true" />
              Export data
            </Button>
          </div>
          {exported ? (
            <p className="md:col-span-4 text-sm font-medium text-primary">
              Export dimulai. Event export dicatat di audit log.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AdminSection>
  );
}

function AuditLogPage({ data }: { data: AdminDataset }) {
  return (
    <AdminSection
      eyebrow="Audit log"
      title="Aktivitas penting"
      description="Log aktivitas penting yang tersimpan di Supabase."
    >
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="min-w-44">
                    {new Date(log.createdAt).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell className="min-w-72 text-muted-foreground">
                    {log.detail}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {!data.auditLogs.length ? (
        <EmptyState title="Belum ada audit log" />
      ) : null}
    </AdminSection>
  );
}

function AdminSection({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-eco-ink">{title}</h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="size-6 text-primary" aria-hidden="true" />
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-eco-ink">{value}</p>
      </CardContent>
    </Card>
  );
}

function StudentFilters({
  query,
  groupCodes,
  group,
  status,
  onQuery,
  onGroup,
  onStatus,
}: {
  query: string;
  groupCodes: GroupCode[];
  group: "all" | GroupCode;
  status: "all" | StudentStatus;
  onQuery: (value: string) => void;
  onGroup: (value: "all" | GroupCode) => void;
  onStatus: (value: "all" | StudentStatus) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[220px_150px_170px]">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          className="h-11 rounded-xl pl-9"
          placeholder="Cari siswa"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
      </div>
      <Select
        value={group}
        onValueChange={(value) => onGroup(value as "all" | GroupCode)}
      >
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua</SelectItem>
          {groupCodes.map((code) => (
            <SelectItem key={code} value={code}>
              Kelompok {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={status}
        onValueChange={(value) => onStatus(value as "all" | StudentStatus)}
      >
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua status</SelectItem>
          {(
            [
              "registered",
              "issue",
              "stimulus",
              "role",
              "discussion",
              "final",
              "completed",
            ] as StudentStatus[]
          ).map((item) => (
            <SelectItem key={item} value={item}>
              {statusLabel(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StudentsTable({
  rows,
  sortBy,
  sortDir,
  onSort,
}: {
  rows: AdminStudentRow[];
  sortBy?: StudentSortBy;
  sortDir?: "asc" | "desc";
  onSort?: (sortBy: StudentSortBy) => void;
}) {
  const sortMark = (field: StudentSortBy) =>
    sortBy === field ? (sortDir === "asc" ? " ↑" : " ↓") : "";
  const headerButton = (label: string, field: StudentSortBy) =>
    onSort ? (
      <button
        type="button"
        className="font-medium text-foreground"
        onClick={() => onSort(field)}
      >
        {label}
        {sortMark(field)}
      </button>
    ) : (
      label
    );

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{headerButton("Nama", "studentName")}</TableHead>
              <TableHead>{headerButton("Kelompok", "groupCode")}</TableHead>
              <TableHead>Isu</TableHead>
              <TableHead>{headerButton("Status", "status")}</TableHead>
              <TableHead>
                {headerButton("Progress", "progressPercent")}
              </TableHead>
              <TableHead>Roblox</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="min-w-48 font-medium">
                  {student.studentName}
                </TableCell>
                <TableCell>Kelompok {student.groupCode}</TableCell>
                <TableCell className="min-w-60 text-muted-foreground">
                  {student.issueTitle}
                </TableCell>
                <TableCell>
                  <StatusBadge status={student.status} />
                </TableCell>
                <TableCell>
                  <div className="flex min-w-32 items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${student.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {student.progressPercent}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>{student.robloxClicks} klik</TableCell>
                <TableCell>
                  <Button asChild variant="outline" className="h-9 rounded-xl">
                    <Link href={`/admin/siswa/${student.id}`}>Detail</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState title="Tidak ada siswa sesuai filter" />
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: StudentStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-lg", statusClass(status))}>
      {statusLabel(status)}
    </Badge>
  );
}

function statusClass(status: StudentStatus) {
  if (status === "completed")
    return "border-primary/30 bg-primary/10 text-primary";
  if (status === "final") return "border-amber-300 bg-amber-50 text-amber-800";
  if (status === "discussion") return "border-river/30 bg-sky-50 text-river";
  return "border-border bg-muted text-muted-foreground";
}

function DetailBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <h2 className="font-semibold text-eco-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function RubricScoreGrid({
  form,
}: {
  form: ReturnType<typeof useForm<RubricFormValues>>;
}) {
  const fields: Array<keyof RubricFormValues> = [
    "problemUnderstandingScore",
    "roleAlignmentScore",
    "discussionQualityScore",
    "solutionQualityScore",
    "actionCommitmentScore",
  ];

  return (
    <div className="grid gap-2">
      {fields.map((field, index) => (
        <div key={field} className="grid gap-2 sm:grid-cols-[1fr_120px]">
          <label className="text-sm font-medium">{rubricCriteria[index]}</label>
          <Controller
            control={form.control}
            name={field}
            render={({ field: controlField }) => (
              <Select
                value={String(controlField.value)}
                onValueChange={(value) => controlField.onChange(Number(value))}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <SelectItem key={score} value={String(score)}>
                      Skor {score}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      ))}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValue,
  children,
}: {
  label: string;
  value: string;
  onValue: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={onValue}>
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function PublishSelect<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          value={field.value ? "published" : "draft"}
          onValueChange={(value) => field.onChange(value === "published")}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      )}
    />
  );
}

function IssueSelect<T extends FieldValues>({
  control,
  issues,
  name,
}: {
  control: Control<T>;
  issues: AdminDataset["issues"];
  name: Path<T>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {issues.map((issue) => (
              <SelectItem key={issue.id} value={issue.id}>
                Kelompok {issue.groupCode} - {issue.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

function AssetTypeSelect<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
      )}
    />
  );
}

function LabeledInput({
  label,
  id,
  register,
}: {
  label: string;
  id: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <Input id={id} className="h-11 rounded-xl" {...register} />
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        {title}
      </CardContent>
    </Card>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm font-medium text-destructive">{message}</p>;
}
