import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  Leaf,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const guideSections = [
  {
    title: "Cara bermain",
    icon: BookOpen,
    items: [
      "Isi nama dan kelompok.",
      "Pilih isu lingkungan sesuai kelompok.",
      "Baca stimulus dan jawab pertanyaan refleksi.",
      "Pilih peran stakeholder untuk diskusi.",
    ],
  },
  {
    title: "Role-play",
    icon: Users,
    items: [
      "Setiap peran punya misi dan kepentingan berbeda.",
      "Dengarkan pendapat peran lain sebelum membuat solusi.",
      "Gunakan bukti dari stimulus dan pengamatan.",
    ],
  },
  {
    title: "Map Roblox",
    icon: ExternalLink,
    items: [
      "Roblox akan terbuka di tab baru setelah konfirmasi.",
      "Jangan tutup website ini.",
      "Kembali ke website setelah eksplorasi selesai.",
    ],
  },
  {
    title: "Tips keamanan",
    icon: ShieldCheck,
    items: [
      "Ikuti instruksi guru selama menggunakan Roblox.",
      "Gunakan bahasa yang sopan saat diskusi.",
      "Jangan membagikan data pribadi di ruang publik.",
    ],
  },
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FAF8_0%,#FFFFFF_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="size-5" aria-hidden="true" />
            </span>
            Eco-Decision
          </Link>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/login">Guru/Admin</Link>
          </Button>
        </nav>

        <section className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Panduan siswa
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-eco-ink sm:text-5xl">
            Ikuti langkahnya dengan tenang
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Website ini akan membimbingmu dari registrasi sampai submit solusi
            akhir. Setiap halaman punya satu aksi utama.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-xl text-base">
              <Link href="/registrasi">
                Ayo mulai
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-12 rounded-xl text-base">
              <Link href="/masuk">Masuk siswa</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl text-base">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {guideSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <section.icon className="size-7 text-primary" aria-hidden="true" />
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <MessageSquareText
                        className="mt-0.5 size-4 shrink-0 text-river"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
