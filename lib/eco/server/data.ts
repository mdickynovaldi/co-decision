import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  AdminStudentRow,
  DiscussionResult,
  FinalSolution,
  GroupCode,
  Issue,
  ReflectionAnswer,
  ReflectionQuestion,
  RoleCard,
  RubricScore,
  StimulusAsset,
  StudentProgress,
  StudentStatus,
} from "@/lib/eco/types";
import { progressPercent } from "@/lib/eco/progress";
import type { AdminStudentQueryValues } from "@/lib/eco/validations";

export type SupabaseServerClient = SupabaseClient;

type StudentSessionRow = Database["public"]["Tables"]["student_sessions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type IssueRow = Database["public"]["Tables"]["issues"]["Row"];
type StimulusAssetRow = Database["public"]["Tables"]["stimulus_assets"]["Row"];
type QuestionRow = Database["public"]["Tables"]["reflection_questions"]["Row"];
type RoleRow = Database["public"]["Tables"]["role_cards"]["Row"];
type RubricRow = Database["public"]["Tables"]["rubric_scores"]["Row"];

export type StudentCatalog = {
  issues: Issue[];
  stimulusAssets: StimulusAsset[];
  reflectionQuestions: ReflectionQuestion[];
  roleCards: RoleCard[];
};

export type StudentState = StudentCatalog & {
  user: Pick<User, "id" | "email"> | null;
  profile: Pick<ProfileRow, "full_name" | "role"> | null;
  progress?: StudentProgress;
};

export type AdminDataset = {
  profile: Pick<ProfileRow, "full_name" | "role">;
  groupCodes: GroupCode[];
  students: AdminStudentRow[];
  studentPage: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
  issues: Issue[];
  stimulusAssets: StimulusAsset[];
  reflectionQuestions: ReflectionQuestion[];
  roleCards: RoleCard[];
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    detail: string;
    createdAt: string;
  }>;
  discussions: Array<{
    studentSessionId: string;
    studentName: string;
    issueTitle: string;
    observationText: string;
    groupSolutionDraft: string;
    robloxClicks: number;
  }>;
  finalSolutions: Array<{
    studentSessionId: string;
    studentName: string;
    groupCode: GroupCode;
    roleName: string;
    finalSolutionText: string;
    personalCommitmentText: string;
  }>;
  reflectionSummaries: Array<{
    studentSessionId: string;
    studentName: string;
    questionText: string;
    answerText: string;
    submittedAt?: string;
  }>;
};

function asStringArray(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function toIssue(row: IssueRow): Issue {
  return {
    id: row.id,
    groupCode: row.group_code,
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    thumbnailTone: row.thumbnail_tone,
    robloxMapUrl: row.roblox_map_url,
    isPublished: row.is_published,
  };
}

export function toReflectionQuestion(row: QuestionRow): ReflectionQuestion {
  return {
    id: row.id,
    issueId: row.issue_id ?? undefined,
    questionText: row.question_text,
    orderIndex: row.order_index,
    isRequired: row.is_required,
    isPublished: row.is_published,
  };
}

export function toStimulusAsset(row: StimulusAssetRow): StimulusAsset {
  return {
    id: row.id,
    issueId: row.issue_id,
    assetType: row.type,
    title: row.title,
    url: row.url,
    description: row.description ?? undefined,
    orderIndex: row.order_index,
    isPublished: row.is_published,
  };
}

export function toRoleCard(row: RoleRow): RoleCard {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    avatar: row.avatar,
    shortDescription: row.short_description,
    mission: row.mission,
    interest: row.interest,
    alternatives: asStringArray(row.alternatives),
    decisionCriteria: asStringArray(row.decision_criteria),
    checklist: asStringArray(row.checklist),
    isPublished: row.is_published,
  };
}

function toRubric(row?: RubricRow): RubricScore | undefined {
  if (!row) return undefined;

  return {
    problemUnderstandingScore: row.problem_understanding_score,
    roleAlignmentScore: row.role_alignment_score,
    discussionQualityScore: row.discussion_quality_score,
    solutionQualityScore: row.solution_quality_score,
    actionCommitmentScore: row.action_commitment_score,
    feedbackText: row.feedback_text,
    status: row.status,
  };
}

export async function getPublishedCatalog(supabase: SupabaseServerClient) {
  const [issuesResult, assetsResult, questionsResult, rolesResult] = await Promise.all([
    supabase
      .from("issues")
      .select("*")
      .eq("is_published", true)
      .order("group_code", { ascending: true }),
    supabase
      .from("stimulus_assets")
      .select("*")
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("reflection_questions")
      .select("*")
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("role_cards")
      .select("*")
      .eq("is_published", true)
      .order("name", { ascending: true }),
  ]);

  if (issuesResult.error) throw issuesResult.error;
  if (assetsResult.error) throw assetsResult.error;
  if (questionsResult.error) throw questionsResult.error;
  if (rolesResult.error) throw rolesResult.error;

  return {
    issues: (issuesResult.data ?? []).map(toIssue),
    stimulusAssets: (assetsResult.data ?? []).map(toStimulusAsset),
    reflectionQuestions: (questionsResult.data ?? []).map(toReflectionQuestion),
    roleCards: (rolesResult.data ?? []).map(toRoleCard),
  };
}

export async function getCurrentUser(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getCurrentProfile(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as ProfileRow | null;
}

export async function getStudentProgressForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data: session, error: sessionError } = await supabase
    .from("student_sessions")
    .select("*")
    .eq("student_user_id", userId)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session) return undefined;

  const [answers, discussion, finalSolution, clicks] = await Promise.all([
    supabase
      .from("reflection_answers")
      .select("*")
      .eq("student_session_id", session.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("discussion_results")
      .select("*")
      .eq("student_session_id", session.id)
      .maybeSingle(),
    supabase
      .from("final_solutions")
      .select("*")
      .eq("student_session_id", session.id)
      .maybeSingle(),
    supabase
      .from("roblox_map_clicks")
      .select("*")
      .eq("student_session_id", session.id)
      .order("clicked_at", { ascending: true }),
  ]);

  if (answers.error) throw answers.error;
  if (discussion.error) throw discussion.error;
  if (finalSolution.error) throw finalSolution.error;
  if (clicks.error) throw clicks.error;

  const reflectionAnswers: ReflectionAnswer[] = (answers.data ?? []).map((answer) => ({
    questionId: answer.question_id,
    answerText: answer.answer_text,
    autosavedAt: answer.autosaved_at ?? undefined,
    submittedAt: answer.submitted_at ?? undefined,
  }));

  const discussionResult: DiscussionResult | undefined = discussion.data
    ? {
        observationText: discussion.data.observation_text,
        visibleProblemText: discussion.data.visible_problem_text,
        roleOpinionText: discussion.data.role_opinion_text,
        otherRolesOpinionText: discussion.data.other_roles_opinion_text,
        groupSolutionDraft: discussion.data.group_solution_draft,
        agreedRolesCount: discussion.data.agreed_roles_count,
        autosavedAt: discussion.data.autosaved_at ?? undefined,
        submittedAt: discussion.data.submitted_at ?? undefined,
      }
    : undefined;

  const final: FinalSolution | undefined = finalSolution.data
    ? {
        finalSolutionText: finalSolution.data.final_solution_text,
        actionStepsText: finalSolution.data.action_steps_text,
        personalCommitmentText: finalSolution.data.personal_commitment_text,
        submittedAt: finalSolution.data.submitted_at,
      }
    : undefined;

  return {
    id: session.id,
    studentName: session.student_name,
    classCode: session.class_code ?? undefined,
    groupCode: session.group_code,
    issueId: session.issue_id ?? undefined,
    roleCardId: session.role_card_id ?? undefined,
    status: session.status,
    progressStep: session.progress_step,
    reflectionAnswers,
    discussionResult,
    finalSolution: final,
    robloxClicks: (clicks.data ?? []).map((click) => ({
      id: click.id,
      studentSessionId: click.student_session_id,
      issueId: click.issue_id ?? undefined,
      roleCardId: click.role_card_id ?? undefined,
      robloxMapUrl: click.roblox_map_url,
      clickedAt: click.clicked_at,
    })),
    createdAt: session.created_at,
    updatedAt: session.updated_at ?? session.created_at,
    completedAt: session.completed_at ?? undefined,
  } satisfies StudentProgress;
}

export async function getStudentState(supabase: SupabaseServerClient) {
  const catalog = await getPublishedCatalog(supabase);
  const user = await getCurrentUser(supabase);

  if (!user) {
    return {
      ...catalog,
      user: null,
      profile: null,
    } satisfies StudentState;
  }

  const [profile, progress] = await Promise.all([
    getCurrentProfile(supabase, user.id),
    getStudentProgressForUser(supabase, user.id),
  ]);

  return {
    ...catalog,
    user: { id: user.id, email: user.email ?? "" },
    profile: profile
      ? {
          full_name: profile.full_name,
          role: profile.role,
        }
      : null,
    progress,
  } satisfies StudentState;
}

const defaultStudentQuery: AdminStudentQueryValues = {
  query: "",
  groupCode: "all",
  status: "all",
  sortBy: "updatedAt",
  sortDir: "desc",
  page: 1,
  pageSize: 10,
};

function filterAndSortStudents(
  students: AdminStudentRow[],
  options: AdminStudentQueryValues,
) {
  const query = options.query.toLowerCase();
  const filtered = students.filter((student) => {
    const matchesQuery =
      !query ||
      student.studentName.toLowerCase().includes(query) ||
      student.issueTitle.toLowerCase().includes(query) ||
      student.roleName.toLowerCase().includes(query);
    const matchesGroup =
      options.groupCode === "all" || student.groupCode === options.groupCode;
    const matchesStatus = options.status === "all" || student.status === options.status;

    return matchesQuery && matchesGroup && matchesStatus;
  });

  filtered.sort((a, b) => {
    const left = a[options.sortBy];
    const right = b[options.sortBy];
    const direction = options.sortDir === "asc" ? 1 : -1;

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * direction;
    }

    return String(left).localeCompare(String(right), "id-ID") * direction;
  });

  const start = (options.page - 1) * options.pageSize;
  return {
    students: filtered.slice(start, start + options.pageSize),
    total: filtered.length,
  };
}

export async function getAdminDataset(
  supabase: SupabaseServerClient,
  studentQuery: Partial<AdminStudentQueryValues> = {},
): Promise<AdminDataset> {
  const options = { ...defaultStudentQuery, ...studentQuery };
  const user = await getCurrentUser(supabase);
  if (!user) throw new Error("Sesi login tidak ditemukan.");

  const profile = await getCurrentProfile(supabase, user.id);
  if (!profile || !["teacher", "admin", "super_admin"].includes(profile.role)) {
    throw new Error("Akun ini tidak memiliki akses dashboard.");
  }

  const [
    sessionsResult,
    profilesResult,
    issuesResult,
    assetsResult,
    rolesResult,
    clicksResult,
    rubricsResult,
    answersResult,
    questionsResult,
    discussionsResult,
    finalsResult,
    auditResult,
  ] = await Promise.all([
    supabase.from("student_sessions").select("*").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("*"),
    supabase.from("issues").select("*").order("group_code", { ascending: true }),
    supabase.from("stimulus_assets").select("*").order("order_index", { ascending: true }),
    supabase.from("role_cards").select("*").order("name", { ascending: true }),
    supabase.from("roblox_map_clicks").select("*"),
    supabase.from("rubric_scores").select("*"),
    supabase.from("reflection_answers").select("*").order("created_at", { ascending: false }),
    supabase.from("reflection_questions").select("*").order("order_index", { ascending: true }),
    supabase.from("discussion_results").select("*").order("created_at", { ascending: false }),
    supabase.from("final_solutions").select("*").order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  for (const result of [
    sessionsResult,
    profilesResult,
    issuesResult,
    assetsResult,
    rolesResult,
    clicksResult,
    rubricsResult,
    answersResult,
    questionsResult,
    discussionsResult,
    finalsResult,
    auditResult,
  ]) {
    if (result.error) throw result.error;
  }

  const profiles = new Map((profilesResult.data ?? []).map((item) => [item.id, item]));
  const issues = new Map((issuesResult.data ?? []).map((item) => [item.id, toIssue(item)]));
  const roles = new Map((rolesResult.data ?? []).map((item) => [item.id, toRoleCard(item)]));
  const rubrics = new Map(
    (rubricsResult.data ?? []).map((item) => [item.student_session_id, item]),
  );

  const clickCounts = new Map<string, number>();
  for (const click of clicksResult.data ?? []) {
    clickCounts.set(click.student_session_id, (clickCounts.get(click.student_session_id) ?? 0) + 1);
  }

  const sessions = (sessionsResult.data ?? []) as StudentSessionRow[];
  const groupCodes = Array.from(
    new Set([
      ...(issuesResult.data ?? []).map((issue) => issue.group_code),
      ...sessions.map((session) => session.group_code),
    ]),
  ).sort((left, right) => left.localeCompare(right, "id-ID"));
  const allStudents = sessions.map((session) => {
    const studentProfile = profiles.get(session.student_user_id);
    const issue = session.issue_id ? issues.get(session.issue_id) : undefined;
    const role = session.role_card_id ? roles.get(session.role_card_id) : undefined;

    return {
      id: session.id,
      studentName: session.student_name || studentProfile?.full_name || "Siswa",
      groupCode: session.group_code,
      issueTitle: issue?.title ?? "Belum memilih isu",
      roleName: role?.name ?? "Belum memilih peran",
      status: session.status,
      progressPercent: progressPercent(session.progress_step),
      robloxClicks: clickCounts.get(session.id) ?? 0,
      updatedAt: session.updated_at ?? session.created_at,
      rubric: toRubric(rubrics.get(session.id)),
    } satisfies AdminStudentRow;
  });
  const pagedStudents = filterAndSortStudents(allStudents, options);

  const questions = new Map(
    (questionsResult.data ?? []).map((item) => [item.id, toReflectionQuestion(item)]),
  );
  const sessionById = new Map(sessions.map((session) => [session.id, session]));

  return {
    profile: {
      full_name: profile.full_name,
      role: profile.role,
    },
    groupCodes,
    students: pagedStudents.students,
    studentPage: {
      page: options.page,
      pageSize: options.pageSize,
      total: pagedStudents.total,
      pageCount: Math.max(1, Math.ceil(pagedStudents.total / options.pageSize)),
    },
    issues: (issuesResult.data ?? []).map(toIssue),
    stimulusAssets: (assetsResult.data ?? []).map(toStimulusAsset),
    reflectionQuestions: (questionsResult.data ?? []).map(toReflectionQuestion),
    roleCards: (rolesResult.data ?? []).map(toRoleCard),
    auditLogs: (auditResult.data ?? []).map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entity_type,
      detail:
        typeof log.metadata === "object" && log.metadata && "detail" in log.metadata
          ? String(log.metadata.detail)
          : JSON.stringify(log.metadata),
      createdAt: log.created_at,
    })),
    discussions: (discussionsResult.data ?? []).map((discussion) => {
      const session = sessionById.get(discussion.student_session_id);
      const issue = session?.issue_id ? issues.get(session.issue_id) : undefined;
      return {
        studentSessionId: discussion.student_session_id,
        studentName: session?.student_name ?? "Siswa",
        issueTitle: issue?.title ?? "Belum memilih isu",
        observationText: discussion.observation_text,
        groupSolutionDraft: discussion.group_solution_draft,
        robloxClicks: clickCounts.get(discussion.student_session_id) ?? 0,
      };
    }),
    finalSolutions: (finalsResult.data ?? []).map((final) => {
      const session = sessionById.get(final.student_session_id);
      const role = session?.role_card_id ? roles.get(session.role_card_id) : undefined;
      return {
        studentSessionId: final.student_session_id,
        studentName: session?.student_name ?? "Siswa",
        groupCode: session?.group_code ?? "A",
        roleName: role?.name ?? "Belum memilih peran",
        finalSolutionText: final.final_solution_text,
        personalCommitmentText: final.personal_commitment_text,
      };
    }),
    reflectionSummaries: (answersResult.data ?? []).map((answer) => {
      const session = sessionById.get(answer.student_session_id);
      const question = questions.get(answer.question_id);
      return {
        studentSessionId: answer.student_session_id,
        studentName: session?.student_name ?? "Siswa",
        questionText: question?.questionText ?? "Pertanyaan",
        answerText: answer.answer_text,
        submittedAt: answer.submitted_at ?? undefined,
      };
    }),
  };
}

export function ensureIssueForGroup(catalog: StudentCatalog, groupCode: GroupCode) {
  return (
    catalog.issues.find((issue) => issue.groupCode === groupCode) ??
    catalog.issues[0]
  );
}

export function assertStudentStatusOpen(status: StudentStatus) {
  if (status === "completed") {
    throw new Error("Sesi sudah selesai dan tidak bisa diubah.");
  }
}
