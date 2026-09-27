-- core.handle_new_user() is a trigger function (fires AFTER INSERT ON
-- auth.users) and is SECURITY DEFINER, so it should never be directly
-- callable by anon/authenticated — only the trigger mechanism needs to
-- invoke it. The original migration never revoked the default PUBLIC
-- execute grant, which is what Supabase's Security Advisor flags.
REVOKE EXECUTE ON FUNCTION core.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION core.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION core.handle_new_user() FROM authenticated;
