import { expect, test, type Page } from "@playwright/test";

test.skip(
  !process.env.E2E_SUPABASE_READY,
  "Supabase project/env is required for full backend E2E.",
);

const password = "Password123!";

async function registerStudent(page: Page, name: string, groupCode = "A") {
  const email = `siswa-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  await page.goto("/registrasi");
  await page.getByLabel("Email siswa").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByLabel("Nama lengkap").fill(name);
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: `Kelompok ${groupCode}` }).click();
  await page.getByText("Saya siap mengikuti pembelajaran").click();
  await page.getByRole("button", { name: /Lanjut pilih isu/i }).click();

  try {
    await expect(page).toHaveURL(/\/isu/, { timeout: 10_000 });
  } catch {
    await page.goto("/masuk");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /^Masuk$/ }).click();
    await expect(page).toHaveURL(/\/lanjutkan/);
    await page.goto("/isu");
  }

  return { email, name };
}

async function answerReflection(page: Page) {
  const answers = page.locator("textarea");
  await answers.nth(0).fill("Masalah utama terlihat dari perubahan kualitas lingkungan.");
  await answers.nth(1).fill("Masalah terjadi karena aktivitas manusia dan pengelolaan yang lemah.");
  await answers.nth(2).fill("Pihak terdampak meliputi warga, sekolah, pemerintah, dan pelaku usaha.");
  await page.getByRole("button", { name: /Simpan dan pilih peran/i }).click();
}

async function chooseFirstRole(page: Page) {
  await page.getByRole("button", { name: /Pilih peran/i }).first().click();
  await expect(page).toHaveURL(/\/peran\//);
  await page.getByRole("button", { name: /Lanjut ke Diskusi Bersama/i }).click();
}

async function loginAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL ?? "");
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: /Masuk dashboard/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

test.describe.serial("real Supabase flows", () => {
  test("student completes full flow and records Roblox click", async ({ page }) => {
    const student = await registerStudent(page, "Siswa Full E2E", "A");

    await expect(page).toHaveURL(/\/isu/);
    await page.getByRole("button", { name: /Pilih isu/i }).first().click();
    await expect(page).toHaveURL(/\/stimulus/);

    await answerReflection(page);
    await expect(page).toHaveURL(/\/peran/);

    await chooseFirstRole(page);
    await expect(page).toHaveURL(/\/diskusi/);

    await page.getByRole("button", { name: /Masuk ke Map Roblox/i }).click();
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("link", { name: /Ya, buka Roblox/i }).click();
    const popup = await popupPromise;
    await popup.close();
    await expect(page.getByText("1x")).toBeVisible();

    await page.getByRole("link", { name: /Isi hasil pengamatan/i }).click();
    await expect(page).toHaveURL(/\/hasil-diskusi/);
    await page
      .getByLabel("Hasil pengamatan dari Roblox")
      .fill("Terlihat area terdampak dan tanda masalah lingkungan di beberapa titik.");
    await page
      .getByLabel("Masalah paling terlihat")
      .fill("Kualitas lingkungan menurun dan perlu tindakan bersama.");
    await page
      .getByLabel("Pendapat dari peranmu")
      .fill("Peran saya mengusulkan keputusan berbasis bukti dan monitoring.");
    await page.getByLabel("Pendapat role lain").fill("Warga meminta solusi yang adil.");
    await page
      .getByLabel("Solusi sementara kelompok")
      .fill("Kelompok mengusulkan monitoring, edukasi, dan pelaporan berkala.");
    await page.getByLabel("Jumlah peran yang setuju").fill("5");
    await page.getByRole("button", { name: /Simpan hasil diskusi/i }).click();

    await expect(page).toHaveURL(/\/solusi-akhir/);
    await page
      .getByLabel("Solusi akhir kelompok")
      .fill("Solusi akhir adalah monitoring lingkungan, forum warga, dan perbaikan sumber masalah.");
    await page
      .getByLabel("Langkah tindakan nyata")
      .fill("Membuat jadwal pantau, membagi tugas, dan melaporkan hasil kepada guru.");
    await page
      .getByLabel("Komitmen pribadi siswa")
      .fill("Saya akan ikut menjaga lingkungan dan mencatat temuan.");
    await page.getByRole("button", { name: /Submit solusi akhir/i }).click();
    await page.getByRole("button", { name: /Ya, submit/i }).click();

    await expect(page).toHaveURL(/\/selesai/);
    await expect(
      page.getByRole("heading", { name: /Kamu telah menyelesaikan/i }),
    ).toBeVisible();

    await page.goto("/lanjutkan");
    await expect(page.getByRole("heading", { name: /Lanjutkan progresmu/i })).toBeVisible();
    await expect(page.getByText(student.name)).toBeVisible();
  });

  test("student sees safe state when Roblox URL is empty", async ({ page }) => {
    await registerStudent(page, "Siswa Safe State E2E", "E");
    await page.goto("/stimulus");
    await answerReflection(page);
    await chooseFirstRole(page);

    await expect(page).toHaveURL(/\/diskusi/);
    await expect(page.getByText("Map Roblox belum tersedia.")).toBeVisible();
  });

  test("admin uses filters, rubric, content CRUD, and export", async ({ page }) => {
    await loginAdmin(page);

    await page.goto("/admin/siswa");
    await page.getByPlaceholder("Cari siswa").fill("Siswa");
    await expect(page.getByText("Memperbarui filter...")).toBeVisible();

    const datasetResponse = await page.request.get("/api/admin?pageSize=50");
    const datasetJson = await datasetResponse.json();
    expect(datasetJson.ok).toBe(true);
    const firstStudent = datasetJson.data.students[0];
    expect(firstStudent.id).toBeTruthy();

    const rubricResponse = await page.request.post("/api/admin", {
      data: {
        action: "saveRubric",
        payload: {
          studentSessionId: firstStudent.id,
          problemUnderstandingScore: 4,
          roleAlignmentScore: 4,
          discussionQualityScore: 4,
          solutionQualityScore: 4,
          actionCommitmentScore: 4,
          feedbackText: "Feedback E2E tersimpan dari test nyata.",
        },
      },
    });
    expect((await rubricResponse.json()).ok).toBe(true);

    const suffix = Date.now();
    const createIssue = await page.request.post("/api/admin", {
      data: {
        action: "createIssue",
        payload: {
          groupCode: "A",
          slug: `isu-e2e-${suffix}`,
          title: `Isu E2E ${suffix}`,
          description: "Deskripsi isu E2E untuk verifikasi CRUD.",
          content: "Narasi kasus E2E yang cukup panjang untuk validasi konten admin.",
          thumbnailTone: "from-emerald-100 via-sky-100 to-white",
          robloxMapUrl: "",
          isPublished: false,
        },
      },
    });
    const createIssueJson = await createIssue.json();
    expect(createIssueJson.ok).toBe(true);
    const createdIssue = createIssueJson.data.issues.find(
      (issue: { slug: string }) => issue.slug === `isu-e2e-${suffix}`,
    );
    expect(createdIssue.id).toBeTruthy();

    const saveIssue = await page.request.post("/api/admin", {
      data: {
        action: "saveIssue",
        payload: {
          issueId: createdIssue.id,
          title: `Isu E2E ${suffix} Updated`,
          description: "Deskripsi isu E2E yang sudah diperbarui.",
          content: "Narasi kasus E2E yang diperbarui untuk memeriksa update konten.",
          robloxMapUrl: "https://www.roblox.com/games/0000000000/Eco-Decision-Map",
          isPublished: false,
        },
      },
    });
    expect((await saveIssue.json()).ok).toBe(true);

    const createQuestion = await page.request.post("/api/admin", {
      data: {
        action: "createReflectionQuestion",
        payload: {
          issueId: createdIssue.id,
          questionText: "Apa bukti utama dari skenario E2E?",
          orderIndex: 9,
          isRequired: true,
          isPublished: false,
        },
      },
    });
    const questionJson = await createQuestion.json();
    expect(questionJson.ok).toBe(true);
    const createdQuestion = questionJson.data.reflectionQuestions.find(
      (question: { questionText: string }) =>
        question.questionText === "Apa bukti utama dari skenario E2E?",
    );

    const createRole = await page.request.post("/api/admin", {
      data: {
        action: "createRoleCard",
        payload: {
          name: `Role E2E ${suffix}`,
          slug: `role-e2e-${suffix}`,
          avatar: "E2",
          shortDescription: "Role E2E untuk verifikasi CRUD.",
          mission: "Menguji pembuatan role card dari dashboard admin.",
          interest: "Memastikan data role tersimpan dan bisa dihapus lagi.",
          alternatives: ["Alternatif E2E pertama."],
          decisionCriteria: ["Kriteria E2E pertama."],
          checklist: ["Checklist E2E pertama."],
          isPublished: false,
        },
      },
    });
    const roleJson = await createRole.json();
    expect(roleJson.ok).toBe(true);
    const createdRole = roleJson.data.roleCards.find(
      (role: { slug: string }) => role.slug === `role-e2e-${suffix}`,
    );

    const createAsset = await page.request.post("/api/admin", {
      data: {
        action: "createStimulusAsset",
        payload: {
          issueId: createdIssue.id,
          assetType: "link",
          title: `Aset E2E ${suffix}`,
          url: "https://www.roblox.com/",
          description: "Aset stimulus E2E.",
          orderIndex: 8,
          isPublished: false,
        },
      },
    });
    const assetJson = await createAsset.json();
    expect(assetJson.ok).toBe(true);
    const createdAsset = assetJson.data.stimulusAssets.find(
      (asset: { title: string }) => asset.title === `Aset E2E ${suffix}`,
    );

    for (const [kind, id] of [
      ["asset", createdAsset.id],
      ["question", createdQuestion.id],
      ["role", createdRole.id],
      ["issue", createdIssue.id],
    ] as const) {
      const deleteResponse = await page.request.post("/api/admin", {
        data: { action: "deleteContent", payload: { kind, id } },
      });
      expect((await deleteResponse.json()).ok).toBe(true);
    }

    await page.goto("/admin/konten");
    await expect(page.getByRole("heading", { name: /Kelola isu/i })).toBeVisible();

    await page.goto("/admin/export");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export data/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/eco-decision-export\.(csv|xlsx)/);
  });
});
