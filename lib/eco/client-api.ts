"use client";

import type { AdminDataset, StudentState } from "@/lib/eco/server/data";
import type {
  DiscussionFormValues,
  FinalSolutionFormValues,
  AdminStudentQueryValues,
  IssueContentFormValues,
  IssueCreateFormValues,
  LoginFormValues,
  ReflectionFormValues,
  ReflectionQuestionContentFormValues,
  ReflectionQuestionCreateFormValues,
  RoleCardContentFormValues,
  RoleCardCreateFormValues,
  RegistrationFormValues,
  RubricFormValues,
  StimulusAssetContentFormValues,
  StimulusAssetCreateFormValues,
} from "@/lib/eco/validations";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let json: ApiResponse<T>;
  try {
    json = text
      ? (JSON.parse(text) as ApiResponse<T>)
      : ({
        ok: false,
        message: response.ok
          ? "Response kosong dari server."
          : "Server belum mengirim response JSON.",
      } satisfies ApiResponse<T>);
  } catch {
    json = {
      ok: false,
      message: "Server mengirim response yang belum valid.",
    };
  }

  if (!json.ok) {
    throw new Error(json.message);
  }

  return json.data;
}

async function studentAction<T>(action: string, payload?: unknown) {
  const response = await fetch("/api/student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  return parseResponse<T>(response);
}

async function adminAction<T>(action: string, payload?: unknown) {
  const response = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  return parseResponse<T>(response);
}

export async function getStudentState() {
  const response = await fetch("/api/student", { cache: "no-store" });
  return parseResponse<StudentState>(response);
}

export function registerStudent(values: RegistrationFormValues) {
  return studentAction<StudentState>("register", values);
}

export function signInStudent(values: LoginFormValues) {
  return studentAction<StudentState>("login", values);
}

export function signOutStudent() {
  return studentAction<{ signedOut: boolean }>("logout");
}

export function selectIssue(issueId: string) {
  return studentAction<StudentState>("selectIssue", { issueId });
}

export function saveReflection(values: ReflectionFormValues) {
  return studentAction<StudentState>("saveReflection", values);
}

export function selectRole(roleCardId: string) {
  return studentAction<StudentState>("selectRole", { roleCardId });
}

export function trackRobloxClick(robloxMapUrl?: string) {
  return studentAction<StudentState>("trackRobloxClick", { robloxMapUrl });
}

export function saveDiscussion(values: DiscussionFormValues) {
  return studentAction<StudentState>("saveDiscussion", values);
}

export function submitFinalSolution(values: FinalSolutionFormValues) {
  return studentAction<StudentState>("submitFinalSolution", values);
}

export async function getAdminDataset(query?: Partial<AdminStudentQueryValues>) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const url = params.size ? `/api/admin?${params.toString()}` : "/api/admin";
  const response = await fetch(url, { cache: "no-store" });
  return parseResponse<AdminDataset>(response);
}

export function signInAdmin(values: LoginFormValues) {
  return adminAction<AdminDataset>("login", values);
}

export function signOutAdmin() {
  return adminAction<{ signedOut: boolean }>("logout");
}

export function saveRubric(values: RubricFormValues) {
  return adminAction<AdminDataset>("saveRubric", values);
}

export function saveIssueContent(values: IssueContentFormValues) {
  return adminAction<AdminDataset>("saveIssue", values);
}

export function createIssueContent(values: IssueCreateFormValues) {
  return adminAction<AdminDataset>("createIssue", values);
}

export function deleteContentItem(kind: "issue" | "question" | "role" | "asset", id: string) {
  return adminAction<AdminDataset>("deleteContent", { kind, id });
}

export function deleteGroupContent(groupCode: string) {
  return adminAction<AdminDataset>("deleteGroup", { groupCode });
}

export function deleteStudentAnswers(
  kind: "reflection" | "discussion" | "final" | "rubric",
  ids: string[],
) {
  return adminAction<AdminDataset>("deleteStudentAnswers", { kind, ids });
}

export function saveReflectionQuestion(values: ReflectionQuestionContentFormValues) {
  return adminAction<AdminDataset>("saveReflectionQuestion", values);
}

export function createReflectionQuestion(values: ReflectionQuestionCreateFormValues) {
  return adminAction<AdminDataset>("createReflectionQuestion", values);
}

export function saveRoleCard(values: RoleCardContentFormValues) {
  return adminAction<AdminDataset>("saveRoleCard", values);
}

export function createRoleCard(values: RoleCardCreateFormValues) {
  return adminAction<AdminDataset>("createRoleCard", values);
}

export function saveStimulusAsset(values: StimulusAssetContentFormValues) {
  return adminAction<AdminDataset>("saveStimulusAsset", values);
}

export function createStimulusAsset(values: StimulusAssetCreateFormValues) {
  return adminAction<AdminDataset>("createStimulusAsset", values);
}
