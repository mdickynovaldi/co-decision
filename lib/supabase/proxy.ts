import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

const studentProtectedPrefixes = [
  "/isu",
  "/stimulus",
  "/peran",
  "/diskusi",
  "/hasil-diskusi",
  "/solusi-akhir",
  "/selesai",
  "/lanjutkan",
];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  let supabase;
  try {
    const { url, publishableKey } = getSupabasePublicEnv();
    supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });
  } catch {
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (!userId && startsWithAny(pathname, studentProtectedPrefixes)) {
    return NextResponse.redirect(new URL("/masuk", request.url));
  }

  if (userId && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!profile || !["teacher", "admin", "super_admin"].includes(profile.role)) {
      return NextResponse.redirect(new URL("/masuk", request.url));
    }
  }

  return response;
}
