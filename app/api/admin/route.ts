import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getAdminDataset, getCurrentProfile, getCurrentUser } from "@/lib/eco/server/data";
import {
  adminStudentQuerySchema,
  contentDeleteSchema,
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
} from "@/lib/eco/validations";

function ok(data: unknown) {
  return NextResponse.json({ ok: true, data });
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function errorMessage(error: unknown) {
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

    return fail("Aksi tidak dikenal.");
  } catch (error) {
    return fail(errorMessage(error), 500);
  }
}
