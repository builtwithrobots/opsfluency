-- Optional video URL on SOPs. Managers can attach a YouTube, Loom, or Vimeo
-- link to any SOP; workers see a "Watch video" button in the PWA when set.
-- Stored on sops (not sop_versions) so it persists across version re-uploads.
-- No RLS change needed — inherits sops_company_isolation policy.

alter table sops
  add column if not exists video_url text;
