alter table public.issues
  drop constraint if exists issues_group_code_check,
  add constraint issues_group_code_format_check
    check (
      group_code is null
      or group_code ~ '^[A-Z0-9][A-Z0-9_-]{0,11}$'
    );

alter table public.groups
  drop constraint if exists groups_code_check,
  add constraint groups_code_format_check
    check (code ~ '^[A-Z0-9][A-Z0-9_-]{0,11}$');

alter table public.student_sessions
  drop constraint if exists student_sessions_group_code_check,
  add constraint student_sessions_group_code_format_check
    check (group_code ~ '^[A-Z0-9][A-Z0-9_-]{0,11}$');
