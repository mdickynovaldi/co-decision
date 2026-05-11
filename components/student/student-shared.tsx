import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  "Daftar",
  "Isu",
  "Stimulus",
  "Peran",
  "Diskusi",
  "Solusi",
  "Selesai",
];

export function StudentFrame({
  eyebrow,
  title,
  description,
  step,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  step?: number;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FAF8_0%,#FFFFFF_54%,#F4FBFF_100%)] text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-eco-ink"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="size-5" aria-hidden="true" />
            </span>
            Eco-Decision
          </Link>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Mode pembelajaran aman
          </div>
        </nav>

        {typeof step === "number" ? <StepProgress currentStep={step} /> : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-eco-ink sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                {description}
              </p>
            </div>
            {children}
          </div>
          {aside ? <aside className="space-y-4">{aside}</aside> : null}
        </section>
      </div>
    </main>
  );
}

export function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-white p-2 shadow-sm sm:grid-cols-4 lg:grid-cols-7">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < currentStep;
        const active = stepNumber === currentStep;

        return (
          <li
            key={label}
            className={cn(
              "flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground",
              done && "bg-primary/10 text-primary",
              active && "bg-amber-100 text-amber-950 ring-1 ring-amber-300",
            )}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border text-xs",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-amber-500 bg-amber-400 text-amber-950",
              )}
            >
              {done ? <CheckCircle2 className="size-4" aria-hidden="true" /> : stepNumber}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StartRequired() {
  return (
    <StudentFrame
      eyebrow="Data belum lengkap"
      title="Masuk sebagai siswa dulu"
      description="Kami belum menemukan sesi Supabase aktif. Masuk atau registrasi agar progres pembelajaran tersimpan."
    >
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-eco-ink">Belum ada sesi siswa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Data pembelajaran tersimpan aman di Supabase.
            </p>
          </div>
          <Button asChild className="h-11 rounded-xl">
            <Link href="/masuk">
              Masuk siswa
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </StudentFrame>
  );
}

export function InfoPanel({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card className="border-primary/15 bg-primary/5">
      <CardContent className="p-5">
        <h2 className="font-semibold text-eco-ink">{title}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ResetProgressButton({ onReset }: { onReset: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 rounded-xl"
      onClick={onReset}
    >
      <RotateCcw className="size-4" aria-hidden="true" />
      Keluar dan mulai akun lain
    </Button>
  );
}
