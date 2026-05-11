import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  getPublishedCatalog,
  getStudentProgressForUser,
  getStudentState,
  ensureIssueForGroup,
  assertStudentStatusOpen,
} from "@/lib/eco/server/data";
import {
  discussionSchema,
  finalSolutionSchema,
  issueSelectionSchema,
  loginSchema,
  reflectionSchema,
  registrationSchema,
  robloxClickSchema,
  roleSelectionSchema,
} from "@/lib/eco/validations";

function ok(data: unknown) {
  return NextResponse.json({ ok: true, data });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Terjadi kendala. Coba lagi sebentar.";
}

function canFallbackToAdminSignup(message: string) {
  return /rate limit|over_email_send_rate_limit|email not confirmed/i.test(message);
}

async function createConfirmedStudentUser(values: {
  email: string;
  password: string;
  studentName: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.studentName,
      role: "student",
    },
  });

  if (error && !/already|exists|registered/i.test(error.message)) {
    throw error;
  }
}

async function requireStudentSession(options: { mustBeOpen?: boolean } = {}) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) throw new Error("Masuk sebagai siswa terlebih dahulu.");

  const progress = await getStudentProgressForUser(supabase, user.id);
  if (!progress) throw new Error("Sesi siswa belum dibuat.");
  if (options.mustBeOpen) assertStudentStatusOpen(progress.status);

  return { supabase, user, progress };
}

async function stateResponse(supabase?: Awaited<ReturnType<typeof createClient>>) {
  const client = supabase ?? (await createClient());
  return ok(await getStudentState(client));
}

export async function GET() {
  try {
    return await stateResponse();
  } catch (error) {
    return fail(errorMessage(error), 500);
  }
}

export async function POST(request: NextRequest) {
  let body: { action?: string; payload?: unknown };

  try {
    body = (await request.json()) as { action?: string; payload?: unknown };
  } catch {
    return fail("Request tidak valid.");
  }

  try {
    if (body.action === "register") {
      const values = registrationSchema.parse(body.payload);
      const supabase = await createClient();
      const catalog = await getPublishedCatalog(supabase);
      const issue = ensureIssueForGroup(catalog, values.groupCode);

      const { data: signUp, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.studentName,
            role: "student",
          },
        },
      });

      if (signUpError && !/already/i.test(signUpError.message)) {
        if (canFallbackToAdminSignup(signUpError.message)) {
          await createConfirmedStudentUser(values);
        } else {
          return fail("Registrasi belum berhasil. Periksa email dan password.");
        }
      } else if (signUp.user && !signUp.session) {
        await createConfirmedStudentUser(values);
      }

      const { data: signIn, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

      if (signInError || !signIn.user) {
        return fail("Akun sudah ada atau password salah. Coba masuk lewat halaman masuk.");
      }

      const admin = createAdminClient();
      const classCode = values.classCode.trim() || "ECO-DEMO";
      const { data: classRow } = await admin
        .from("classes")
        .select("id, code")
        .eq("code", classCode)
        .eq("is_active", true)
        .maybeSingle();

      const { error: profileError } = await admin.from("profiles").upsert({
        id: signIn.user.id,
        email: values.email,
        full_name: values.studentName.trim(),
        role: "student",
      });

      if (profileError) throw profileError;

      const { error: sessionError } = await admin
        .from("student_sessions")
        .upsert(
          {
            student_user_id: signIn.user.id,
            student_name: values.studentName.trim(),
            class_id: classRow?.id ?? null,
            class_code: classRow?.code ?? classCode,
            group_code: values.groupCode,
            issue_id: issue?.id,
            status: "registered",
            progress_step: 2,
          },
          { onConflict: "student_user_id" },
        );

      if (sessionError) throw sessionError;

      return stateResponse(supabase);
    }

    if (body.action === "login") {
      const values = loginSchema.parse(body.payload);
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword(values);

      if (error || !data.user) return fail("Email atau password belum cocok.", 401);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (profile?.role !== "student") {
        await supabase.auth.signOut();
        return fail("Akun ini bukan akun siswa.", 403);
      }

      return stateResponse(supabase);
    }

    if (body.action === "logout") {
      const supabase = await createClient();
      await supabase.auth.signOut();
      return ok({ signedOut: true });
    }

    if (body.action === "selectIssue") {
      const payload = issueSelectionSchema.parse(body.payload);
      const { supabase, progress } = await requireStudentSession({ mustBeOpen: true });
      const { error } = await supabase
        .from("student_sessions")
        .update({
          issue_id: payload.issueId,
          status: "stimulus",
          progress_step: Math.max(progress.progressStep, 3),
        })
        .eq("id", progress.id);

      if (error) throw error;
      return stateResponse(supabase);
    }

    if (body.action === "saveReflection") {
      const values = reflectionSchema.parse(body.payload);
      const { supabase, progress } = await requireStudentSession({ mustBeOpen: true });
      const timestamp = new Date().toISOString();
      const rows = Object.entries(values.answers).map(([questionId, answerText]) => ({
        student_session_id: progress.id,
        question_id: questionId,
        answer_text: answerText,
        autosaved_at: timestamp,
        submitted_at: timestamp,
      }));

      const { error: answersError } = await supabase
        .from("reflection_answers")
        .upsert(rows, { onConflict: "student_session_id,question_id" });

      if (answersError) throw answersError;

      const { error: sessionError } = await supabase
        .from("student_sessions")
        .update({
          status: "role",
          progress_step: Math.max(progress.progressStep, 4),
        })
        .eq("id", progress.id);

      if (sessionError) throw sessionError;
      return stateResponse(supabase);
    }

    if (body.action === "selectRole") {
      const payload = roleSelectionSchema.parse(body.payload);
      const { supabase, progress } = await requireStudentSession({ mustBeOpen: true });
      const { error } = await supabase
        .from("student_sessions")
        .update({
          role_card_id: payload.roleCardId,
          status: "discussion",
          progress_step: Math.max(progress.progressStep, 6),
        })
        .eq("id", progress.id);

      if (error) throw error;
      return stateResponse(supabase);
    }

    if (body.action === "trackRobloxClick") {
      const payload = robloxClickSchema.parse(body.payload);
      const { supabase, progress } = await requireStudentSession({ mustBeOpen: true });
      const { error: clickError } = await supabase.from("roblox_map_clicks").insert({
        student_session_id: progress.id,
        issue_id: progress.issueId,
        role_card_id: progress.roleCardId,
        roblox_map_url: payload.robloxMapUrl ?? "",
        user_agent: request.headers.get("user-agent"),
      });

      if (clickError) throw clickError;

      const { error: sessionError } = await supabase
        .from("student_sessions")
        .update({
          status: "discussion",
          progress_step: Math.max(progress.progressStep, 7),
        })
        .eq("id", progress.id);

      if (sessionError) throw sessionError;
      return stateResponse(supabase);
    }

    if (body.action === "saveDiscussion") {
      const values = discussionSchema.parse(body.payload);
      const { supabase, progress } = await requireStudentSession({ mustBeOpen: true });
      const timestamp = new Date().toISOString();
      const { error: discussionError } = await supabase
        .from("discussion_results")
        .upsert(
          {
            student_session_id: progress.id,
            observation_text: values.observationText,
            visible_problem_text: values.visibleProblemText,
            role_opinion_text: values.roleOpinionText,
            other_roles_opinion_text: values.otherRolesOpinionText,
            group_solution_draft: values.groupSolutionDraft,
            agreed_roles_count: values.agreedRolesCount,
            autosaved_at: timestamp,
            submitted_at: timestamp,
          },
          { onConflict: "student_session_id" },
        );

      if (discussionError) throw discussionError;

      const { error: sessionError } = await supabase
        .from("student_sessions")
        .update({
          status: "final",
          progress_step: Math.max(progress.progressStep, 8),
        })
        .eq("id", progress.id);

      if (sessionError) throw sessionError;
      return stateResponse(supabase);
    }

    if (body.action === "submitFinalSolution") {
      const values = finalSolutionSchema.parse(body.payload);
      const { supabase, progress } = await requireStudentSession({ mustBeOpen: true });
      const timestamp = new Date().toISOString();
      const { error: finalError } = await supabase
        .from("final_solutions")
        .upsert(
          {
            student_session_id: progress.id,
            final_solution_text: values.finalSolutionText,
            action_steps_text: values.actionStepsText,
            personal_commitment_text: values.personalCommitmentText,
            submitted_at: timestamp,
          },
          { onConflict: "student_session_id" },
        );

      if (finalError) throw finalError;

      const { error: sessionError } = await supabase
        .from("student_sessions")
        .update({
          status: "completed",
          progress_step: 10,
          completed_at: timestamp,
        })
        .eq("id", progress.id);

      if (sessionError) throw sessionError;
      return stateResponse(supabase);
    }

    return fail("Aksi tidak dikenal.");
  } catch (error) {
    return fail(errorMessage(error), 500);
  }
}
