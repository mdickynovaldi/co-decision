export type GroupCode = "A" | "B" | "C" | "D" | "E";

export type StudentStatus =
  | "registered"
  | "issue"
  | "stimulus"
  | "role"
  | "discussion"
  | "final"
  | "completed";

export type Issue = {
  id: string;
  groupCode: GroupCode;
  slug: string;
  title: string;
  description: string;
  content: string;
  thumbnailTone: string;
  robloxMapUrl?: string;
  isPublished: boolean;
};

export type StimulusAsset = {
  id: string;
  issueId: string;
  assetType: "link" | "image" | "video" | "document";
  title: string;
  url: string;
  description?: string;
  orderIndex: number;
  isPublished: boolean;
};

export type ReflectionQuestion = {
  id: string;
  issueId?: string;
  questionText: string;
  orderIndex: number;
  isRequired: boolean;
  isPublished: boolean;
};

export type RoleCard = {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  shortDescription: string;
  mission: string;
  interest: string;
  alternatives: string[];
  decisionCriteria: string[];
  checklist: string[];
  isPublished: boolean;
};

export type ReflectionAnswer = {
  questionId: string;
  answerText: string;
  autosavedAt?: string;
  submittedAt?: string;
};

export type DiscussionResult = {
  observationText: string;
  visibleProblemText: string;
  roleOpinionText: string;
  otherRolesOpinionText?: string;
  groupSolutionDraft: string;
  agreedRolesCount: number;
  autosavedAt?: string;
  submittedAt?: string;
};

export type FinalSolution = {
  finalSolutionText: string;
  actionStepsText: string;
  personalCommitmentText: string;
  submittedAt?: string;
};

export type RobloxClickEvent = {
  id: string;
  studentSessionId: string;
  issueId?: string;
  roleCardId?: string;
  robloxMapUrl?: string;
  clickedAt: string;
};

export type StudentProgress = {
  id: string;
  studentName: string;
  classCode?: string;
  groupCode: GroupCode;
  issueId?: string;
  roleCardId?: string;
  status: StudentStatus;
  progressStep: number;
  reflectionAnswers: ReflectionAnswer[];
  discussionResult?: DiscussionResult;
  finalSolution?: FinalSolution;
  robloxClicks: RobloxClickEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type RubricScore = {
  problemUnderstandingScore: number;
  roleAlignmentScore: number;
  discussionQualityScore: number;
  solutionQualityScore: number;
  actionCommitmentScore: number;
  feedbackText: string;
  status: "draft" | "saved";
};

export type AdminStudentRow = {
  id: string;
  studentName: string;
  groupCode: GroupCode;
  issueTitle: string;
  roleName: string;
  status: StudentStatus;
  progressPercent: number;
  robloxClicks: number;
  updatedAt: string;
  rubric?: RubricScore;
};
