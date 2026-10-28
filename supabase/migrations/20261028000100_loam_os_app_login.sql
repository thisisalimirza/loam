-- Lets the app role log in through the pooler.
-- The password is set out of band and never committed. To rotate it, run in the SQL editor:
--   alter role loam_os_app with password '<new password>';
-- then update LOAM_DATABASE_URL in Vercel (production + preview).
alter role loam_os_app with login;
