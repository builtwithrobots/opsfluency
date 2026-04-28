-- Add department_ids to team_invites so admins/managers can be
-- pre-assigned to departments when their invite is created.
-- Uses the same UUID[] pattern as employee_invites.

alter table team_invites
  add column if not exists department_ids uuid[] not null default '{}';

comment on column team_invites.department_ids is
  'Departments pre-assigned at invite time. Inserted into employee_departments when the invite is claimed.';
