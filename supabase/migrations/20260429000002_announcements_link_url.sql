-- Add optional link_url to announcements.
-- Managers can attach a URL (video, document, or external resource) to any
-- announcement. The worker PWA auto-embeds YouTube, Loom, and Vimeo; all
-- other URLs render as a tap-to-open button.
-- No RLS change needed — inherits announcements_company_isolation policy.

alter table announcements
  add column link_url text;
