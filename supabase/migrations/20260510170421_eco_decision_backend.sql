create extension if not exists "pgcrypto";

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'student'
    check (role in ('student', 'teacher', 'admin', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  teacher_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  group_code text check (group_code in ('A', 'B', 'C', 'D', 'E')),
  title text not null,
  slug text not null unique,
  description text not null,
  content text not null,
  thumbnail_tone text not null default 'from-emerald-100 via-sky-100 to-white',
  thumbnail_url text,
  roblox_map_url text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  code text not null check (code in ('A', 'B', 'C', 'D', 'E')),
  name text not null,
  issue_id uuid references public.issues(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (class_id, code)
);

create table if not exists public.stimulus_assets (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  type text not null check (type in ('link', 'image', 'video', 'document')),
  title text not null,
  url text not null,
  description text,
  order_index int not null default 1,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (issue_id, order_index)
);

create table if not exists public.reflection_questions (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references public.issues(id) on delete cascade,
  question_text text not null,
  order_index int not null,
  min_answer_length int not null default 10,
  is_required boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (issue_id, order_index)
);

create table if not exists public.role_cards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  avatar text not null,
  avatar_url text,
  short_description text not null,
  mission text not null,
  interest text not null,
  alternatives jsonb not null default '[]'::jsonb,
  decision_criteria jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.student_sessions (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  class_id uuid references public.classes(id) on delete set null,
  class_code text,
  group_code text not null check (group_code in ('A', 'B', 'C', 'D', 'E')),
  issue_id uuid references public.issues(id) on delete set null,
  role_card_id uuid references public.role_cards(id) on delete set null,
  status text not null default 'registered'
    check (status in ('registered', 'issue', 'stimulus', 'role', 'discussion', 'final', 'completed')),
  progress_step int not null default 1 check (progress_step between 1 and 10),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (student_user_id)
);

create table if not exists public.reflection_answers (
  id uuid primary key default gen_random_uuid(),
  student_session_id uuid not null references public.student_sessions(id) on delete cascade,
  question_id uuid not null references public.reflection_questions(id) on delete cascade,
  answer_text text not null,
  autosaved_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (student_session_id, question_id)
);

create table if not exists public.roblox_map_clicks (
  id uuid primary key default gen_random_uuid(),
  student_session_id uuid not null references public.student_sessions(id) on delete cascade,
  issue_id uuid references public.issues(id) on delete set null,
  role_card_id uuid references public.role_cards(id) on delete set null,
  roblox_map_url text not null default '',
  user_agent text,
  clicked_at timestamptz not null default now()
);

create table if not exists public.discussion_results (
  id uuid primary key default gen_random_uuid(),
  student_session_id uuid not null references public.student_sessions(id) on delete cascade,
  observation_text text not null,
  visible_problem_text text not null,
  role_opinion_text text not null,
  other_roles_opinion_text text not null default '',
  group_solution_draft text not null,
  agreed_roles_count int not null default 0 check (agreed_roles_count between 0 and 5),
  autosaved_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (student_session_id)
);

create table if not exists public.final_solutions (
  id uuid primary key default gen_random_uuid(),
  student_session_id uuid not null references public.student_sessions(id) on delete cascade,
  final_solution_text text not null,
  action_steps_text text not null,
  personal_commitment_text text not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (student_session_id)
);

create table if not exists public.rubric_scores (
  id uuid primary key default gen_random_uuid(),
  student_session_id uuid not null references public.student_sessions(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  problem_understanding_score int not null check (problem_understanding_score between 1 and 5),
  role_alignment_score int not null check (role_alignment_score between 1 and 5),
  discussion_quality_score int not null check (discussion_quality_score between 1 and 5),
  solution_quality_score int not null check (solution_quality_score between 1 and 5),
  action_commitment_score int not null check (action_commitment_score between 1 and 5),
  feedback_text text not null default '',
  status text not null default 'saved' check (status in ('draft', 'saved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (student_session_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists classes_teacher_id_idx on public.classes(teacher_id);
create index if not exists groups_class_id_idx on public.groups(class_id);
create index if not exists issues_group_code_idx on public.issues(group_code);
create index if not exists issues_is_published_idx on public.issues(is_published);
create index if not exists student_sessions_user_idx on public.student_sessions(student_user_id);
create index if not exists student_sessions_class_idx on public.student_sessions(class_id);
create index if not exists student_sessions_status_idx on public.student_sessions(status);
create index if not exists reflection_answers_session_idx on public.reflection_answers(student_session_id);
create index if not exists roblox_clicks_session_idx on public.roblox_map_clicks(student_session_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists rate_limit_events_key_created_idx on public.rate_limit_events(key, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(private.current_profile_role() in ('teacher', 'admin', 'super_admin'), false);
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(private.current_profile_role() in ('admin', 'super_admin'), false);
$$;

create or replace function private.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(private.current_profile_role() in ('teacher', 'admin', 'super_admin'), false);
$$;

create or replace function private.can_read_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    private.is_admin()
    or exists (
      select 1
      from public.classes c
      where c.id = target_class_id
        and c.teacher_id = (select auth.uid())
    ),
    false
  );
$$;

create or replace function private.session_is_open(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_sessions s
    where s.id = target_session_id
      and s.status <> 'completed'
  );
$$;

create or replace function private.is_session_owner(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.student_sessions s
    where s.id = target_session_id
      and s.student_user_id = (select auth.uid())
  );
$$;

create or replace function private.can_read_student_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    private.is_session_owner(target_session_id)
    or private.is_admin()
    or exists (
      select 1
      from public.student_sessions s
      join public.classes c on c.id = s.class_id
      where s.id = target_session_id
        and c.teacher_id = (select auth.uid())
        and private.current_profile_role() = 'teacher'
    ),
    false
  );
$$;

create or replace function private.can_grade_student_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    private.is_admin()
    or exists (
      select 1
      from public.student_sessions s
      join public.classes c on c.id = s.class_id
      where s.id = target_session_id
        and c.teacher_id = (select auth.uid())
        and private.current_profile_role() = 'teacher'
    ),
    false
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on all functions in schema private to anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'classes',
    'issues',
    'reflection_questions',
    'role_cards',
    'student_sessions',
    'reflection_answers',
    'discussion_results',
    'final_solutions',
    'rubric_scores'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function private.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.groups enable row level security;
alter table public.issues enable row level security;
alter table public.stimulus_assets enable row level security;
alter table public.reflection_questions enable row level security;
alter table public.role_cards enable row level security;
alter table public.student_sessions enable row level security;
alter table public.reflection_answers enable row level security;
alter table public.roblox_map_clicks enable row level security;
alter table public.discussion_results enable row level security;
alter table public.final_solutions enable row level security;
alter table public.rubric_scores enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rate_limit_events enable row level security;

drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id or private.is_staff());

drop policy if exists "profiles_insert_student_self" on public.profiles;
create policy "profiles_insert_student_self"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id and role = 'student');

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id or private.is_admin())
with check (((select auth.uid()) = id and role = 'student') or private.is_admin());

drop policy if exists "classes_select_active_or_staff" on public.classes;
create policy "classes_select_active_or_staff"
on public.classes
for select
to authenticated
using (is_active or private.can_read_class(id) or private.is_admin());

drop policy if exists "classes_manage_admin" on public.classes;
create policy "classes_manage_admin"
on public.classes
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "groups_select_active_or_staff" on public.groups;
create policy "groups_select_active_or_staff"
on public.groups
for select
to authenticated
using (
  exists (
    select 1 from public.classes c where c.id = class_id and c.is_active
  )
  or private.can_read_class(class_id)
  or private.is_admin()
);

drop policy if exists "groups_manage_admin" on public.groups;
create policy "groups_manage_admin"
on public.groups
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "issues_select_published_or_staff" on public.issues;
create policy "issues_select_published_or_staff"
on public.issues
for select
to anon, authenticated
using (is_published or private.can_manage_content());

drop policy if exists "issues_manage_staff" on public.issues;
create policy "issues_manage_staff"
on public.issues
for all
to authenticated
using (private.can_manage_content())
with check (private.can_manage_content());

drop policy if exists "stimulus_select_published_or_staff" on public.stimulus_assets;
create policy "stimulus_select_published_or_staff"
on public.stimulus_assets
for select
to anon, authenticated
using (
  private.can_manage_content()
  or exists (
    select 1 from public.issues i where i.id = issue_id and i.is_published
  )
  and is_published
);

drop policy if exists "stimulus_manage_staff" on public.stimulus_assets;
create policy "stimulus_manage_staff"
on public.stimulus_assets
for all
to authenticated
using (private.can_manage_content())
with check (private.can_manage_content());

drop policy if exists "questions_select_published_or_staff" on public.reflection_questions;
create policy "questions_select_published_or_staff"
on public.reflection_questions
for select
to anon, authenticated
using (
  is_published
  and (
    issue_id is null
    or exists (select 1 from public.issues i where i.id = issue_id and i.is_published)
  )
  or private.can_manage_content()
);

drop policy if exists "questions_manage_staff" on public.reflection_questions;
create policy "questions_manage_staff"
on public.reflection_questions
for all
to authenticated
using (private.can_manage_content())
with check (private.can_manage_content());

drop policy if exists "roles_select_published_or_staff" on public.role_cards;
create policy "roles_select_published_or_staff"
on public.role_cards
for select
to anon, authenticated
using (is_published or private.can_manage_content());

drop policy if exists "roles_manage_staff" on public.role_cards;
create policy "roles_manage_staff"
on public.role_cards
for all
to authenticated
using (private.can_manage_content())
with check (private.can_manage_content());

drop policy if exists "sessions_select_owner_or_staff" on public.student_sessions;
create policy "sessions_select_owner_or_staff"
on public.student_sessions
for select
to authenticated
using (private.can_read_student_session(id));

drop policy if exists "sessions_insert_student_self" on public.student_sessions;
create policy "sessions_insert_student_self"
on public.student_sessions
for insert
to authenticated
with check (student_user_id = (select auth.uid()));

drop policy if exists "sessions_update_owner_open_or_staff" on public.student_sessions;
create policy "sessions_update_owner_open_or_staff"
on public.student_sessions
for update
to authenticated
using (
  (student_user_id = (select auth.uid()) and status <> 'completed')
  or private.can_grade_student_session(id)
)
with check (
  student_user_id = (select auth.uid())
  or private.can_grade_student_session(id)
);

drop policy if exists "answers_select_owner_or_staff" on public.reflection_answers;
create policy "answers_select_owner_or_staff"
on public.reflection_answers
for select
to authenticated
using (private.can_read_student_session(student_session_id));

drop policy if exists "answers_insert_owner_open" on public.reflection_answers;
create policy "answers_insert_owner_open"
on public.reflection_answers
for insert
to authenticated
with check (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
);

drop policy if exists "answers_update_owner_open" on public.reflection_answers;
create policy "answers_update_owner_open"
on public.reflection_answers
for update
to authenticated
using (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
)
with check (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
);

drop policy if exists "roblox_clicks_select_owner_or_staff" on public.roblox_map_clicks;
create policy "roblox_clicks_select_owner_or_staff"
on public.roblox_map_clicks
for select
to authenticated
using (private.can_read_student_session(student_session_id));

drop policy if exists "roblox_clicks_insert_owner_open" on public.roblox_map_clicks;
create policy "roblox_clicks_insert_owner_open"
on public.roblox_map_clicks
for insert
to authenticated
with check (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
);

drop policy if exists "discussion_select_owner_or_staff" on public.discussion_results;
create policy "discussion_select_owner_or_staff"
on public.discussion_results
for select
to authenticated
using (private.can_read_student_session(student_session_id));

drop policy if exists "discussion_insert_owner_open" on public.discussion_results;
create policy "discussion_insert_owner_open"
on public.discussion_results
for insert
to authenticated
with check (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
);

drop policy if exists "discussion_update_owner_open" on public.discussion_results;
create policy "discussion_update_owner_open"
on public.discussion_results
for update
to authenticated
using (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
)
with check (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
);

drop policy if exists "final_select_owner_or_staff" on public.final_solutions;
create policy "final_select_owner_or_staff"
on public.final_solutions
for select
to authenticated
using (private.can_read_student_session(student_session_id));

drop policy if exists "final_insert_owner_open" on public.final_solutions;
create policy "final_insert_owner_open"
on public.final_solutions
for insert
to authenticated
with check (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
);

drop policy if exists "final_update_owner_open" on public.final_solutions;
create policy "final_update_owner_open"
on public.final_solutions
for update
to authenticated
using (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
)
with check (
  private.is_session_owner(student_session_id)
  and private.session_is_open(student_session_id)
);

drop policy if exists "rubric_select_staff" on public.rubric_scores;
create policy "rubric_select_staff"
on public.rubric_scores
for select
to authenticated
using (private.can_grade_student_session(student_session_id));

drop policy if exists "rubric_insert_staff" on public.rubric_scores;
create policy "rubric_insert_staff"
on public.rubric_scores
for insert
to authenticated
with check (
  teacher_id = (select auth.uid())
  and private.can_grade_student_session(student_session_id)
);

drop policy if exists "rubric_update_staff" on public.rubric_scores;
create policy "rubric_update_staff"
on public.rubric_scores
for update
to authenticated
using (private.can_grade_student_session(student_session_id))
with check (
  teacher_id = (select auth.uid())
  and private.can_grade_student_session(student_session_id)
);

drop policy if exists "audit_insert_staff" on public.audit_logs;
create policy "audit_insert_staff"
on public.audit_logs
for insert
to authenticated
with check (private.is_staff());

drop policy if exists "audit_select_admin" on public.audit_logs;
create policy "audit_select_admin"
on public.audit_logs
for select
to authenticated
using (private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stimulus-assets',
  'stimulus-assets',
  false,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'video/mp4']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "stimulus_assets_read_published" on storage.objects;
create policy "stimulus_assets_read_published"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'stimulus-assets');

drop policy if exists "stimulus_assets_staff_insert" on storage.objects;
create policy "stimulus_assets_staff_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'stimulus-assets' and private.can_manage_content());

drop policy if exists "stimulus_assets_staff_update" on storage.objects;
create policy "stimulus_assets_staff_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'stimulus-assets' and private.can_manage_content())
with check (bucket_id = 'stimulus-assets' and private.can_manage_content());

drop policy if exists "stimulus_assets_staff_delete" on storage.objects;
create policy "stimulus_assets_staff_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'stimulus-assets' and private.can_manage_content());

insert into public.classes (name, code, is_active)
values ('Kelas Demo Eco-Decision', 'ECO-DEMO', true)
on conflict (code) do update set
  name = excluded.name,
  is_active = excluded.is_active;

insert into public.issues (
  group_code,
  slug,
  title,
  description,
  content,
  thumbnail_tone,
  roblox_map_url,
  is_published
)
values
('A', 'pencemaran-sungai-ciujung', 'Pencemaran Sungai Ciujung', 'Sungai berubah warna, bau, dan mengganggu aktivitas warga di sekitar bantaran.', 'Warga di sekitar Sungai Ciujung melaporkan air sungai berwarna pekat setelah hujan dan aktivitas industri meningkat. Sebagian warga masih memakai sungai untuk kebutuhan harian, sementara pelaku usaha menyatakan telah mengikuti prosedur. Kelompokmu perlu menimbang bukti, dampak, dan kepentingan pihak yang berbeda.', 'from-emerald-100 via-sky-100 to-white', 'https://www.roblox.com/games/0000000000/Eco-Decision-Map', true),
('B', 'alih-fungsi-lahan-pesisir', 'Alih Fungsi Lahan Pesisir', 'Mangrove berkurang karena pembangunan, tambak, dan kebutuhan ekonomi warga.', 'Lahan pesisir yang dulu ditumbuhi mangrove kini berubah menjadi area usaha dan permukiman. Warga membutuhkan penghasilan, tetapi abrasi dan banjir rob makin sering terjadi. Diskusi perlu mencari keputusan yang adil bagi lingkungan dan masyarakat.', 'from-cyan-100 via-emerald-100 to-white', 'https://www.roblox.com/games/0000000000/Eco-Decision-Map', true),
('C', 'pencemaran-udara-industri', 'Pencemaran Udara Industri', 'Asap pabrik dan kendaraan membuat kualitas udara menurun di sekitar sekolah.', 'Siswa dan warga mengeluhkan batuk dan bau menyengat pada jam tertentu. Industri menyatakan proses produksi penting untuk ekonomi daerah. Kelompokmu perlu memetakan sumber masalah, pihak terdampak, dan solusi yang masuk akal.', 'from-slate-100 via-sky-100 to-white', 'https://www.roblox.com/games/0000000000/Eco-Decision-Map', true),
('D', 'pengerukan-bukit-tambang', 'Pengerukan Bukit Tambang', 'Aktivitas tambang mengubah bentang alam dan meningkatkan risiko longsor.', 'Bukit yang menjadi penahan air mulai terkikis oleh aktivitas tambang. Perusahaan membuka lapangan kerja, tetapi warga khawatir pada debu, jalan rusak, dan risiko longsor. Keputusan kelompok harus mempertimbangkan bukti lingkungan dan kebutuhan ekonomi.', 'from-lime-100 via-stone-100 to-white', 'https://www.roblox.com/games/0000000000/Eco-Decision-Map', true),
('E', 'limbah-b3-industri', 'Limbah B3 Industri', 'Limbah berbahaya perlu ditangani aman agar tidak mencemari tanah dan air.', 'Beberapa drum limbah ditemukan di dekat area industri dan warga khawatir limbah itu mencemari tanah. Guru belum memasang tautan map untuk skenario ini. Kelompokmu tetap dapat membaca stimulus dan menyiapkan pertanyaan diskusi.', 'from-amber-100 via-emerald-100 to-white', '', true)
on conflict (slug) do update set
  group_code = excluded.group_code,
  title = excluded.title,
  description = excluded.description,
  content = excluded.content,
  thumbnail_tone = excluded.thumbnail_tone,
  roblox_map_url = excluded.roblox_map_url,
  is_published = excluded.is_published;

insert into public.stimulus_assets (
  issue_id,
  type,
  title,
  url,
  description,
  order_index,
  is_published
)
select
  i.id,
  'link',
  'Stimulus awal ' || i.group_code,
  coalesce(nullif(i.roblox_map_url, ''), 'https://www.roblox.com/'),
  'Tautan stimulus demo untuk skenario ' || i.title,
  1,
  true
from public.issues i
on conflict (issue_id, order_index) do update set
  type = excluded.type,
  title = excluded.title,
  url = excluded.url,
  description = excluded.description,
  is_published = excluded.is_published;

insert into public.groups (class_id, code, name, issue_id)
select c.id, v.code, 'Kelompok ' || v.code, i.id
from public.classes c
cross join (values ('A'), ('B'), ('C'), ('D'), ('E')) as v(code)
left join public.issues i on i.group_code = v.code
where c.code = 'ECO-DEMO'
on conflict (class_id, code) do update set
  name = excluded.name,
  issue_id = excluded.issue_id;

insert into public.reflection_questions (
  issue_id,
  question_text,
  order_index,
  min_answer_length,
  is_required,
  is_published
)
values
(null, 'Apa masalah utama yang terjadi?', 1, 10, true, true),
(null, 'Apakah masalah ini terjadi secara alami atau akibat aktivitas manusia?', 2, 10, true, true),
(null, 'Siapa saja pihak yang terdampak?', 3, 10, true, true)
on conflict (issue_id, order_index) do update set
  question_text = excluded.question_text,
  min_answer_length = excluded.min_answer_length,
  is_required = excluded.is_required,
  is_published = excluded.is_published;

insert into public.role_cards (
  name,
  slug,
  avatar,
  short_description,
  mission,
  interest,
  alternatives,
  decision_criteria,
  checklist,
  is_published
)
values
('Ilmuwan', 'ilmuwan', 'IL', 'Membaca data dan membantu kelompok mengambil keputusan berbasis bukti.', 'Jelaskan apa yang bisa dibuktikan dari pengamatan dan data lingkungan.', 'Keputusan harus masuk akal secara ilmiah dan dapat dipantau.', '["Uji kualitas air atau udara secara berkala.", "Membuat peta sumber pencemaran.", "Menyusun indikator pemulihan lingkungan."]'::jsonb, '["Ada bukti pengamatan.", "Solusi bisa diukur.", "Risiko lingkungan berkurang."]'::jsonb, '["Catat bukti yang terlihat di map.", "Bedakan dugaan dan fakta.", "Minta kelompok menyebut indikator keberhasilan."]'::jsonb, true),
('Warga', 'warga', 'WG', 'Mewakili kebutuhan masyarakat yang terdampak langsung oleh masalah.', 'Sampaikan dampak masalah pada kesehatan, pekerjaan, dan kehidupan harian.', 'Lingkungan aman tanpa mengabaikan kebutuhan hidup warga.', '["Forum warga dan pelaku usaha.", "Pelaporan dampak ke pemerintah.", "Aksi bersih lingkungan bersama."]'::jsonb, '["Warga dilibatkan.", "Dampak harian berkurang.", "Solusi tidak memberatkan kelompok rentan."]'::jsonb, '["Sebutkan dampak yang dirasakan warga.", "Tanyakan kompensasi atau bantuan yang adil.", "Usulkan cara warga ikut memantau."]'::jsonb, true),
('Pemerintah', 'pemerintah', 'PM', 'Menjaga aturan, keselamatan, dan keseimbangan kepentingan publik.', 'Cari keputusan yang bisa dijalankan, diawasi, dan adil bagi semua pihak.', 'Aturan dipatuhi dan konflik sosial dapat dikurangi.', '["Inspeksi dan sanksi bertahap.", "Mediasi antar pihak.", "Program pemulihan lingkungan daerah."]'::jsonb, '["Sesuai aturan.", "Bisa diawasi sekolah/daerah.", "Tidak menimbulkan risiko baru."]'::jsonb, '["Tanyakan aturan yang perlu dipatuhi.", "Buat urutan tindakan yang realistis.", "Pastikan ada pihak penanggung jawab."]'::jsonb, true),
('Industri', 'industri', 'IN', 'Mewakili kegiatan ekonomi yang harus bertanggung jawab pada lingkungan.', 'Jelaskan kebutuhan produksi sambil menawarkan perbaikan yang bertanggung jawab.', 'Usaha tetap berjalan dengan dampak lingkungan yang terkendali.', '["Perbaikan instalasi pengolahan limbah.", "Audit lingkungan terbuka.", "Pendanaan program pemulihan."]'::jsonb, '["Biaya realistis.", "Dampak turun jelas.", "Kepercayaan publik membaik."]'::jsonb, '["Jelaskan batas kemampuan industri.", "Tawarkan langkah perbaikan konkret.", "Terima pengawasan dari pihak lain."]'::jsonb, true),
('LSM', 'lsm', 'LS', 'Mendorong transparansi, keadilan lingkungan, dan aksi masyarakat.', 'Pastikan suara warga dan lingkungan tidak kalah oleh kepentingan besar.', 'Keputusan terbuka, adil, dan berpihak pada keberlanjutan.', '["Kampanye edukasi publik.", "Pemantauan independen.", "Advokasi pemulihan lingkungan."]'::jsonb, '["Transparan.", "Melibatkan warga.", "Ada komitmen jangka panjang."]'::jsonb, '["Tanyakan siapa yang belum didengar.", "Dorong bukti dibuka bersama.", "Usulkan komitmen aksi nyata."]'::jsonb, true)
on conflict (slug) do update set
  name = excluded.name,
  avatar = excluded.avatar,
  short_description = excluded.short_description,
  mission = excluded.mission,
  interest = excluded.interest,
  alternatives = excluded.alternatives,
  decision_criteria = excluded.decision_criteria,
  checklist = excluded.checklist,
  is_published = excluded.is_published;
