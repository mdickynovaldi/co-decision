import { z } from "zod";

export const groupCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Kode kelompok belum diisi.")
  .max(12, "Kode kelompok maksimal 12 karakter.")
  .regex(
    /^[A-Z0-9][A-Z0-9_-]*$/,
    "Kode kelompok hanya boleh huruf, angka, - atau _, dan harus diawali huruf/angka.",
  );
export const uuidSchema = z.uuid("ID tidak valid.");
export const studentStatusSchema = z.enum([
  "registered",
  "issue",
  "stimulus",
  "role",
  "discussion",
  "final",
  "completed",
]);

export const registrationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email belum valid."),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(72, "Password terlalu panjang.")
    .regex(/[a-z]/, "Password harus memuat huruf kecil.")
    .regex(/[A-Z]/, "Password harus memuat huruf besar.")
    .regex(/[0-9]/, "Password harus memuat angka."),
  studentName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama terlalu panjang."),
  groupCode: groupCodeSchema,
  classCode: z
    .string()
    .trim()
    .max(24, "Kode kelas terlalu panjang.")
    .regex(/^[A-Za-z0-9 _-]*$/, "Kode kelas hanya boleh huruf, angka, spasi, - atau _."),
  ready: z.boolean().refine((value) => value, "Centang kesiapanmu dulu."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email belum valid."),
  password: z.string().min(1, "Password belum diisi."),
});

export const reflectionSchema = z.object({
  answers: z
    .record(z.string(), z.string().trim().min(10, "Jawaban minimal 10 karakter."))
    .refine((answers) => Object.keys(answers).length >= 3, {
      message: "Jawaban refleksi belum lengkap.",
    }),
});

export const discussionSchema = z.object({
  observationText: z
    .string()
    .trim()
    .min(12, "Hasil pengamatan belum cukup jelas.")
    .max(1200, "Hasil pengamatan terlalu panjang."),
  visibleProblemText: z
    .string()
    .trim()
    .min(8, "Masalah paling terlihat belum diisi.")
    .max(700, "Jawaban terlalu panjang."),
  roleOpinionText: z
    .string()
    .trim()
    .min(8, "Pendapat dari peranmu belum diisi.")
    .max(900, "Jawaban terlalu panjang."),
  otherRolesOpinionText: z.string().trim().max(900, "Jawaban terlalu panjang."),
  groupSolutionDraft: z
    .string()
    .trim()
    .min(12, "Solusi sementara belum cukup jelas.")
    .max(1000, "Solusi terlalu panjang."),
  agreedRolesCount: z
    .number()
    .int("Jumlah peran harus angka bulat.")
    .min(0, "Jumlah tidak boleh kurang dari 0.")
    .max(5, "Jumlah peran maksimal 5."),
});

export const finalSolutionSchema = z.object({
  finalSolutionText: z
    .string()
    .trim()
    .min(15, "Solusi akhir belum cukup jelas.")
    .max(1200, "Solusi akhir terlalu panjang."),
  actionStepsText: z
    .string()
    .trim()
    .min(15, "Langkah tindakan nyata belum cukup jelas.")
    .max(1200, "Langkah tindakan terlalu panjang."),
  personalCommitmentText: z
    .string()
    .trim()
    .min(10, "Komitmen pribadi belum cukup jelas.")
    .max(700, "Komitmen terlalu panjang."),
});

export const rubricSchema = z.object({
  studentSessionId: uuidSchema,
  problemUnderstandingScore: z.number().int().min(1).max(5),
  roleAlignmentScore: z.number().int().min(1).max(5),
  discussionQualityScore: z.number().int().min(1).max(5),
  solutionQualityScore: z.number().int().min(1).max(5),
  actionCommitmentScore: z.number().int().min(1).max(5),
  feedbackText: z
    .string()
    .trim()
    .min(5, "Feedback minimal 5 karakter.")
    .max(1200, "Feedback terlalu panjang."),
});

export const issueSelectionSchema = z.object({
  issueId: uuidSchema,
});

export const roleSelectionSchema = z.object({
  roleCardId: uuidSchema,
});

export const robloxClickSchema = z.object({
  robloxMapUrl: z.string().trim().max(500).optional(),
});

export const issueContentSchema = z.object({
  issueId: uuidSchema,
  title: z.string().trim().min(3, "Judul belum diisi.").max(140),
  description: z.string().trim().min(10, "Deskripsi belum cukup jelas.").max(280),
  content: z.string().trim().min(20, "Narasi belum cukup jelas.").max(2400),
  robloxMapUrl: z
    .string()
    .trim()
    .max(500, "URL terlalu panjang.")
    .refine(
      (value) => !value || /^https:\/\/www\.roblox\.com\/games\//.test(value),
      "Gunakan URL Roblox yang valid.",
    ),
  isPublished: z.boolean(),
});

export const issueCreateSchema = issueContentSchema
  .omit({ issueId: true })
  .extend({
    groupCode: groupCodeSchema,
    slug: z
      .string()
      .trim()
      .min(3, "Slug belum diisi.")
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug gunakan huruf kecil, angka, dan -."),
    thumbnailTone: z.string().trim().min(3).max(120),
  });

export const contentDeleteSchema = z.object({
  kind: z.enum(["issue", "question", "role", "asset"]),
  id: uuidSchema,
});

export const groupDeleteSchema = z.object({
  groupCode: groupCodeSchema,
});

export const reflectionQuestionContentSchema = z.object({
  questionId: uuidSchema,
  issueId: uuidSchema.optional().or(z.literal("")),
  questionText: z.string().trim().min(8, "Pertanyaan belum cukup jelas.").max(240),
  orderIndex: z.number().int().min(1).max(99),
  isRequired: z.boolean(),
  isPublished: z.boolean(),
});

export const reflectionQuestionCreateSchema = reflectionQuestionContentSchema.omit({
  questionId: true,
});

const stringListSchema = z
  .array(z.string().trim().min(2).max(160))
  .min(1, "Isi minimal satu poin.")
  .max(8, "Maksimal 8 poin.");

export const roleCardContentSchema = z.object({
  roleCardId: uuidSchema,
  name: z.string().trim().min(3, "Nama peran belum diisi.").max(80),
  slug: z
    .string()
    .trim()
    .min(3, "Slug belum diisi.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug gunakan huruf kecil, angka, dan -."),
  avatar: z.string().trim().min(1).max(4),
  shortDescription: z.string().trim().min(12).max(240),
  mission: z.string().trim().min(12).max(500),
  interest: z.string().trim().min(12).max(500),
  alternatives: stringListSchema,
  decisionCriteria: stringListSchema,
  checklist: stringListSchema,
  isPublished: z.boolean(),
});

export const roleCardCreateSchema = roleCardContentSchema.omit({
  roleCardId: true,
});

export const stimulusAssetContentSchema = z.object({
  assetId: uuidSchema,
  issueId: uuidSchema,
  assetType: z.enum(["link", "image", "video", "document"]),
  title: z.string().trim().min(3, "Judul aset belum diisi.").max(140),
  url: z.string().trim().url("URL aset belum valid.").max(500),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  orderIndex: z.number().int().min(1).max(99),
  isPublished: z.boolean(),
});

export const stimulusAssetCreateSchema = stimulusAssetContentSchema.omit({
  assetId: true,
});

export const adminStudentQuerySchema = z.object({
  query: z.string().trim().max(100).default(""),
  groupCode: z.union([z.literal("all"), groupCodeSchema]).default("all"),
  status: z.union([studentStatusSchema, z.literal("all")]).default("all"),
  sortBy: z
    .enum(["studentName", "groupCode", "status", "progressPercent", "updatedAt"])
    .default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
});

export const exportSchema = z.object({
  format: z.enum(["csv", "xlsx"]).default("csv"),
  groupCode: z.union([z.literal("all"), groupCodeSchema]).default("all"),
  status: z.union([studentStatusSchema, z.literal("all")]).default("all"),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ReflectionFormValues = z.infer<typeof reflectionSchema>;
export type DiscussionFormValues = z.infer<typeof discussionSchema>;
export type FinalSolutionFormValues = z.infer<typeof finalSolutionSchema>;
export type RubricFormValues = z.infer<typeof rubricSchema>;
export type IssueContentFormValues = z.infer<typeof issueContentSchema>;
export type IssueCreateFormValues = z.infer<typeof issueCreateSchema>;
export type ReflectionQuestionContentFormValues = z.infer<
  typeof reflectionQuestionContentSchema
>;
export type ReflectionQuestionCreateFormValues = z.infer<
  typeof reflectionQuestionCreateSchema
>;
export type RoleCardContentFormValues = z.infer<typeof roleCardContentSchema>;
export type RoleCardCreateFormValues = z.infer<typeof roleCardCreateSchema>;
export type StimulusAssetContentFormValues = z.infer<
  typeof stimulusAssetContentSchema
>;
export type StimulusAssetCreateFormValues = z.infer<
  typeof stimulusAssetCreateSchema
>;
export type AdminStudentQueryValues = z.infer<typeof adminStudentQuerySchema>;
export type ExportFormValues = z.infer<typeof exportSchema>;
