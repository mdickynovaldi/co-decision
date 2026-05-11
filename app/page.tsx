import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Leaf,
  Map,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const playSteps = [
  "Registrasi siswa",
  "Pilih isu lingkungan",
  "Jawab refleksi",
  "Pilih stakeholder",
  "Masuk Map Roblox",
  "Submit solusi",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FAF8_0%,#FFFFFF_58%,#E8F4FB_100%)] text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="size-5" aria-hidden="true" />
          </span>
          Eco-Decision
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden rounded-xl sm:inline-flex">
            <Link href="/panduan">Panduan</Link>
          </Button>
          <Button asChild variant="outline" className="hidden rounded-xl sm:inline-flex">
            <Link href="/admin/login">Guru/Admin</Link>
          </Button>
          <Button asChild variant="ghost" className="hidden rounded-xl sm:inline-flex">
            <Link href="/masuk">Masuk Siswa</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-8 lg:pb-20 lg:pt-14">
        <div className="max-w-3xl">
          <Badge className="rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary">
            SSI-PBL role-play lingkungan
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-eco-ink sm:text-6xl">
            Eco-Decision Role Play
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Belajar memecahkan masalah lingkungan melalui role-play interaktif,
            diskusi stakeholder, dan eksplorasi Map Roblox yang dibuka di tab
            baru.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12 rounded-xl px-5 text-base">
              <Link href="/mulai">
                Mulai Bermain
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl px-5 text-base"
            >
              <Link href="/panduan">
                Lihat Panduan
                <BookOpen className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Data siswa tidak tampil publik
            </span>
            <span className="inline-flex items-center gap-2">
              <ExternalLink className="size-4 text-river" aria-hidden="true" />
              Roblox terbuka di tab baru
            </span>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-border bg-white p-5 shadow-xl shadow-primary/10">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-emerald-100 via-sky-100 to-white" />
          <div className="relative grid gap-4">
            <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Skenario aktif
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-eco-ink">
                    Pencemaran Sungai Ciujung
                  </h2>
                </div>
                <Map className="size-9 text-river" aria-hidden="true" />
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {["A", "B", "C", "D", "E"].map((group) => (
                  <span
                    key={group}
                    className="grid h-10 place-items-center rounded-xl bg-muted text-sm font-semibold text-eco-ink"
                  >
                    {group}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <PreviewTile
                icon={Users}
                label="Role stakeholder"
                value="Ilmuwan, Warga, Pemerintah"
              />
              <PreviewTile
                icon={MessageSquareText}
                label="Diskusi"
                value="Refleksi, observasi, solusi"
              />
            </div>

            <div className="rounded-2xl border border-border bg-[#10231D] p-4 text-white">
              <p className="text-sm text-white/70">Progress siswa</p>
              <div className="mt-4 space-y-3">
                {playSteps.slice(0, 4).map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-white/15 text-xs">
                      {index + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Satu halaman, satu aksi",
              body: "Siswa selalu tahu langkah berikutnya melalui CTA dan progress stepper.",
            },
            {
              title: "Role-play stakeholder",
              body: "Setiap siswa membawa kepentingan dan misi peran ke diskusi kelompok.",
            },
            {
              title: "Dashboard guru",
              body: "Guru melihat progres, jawaban, rubrik, feedback, dan export data Supabase.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="p-5">
                <CheckCircle2 className="size-6 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-eco-ink">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

function PreviewTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <Icon className="size-6 text-primary" aria-hidden="true" />
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-eco-ink">{value}</p>
    </div>
  );
}
