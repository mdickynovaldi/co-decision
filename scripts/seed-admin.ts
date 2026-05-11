import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const fullName = process.env.SEED_ADMIN_NAME ?? "Guru Eco-Decision";
const role = process.env.SEED_ADMIN_ROLE ?? "admin";

if (!url || !serviceRoleKey || !email || !password) {
  throw new Error(
    "Isi NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL, dan SEED_ADMIN_PASSWORD.",
  );
}

if (!["teacher", "admin", "super_admin"].includes(role)) {
  throw new Error("SEED_ADMIN_ROLE harus teacher, admin, atau super_admin.");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(targetEmail: string) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === targetEmail.toLowerCase());
}

async function main() {
  let user = await findUserByEmail(email!);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) throw error;
    user = data.user;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: email!,
    full_name: fullName,
    role: role as "teacher" | "admin" | "super_admin",
  });

  if (profileError) throw profileError;

  console.log(`Seed admin siap: ${email} (${role})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
