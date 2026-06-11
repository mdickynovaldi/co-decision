import { NextResponse } from "next/server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getAdminDataset, getCurrentProfile, getCurrentUser } from "@/lib/eco/server/data";
import {
  adminStudentQuerySchema,
  contentDeleteSchema,
  groupDeleteSchema,
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
  studentAnswerDeleteSchema,
} from "@/lib/eco/validations";

function ok(data: unknown) {
  return NextResponse.json({ ok: true, data });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function errorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  ) {
    return "Slug sudah dipakai role/konten lain. Gunakan slug yang berbeda.";
  }
  if (error instanceof Error) return error.message;
  return "Terjadi kendala. Coba lagi sebentar.";
}

async function requireStaff() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) throw new Error("Masuk sebagai guru/admin terlebih dahulu.");

  const profile = await getCurrentProfile(supabase, user.id);
  if (!profile || !["teacher", "admin", "super_admin"].includes(profile.role)) {
    throw new Error("Akun ini tidak memiliki akses dashboard.");
  }

  return { supabase, user, profile };
}

async function writeAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  detail: string,
) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: { detail },
  });
}

// Service-role deletes bypass RLS, so re-check the per-class isolation that RLS
// normally enforces: admins may act on any session, teachers only on sessions
// inside classes they teach. Rejects the whole request if any id is out of scope.
async function assertSessionsInScope(
  admin: ReturnType<typeof createAdminClient>,
  profile: { role: string },
  userId: string,
  sessionIds: string[],
) {
  if (profile.role === "admin" || profile.role === "super_admin") return;
  if (!sessionIds.length) return;

  const { data: sessions, error } = await admin
    .from("student_sessions")
    .select("id, class_id")
    .in("id", sessionIds);

  if (error) throw error;

  const classIds = Array.from(
    new Set(
      (sessions ?? [])
        .map((session) => session.class_id as string | null)
        .filter((classId): classId is string => Boolean(classId)),
    ),
  );

  const { data: ownedClasses, error: classError } = classIds.length
    ? await admin
        .from("classes")
        .select("id")
        .eq("teacher_id", userId)
        .in("id", classIds)
    : { data: [] as { id: string }[], error: null };

  if (classError) throw classError;

  const ownedClassIds = new Set(
    (ownedClasses ?? []).map((row) => row.id as string),
  );
  const allInScope =
    (sessions?.length ?? 0) === sessionIds.length &&
    (sessions ?? []).every(
      (session) =>
        session.class_id && ownedClassIds.has(session.class_id as string),
    );

  if (!allInScope) {
    throw new Error("Hanya bisa menghapus data siswa di kelas yang kamu ampu.");
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const options = adminStudentQuerySchema.parse(
      Object.fromEntries(url.searchParams.entries()),
    );
    return ok(await getAdminDataset(supabase, options));
  } catch (error) {
    return fail(errorMessage(error), 500);
  }
}

export async function POST(request: Request) {
  let body: { action?: string; payload?: unknown };

  try {
    body = (await request.json()) as { action?: string; payload?: unknown };
  } catch {
    return fail("Request tidak valid.");
  }

  try {
    if (body.action === "login") {
      const values = loginSchema.parse(body.payload);
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword(values);

      if (error || !data.user) return fail("Email atau password belum cocok.", 401);

      const profile = await getCurrentProfile(supabase, data.user.id);
      if (!profile || !["teacher", "admin", "super_admin"].includes(profile.role)) {
        await supabase.auth.signOut();
        return fail("Akun ini bukan akun guru/admin.", 403);
      }

      await writeAudit(
        supabase,
        data.user.id,
        "admin.login",
        "auth",
        null,
        "Login guru/admin berhasil",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "logout") {
      const supabase = await createClient();
      await supabase.auth.signOut();
      return ok({ signedOut: true });
    }

    if (body.action === "saveRubric") {
      const values = rubricSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const { error } = await supabase
        .from("rubric_scores")
        .upsert(
          {
            student_session_id: values.studentSessionId,
            teacher_id: user.id,
            problem_understanding_score: values.problemUnderstandingScore,
            role_alignment_score: values.roleAlignmentScore,
            discussion_quality_score: values.discussionQualityScore,
            solution_quality_score: values.solutionQualityScore,
            action_commitment_score: values.actionCommitmentScore,
            feedback_text: values.feedbackText,
            status: "saved",
          },
          { onConflict: "student_session_id" },
        );

      if (error) throw error;

      await writeAudit(
        supabase,
        user.id,
        "teacher_scored_student",
        "rubric_score",
        values.studentSessionId,
        "Guru menyimpan skor dan feedback siswa.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "saveIssue") {
      const values = issueContentSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const { error } = await supabase
        .from("issues")
        .update({
          title: values.title,
          description: values.description,
          content: values.content,
          roblox_map_url: values.robloxMapUrl,
          is_published: values.isPublished,
        })
        .eq("id", values.issueId);

      if (error) throw error;

      await writeAudit(
        supabase,
        user.id,
        "content.update",
        "issue",
        values.issueId,
        "Konten isu atau link Roblox diperbarui.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "createIssue") {
      const values = issueCreateSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const { data, error } = await supabase
        .from("issues")
        .insert({
          group_code: values.groupCode,
          slug: values.slug,
          title: values.title,
          description: values.description,
          content: values.content,
          thumbnail_tone: values.thumbnailTone,
          roblox_map_url: values.robloxMapUrl,
          is_published: values.isPublished,
        })
        .select("id")
        .single();

      if (error) throw error;

      const { data: activeClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("is_active", true);

      if (activeClasses?.length) {
        await supabase.from("groups").upsert(
          activeClasses.map((classRow) => ({
            class_id: classRow.id,
            code: values.groupCode,
            name: `Kelompok ${values.groupCode}`,
            issue_id: data.id,
          })),
          { onConflict: "class_id,code" },
        );
      }

      await writeAudit(
        supabase,
        user.id,
        "content.create",
        "issue",
        data.id,
        "Konten isu baru dibuat.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "deleteGroup") {
      const values = groupDeleteSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();

      const { error: issuesError } = await supabase
        .from("issues")
        .delete()
        .eq("group_code", values.groupCode);

      if (issuesError) throw issuesError;

      await supabase.from("groups").delete().eq("code", values.groupCode);

      await writeAudit(
        supabase,
        user.id,
        "content.delete_group",
        "group",
        null,
        `Kelompok ${values.groupCode} dan konten isunya dihapus.`,
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "saveReflectionQuestion") {
      const values = reflectionQuestionContentSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const { error } = await supabase
        .from("reflection_questions")
        .update({
          issue_id: values.issueId || null,
          question_text: values.questionText,
          order_index: values.orderIndex,
          is_required: values.isRequired,
          is_published: values.isPublished,
        })
        .eq("id", values.questionId);

      if (error) throw error;

      await writeAudit(
        supabase,
        user.id,
        "content.update",
        "reflection_question",
        values.questionId,
        "Pertanyaan refleksi diperbarui.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "createReflectionQuestion") {
      const values = reflectionQuestionCreateSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const { data, error } = await supabase
        .from("reflection_questions")
        .insert({
          issue_id: values.issueId || null,
          question_text: values.questionText,
          order_index: values.orderIndex,
          is_required: values.isRequired,
          is_published: values.isPublished,
        })
        .select("id")
        .single();

      if (error) throw error;

      await writeAudit(
        supabase,
        user.id,
        "content.create",
        "reflection_question",
        data.id,
        "Pertanyaan refleksi baru dibuat.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "saveRoleCard") {
      const values = roleCardContentSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const { error } = await supabase
        .from("role_cards")
        .update({
          name: values.name,
          slug: values.slug,
          avatar: values.avatar,
          short_description: values.shortDescription,
          mission: values.mission,
          interest: values.interest,
          alternatives: values.alternatives,
          decision_criteria: values.decisionCriteria,
          checklist: values.checklist,
          is_published: values.isPublished,
        })
        .eq("id", values.roleCardId);

      if (error) throw error;

      await writeAudit(
        supabase,
        user.id,
        "content.update",
        "role_card",
        values.roleCardId,
        "Role card diperbarui.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "createRoleCard") {
      const values = roleCardCreateSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const { data, error } = await supabase
        .from("role_cards")
        .insert({
          name: values.name,
          slug: values.slug,
          avatar: values.avatar,
          short_description: values.shortDescription,
          mission: values.mission,
          interest: values.interest,
          alternatives: values.alternatives,
          decision_criteria: values.decisionCriteria,
          checklist: values.checklist,
          is_published: values.isPublished,
        })
        .select("id")
        .single();

      if (error) throw error;

      await writeAudit(
        supabase,
        user.id,
        "content.create",
        "role_card",
        data.id,
        "Role card baru dibuat.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "saveStimulusAsset") {
      const values = stimulusAssetContentSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const { error } = await supabase
        .from("stimulus_assets")
        .update({
          issue_id: values.issueId,
          type: values.assetType,
          title: values.title,
          url: values.url,
          description: values.description || null,
          order_index: values.orderIndex,
          is_published: values.isPublished,
        })
        .eq("id", values.assetId);

      if (error) throw error;

      await writeAudit(
        supabase,
        user.id,
        "content.update",
        "stimulus_asset",
        values.assetId,
        "Aset stimulus diperbarui.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "createStimulusAsset") {
      const values = stimulusAssetCreateSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const { data, error } = await supabase
        .from("stimulus_assets")
        .insert({
          issue_id: values.issueId,
          type: values.assetType,
          title: values.title,
          url: values.url,
          description: values.description || null,
          order_index: values.orderIndex,
          is_published: values.isPublished,
        })
        .select("id")
        .single();

      if (error) throw error;

      await writeAudit(
        supabase,
        user.id,
        "content.create",
        "stimulus_asset",
        data.id,
        "Aset stimulus baru dibuat.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "deleteContent") {
      const values = contentDeleteSchema.parse(body.payload);
      const { supabase, user } = await requireStaff();
      const tableByKind = {
        issue: "issues",
        question: "reflection_questions",
        role: "role_cards",
        asset: "stimulus_assets",
      } as const;
      const entityByKind = {
        issue: "issue",
        question: "reflection_question",
        role: "role_card",
        asset: "stimulus_asset",
      } as const;
      const { error } = await supabase.from(tableByKind[values.kind]).delete().eq("id", values.id);

      if (error) throw error;

      await writeAudit(
        supabase,
        user.id,
        "content.delete",
        entityByKind[values.kind],
        values.id,
        "Konten dihapus dari Supabase.",
      );

      return ok(await getAdminDataset(supabase));
    }

    if (body.action === "deleteStudentAnswers") {
      const values = studentAnswerDeleteSchema.parse(body.payload);
      const { supabase, user, profile } = await requireStaff();
      const admin = createAdminClient();

      if (values.kind === "rubric") {
        await assertSessionsInScope(admin, profile, user.id, values.ids);

        const { error } = await admin
          .from("rubric_scores")
          .delete()
          .in("student_session_id", values.ids);

        if (error) throw error;

        await writeAudit(
          supabase,
          user.id,
          "content.delete",
          "rubric_score",
          null,
          `Skor rubrik ${values.ids.length} siswa dihapus.`,
        );

        return ok(await getAdminDataset(supabase));
      }

      const tableByKind = {
        reflection: "reflection_answers",
        discussion: "discussion_results",
        final: "final_solutions",
      } as const;
      const resetByKind = {
        reflection: { status: "stimulus", progress_step: 3, completed_at: null },
        discussion: { status: "discussion", progress_step: 6, completed_at: null },
        final: { status: "final", progress_step: 8, completed_at: null },
      } as const;
      const entityByKind = {
        reflection: "reflection_answer",
        discussion: "discussion_result",
        final: "final_solution",
      } as const;

      const table = tableByKind[values.kind];
      const { data: rows, error: fetchError } = await admin
        .from(table)
        .select("id, student_session_id")
        .in("id", values.ids);

      if (fetchError) throw fetchError;

      const sessionIds = Array.from(
        new Set((rows ?? []).map((row) => row.student_session_id as string)),
      );

      await assertSessionsInScope(admin, profile, user.id, sessionIds);

      if (values.kind === "reflection") {
        // Reflection answers are stored one row per question. Deleting any
        // answer reopens the whole stimulus step, so clear every answer of the
        // affected students to keep the reset consistent.
        if (sessionIds.length) {
          const { error: deleteError } = await admin
            .from("reflection_answers")
            .delete()
            .in("student_session_id", sessionIds);

          if (deleteError) throw deleteError;
        }
      } else {
        const { error: deleteError } = await admin
          .from(table)
          .delete()
          .in("id", values.ids);

        if (deleteError) throw deleteError;
      }

      if (sessionIds.length) {
        const { error: resetError } = await admin
          .from("student_sessions")
          .update(resetByKind[values.kind])
          .in("id", sessionIds);

        if (resetError) throw resetError;

        if (values.kind === "discussion") {
          // Clear recorded Roblox clicks so the click count matches the
          // reset-to-discussion state instead of showing stale events.
          const { error: clicksError } = await admin
            .from("roblox_map_clicks")
            .delete()
            .in("student_session_id", sessionIds);

          if (clicksError) throw clicksError;
        }
      }

      await writeAudit(
        supabase,
        user.id,
        "content.delete",
        entityByKind[values.kind],
        null,
        `${sessionIds.length} siswa: data ${entityByKind[values.kind]} dihapus dan progres direset agar bisa diisi ulang.`,
      );

      return ok(await getAdminDataset(supabase));
    }

    return fail("Aksi tidak dikenal.");
  } catch (error) {
    return fail(errorMessage(error), 500);
  }
}
