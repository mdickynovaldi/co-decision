import type {
  AdminStudentRow,
  GroupCode,
  Issue,
  ReflectionQuestion,
  RoleCard,
} from "@/lib/eco/types";

export const groupCodes: GroupCode[] = ["A", "B", "C", "D", "E"];

export const issues: Issue[] = [
  {
    id: "issue-ciujung",
    groupCode: "A",
    slug: "pencemaran-sungai-ciujung",
    title: "Pencemaran Sungai Ciujung",
    description:
      "Sungai berubah warna, bau, dan mengganggu aktivitas warga di sekitar bantaran.",
    content:
      "Warga di sekitar Sungai Ciujung melaporkan air sungai berwarna pekat setelah hujan dan aktivitas industri meningkat. Sebagian warga masih memakai sungai untuk kebutuhan harian, sementara pelaku usaha menyatakan telah mengikuti prosedur. Kelompokmu perlu menimbang bukti, dampak, dan kepentingan pihak yang berbeda.",
    thumbnailTone: "from-emerald-100 via-sky-100 to-white",
    robloxMapUrl: "https://www.roblox.com/games/0000000000/Eco-Decision-Map",
    isPublished: true,
  },
  {
    id: "issue-pesisir",
    groupCode: "B",
    slug: "alih-fungsi-lahan-pesisir",
    title: "Alih Fungsi Lahan Pesisir",
    description:
      "Mangrove berkurang karena pembangunan, tambak, dan kebutuhan ekonomi warga.",
    content:
      "Lahan pesisir yang dulu ditumbuhi mangrove kini berubah menjadi area usaha dan permukiman. Warga membutuhkan penghasilan, tetapi abrasi dan banjir rob makin sering terjadi. Diskusi perlu mencari keputusan yang adil bagi lingkungan dan masyarakat.",
    thumbnailTone: "from-cyan-100 via-emerald-100 to-white",
    robloxMapUrl: "https://www.roblox.com/games/0000000000/Eco-Decision-Map",
    isPublished: true,
  },
  {
    id: "issue-udara",
    groupCode: "C",
    slug: "pencemaran-udara-industri",
    title: "Pencemaran Udara Industri",
    description:
      "Asap pabrik dan kendaraan membuat kualitas udara menurun di sekitar sekolah.",
    content:
      "Siswa dan warga mengeluhkan batuk dan bau menyengat pada jam tertentu. Industri menyatakan proses produksi penting untuk ekonomi daerah. Kelompokmu perlu memetakan sumber masalah, pihak terdampak, dan solusi yang masuk akal.",
    thumbnailTone: "from-slate-100 via-sky-100 to-white",
    robloxMapUrl: "https://www.roblox.com/games/0000000000/Eco-Decision-Map",
    isPublished: true,
  },
  {
    id: "issue-bukit",
    groupCode: "D",
    slug: "pengerukan-bukit-tambang",
    title: "Pengerukan Bukit Tambang",
    description:
      "Aktivitas tambang mengubah bentang alam dan meningkatkan risiko longsor.",
    content:
      "Bukit yang menjadi penahan air mulai terkikis oleh aktivitas tambang. Perusahaan membuka lapangan kerja, tetapi warga khawatir pada debu, jalan rusak, dan risiko longsor. Keputusan kelompok harus mempertimbangkan bukti lingkungan dan kebutuhan ekonomi.",
    thumbnailTone: "from-lime-100 via-stone-100 to-white",
    robloxMapUrl: "https://www.roblox.com/games/0000000000/Eco-Decision-Map",
    isPublished: true,
  },
  {
    id: "issue-b3",
    groupCode: "E",
    slug: "limbah-b3-industri",
    title: "Limbah B3 Industri",
    description:
      "Limbah berbahaya perlu ditangani aman agar tidak mencemari tanah dan air.",
    content:
      "Beberapa drum limbah ditemukan di dekat area industri dan warga khawatir limbah itu mencemari tanah. Guru belum memasang tautan map untuk skenario ini. Kelompokmu tetap dapat membaca stimulus dan menyiapkan pertanyaan diskusi.",
    thumbnailTone: "from-amber-100 via-emerald-100 to-white",
    robloxMapUrl: "",
    isPublished: true,
  },
];

export const reflectionQuestions: ReflectionQuestion[] = [
  {
    id: "main-problem",
    questionText: "Apa masalah utama yang terjadi?",
    orderIndex: 1,
    isRequired: true,
    isPublished: true,
  },
  {
    id: "cause",
    questionText:
      "Apakah masalah ini terjadi secara alami atau akibat aktivitas manusia?",
    orderIndex: 2,
    isRequired: true,
    isPublished: true,
  },
  {
    id: "affected",
    questionText: "Siapa saja pihak yang terdampak?",
    orderIndex: 3,
    isRequired: true,
    isPublished: true,
  },
];

export const roleCards: RoleCard[] = [
  {
    id: "role-scientist",
    name: "Ilmuwan",
    slug: "ilmuwan",
    avatar: "IL",
    shortDescription:
      "Membaca data dan membantu kelompok mengambil keputusan berbasis bukti.",
    mission:
      "Jelaskan apa yang bisa dibuktikan dari pengamatan dan data lingkungan.",
    interest: "Keputusan harus masuk akal secara ilmiah dan dapat dipantau.",
    alternatives: [
      "Uji kualitas air atau udara secara berkala.",
      "Membuat peta sumber pencemaran.",
      "Menyusun indikator pemulihan lingkungan.",
    ],
    decisionCriteria: [
      "Ada bukti pengamatan.",
      "Solusi bisa diukur.",
      "Risiko lingkungan berkurang.",
    ],
    checklist: [
      "Catat bukti yang terlihat di map.",
      "Bedakan dugaan dan fakta.",
      "Minta kelompok menyebut indikator keberhasilan.",
    ],
    isPublished: true,
  },
  {
    id: "role-resident",
    name: "Warga",
    slug: "warga",
    avatar: "WG",
    shortDescription:
      "Mewakili kebutuhan masyarakat yang terdampak langsung oleh masalah.",
    mission:
      "Sampaikan dampak masalah pada kesehatan, pekerjaan, dan kehidupan harian.",
    interest: "Lingkungan aman tanpa mengabaikan kebutuhan hidup warga.",
    alternatives: [
      "Forum warga dan pelaku usaha.",
      "Pelaporan dampak ke pemerintah.",
      "Aksi bersih lingkungan bersama.",
    ],
    decisionCriteria: [
      "Warga dilibatkan.",
      "Dampak harian berkurang.",
      "Solusi tidak memberatkan kelompok rentan.",
    ],
    checklist: [
      "Sebutkan dampak yang dirasakan warga.",
      "Tanyakan kompensasi atau bantuan yang adil.",
      "Usulkan cara warga ikut memantau.",
    ],
    isPublished: true,
  },
  {
    id: "role-government",
    name: "Pemerintah",
    slug: "pemerintah",
    avatar: "PM",
    shortDescription:
      "Menjaga aturan, keselamatan, dan keseimbangan kepentingan publik.",
    mission:
      "Cari keputusan yang bisa dijalankan, diawasi, dan adil bagi semua pihak.",
    interest: "Aturan dipatuhi dan konflik sosial dapat dikurangi.",
    alternatives: [
      "Inspeksi dan sanksi bertahap.",
      "Mediasi antar pihak.",
      "Program pemulihan lingkungan daerah.",
    ],
    decisionCriteria: [
      "Sesuai aturan.",
      "Bisa diawasi sekolah/daerah.",
      "Tidak menimbulkan risiko baru.",
    ],
    checklist: [
      "Tanyakan aturan yang perlu dipatuhi.",
      "Buat urutan tindakan yang realistis.",
      "Pastikan ada pihak penanggung jawab.",
    ],
    isPublished: true,
  },
  {
    id: "role-industry",
    name: "Industri",
    slug: "industri",
    avatar: "IN",
    shortDescription:
      "Mewakili kegiatan ekonomi yang harus bertanggung jawab pada lingkungan.",
    mission:
      "Jelaskan kebutuhan produksi sambil menawarkan perbaikan yang bertanggung jawab.",
    interest: "Usaha tetap berjalan dengan dampak lingkungan yang terkendali.",
    alternatives: [
      "Perbaikan instalasi pengolahan limbah.",
      "Audit lingkungan terbuka.",
      "Pendanaan program pemulihan.",
    ],
    decisionCriteria: [
      "Biaya realistis.",
      "Dampak turun jelas.",
      "Kepercayaan publik membaik.",
    ],
    checklist: [
      "Jelaskan batas kemampuan industri.",
      "Tawarkan langkah perbaikan konkret.",
      "Terima pengawasan dari pihak lain.",
    ],
    isPublished: true,
  },
  {
    id: "role-ngo",
    name: "LSM",
    slug: "lsm",
    avatar: "LS",
    shortDescription:
      "Mendorong transparansi, keadilan lingkungan, dan aksi masyarakat.",
    mission:
      "Pastikan suara warga dan lingkungan tidak kalah oleh kepentingan besar.",
    interest: "Keputusan terbuka, adil, dan berpihak pada keberlanjutan.",
    alternatives: [
      "Kampanye edukasi publik.",
      "Pemantauan independen.",
      "Advokasi pemulihan lingkungan.",
    ],
    decisionCriteria: [
      "Transparan.",
      "Melibatkan warga.",
      "Ada komitmen jangka panjang.",
    ],
    checklist: [
      "Tanyakan siapa yang belum didengar.",
      "Dorong bukti dibuka bersama.",
      "Usulkan komitmen aksi nyata.",
    ],
    isPublished: true,
  },
];

export const recommendedActions = [
  "Melaporkan ke Dinas Lingkungan Hidup",
  "Edukasi warga sekitar",
  "Monitoring kualitas lingkungan",
  "Program penghijauan",
  "Bioremediasi sederhana",
];

export const rubricCriteria = [
  "Pemahaman masalah",
  "Kesesuaian peran",
  "Argumentasi Keputusan",
  "Kualitas solusi",
  "Komitmen aksi",
];

export const adminStudents: AdminStudentRow[] = [
  {
    id: "student-1",
    studentName: "Alya Prameswari",
    groupCode: "A",
    issueTitle: "Pencemaran Sungai Ciujung",
    roleName: "Ilmuwan",
    status: "completed",
    progressPercent: 100,
    robloxClicks: 1,
    updatedAt: "10 Mei 2026, 09.20",
    rubric: {
      problemUnderstandingScore: 4,
      roleAlignmentScore: 5,
      discussionQualityScore: 4,
      solutionQualityScore: 4,
      actionCommitmentScore: 5,
      feedbackText: "Solusi sudah jelas. Tambahkan indikator pemantauan.",
      status: "saved",
    },
  },
  {
    id: "student-2",
    studentName: "Bima Santoso",
    groupCode: "B",
    issueTitle: "Alih Fungsi Lahan Pesisir",
    roleName: "Warga",
    status: "discussion",
    progressPercent: 72,
    robloxClicks: 1,
    updatedAt: "10 Mei 2026, 09.05",
  },
  {
    id: "student-3",
    studentName: "Citra Dewi",
    groupCode: "C",
    issueTitle: "Pencemaran Udara Industri",
    roleName: "Pemerintah",
    status: "final",
    progressPercent: 86,
    robloxClicks: 2,
    updatedAt: "10 Mei 2026, 09.12",
  },
  {
    id: "student-4",
    studentName: "Damar Wibowo",
    groupCode: "D",
    issueTitle: "Pengerukan Bukit Tambang",
    roleName: "Industri",
    status: "role",
    progressPercent: 48,
    robloxClicks: 0,
    updatedAt: "10 Mei 2026, 08.54",
  },
  {
    id: "student-5",
    studentName: "Eka Lestari",
    groupCode: "E",
    issueTitle: "Limbah B3 Industri",
    roleName: "LSM",
    status: "discussion",
    progressPercent: 64,
    robloxClicks: 0,
    updatedAt: "10 Mei 2026, 08.42",
  },
];

export function getIssueByGroup(groupCode?: GroupCode) {
  return issues.find((issue) => issue.groupCode === groupCode) ?? issues[0];
}

export function getIssueById(issueId?: string) {
  return issues.find((issue) => issue.id === issueId);
}

export function getRoleById(roleCardId?: string) {
  return roleCards.find((role) => role.id === roleCardId);
}

export function getRoleBySlug(slug?: string) {
  return roleCards.find((role) => role.slug === slug);
}
