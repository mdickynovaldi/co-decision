"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  Leaf,
  Play,
  Save,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { Controller, useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  getIssueByGroup,
  issues as fallbackIssues,
  groupCodes,
  recommendedActions,
  reflectionQuestions as fallbackReflectionQuestions,
  roleCards as fallbackRoleCards,
} from "@/lib/eco/mock-data";
import {
  registerStudent,
  saveDiscussion,
  saveReflection,
  selectIssue,
  selectRole,
  signInStudent,
  signOutStudent,
  submitFinalSolution,
  trackRobloxClick,
  getStudentState,
} from "@/lib/eco/client-api";
import { getResumePath } from "@/lib/eco/progress";
import type {
  Issue,
  ReflectionQuestion,
  RoleCard,
  StimulusAsset,
  StudentProgress,
} from "@/lib/eco/types";
import {
  discussionSchema,
  finalSolutionSchema,
  loginSchema,
  reflectionSchema,
  registrationSchema,
  type DiscussionFormValues,
  type FinalSolutionFormValues,
  type LoginFormValues,
  type ReflectionFormValues,
  type RegistrationFormValues,
} from "@/lib/eco/validations";
import { cn } from "@/lib/utils";
import {
  InfoPanel,
  ResetProgressButton,
  StartRequired,
  StudentFrame,
} from "@/components/student/student-shared";

type StudentPage =
  | "masuk"
  | "mulai"
  | "registrasi"
  | "isu"
  | "stimulus"
  | "peran"
  | "detail-peran"
  | "diskusi"
  | "hasil-diskusi"
  | "solusi-akhir"
  | "selesai"
  | "lanjutkan";

export function StudentFlow({
  page,
  roleSlug,
}: {
  page: StudentPage;
  roleSlug?: string;
}) {
  const { state, loading, error, setState } = useStudentState();
  const progress = state?.progress;
  const catalog = {
    issues: state?.issues?.length ? state.issues : fallbackIssues,
    stimulusAssets: state?.stimulusAssets?.length ? state.stimulusAssets : [],
    reflectionQuestions: state?.reflectionQuestions?.length
      ? state.reflectionQuestions
      : fallbackReflectionQuestions,
    roleCards: state?.roleCards?.length ? state.roleCards : fallbackRoleCards,
  };

  if (page === "mulai") return <StartPage progress={progress} />;
  if (page === "masuk") return <LoginPage onState={setState} />;
  if (page === "registrasi") return <RegistrationPage onState={setState} />;

  if (loading) return <StudentLoading />;
  if (error) return <StudentError message={error} />;
  if (page === "lanjutkan") {
    return <ResumePage progress={progress} catalog={catalog} />;
  }

  if (!progress) return <StartRequired />;

  if (page === "isu") {
    return <IssuePage progress={progress} catalog={catalog} onState={setState} />;
  }
  if (page === "stimulus") {
    return <StimulusPage progress={progress} catalog={catalog} onState={setState} />;
  }
  if (page === "peran") {
    return <RoleSelectionPage progress={progress} catalog={catalog} onState={setState} />;
  }
  if (page === "detail-peran") {
    return (
      <RoleDetailPage
        progress={progress}
        roleSlug={roleSlug}
        catalog={catalog}
        onState={setState}
      />
    );
  }
  if (page === "diskusi") {
    return <DiscussionMapPage progress={progress} catalog={catalog} onState={setState} />;
  }
  if (page === "hasil-diskusi") {
    return <DiscussionResultPage progress={progress} onState={setState} />;
  }
  if (page === "solusi-akhir") {
    return <FinalSolutionPage progress={progress} onState={setState} />;
  }
  if (page === "selesai") {
    return <DonePage progress={progress} catalog={catalog} />;
  }

  return <StartRequired />;
}

type StudentCatalog = {
  issues: Issue[];
  stimulusAssets: StimulusAsset[];
  reflectionQuestions: ReflectionQuestion[];
  roleCards: RoleCard[];
};

type StudentBackendState = Awaited<ReturnType<typeof getStudentState>>;

function useStudentState() {
  const [state, setState] = useState<StudentBackendState | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getStudentState()
      .then((nextState) => {
        if (!active) return;
        setState(nextState);
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
  }, []);

  return { state, loading, error, setState };
}

function findIssueByGroup(catalog: StudentCatalog, groupCode: StudentProgress["groupCode"]) {
  return (
    catalog.issues.find((issue) => issue.groupCode === groupCode) ??
    getIssueByGroup(groupCode)
  );
}

function findIssue(catalog: StudentCatalog, issueId?: string) {
  return catalog.issues.find((issue) => issue.id === issueId);
}

function findRole(catalog: StudentCatalog, roleCardId?: string) {
  return catalog.roleCards.find((role) => role.id === roleCardId);
}

function findRoleBySlug(catalog: StudentCatalog, slug?: string) {
  return catalog.roleCards.find((role) => role.slug === slug);
}

function StudentLoading() {
  return (
    <StudentFrame
      eyebrow="Memuat data"
      title="Mengambil progresmu"
      description="Kami sedang membaca data dari Supabase."
    >
      <Card>
        <CardContent className="p-6 text-muted-foreground">Memuat...</CardContent>
      </Card>
    </StudentFrame>
  );
}

function StudentError({ message }: { message: string }) {
  return (
    <StudentFrame
      eyebrow="Terjadi kendala"
      title="Data belum bisa dimuat"
      description="Periksa konfigurasi Supabase atau coba lagi sebentar."
    >
      <Alert className="border-amber-300 bg-amber-50">
        <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
        <AlertTitle>Data belum tersedia.</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button asChild className="h-11 rounded-xl">
        <Link href="/masuk">Masuk siswa</Link>
      </Button>
    </StudentFrame>
  );
}

function StartPage({ progress }: { progress?: StudentProgress }) {
  return (
    <StudentFrame
      eyebrow="Mulai pembelajaran"
      title="Ikuti alur role-play dari awal sampai solusi akhir"
      description="Kamu akan membaca isu lingkungan, memilih peran stakeholder, masuk ke Map Roblox, lalu menyusun solusi bersama kelompok."
      aside={
        <InfoPanel
          title="Yang akan kamu lakukan"
          items={[
            "Isi nama dan kelompok.",
            "Baca stimulus fenomena.",
            "Pilih peran diskusi.",
            "Buka Map Roblox di tab baru.",
            "Kembali ke website untuk mengirim solusi.",
          ]}
        />
      }
    >
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <Button asChild className="h-12 rounded-xl text-base">
            <Link href={progress ? "/lanjutkan" : "/registrasi"}>
              {progress ? "Lanjutkan progres" : "Ayo mulai"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-xl text-base"
          >
            <Link href="/masuk">
              Masuk siswa
              <BookOpen className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </StudentFrame>
  );
}

function RegistrationPage({
  onState,
}: {
  onState: (state: StudentBackendState) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      password: "",
      studentName: "",
      groupCode: "A",
      classCode: "ECO-DEMO",
      ready: false,
    },
  });

  async function onSubmit(values: RegistrationFormValues) {
    setServerError("");
    try {
      const nextState = await registerStudent(values);
      onState(nextState);
      router.push("/isu");
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Registrasi belum berhasil.",
      );
    }
  }

  return (
    <StudentFrame
      eyebrow="Registrasi siswa"
      title="Isi identitas awal"
      description="Buat akun siswa agar progres tersimpan di Supabase dan bisa dilanjutkan setelah refresh."
      step={1}
      aside={
        <InfoPanel
          title="Catatan akun siswa"
          items={[
            "Gunakan email yang bisa kamu ingat.",
            "Kode kelas demo: ECO-DEMO.",
            "Data siswa hanya tampil di dashboard guru/admin.",
          ]}
        />
      }
    >
      <Card>
        <CardContent className="p-6">
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email siswa
                </label>
                <Input
                  id="email"
                  type="email"
                  className="h-11 rounded-xl"
                  placeholder="siswa@sekolah.sch.id"
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
                  placeholder="Minimal 8 karakter, huruf besar, huruf kecil, angka"
                  aria-invalid={Boolean(form.formState.errors.password)}
                  {...form.register("password")}
                />
                <FieldError message={form.formState.errors.password?.message} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="studentName">
                Nama lengkap
              </label>
              <Input
                id="studentName"
                className="h-11 rounded-xl"
                placeholder="Contoh: Siti Rahma"
                aria-invalid={Boolean(form.formState.errors.studentName)}
                {...form.register("studentName")}
              />
              <FieldError message={form.formState.errors.studentName?.message} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="groupCode"
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kelompok</label>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="h-11 w-full rounded-xl"
                        aria-invalid={Boolean(form.formState.errors.groupCode)}
                      >
                        <SelectValue placeholder="Pilih kelompok" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupCodes.map((code) => (
                          <SelectItem key={code} value={code}>
                            Kelompok {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError
                      message={form.formState.errors.groupCode?.message}
                    />
                  </div>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="classCode">
                  Kode kelas
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    (opsional)
                  </span>
                </label>
                <Input
                  id="classCode"
                  className="h-11 rounded-xl"
                  placeholder="Contoh: IPA-1"
                  aria-invalid={Boolean(form.formState.errors.classCode)}
                  {...form.register("classCode")}
                />
                <FieldError message={form.formState.errors.classCode?.message} />
              </div>
            </div>

            <Controller
              control={form.control}
              name="ready"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm leading-6">
                    <Checkbox
                      className="mt-1"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      aria-invalid={Boolean(form.formState.errors.ready)}
                    />
                    <span>
                      Saya siap mengikuti pembelajaran, berdiskusi dengan sopan,
                      dan kembali ke website setelah eksplorasi Roblox.
                    </span>
                  </label>
                  <FieldError message={form.formState.errors.ready?.message} />
                </div>
              )}
            />

            {serverError ? (
              <Alert className="border-amber-300 bg-amber-50">
                <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
                <AlertTitle>Registrasi belum berhasil.</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="h-12 rounded-xl text-base">
              {form.formState.isSubmitting ? "Menyimpan..." : "Lanjut pilih isu"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </StudentFrame>
  );
}

function LoginPage({ onState }: { onState: (state: StudentBackendState) => void }) {
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
      const nextState = await signInStudent(values);
      onState(nextState);
      router.push("/lanjutkan");
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Login belum berhasil.",
      );
    }
  }

  return (
    <StudentFrame
      eyebrow="Masuk siswa"
      title="Lanjutkan progres dari Supabase"
      description="Masuk dengan akun siswa yang dibuat saat registrasi."
      aside={
        <InfoPanel
          title="Belum punya akun?"
          items={[
            "Buka halaman registrasi siswa.",
            "Pilih kelompok dan kode kelas.",
            "Setelah itu progresmu tersimpan otomatis.",
          ]}
        />
      }
    >
      <Card>
        <CardContent className="p-6">
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="loginEmail">
                Email
              </label>
              <Input
                id="loginEmail"
                type="email"
                className="h-11 rounded-xl"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              <FieldError message={form.formState.errors.email?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="loginPassword">
                Password
              </label>
              <Input
                id="loginPassword"
                type="password"
                className="h-11 rounded-xl"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FieldError message={form.formState.errors.password?.message} />
            </div>
            {serverError ? (
              <Alert className="border-amber-300 bg-amber-50">
                <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
                <AlertTitle>Login belum berhasil.</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="h-12 rounded-xl text-base">
                {form.formState.isSubmitting ? "Memeriksa..." : "Masuk"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl text-base">
                <Link href="/registrasi">Registrasi siswa</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </StudentFrame>
  );
}

function IssuePage({
  progress,
  catalog,
  onState,
}: {
  progress: StudentProgress;
  catalog: StudentCatalog;
  onState: (state: StudentBackendState) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  async function handleSelect(issueId: string) {
    setServerError("");
    try {
      const nextState = await selectIssue(issueId);
      onState(nextState);
      router.push("/stimulus");
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Isu belum bisa dipilih.",
      );
    }
  }

  return (
    <StudentFrame
      eyebrow="Pilih isu lingkungan"
      title="Pilih skenario yang akan dibahas kelompokmu"
      description="Isu sesuai kelompokmu sudah disorot. Kamu tetap bisa melihat skenario lain untuk memahami pilihan yang tersedia."
      step={2}
      aside={
        <InfoPanel
          title="Kelompokmu"
          items={[
            `Nama: ${progress.studentName}`,
            `Kelompok ${progress.groupCode}`,
            `Rekomendasi isu: ${findIssueByGroup(catalog, progress.groupCode).title}`,
          ]}
        />
      }
    >
      {serverError ? (
        <Alert className="border-amber-300 bg-amber-50">
          <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
          <AlertTitle>Isu belum tersimpan.</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {catalog.issues.map((issue) => {
          const recommended = issue.groupCode === progress.groupCode;
          const selected = issue.id === progress.issueId;

          return (
            <Card
              key={issue.id}
              className={cn(
                "overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md",
                recommended && "border-primary/50 ring-2 ring-primary/10",
              )}
            >
              <div
                className={cn("h-24 bg-gradient-to-br", issue.thumbnailTone)}
              />
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-lg">Kelompok {issue.groupCode}</Badge>
                  {recommended ? (
                    <Badge variant="outline" className="rounded-lg">
                      Disarankan
                    </Badge>
                  ) : null}
                  {selected ? (
                    <Badge variant="secondary" className="rounded-lg">
                      Dipilih
                    </Badge>
                  ) : null}
                </div>
                <CardTitle>{issue.title}</CardTitle>
                <CardDescription>{issue.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  className="h-11 w-full rounded-xl"
                  onClick={() => handleSelect(issue.id)}
                >
                  Pilih isu
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </StudentFrame>
  );
}

function StimulusPage({
  progress,
  catalog,
  onState,
}: {
  progress: StudentProgress;
  catalog: StudentCatalog;
  onState: (state: StudentBackendState) => void;
}) {
  const router = useRouter();
  const issue = findIssue(catalog, progress.issueId) ?? findIssueByGroup(catalog, progress.groupCode);
  const defaultAnswers = useMemo(() => {
    return Object.fromEntries(
      catalog.reflectionQuestions.map((question) => [
        question.id,
        progress.reflectionAnswers.find(
          (answer) => answer.questionId === question.id,
        )?.answerText ?? "",
      ]),
    );
  }, [catalog.reflectionQuestions, progress.reflectionAnswers]);
  const [savedMessage, setSavedMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const form = useForm<ReflectionFormValues>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      answers: defaultAnswers,
    },
  });

  async function onSubmit(values: ReflectionFormValues) {
    setServerError("");
    try {
      const nextState = await saveReflection(values);
      onState(nextState);
      setSavedMessage("Jawabanmu tersimpan di Supabase.");
      router.push("/peran");
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Jawaban belum tersimpan.",
      );
    }
  }

  return (
    <StudentFrame
      eyebrow="Stimulus fenomena"
      title={issue.title}
      description="Baca narasi kasus, lalu jawab pertanyaan refleksi sebelum memilih peran stakeholder."
      step={3}
      aside={
        <InfoPanel
          title="Petunjuk refleksi"
          items={[
            "Jawab dengan kalimat sendiri.",
            "Sebutkan bukti dari narasi.",
            "Kamu tidak bisa lanjut jika jawaban kosong.",
          ]}
        />
      }
    >
      <Card>
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[280px_1fr]">
          <div
            className={cn(
              "grid min-h-56 place-items-center rounded-xl bg-gradient-to-br p-6 text-center",
              issue.thumbnailTone,
            )}
          >
            <div>
              <Leaf className="mx-auto size-12 text-primary" aria-hidden="true" />
              <p className="mt-3 font-semibold text-eco-ink">
                Stimulus lingkungan
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ilustrasi placeholder untuk gambar/video stimulus.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-eco-ink">Narasi kasus</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{issue.content}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pertanyaan refleksi</CardTitle>
          <CardDescription>
            Minimal 10 karakter untuk setiap jawaban.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            {catalog.reflectionQuestions.map((question) => {
              const message =
                form.formState.errors.answers?.[question.id]?.message;
              const answerRegister = form.register(`answers.${question.id}`);

              return (
                <div key={question.id} className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor={`answer-${question.id}`}
                  >
                    {question.orderIndex}. {question.questionText}
                  </label>
                  <Textarea
                    id={`answer-${question.id}`}
                    className="min-h-28 rounded-xl"
                    aria-invalid={Boolean(message)}
                    placeholder="Tulis jawabanmu di sini."
                    {...answerRegister}
                    onBlur={(event) => {
                      answerRegister.onBlur(event);
                      setSavedMessage("Draft jawaban tersimpan di form.");
                    }}
                  />
                  <FieldError message={message} />
                </div>
              );
            })}

            {savedMessage ? (
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {savedMessage}
              </p>
            ) : null}

            {serverError ? (
              <Alert className="border-amber-300 bg-amber-50">
                <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
                <AlertTitle>Jawaban belum tersimpan.</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="h-12 rounded-xl text-base">
              {form.formState.isSubmitting ? "Menyimpan..." : "Simpan dan pilih peran"}
              <Save className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </StudentFrame>
  );
}

function RoleSelectionPage({
  progress,
  catalog,
  onState,
}: {
  progress: StudentProgress;
  catalog: StudentCatalog;
  onState: (state: StudentBackendState) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  async function handleSelect(roleId: string, slug: string) {
    setServerError("");
    try {
      const nextState = await selectRole(roleId);
      onState(nextState);
      router.push(`/peran/${slug}`);
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Peran belum tersimpan.",
      );
    }
  }

  return (
    <StudentFrame
      eyebrow="Pilih peran stakeholder"
      title="Ambil sudut pandang untuk diskusi"
      description="Pilih satu peran. Kartu detail akan menjelaskan misi, kepentingan, dan checklist diskusimu."
      step={4}
    >
      {serverError ? (
        <Alert className="border-amber-300 bg-amber-50">
          <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
          <AlertTitle>Peran belum tersimpan.</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.roleCards.map((role) => (
          <Card
            key={role.id}
            className={cn(
              "transition hover:-translate-y-0.5 hover:shadow-md",
              progress.roleCardId === role.id &&
                "border-primary/50 ring-2 ring-primary/10",
            )}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-sm font-bold text-secondary-foreground">
                  {role.avatar}
                </span>
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <CardDescription>{role.shortDescription}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Kepentingan utama: {role.interest}
              </p>
              <Button
                type="button"
                className="h-11 w-full rounded-xl"
                onClick={() => handleSelect(role.id, role.slug)}
              >
                Pilih peran
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </StudentFrame>
  );
}

function RoleDetailPage({
  progress,
  roleSlug,
  catalog,
  onState,
}: {
  progress: StudentProgress;
  roleSlug?: string;
  catalog: StudentCatalog;
  onState: (state: StudentBackendState) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const role =
    findRoleBySlug(catalog, roleSlug) ??
    findRole(catalog, progress.roleCardId) ??
    catalog.roleCards[0];

  async function continueToDiscussion() {
    if (!role) return;
    setServerError("");
    try {
      const nextState = await selectRole(role.id);
      onState(nextState);
      router.push("/diskusi");
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Peran belum tersimpan.",
      );
    }
  }

  if (!role) return <StartRequired />;

  return (
    <StudentFrame
      eyebrow="Kartu peran"
      title={`Kamu berperan sebagai ${role.name}`}
      description={role.shortDescription}
      step={5}
      aside={
        <InfoPanel
          title="Checklist diskusi"
          items={role.checklist}
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <RoleInfoCard title="Misi" icon={ClipboardList} content={role.mission} />
        <RoleInfoCard title="Kepentingan" icon={Users} content={role.interest} />
        <RoleInfoCard
          title="Kriteria keputusan"
          icon={CheckCircle2}
          content={role.decisionCriteria.join(" ")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alternatif solusi yang bisa kamu bawa</CardTitle>
          <CardDescription>
            Gunakan ini sebagai bahan awal, lalu dengarkan pendapat peran lain.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {role.alternatives.map((alternative) => (
            <div
              key={alternative}
              className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-6"
            >
              {alternative}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        type="button"
        className="h-12 rounded-xl text-base"
        onClick={continueToDiscussion}
      >
        Lanjut ke Diskusi Bersama
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
      {serverError ? (
        <Alert className="border-amber-300 bg-amber-50">
          <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
          <AlertTitle>Belum bisa lanjut.</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}
    </StudentFrame>
  );
}

function DiscussionMapPage({
  progress,
  catalog,
  onState,
}: {
  progress: StudentProgress;
  catalog: StudentCatalog;
  onState: (state: StudentBackendState) => void;
}) {
  const issue = findIssue(catalog, progress.issueId) ?? findIssueByGroup(catalog, progress.groupCode);
  const role = findRole(catalog, progress.roleCardId);
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const hasRobloxLink = Boolean(issue.robloxMapUrl);

  async function handleRobloxClick() {
    setServerError("");
    try {
      const nextState = await trackRobloxClick(issue.robloxMapUrl);
      onState(nextState);
      setOpen(false);
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Klik Roblox belum tercatat.",
      );
    }
  }

  return (
    <StudentFrame
      eyebrow="Diskusi bersama"
      title="Diskusi Bersama di Map Roblox"
      description="Buka map di tab baru, ikuti instruksi guru, lalu kembali ke website ini untuk mengisi hasil pengamatan."
      step={6}
      aside={
        <InfoPanel
          title="Tugas di Roblox"
          items={[
            "Amati lokasi dan tanda masalah.",
            "Diskusikan dari sudut pandang peranmu.",
            "Catat bukti dan pendapat role lain.",
            "Kembali ke website ini setelah eksplorasi.",
          ]}
        />
      }
    >
      <Card>
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_280px]">
          <div>
            <Badge className="rounded-lg">Kelompok {progress.groupCode}</Badge>
            <h2 className="mt-4 text-2xl font-semibold text-eco-ink">
              {issue.title}
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Peranmu:{" "}
              <span className="font-semibold text-foreground">
                {role?.name ?? "Belum dipilih"}
              </span>
              . Pastikan tab website ini tetap terbuka agar kamu bisa melanjutkan
              pengisian hasil diskusi.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Klik Roblox Map
            </p>
            <p className="mt-2 text-3xl font-semibold text-eco-ink">
              {progress.robloxClicks.length}x
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Event klik dicatat ke Supabase.
            </p>
          </div>
        </CardContent>
      </Card>

      {serverError ? (
        <Alert className="border-amber-300 bg-amber-50">
          <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
          <AlertTitle>Event belum tercatat.</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      {hasRobloxLink ? (
        <Button
          type="button"
          className="h-12 rounded-xl bg-amber-400 text-base text-amber-950 hover:bg-amber-300"
          onClick={() => setOpen(true)}
        >
          <Play className="size-5" aria-hidden="true" />
          Masuk ke Map Roblox
        </Button>
      ) : (
        <Alert className="border-amber-300 bg-amber-50">
          <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
          <AlertTitle>Map Roblox belum tersedia.</AlertTitle>
          <AlertDescription>
            Silakan hubungi guru. Kamu tetap bisa menyiapkan pertanyaan diskusi
            dari stimulus yang sudah dibaca.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="h-11 rounded-xl">
          <Link href="/hasil-diskusi">
            Isi hasil pengamatan
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-11 rounded-xl">
          <Link href="/peran">Ganti peran</Link>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buka Map Roblox?</DialogTitle>
            <DialogDescription>
              Map Roblox akan terbuka di tab baru. Jangan tutup website ini
              karena kamu perlu kembali untuk mengisi hasil diskusi.
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-sky-200 bg-sky-50">
            <ExternalLink className="size-4 text-sky-700" aria-hidden="true" />
            <AlertTitle>Link eksternal</AlertTitle>
            <AlertDescription>
              Ikuti instruksi guru dan gunakan akun Roblox sesuai aturan sekolah.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button asChild className="h-11 rounded-xl">
              <a
                href={issue.robloxMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void handleRobloxClick();
                }}
              >
                Ya, buka Roblox
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentFrame>
  );
}

function DiscussionResultPage({
  progress,
  onState,
}: {
  progress: StudentProgress;
  onState: (state: StudentBackendState) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const form = useForm<DiscussionFormValues>({
    resolver: zodResolver(discussionSchema),
    defaultValues: {
      observationText: progress.discussionResult?.observationText ?? "",
      visibleProblemText: progress.discussionResult?.visibleProblemText ?? "",
      roleOpinionText: progress.discussionResult?.roleOpinionText ?? "",
      otherRolesOpinionText: progress.discussionResult?.otherRolesOpinionText ?? "",
      groupSolutionDraft: progress.discussionResult?.groupSolutionDraft ?? "",
      agreedRolesCount: progress.discussionResult?.agreedRolesCount ?? 0,
    },
  });

  async function onSubmit(values: DiscussionFormValues) {
    setServerError("");
    try {
      const nextState = await saveDiscussion(values);
      onState(nextState);
      router.push("/solusi-akhir");
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Hasil diskusi belum tersimpan.",
      );
    }
  }

  return (
    <StudentFrame
      eyebrow="Hasil diskusi"
      title="Catat hasil pengamatan dan diskusi kelompok"
      description="Tulis ringkasan setelah kembali dari Map Roblox. Data ini menjadi bahan solusi akhir."
      step={6}
      aside={
        <InfoPanel
          title="Status"
          items={[
            "Draft tersimpan saat submit form.",
            "Guru bisa membaca hasil diskusi di dashboard.",
            "Status berikutnya: solusi akhir.",
          ]}
        />
      }
    >
      <Card>
        <CardContent className="p-6">
          <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <TextareaField
              id="observationText"
              label="Hasil pengamatan dari Roblox"
              placeholder="Apa saja yang kamu lihat di map?"
              register={form.register("observationText")}
              error={form.formState.errors.observationText?.message}
            />
            <TextareaField
              id="visibleProblemText"
              label="Masalah paling terlihat"
              placeholder="Masalah apa yang paling kuat terlihat?"
              register={form.register("visibleProblemText")}
              error={form.formState.errors.visibleProblemText?.message}
            />
            <TextareaField
              id="roleOpinionText"
              label="Pendapat dari peranmu"
              placeholder="Apa pendapat peranmu terhadap masalah ini?"
              register={form.register("roleOpinionText")}
              error={form.formState.errors.roleOpinionText?.message}
            />
            <TextareaField
              id="otherRolesOpinionText"
              label="Pendapat role lain"
              placeholder="Catat pendapat role lain jika ada."
              register={form.register("otherRolesOpinionText")}
              error={form.formState.errors.otherRolesOpinionText?.message}
              optional
            />
            <TextareaField
              id="groupSolutionDraft"
              label="Solusi sementara kelompok"
              placeholder="Apa solusi sementara yang muncul dari diskusi?"
              register={form.register("groupSolutionDraft")}
              error={form.formState.errors.groupSolutionDraft?.message}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="agreedRolesCount">
                Jumlah peran yang setuju
              </label>
              <Input
                id="agreedRolesCount"
                type="number"
                min={0}
                max={5}
                className="h-11 max-w-40 rounded-xl"
                aria-invalid={Boolean(form.formState.errors.agreedRolesCount)}
                {...form.register("agreedRolesCount", { valueAsNumber: true })}
              />
              <FieldError
                message={form.formState.errors.agreedRolesCount?.message}
              />
            </div>

            <Button type="submit" className="h-12 rounded-xl text-base">
              {form.formState.isSubmitting ? "Menyimpan..." : "Simpan hasil diskusi"}
              <Save className="size-4" aria-hidden="true" />
            </Button>
            {serverError ? (
              <Alert className="border-amber-300 bg-amber-50">
                <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
                <AlertTitle>Hasil diskusi belum tersimpan.</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </StudentFrame>
  );
}

function FinalSolutionPage({
  progress,
  onState,
}: {
  progress: StudentProgress;
  onState: (state: StudentBackendState) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<FinalSolutionFormValues | null>(null);
  const form = useForm<FinalSolutionFormValues>({
    resolver: zodResolver(finalSolutionSchema),
    defaultValues: {
      finalSolutionText: progress.finalSolution?.finalSolutionText ?? "",
      actionStepsText: progress.finalSolution?.actionStepsText ?? "",
      personalCommitmentText:
        progress.finalSolution?.personalCommitmentText ?? "",
    },
  });

  function onSubmit(values: FinalSolutionFormValues) {
    setPendingValues(values);
    setConfirmOpen(true);
  }

  async function confirmSubmit() {
    if (!pendingValues) return;
    setServerError("");
    try {
      const nextState = await submitFinalSolution(pendingValues);
      onState(nextState);
      setConfirmOpen(false);
      router.push("/selesai");
    } catch (requestError) {
      setServerError(
        requestError instanceof Error
          ? requestError.message
          : "Solusi akhir belum tersimpan.",
      );
    }
  }

  return (
    <StudentFrame
      eyebrow="Solusi tindakan nyata"
      title="Rumuskan solusi akhir kelompok"
      description="Periksa kembali jawabanmu sebelum submit. Setelah submit, status prototype menjadi selesai."
      step={7}
      aside={
        <InfoPanel title="Rekomendasi aksi" items={recommendedActions} />
      }
    >
      <Card>
        <CardContent className="p-6">
          <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <TextareaField
              id="finalSolutionText"
              label="Solusi akhir kelompok"
              placeholder="Tulis solusi akhir yang disepakati."
              register={form.register("finalSolutionText")}
              error={form.formState.errors.finalSolutionText?.message}
            />
            <TextareaField
              id="actionStepsText"
              label="Langkah tindakan nyata"
              placeholder="Tulis langkah yang bisa dilakukan setelah diskusi."
              register={form.register("actionStepsText")}
              error={form.formState.errors.actionStepsText?.message}
            />
            <TextareaField
              id="personalCommitmentText"
              label="Komitmen pribadi siswa"
              placeholder="Tulis komitmen pribadimu."
              register={form.register("personalCommitmentText")}
              error={form.formState.errors.personalCommitmentText?.message}
            />
            <Button type="submit" className="h-12 rounded-xl text-base">
              Submit solusi akhir
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </Button>
            {serverError ? (
              <Alert className="border-amber-300 bg-amber-50">
                <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
                <AlertTitle>Solusi akhir belum tersimpan.</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit solusi akhir?</DialogTitle>
            <DialogDescription>
              Pastikan solusi dan komitmen sudah diperiksa. Setelah submit, sesi
              akan ditandai selesai di prototype.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={() => setConfirmOpen(false)}
            >
              Periksa lagi
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl"
              onClick={confirmSubmit}
            >
              Ya, submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentFrame>
  );
}

function DonePage({
  progress,
  catalog,
}: {
  progress: StudentProgress;
  catalog: StudentCatalog;
}) {
  const router = useRouter();
  const issue = findIssue(catalog, progress.issueId);
  const role = findRole(catalog, progress.roleCardId);

  function downloadSummary() {
    const lines = [
      "Ringkasan Eco-Decision Role Play",
      `Nama: ${progress.studentName}`,
      `Kelompok: ${progress.groupCode}`,
      `Isu: ${issue?.title ?? "-"}`,
      `Peran: ${role?.name ?? "-"}`,
      "",
      "Solusi akhir:",
      progress.finalSolution?.finalSolutionText ?? "-",
      "",
      "Langkah tindakan:",
      progress.finalSolution?.actionStepsText ?? "-",
      "",
      "Komitmen pribadi:",
      progress.finalSolution?.personalCommitmentText ?? "-",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ringkasan-eco-decision.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function backHome() {
    router.push("/");
  }

  return (
    <StudentFrame
      eyebrow="Summary selesai"
      title="Selamat! Kamu telah menyelesaikan role-play game."
      description="Ringkasan ini menampilkan pilihan isu, peran, solusi akhir, dan komitmen pribadi yang sudah kamu submit."
      step={7}
    >
      <Card>
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[220px_1fr]">
          <div className="grid min-h-44 place-items-center rounded-xl bg-gradient-to-br from-emerald-100 via-sky-100 to-white">
            <Sparkles className="size-16 text-primary" aria-hidden="true" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryItem label="Nama" value={progress.studentName} />
            <SummaryItem label="Kelompok" value={progress.groupCode} />
            <SummaryItem label="Isu" value={issue?.title ?? "-"} />
            <SummaryItem label="Peran" value={role?.name ?? "-"} />
            <SummaryItem
              label="Solusi akhir"
              value={progress.finalSolution?.finalSolutionText ?? "-"}
              wide
            />
            <SummaryItem
              label="Komitmen pribadi"
              value={progress.finalSolution?.personalCommitmentText ?? "-"}
              wide
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          className="h-11 rounded-xl"
          onClick={downloadSummary}
        >
          <Download className="size-4" aria-hidden="true" />
          Unduh ringkasan
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl"
          onClick={backHome}
        >
          Kembali ke Beranda
        </Button>
        <ResetProgressButton
          onReset={async () => {
            await signOutStudent();
            router.push("/registrasi");
          }}
        />
      </div>
    </StudentFrame>
  );
}

function ResumePage({
  progress,
  catalog,
}: {
  progress?: StudentProgress;
  catalog: StudentCatalog;
}) {
  const router = useRouter();
  const issue = findIssue(catalog, progress?.issueId);
  const role = findRole(catalog, progress?.roleCardId);

  return (
    <StudentFrame
      eyebrow="Resume progress"
      title={progress ? "Lanjutkan progresmu?" : "Belum ada progres"}
      description={
        progress
          ? "Kami menemukan progres di tab ini. Kamu bisa melanjutkan tahap terakhir atau mengulang dari awal."
          : "Mulai dari registrasi agar progress bisa tersimpan sementara."
      }
    >
      <Card>
        <CardContent className="space-y-5 p-6">
          {progress ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <SummaryItem label="Nama" value={progress.studentName} />
                <SummaryItem label="Kelompok" value={progress.groupCode} />
                <SummaryItem label="Isu" value={issue?.title ?? "Belum dipilih"} />
                <SummaryItem label="Peran" value={role?.name ?? "Belum dipilih"} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  className="h-11 rounded-xl"
                  onClick={() => router.push(getResumePath(progress.status))}
                >
                  Lanjutkan
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                <ResetProgressButton
                  onReset={async () => {
                    await signOutStudent();
                    router.push("/registrasi");
                  }}
                />
              </div>
            </>
          ) : (
            <Button asChild className="h-11 rounded-xl">
              <Link href="/registrasi">
                Ayo mulai
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </StudentFrame>
  );
}

function RoleInfoCard({
  title,
  content,
  icon: Icon,
}: {
  title: string;
  content: string;
  icon: typeof ClipboardList;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="size-6 text-primary" aria-hidden="true" />
        <h2 className="mt-4 font-semibold text-eco-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{content}</p>
      </CardContent>
    </Card>
  );
}

function TextareaField({
  id,
  label,
  placeholder,
  register,
  error,
  optional,
}: {
  id: string;
  label: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  error?: string;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
        {optional ? (
          <span className="font-normal text-muted-foreground"> (opsional)</span>
        ) : null}
      </label>
      <Textarea
        id={id}
        className="min-h-28 rounded-xl"
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        {...register}
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="flex items-center gap-2 text-sm font-medium text-destructive" role="alert">
      <ShieldAlert className="size-4" aria-hidden="true" />
      {message}
    </p>
  );
}

function SummaryItem({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/30 p-4",
        wide && "sm:col-span-2",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-eco-ink">{value}</p>
    </div>
  );
}
