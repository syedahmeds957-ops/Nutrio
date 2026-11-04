-- core.handle_new_user() still had no ACL on the live project (proacl NULL,
-- which means the default: EXECUTE for PUBLIC), so anon and authenticated
-- could call it through /rest/v1/rpc/handle_new_user although
-- 20260927000000 is recorded as applied. It is a SECURITY DEFINER trigger
-- function: only the on_auth_user_created trigger should run it. Postgres
-- checks EXECUTE on a trigger function when the trigger is created, not
-- when it fires, so revoking it leaves sign-up working.
REVOKE ALL ON FUNCTION core.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION core.handle_new_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION core.handle_new_user() TO service_role;
