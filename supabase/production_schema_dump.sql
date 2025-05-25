--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: ai_task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_task_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed'
);


--
-- Name: ai_task_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ai_task_type AS ENUM (
    'summarization',
    'classification',
    'extraction',
    'translation',
    'other'
);


--
-- Name: audit_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'view'
);


--
-- Name: billing_method_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_method_type AS ENUM (
    'Hourly',
    'Flat Fee',
    'Contingency',
    'Retainer',
    'Pro Bono',
    'Other'
);


--
-- Name: case_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.case_status AS ENUM (
    'open',
    'closed',
    'pending',
    'archived'
);


--
-- Name: client_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.client_type AS ENUM (
    'Individual',
    'Corporation',
    'LLC',
    'Partnership',
    'LLP',
    'Trust',
    'Estate',
    'Government',
    'NonProfit',
    'NGO',
    'Joint_Venture',
    'Sole_Proprietorship',
    'Association',
    'Foundation',
    'Charity',
    'Educational',
    'Religious',
    'Cooperative',
    'Public_Company',
    'Private_Company',
    'Union',
    'Other'
);


--
-- Name: deadline_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.deadline_status AS ENUM (
    'open',
    'completed',
    'missed'
);


--
-- Name: deadline_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.deadline_type AS ENUM (
    'court',
    'filing',
    'internal',
    'other'
);


--
-- Name: document_permission_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_permission_level AS ENUM (
    'read',
    'write',
    'admin'
);


--
-- Name: document_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_status AS ENUM (
    'draft',
    'final',
    'archived'
);


--
-- Name: event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_type AS ENUM (
    'meeting',
    'court_date',
    'deadline',
    'reminder'
);


--
-- Name: participant_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.participant_role AS ENUM (
    'legal_secretary',
    'paralegal',
    'junior_associate_attorney',
    'associate_attorney',
    'solo_practitioner',
    'senior_associate_attorney',
    'of_counsel',
    'partner',
    'managing_partner',
    'general_counsel'
);


--
-- Name: priority_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.priority_type AS ENUM (
    'High',
    'Medium',
    'Low'
);


--
-- Name: role_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_level AS ENUM (
    'system',
    'firm_admin',
    'management',
    'professional',
    'support'
);


--
-- Name: stage_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stage_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


--
-- Name: stage_progress; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stage_progress AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'blocked'
);


--
-- Name: stage_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stage_status AS ENUM (
    'open',
    'closed',
    'pending',
    'archived'
);


--
-- Name: status_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_type AS ENUM (
    'Active',
    'Closed',
    'On Hold',
    'Pending'
);


--
-- Name: task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.task_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'blocked'
);


--
-- Name: title_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.title_type AS ENUM (
    'Mr',
    'Mrs',
    'Ms',
    'Dr',
    'Prof',
    'Judge',
    'Justice',
    'Atty',
    'Hon',
    'Rev',
    'Capt',
    'Col',
    'Gen',
    'Other'
);


--
-- Name: workflow_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workflow_status AS ENUM (
    'pending',
    'in_review',
    'approved',
    'rejected'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: add_audit_triggers(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_audit_triggers(table_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Add audit trigger if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table = table_name 
        AND trigger_name = 'audit_' || table_name
    ) THEN
        EXECUTE format('
            CREATE TRIGGER audit_%I
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION log_audit_changes()',
            table_name, table_name
        );
    END IF;
END;
$$;


--
-- Name: call_delete_clerk_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.call_delete_clerk_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
begin
  -- Call the Edge Function via HTTP POST
  perform net.http_post(
    'https://ueqzjuclosoedybixqgs.supabase.co.functions.supabase.co/delete-clerk-user',
    json_build_object('user_id', OLD.id)::text,
    'application/json'
  );
  return OLD;
end;
$$;


--
-- Name: check_schedule_reminders(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_schedule_reminders() RETURNS TABLE(id uuid, title text, start_time timestamp with time zone, profile_id uuid, reminder_time interval, reminder_type text[])
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.start_time,
        s.profile_id,
        s.reminder_time,
        s.reminder_type
    FROM schedules s
    WHERE 
        s.reminder_time IS NOT NULL
        AND s.reminder_sent = false
        AND s.start_time - s.reminder_time <= now()
        AND s.start_time > now();
END;
$$;


--
-- Name: clerk_to_supabase_user_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clerk_to_supabase_user_id(clerk_id text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Convert Clerk ID to a deterministic UUID
    RETURN uuid_generate_v5(uuid_ns_url(), clerk_id);
END;
$$;


--
-- Name: create_supabase_user(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_supabase_user(p_clerk_user_id text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Generate a deterministic UUID from the Clerk user ID
    v_user_id := uuid_generate_v5(uuid_ns_url(), p_clerk_user_id);
    
    -- Insert into auth.users if not exists
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    )
    VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        p_clerk_user_id || '@clerk.user',
        crypt('dummy-password', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider": "clerk", "providers": ["clerk"]}'::jsonb,
        '{"clerk_user_id": "' || p_clerk_user_id || '"}'::jsonb,
        false,
        'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN v_user_id;
END;
$$;


--
-- Name: debug_matter_creation(uuid, jsonb, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_matter_creation(p_profile_id uuid, p_client_data jsonb, p_matter_data jsonb, p_billing_data jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_client_id uuid;
  v_matter_id uuid;
  v_billing_id uuid;
  v_phone text;
BEGIN
  -- Ensure phone is never null
  v_phone := COALESCE(p_client_data->>'phone', '+10000000000');
  
  -- Insert client
  INSERT INTO clients (
    profile_id, first_name, last_name, email, phone, 
    title, address, preferred_language, client_type
  ) VALUES (
    p_profile_id,
    p_client_data->>'first_name',
    p_client_data->>'last_name',
    p_client_data->>'email',
    v_phone,
    p_client_data->>'title',
    p_client_data->>'address',
    COALESCE(p_client_data->>'preferred_language', 'English'),
    COALESCE(p_client_data->>'client_type', 'Individual')
  )
  RETURNING id INTO v_client_id;
  
  -- Insert matter
  INSERT INTO cases (
    profile_id, client_id, title, matter_type, sub_type,
    description, jurisdiction, status, priority
  ) VALUES (
    p_profile_id,
    v_client_id,
    p_matter_data->>'title',
    p_matter_data->>'matter_type',
    p_matter_data->>'sub_type',
    p_matter_data->>'description',
    p_matter_data->>'jurisdiction',
    COALESCE(p_matter_data->>'status', 'Active'),
    COALESCE(p_matter_data->>'priority', 'Medium')
  )
  RETURNING id INTO v_matter_id;
  
  -- Insert billing
  INSERT INTO matter_billing (
    matter_id, billing_type, rate, currency
  ) VALUES (
    v_matter_id,
    p_billing_data->>'billing_type',
    (p_billing_data->>'rate')::numeric,
    COALESCE(p_billing_data->>'currency', 'USD')
  )
  RETURNING id INTO v_billing_id;
  
  -- Return all created IDs
  RETURN jsonb_build_object(
    'client_id', v_client_id,
    'matter_id', v_matter_id,
    'billing_id', v_billing_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;


--
-- Name: disable_rls(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.disable_rls() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Set the role to postgres which bypasses RLS
  SET ROLE postgres;
END;
$$;


--
-- Name: ensure_phone_not_null(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_phone_not_null() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    NEW.phone := '+10000000000';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: exec_sql(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.exec_sql(sql text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    EXECUTE sql;
END;
$$;


--
-- Name: get_current_user_uuid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_user_uuid() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN auth.uid()::text;
END;
$$;


--
-- Name: get_document_history(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_document_history(doc_id uuid) RETURNS TABLE(version_number integer, content text, created_at timestamp without time zone, created_by uuid)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT version_number, content, created_at, created_by
    FROM document_versions
    WHERE document_id = doc_id
    ORDER BY version_number DESC;
END;
$$;


--
-- Name: get_document_permissions(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_document_permissions(doc_id uuid) RETURNS TABLE(user_id uuid, permission_type text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT user_id, permission_type
    FROM document_permissions
    WHERE document_id = doc_id;
END;
$$;


--
-- Name: get_full_profile_by_clerk_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_full_profile_by_clerk_id(p_clerk_id text) RETURNS TABLE(id text, user_id text, email text, phone_number text, address text, firm_name text, specialization text, years_of_practice integer, created_at timestamp with time zone, updated_at timestamp with time zone, avatar_url text, onboarding_completed boolean, first_name text, last_name text, home_address text, gender text, role_id text, clerk_id text, firm_id text, is_solo boolean, onboarding_path text, can_upgrade_to_firm boolean, is_deleted boolean, deleted_at timestamp with time zone, role text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.email,
        p.phone_number,
        p.address,
        p.firm_name,
        p.specialization,
        p.years_of_practice,
        p.created_at,
        p.updated_at,
        p.avatar_url,
        p.onboarding_completed,
        p.first_name,
        p.last_name,
        p.home_address,
        p.gender,
        p.role_id,
        p.clerk_id,
        p.firm_id,
        p.is_solo,
        p.onboarding_path,
        p.can_upgrade_to_firm,
        p.is_deleted,
        p.deleted_at,
        p.role
    FROM profiles p
    WHERE p.clerk_id = p_clerk_id;
END;
$$;


--
-- Name: get_profile_by_clerk_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_profile_by_clerk_id(p_clerk_id text) RETURNS TABLE(id text, clerk_id text, email text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.clerk_id,
        p.email
    FROM profiles p
    WHERE p.clerk_id = p_clerk_id;
END;
$$;


--
-- Name: has_document_access(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_document_access(doc_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM documents
        WHERE id = doc_id AND uploaded_by = clerk_to_supabase_user_id(current_user)
        UNION
        SELECT 1 FROM document_permissions
        WHERE document_id = doc_id AND user_id = clerk_to_supabase_user_id(current_user)
    );
END;
$$;


--
-- Name: insert_billing_direct(uuid, text, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_billing_direct(p_matter_id uuid, p_billing_type text, p_rate numeric DEFAULT 0, p_currency text DEFAULT 'USD'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_billing_id uuid;
BEGIN
  -- Insert billing with all fields
  INSERT INTO matter_billing (
    matter_id, billing_type, rate, currency
  ) VALUES (
    p_matter_id, p_billing_type, p_rate, p_currency
  )
  RETURNING id INTO v_billing_id;
  
  RETURN v_billing_id;
END;
$$;


--
-- Name: insert_client(uuid, text, text, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_client(p_profile_id uuid, p_title text DEFAULT ''::text, p_first_name text DEFAULT ''::text, p_last_name text DEFAULT ''::text, p_email text DEFAULT ''::text, p_phone text DEFAULT NULL::text, p_address text DEFAULT ''::text, p_preferred_language text DEFAULT 'English'::text, p_client_type text DEFAULT 'Individual'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_client_id uuid;
  v_result jsonb;
BEGIN
  -- Debug logging
  RAISE NOTICE 'Inserting client with phone: %', p_phone;
  
  -- Direct insert bypassing triggers
  INSERT INTO clients (
    profile_id, title, first_name, last_name, email, 
    phone, address, preferred_language, client_type
  ) VALUES (
    p_profile_id, p_title, p_first_name, p_last_name, p_email, 
    COALESCE(p_phone, ''),  -- Use empty string if p_phone is NULL
    p_address, p_preferred_language, p_client_type
  )
  RETURNING id INTO v_client_id;
  
  -- Build result
  SELECT jsonb_build_object(
    'id', v_client_id,
    'profile_id', p_profile_id,
    'first_name', p_first_name,
    'last_name', p_last_name,
    'email', p_email,
    'phone', p_phone
  ) INTO v_result;
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE,
    'phone_value', p_phone
  );
END;
$$;


--
-- Name: insert_client_direct(uuid, text, text, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_client_direct(p_profile_id uuid, p_first_name text, p_last_name text, p_email text, p_phone text DEFAULT '+10000000000'::text, p_title text DEFAULT ''::text, p_address text DEFAULT ''::text, p_preferred_language text DEFAULT 'English'::text, p_client_type text DEFAULT 'Individual'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_client_id uuid;
BEGIN
  -- Ensure phone is never null or empty
  p_phone := COALESCE(p_phone, '+10000000000');
  
  -- Insert with all fields
  INSERT INTO clients (
    profile_id, first_name, last_name, email, phone, 
    title, address, preferred_language, client_type
  ) VALUES (
    p_profile_id, p_first_name, p_last_name, p_email, p_phone,
    p_title, p_address, p_preferred_language, p_client_type
  )
  RETURNING id INTO v_client_id;
  
  RETURN v_client_id;
END;
$$;


--
-- Name: insert_matter_direct(uuid, uuid, text, text, text, text, text, text, text, numeric, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insert_matter_direct(p_profile_id uuid, p_client_id uuid, p_title text, p_matter_type text, p_sub_type text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_jurisdiction text DEFAULT NULL::text, p_status text DEFAULT 'Active'::text, p_priority text DEFAULT 'Medium'::text, p_estimated_value numeric DEFAULT NULL::numeric, p_matter_date date DEFAULT CURRENT_DATE) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_matter_id uuid;
BEGIN
  -- Insert matter with all fields
  INSERT INTO cases (
    profile_id, client_id, title, matter_type, sub_type,
    description, jurisdiction, status, priority, estimated_value, matter_date
  ) VALUES (
    p_profile_id, p_client_id, p_title, p_matter_type, p_sub_type,
    p_description, p_jurisdiction, p_status, p_priority, p_estimated_value, p_matter_date
  )
  RETURNING id INTO v_matter_id;
  
  RETURN v_matter_id;
END;
$$;


--
-- Name: log_audit_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_audit_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_changed_by UUID;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    -- Check if we're already in an audit log trigger to prevent recursion
    IF TG_TABLE_NAME = 'audit_log' THEN
        RETURN NEW;
    END IF;

    -- Get the current user ID
    v_changed_by := auth.uid();
    
    -- Convert NEW and OLD records to JSONB
    IF TG_OP = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        v_old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_new_data := to_jsonb(NEW);
        v_old_data := to_jsonb(OLD);
    ELSIF TG_OP = 'DELETE' THEN
        v_new_data := NULL;
        v_old_data := to_jsonb(OLD);
    END IF;

    -- Insert into audit_log with record_id as text
    INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        changed_by,
        old_data,
        new_data
    ) VALUES (
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text
            ELSE NEW.id::text
        END,
        TG_OP,
        v_changed_by,
        v_old_data,
        v_new_data
    );

    RETURN NEW;
END;
$$;


--
-- Name: log_document_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_document_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO document_audit_logs (document_id, user_id, action, details)
    VALUES (
        NEW.id,
        auth.uid(),
        TG_OP,
        jsonb_build_object(
            'old', row_to_json(OLD),
            'new', row_to_json(NEW)
        )
    );
    RETURN NEW;
END;
$$;


--
-- Name: match_user_id(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.match_user_id(user_id uuid, auth_uid text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$
    SELECT user_id::text = auth_uid;
$$;


--
-- Name: update_ai_summary_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ai_summary_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.ai_summary IS DISTINCT FROM OLD.ai_summary THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_metrics_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_metrics_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$;


--
-- Name: update_profile(uuid, text, text, text, text, text, text, integer, text, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile(p_id uuid, p_first_name text, p_last_name text, p_email text, p_phone_number text, p_firm_name text, p_specialization text, p_years_of_practice integer, p_address text, p_city text, p_state text, p_zip_code text, p_country text, p_bar_number text, p_role text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE profiles
    SET 
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        email = COALESCE(p_email, email),
        phone_number = COALESCE(p_phone_number, phone_number),
        firm_name = COALESCE(p_firm_name, firm_name),
        specialization = COALESCE(p_specialization, specialization),
        years_of_practice = p_years_of_practice,  -- Remove COALESCE to allow NULL values
        address = COALESCE(p_address, address),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        zip_code = COALESCE(p_zip_code, zip_code),
        country = COALESCE(p_country, country),
        bar_number = COALESCE(p_bar_number, bar_number),
        role = COALESCE(p_role, role),
        updated_at = NOW()
    WHERE id = p_id;
END;
$$;


--
-- Name: update_profile_with_related(text, text, text, text, text, text, text, integer, text, text, text, text, text, boolean, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_with_related(p_clerk_user_id text, p_email text DEFAULT NULL::text, p_phone_number text DEFAULT NULL::text, p_first_name text DEFAULT NULL::text, p_last_name text DEFAULT NULL::text, p_firm_name text DEFAULT NULL::text, p_specialization text DEFAULT NULL::text, p_years_of_practice integer DEFAULT NULL::integer, p_avatar_url text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_home_address text DEFAULT NULL::text, p_gender text DEFAULT NULL::text, p_role text DEFAULT NULL::text, p_onboarding_completed boolean DEFAULT NULL::boolean, p_professional_ids jsonb DEFAULT '[]'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_supabase_user_id uuid;
  v_profile_id uuid;
  v_role_id uuid;
  v_professional_id jsonb;
  v_existing_profile record;
begin
  -- Get or create user mapping
  select supabase_user_id into v_supabase_user_id
  from user_mappings
  where clerk_user_id = p_clerk_user_id;

  if v_supabase_user_id is null then
    -- Create new mapping
    insert into user_mappings (clerk_user_id)
    values (p_clerk_user_id)
    returning supabase_user_id into v_supabase_user_id;
  end if;

  -- Get role_id if role is provided
  if p_role is not null then
    select id into v_role_id
    from roles
    where name = p_role;

    if v_role_id is null then
      -- Default to attorney role if role not found
      select id into v_role_id
      from roles
      where name = 'attorney';
    end if;
  end if;

  -- Get existing profile
  select * into v_existing_profile
  from profiles
  where clerk_id = p_clerk_user_id;

  if v_existing_profile is null then
    -- Create new profile - allow null for years_of_practice
    insert into profiles (
      id,
      user_id,
      clerk_id,
      email,
      phone_number,
      first_name,
      last_name,
      firm_name,
      specialization,
      years_of_practice,
      avatar_url,
      address,
      home_address,
      gender,
      role_id,
      onboarding_completed,
      created_at,
      updated_at
    )
    values (
      v_supabase_user_id,
      v_supabase_user_id,
      p_clerk_user_id,
      COALESCE(NULLIF(p_email, ''), ''),
      COALESCE(NULLIF(p_phone_number, ''), ''),
      COALESCE(NULLIF(p_first_name, ''), ''),
      COALESCE(NULLIF(p_last_name, ''), ''),
      COALESCE(NULLIF(p_firm_name, ''), ''),
      COALESCE(NULLIF(p_specialization, ''), ''),
      p_years_of_practice, -- Changed to allow NULL values
      COALESCE(NULLIF(p_avatar_url, ''), ''),
      COALESCE(NULLIF(p_address, ''), ''),
      COALESCE(NULLIF(p_home_address, ''), ''),
      COALESCE(NULLIF(p_gender, ''), ''),
      v_role_id,
      COALESCE(p_onboarding_completed, false),
      now(),
      now()
    )
    returning id into v_profile_id;
  else
    -- Update existing profile
    -- Key change: If p_years_of_practice is explicitly passed (even as null), use it
    update profiles
    set
      email = COALESCE(NULLIF(p_email, ''), email),
      phone_number = COALESCE(NULLIF(p_phone_number, ''), phone_number),
      first_name = COALESCE(NULLIF(p_first_name, ''), first_name),
      last_name = COALESCE(NULLIF(p_last_name, ''), last_name),
      firm_name = COALESCE(NULLIF(p_firm_name, ''), firm_name),
      specialization = COALESCE(NULLIF(p_specialization, ''), specialization),
      years_of_practice = p_years_of_practice, -- Changed to respect NULL values
      avatar_url = COALESCE(NULLIF(p_avatar_url, ''), avatar_url),
      address = COALESCE(NULLIF(p_address, ''), address),
      home_address = COALESCE(NULLIF(p_home_address, ''), home_address),
      gender = COALESCE(NULLIF(p_gender, ''), gender),
      role_id = COALESCE(v_role_id, role_id),
      onboarding_completed = COALESCE(p_onboarding_completed, onboarding_completed),
      updated_at = now()
    where id = v_existing_profile.id
    returning id into v_profile_id;
  end if;

  -- Handle professional IDs if provided and non-empty
  if p_professional_ids is not null and jsonb_array_length(p_professional_ids) > 0 then
    -- Delete existing professional IDs
    delete from professional_ids
    where profile_id = v_profile_id;

    -- Insert new professional IDs
    for v_professional_id in select * from jsonb_array_elements(p_professional_ids)
    loop
      insert into professional_ids (
        profile_id,
        country,
        state,
        professional_id,
        year_issued,
        document_url
      )
      values (
        v_profile_id,
        v_professional_id->>'country',
        v_professional_id->>'state',
        v_professional_id->>'professional_id',
        (v_professional_id->>'year_issued')::integer,
        v_professional_id->>'document_url'
      );
    end loop;
  end if;

  -- Return the updated profile with related data
  return (
    select jsonb_build_object(
      'profile', row_to_json(p.*),
      'professional_ids', (
        select jsonb_agg(row_to_json(pi.*))
        from professional_ids pi
        where pi.profile_id = p.id
      )
    )
    from profiles p
    where p.id = v_profile_id
  );
end;
$$;


--
-- Name: update_profile_with_related(uuid, text, text, text, text, text, text, integer, text, text, text, text, text, boolean, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_with_related(p_user_id uuid, p_email text, p_phone_number text, p_first_name text, p_last_name text, p_firm_name text, p_specialization text, p_years_of_practice integer, p_avatar_url text, p_address text, p_home_address text, p_gender text, p_role text, p_onboarding_completed boolean, p_professional_ids jsonb DEFAULT '[]'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_profile_id UUID;
    v_profile JSONB;
    v_professional_id JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- Upsert profile
        INSERT INTO profiles (
            user_id,
            email,
            phone_number,
            first_name,
            last_name,
            firm_name,
            specialization,
            years_of_practice,
            avatar_url,
            address,
            home_address,
            gender,
            role,
            onboarding_completed,
            updated_at
        )
        VALUES (
            p_user_id,
            p_email,
            p_phone_number,
            p_first_name,
            p_last_name,
            p_firm_name,
            p_specialization,
            p_years_of_practice,
            p_avatar_url,
            p_address,
            p_home_address,
            p_gender,
            p_role,
            p_onboarding_completed,
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            email = EXCLUDED.email,
            phone_number = EXCLUDED.phone_number,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            firm_name = EXCLUDED.firm_name,
            specialization = EXCLUDED.specialization,
            years_of_practice = EXCLUDED.years_of_practice,
            avatar_url = EXCLUDED.avatar_url,
            address = EXCLUDED.address,
            home_address = EXCLUDED.home_address,
            gender = EXCLUDED.gender,
            role = EXCLUDED.role,
            onboarding_completed = EXCLUDED.onboarding_completed,
            updated_at = NOW()
        RETURNING id INTO v_profile_id;

        -- Delete existing professional IDs
        DELETE FROM professional_ids WHERE profile_id = v_profile_id;

        -- Insert new professional IDs
        IF p_professional_ids IS NOT NULL AND jsonb_array_length(p_professional_ids) > 0 THEN
            FOR v_professional_id IN SELECT * FROM jsonb_array_elements(p_professional_ids)
            LOOP
                INSERT INTO professional_ids (
                    profile_id,
                    country,
                    state,
                    professional_id,
                    year_issued,
                    no_id,
                    created_at,
                    updated_at
                )
                VALUES (
                    v_profile_id,
                    v_professional_id->>'country',
                    v_professional_id->>'state',
                    v_professional_id->>'professional_id',
                    (v_professional_id->>'year_issued')::INTEGER,
                    (v_professional_id->>'no_id')::BOOLEAN,
                    NOW(),
                    NOW()
                );
            END LOOP;
        END IF;

        -- Get the updated profile with related data
        SELECT jsonb_build_object(
            'id', p.id,
            'user_id', p.user_id,
            'email', p.email,
            'phone_number', p.phone_number,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'firm_name', p.firm_name,
            'specialization', p.specialization,
            'years_of_practice', p.years_of_practice,
            'avatar_url', p.avatar_url,
            'address', p.address,
            'home_address', p.home_address,
            'gender', p.gender,
            'role', p.role,
            'onboarding_completed', p.onboarding_completed,
            'professional_ids', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', pi.id,
                            'country', pi.country,
                            'state', pi.state,
                            'professional_id', pi.professional_id,
                            'year_issued', pi.year_issued,
                            'no_id', pi.no_id
                        )
                    )
                    FROM professional_ids pi
                    WHERE pi.profile_id = p.id
                ),
                '[]'::jsonb
            )
        )
        INTO v_profile
        FROM profiles p
        WHERE p.id = v_profile_id;

        RETURN v_profile;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to update profile: %', SQLERRM;
    END;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT timezone('utc'::text, now()),
    target_table text,
    target_id uuid,
    extra_data jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    type text NOT NULL,
    success_rate integer,
    duration integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid,
    type text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    case_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'complete'::text, 'error'::text]))),
    CONSTRAINT ai_tasks_type_check CHECK ((type = ANY (ARRAY['summarization'::text, 'contract_review'::text, 'clause_extraction'::text])))
);


--
-- Name: analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    total_documents integer DEFAULT 0,
    total_pages integer DEFAULT 0,
    total_tokens integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name text NOT NULL,
    record_id text,
    action text NOT NULL,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now(),
    old_data jsonb,
    new_data jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: billing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    matter_id uuid NOT NULL,
    billing_method text NOT NULL,
    hourly_rate numeric,
    flat_fee_amount numeric,
    contingency_percentage numeric,
    retainer_amount numeric,
    currency text DEFAULT 'USD'::text,
    automated_time_capture boolean DEFAULT true,
    blockchain_invoicing boolean DEFAULT false,
    send_invoice_on_approval boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_billing_method CHECK ((billing_method = ANY (ARRAY['Hourly'::text, 'Flat Fee'::text, 'Contingency'::text, 'Retainer'::text]))),
    CONSTRAINT valid_currency CHECK ((currency = ANY (ARRAY['USD'::text, 'EUR'::text, 'GBP'::text, 'CAD'::text, 'AUD'::text, 'JPY'::text, 'CNY'::text, 'INR'::text, 'BRL'::text, 'MXN'::text])))
);


--
-- Name: billing_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    value public.billing_method_type NOT NULL,
    label text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clerk_user_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clerk_user_map (
    clerk_id text NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: client_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    rating integer NOT NULL,
    category text DEFAULT 'service_quality'::text NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT client_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: client_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_types (
    id integer NOT NULL,
    value public.client_type NOT NULL,
    label text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: client_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_types_id_seq OWNED BY public.client_types.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    title text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    preferred_language text DEFAULT 'English'::text,
    client_type text DEFAULT 'Individual'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title_id integer,
    client_type_id integer,
    preferred_language_id integer,
    phone_number text,
    matter_id uuid,
    matter_status_id uuid,
    CONSTRAINT valid_client_type CHECK ((client_type = ANY (ARRAY['Individual'::text, 'Business'::text, 'Government'::text, 'Nonprofit'::text, 'Trust'::text, 'Partnership'::text, 'Estate'::text, 'Other'::text])))
);


--
-- Name: COLUMN clients.phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clients.phone IS 'International phone number with country code, e.g. +12025550123';


--
-- Name: connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    connection_name text NOT NULL,
    connection_type text NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    value text NOT NULL,
    label text NOT NULL
);


--
-- Name: deadlines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deadlines (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    case_id uuid,
    title text NOT NULL,
    description text,
    due_date date NOT NULL,
    type public.deadline_type,
    status public.deadline_status DEFAULT 'open'::public.deadline_status,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action public.audit_action DEFAULT 'update'::public.audit_action NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_comments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_permissions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid,
    user_id uuid NOT NULL,
    permission_level text DEFAULT 'read'::text,
    granted_by text NOT NULL,
    granted_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_permissions_permission_level_check CHECK ((permission_level = ANY (ARRAY['read'::text, 'write'::text, 'admin'::text])))
);


--
-- Name: document_tag_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_tag_relationships (
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_tags (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_versions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    version_number integer NOT NULL,
    file_url text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_workflows (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    status public.workflow_status DEFAULT 'pending'::public.workflow_status NOT NULL,
    assigned_to text,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    file_url text NOT NULL,
    status public.document_status DEFAULT 'draft'::public.document_status NOT NULL,
    uploaded_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    profile_id uuid NOT NULL
);


--
-- Name: firm_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firm_invitations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    firm_id uuid,
    email text NOT NULL,
    role text NOT NULL,
    token uuid NOT NULL,
    status text DEFAULT 'pending'::text,
    invited_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: firm_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firm_locations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    firm_id uuid,
    address text NOT NULL,
    city text,
    state text,
    country text,
    postal_code text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: firm_practice_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firm_practice_areas (
    firm_id uuid NOT NULL,
    practice_area_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: firm_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firm_users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    firm_id uuid,
    user_id uuid,
    role text NOT NULL,
    status text DEFAULT 'active'::text,
    invited_by text,
    is_owner boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: firms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.firms (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    address text,
    city text,
    state text,
    zip_code text,
    phone_number text,
    email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    analytics jsonb DEFAULT '{}'::jsonb,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    custom_attributes jsonb DEFAULT '{}'::jsonb
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid,
    invoice_number text NOT NULL,
    amount numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: jurisdictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jurisdictions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    country_code character(2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: languages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.languages (
    id integer NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: languages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.languages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.languages_id_seq OWNED BY public.languages.id;


--
-- Name: law_firm_associations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.law_firm_associations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    law_firm_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    is_primary boolean DEFAULT false,
    permissions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    profile_id uuid NOT NULL,
    role_id uuid NOT NULL,
    CONSTRAINT law_firm_associations_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'pending'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Name: COLUMN law_firm_associations.role_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.law_firm_associations.role_id IS 'References the roles table for standardized role management';


--
-- Name: law_firms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.law_firms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    address text,
    city text,
    state text,
    zip_code text,
    phone_number text,
    email text,
    website text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    company text,
    status text DEFAULT 'new'::text,
    source text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    profile_id uuid NOT NULL
);


--
-- Name: matter_billing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matter_billing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    matter_id uuid,
    billing_type text NOT NULL,
    rate numeric(10,2),
    currency uuid,
    custom_terms text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    priority uuid,
    billing_method public.billing_method_type,
    status uuid
);


--
-- Name: matter_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matter_documents (
    id text DEFAULT gen_random_uuid() NOT NULL,
    matter_id uuid NOT NULL,
    document_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL
);


--
-- Name: matter_intake_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matter_intake_links (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    matter_id uuid,
    token text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: matter_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matter_participants (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    matter_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.participant_role DEFAULT 'associate_attorney'::public.participant_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: matter_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matter_status (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    status text,
    changed_at timestamp with time zone,
    matter_id uuid,
    notes text
);


--
-- Name: matter_sub_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matter_sub_types (
    id integer NOT NULL,
    matter_type_id integer,
    value text NOT NULL,
    label text NOT NULL
);


--
-- Name: matter_sub_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matter_sub_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matter_sub_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matter_sub_types_id_seq OWNED BY public.matter_sub_types.id;


--
-- Name: matter_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matter_team (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    matter_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    role_id uuid NOT NULL,
    is_lead boolean DEFAULT false,
    is_billing_attorney boolean DEFAULT false,
    is_responsible_attorney boolean DEFAULT false,
    start_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT matter_team_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text])))
);


--
-- Name: TABLE matter_team; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.matter_team IS 'Tracks team members assigned to matters and their roles';


--
-- Name: COLUMN matter_team.is_lead; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.matter_team.is_lead IS 'Indicates if this team member is the lead on the matter';


--
-- Name: COLUMN matter_team.is_billing_attorney; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.matter_team.is_billing_attorney IS 'Indicates if this team member is the billing attorney';


--
-- Name: COLUMN matter_team.is_responsible_attorney; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.matter_team.is_responsible_attorney IS 'Indicates if this team member is the responsible attorney';


--
-- Name: COLUMN matter_team.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.matter_team.status IS 'Current status of the team member assignment';


--
-- Name: matter_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matter_types (
    id integer NOT NULL,
    value text NOT NULL,
    label text NOT NULL
);


--
-- Name: matter_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matter_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matter_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matter_types_id_seq OWNED BY public.matter_types.id;


--
-- Name: matters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    client_id uuid NOT NULL,
    description text,
    jurisdiction text,
    estimated_value numeric,
    matter_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    type_id integer NOT NULL,
    sub_type_id integer NOT NULL,
    title text NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_text text,
    sender_id text,
    case_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read boolean DEFAULT false,
    attachments jsonb,
    attachment_url text,
    user_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    profile_id uuid NOT NULL
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    case_id uuid,
    user_id uuid,
    content text NOT NULL,
    is_private boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id uuid,
    document_id uuid
);


--
-- Name: onboarding_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    firm_id uuid,
    event_type text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: practice_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_areas (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: priorities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.priorities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL
);


--
-- Name: professional_ids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professional_ids (
    id bigint NOT NULL,
    profile_id uuid NOT NULL,
    country character varying(100) NOT NULL,
    state character varying(100),
    professional_id character varying(50),
    year_issued integer,
    verification_status character varying(20) DEFAULT 'not_verified'::character varying,
    no_id boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    document_url text,
    document_name character varying(255),
    issuing_authority character varying(255),
    issue_date date,
    expiration_date date,
    status character varying(20) DEFAULT 'active'::character varying,
    verification_notes text,
    last_verified_at timestamp with time zone,
    verified_by uuid,
    CONSTRAINT valid_dates CHECK ((((issue_date IS NULL) OR (issue_date <= CURRENT_DATE)) AND ((expiration_date IS NULL) OR (expiration_date >= CURRENT_DATE)))),
    CONSTRAINT valid_year_issued CHECK (((year_issued >= 1900) AND ((year_issued)::numeric <= EXTRACT(year FROM CURRENT_DATE))))
);


--
-- Name: professional_ids_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.professional_ids_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: professional_ids_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.professional_ids_id_seq OWNED BY public.professional_ids.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    clerk_id text,
    email text,
    phone_number text,
    first_name text,
    last_name text,
    firm_name text,
    specialization text,
    years_of_practice integer,
    avatar_url text,
    address text,
    home_address text,
    gender text,
    role_id uuid,
    onboarding_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    role text DEFAULT 'user'::text,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text, 'lawyer'::text, 'client'::text])))
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    is_firm_specific boolean DEFAULT false NOT NULL,
    max_admins integer DEFAULT 3,
    permissions jsonb DEFAULT '{}'::jsonb,
    parent_role_id uuid,
    role_level public.role_level DEFAULT 'professional'::public.role_level NOT NULL
);


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    type text NOT NULL,
    status text NOT NULL,
    participants text[] DEFAULT '{}'::text[],
    location text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    recurrence text,
    reminder text,
    profile_id uuid NOT NULL,
    is_recurring boolean DEFAULT false,
    recurrence_pattern text,
    reminder_time interval,
    reminder_type text[] DEFAULT '{}'::text[],
    reminder_sent boolean DEFAULT false,
    CONSTRAINT schedules_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT schedules_type_check CHECK ((type = ANY (ARRAY['meeting'::text, 'call'::text, 'email'::text, 'other'::text])))
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    complexity text DEFAULT 'medium'::text NOT NULL,
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    plan_type text DEFAULT 'free'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT teams_plan_type_check CHECK ((plan_type = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text])))
);


--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_entries (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    case_id uuid,
    user_id uuid,
    description text,
    duration interval NOT NULL,
    rate numeric(10,2),
    date date,
    billing_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    billable_status boolean,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: titles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.titles (
    id integer NOT NULL,
    value public.title_type NOT NULL,
    label text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: titles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.titles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: titles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.titles_id_seq OWNED BY public.titles.id;


--
-- Name: user_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    activity_type text NOT NULL,
    time_saved integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_mappings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    clerk_user_id text NOT NULL,
    supabase_user_id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: user_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    profile_completion integer DEFAULT 0 NOT NULL,
    productivity_score integer DEFAULT 0 NOT NULL,
    client_feedback integer DEFAULT 0 NOT NULL,
    time_saved integer DEFAULT 0 NOT NULL,
    ai_interactions integer DEFAULT 0 NOT NULL,
    networking_score integer DEFAULT 0 NOT NULL,
    compliance_score integer DEFAULT 0 NOT NULL,
    billing_efficiency integer DEFAULT 0 NOT NULL,
    workflow_efficiency integer DEFAULT 0 NOT NULL,
    learning_progress integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text,
    email text NOT NULL,
    password text,
    role text DEFAULT 'lawyer'::text,
    team_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text,
    encrypted_password text,
    first_name text,
    last_name text,
    phone_number text,
    password_hash character varying(255) NOT NULL,
    avatar_url character varying(255),
    bar_number text,
    firm_name text,
    specialization text,
    years_of_practice integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['attorney'::text, 'client'::text, 'paralegal'::text, 'admin'::text])))
);


--
-- Name: workflow_optimizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_optimizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    type text NOT NULL,
    adoption_rate integer,
    impact_score integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2025_05_21; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_05_21 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_05_22; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_05_22 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_05_23; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_05_23 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_05_24; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_05_24 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_05_25; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_05_25 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_05_26; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_05_26 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_05_27; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_05_27 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: messages_2025_05_21; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_21 FOR VALUES FROM ('2025-05-21 00:00:00') TO ('2025-05-22 00:00:00');


--
-- Name: messages_2025_05_22; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_22 FOR VALUES FROM ('2025-05-22 00:00:00') TO ('2025-05-23 00:00:00');


--
-- Name: messages_2025_05_23; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_23 FOR VALUES FROM ('2025-05-23 00:00:00') TO ('2025-05-24 00:00:00');


--
-- Name: messages_2025_05_24; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_24 FOR VALUES FROM ('2025-05-24 00:00:00') TO ('2025-05-25 00:00:00');


--
-- Name: messages_2025_05_25; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_25 FOR VALUES FROM ('2025-05-25 00:00:00') TO ('2025-05-26 00:00:00');


--
-- Name: messages_2025_05_26; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_26 FOR VALUES FROM ('2025-05-26 00:00:00') TO ('2025-05-27 00:00:00');


--
-- Name: messages_2025_05_27; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_05_27 FOR VALUES FROM ('2025-05-27 00:00:00') TO ('2025-05-28 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: client_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_types ALTER COLUMN id SET DEFAULT nextval('public.client_types_id_seq'::regclass);


--
-- Name: languages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.languages ALTER COLUMN id SET DEFAULT nextval('public.languages_id_seq'::regclass);


--
-- Name: matter_sub_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_sub_types ALTER COLUMN id SET DEFAULT nextval('public.matter_sub_types_id_seq'::regclass);


--
-- Name: matter_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_types ALTER COLUMN id SET DEFAULT nextval('public.matter_types_id_seq'::regclass);


--
-- Name: professional_ids id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_ids ALTER COLUMN id SET DEFAULT nextval('public.professional_ids_id_seq'::regclass);


--
-- Name: titles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.titles ALTER COLUMN id SET DEFAULT nextval('public.titles_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activity activity_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_id_key UNIQUE (id);


--
-- Name: activity_logs activity_logs_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_id_key UNIQUE (id);


--
-- Name: activity activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_pkey PRIMARY KEY (id);


--
-- Name: ai_interactions ai_interactions_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_interactions
    ADD CONSTRAINT ai_interactions_id_key UNIQUE (id);


--
-- Name: ai_tasks ai_tasks_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tasks
    ADD CONSTRAINT ai_tasks_id_key UNIQUE (id);


--
-- Name: analytics analytics_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_id_key UNIQUE (id);


--
-- Name: audit_log audit_log_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_id_key UNIQUE (id);


--
-- Name: billing billing_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing
    ADD CONSTRAINT billing_id_key UNIQUE (id);


--
-- Name: billing_methods billing_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_methods
    ADD CONSTRAINT billing_methods_pkey PRIMARY KEY (id);


--
-- Name: billing_methods billing_methods_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_methods
    ADD CONSTRAINT billing_methods_value_key UNIQUE (value);


--
-- Name: clerk_user_map clerk_user_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clerk_user_map
    ADD CONSTRAINT clerk_user_map_pkey PRIMARY KEY (clerk_id);


--
-- Name: clerk_user_map clerk_user_map_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clerk_user_map
    ADD CONSTRAINT clerk_user_map_user_id_key UNIQUE (user_id);


--
-- Name: client_feedback client_feedback_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_feedback
    ADD CONSTRAINT client_feedback_id_key UNIQUE (id);


--
-- Name: client_types client_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_types
    ADD CONSTRAINT client_types_pkey PRIMARY KEY (id);


--
-- Name: clients clients_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_id_key UNIQUE (id);


--
-- Name: connections connections_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_id_key UNIQUE (id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_value_key UNIQUE (value);


--
-- Name: deadlines deadlines_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deadlines
    ADD CONSTRAINT deadlines_id_key UNIQUE (id);


--
-- Name: document_audit_logs document_audit_logs_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_audit_logs
    ADD CONSTRAINT document_audit_logs_id_key UNIQUE (id);


--
-- Name: document_categories document_categories_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_categories
    ADD CONSTRAINT document_categories_id_key UNIQUE (id);


--
-- Name: document_categories document_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_categories
    ADD CONSTRAINT document_categories_name_key UNIQUE (name);


--
-- Name: document_comments document_comments_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT document_comments_id_key UNIQUE (id);


--
-- Name: document_permissions document_permissions_document_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_document_id_user_id_key UNIQUE (document_id, user_id);


--
-- Name: document_permissions document_permissions_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_id_key UNIQUE (id);


--
-- Name: document_tag_relationships document_tag_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tag_relationships
    ADD CONSTRAINT document_tag_relationships_pkey PRIMARY KEY (document_id, tag_id);


--
-- Name: document_tags document_tags_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_id_key UNIQUE (id);


--
-- Name: document_tags document_tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_name_key UNIQUE (name);


--
-- Name: document_versions document_versions_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_id_key UNIQUE (id);


--
-- Name: document_workflows document_workflows_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_workflows
    ADD CONSTRAINT document_workflows_id_key UNIQUE (id);


--
-- Name: documents documents_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_id_key UNIQUE (id);


--
-- Name: firm_invitations firm_invitations_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_invitations
    ADD CONSTRAINT firm_invitations_id_key UNIQUE (id);


--
-- Name: firm_invitations firm_invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_invitations
    ADD CONSTRAINT firm_invitations_token_key UNIQUE (token);


--
-- Name: firm_locations firm_locations_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_locations
    ADD CONSTRAINT firm_locations_id_key UNIQUE (id);


--
-- Name: firm_users firm_users_firm_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_users
    ADD CONSTRAINT firm_users_firm_id_user_id_key UNIQUE (firm_id, user_id);


--
-- Name: firm_users firm_users_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_users
    ADD CONSTRAINT firm_users_id_key UNIQUE (id);


--
-- Name: firms firms_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firms
    ADD CONSTRAINT firms_email_key UNIQUE (email);


--
-- Name: firms firms_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firms
    ADD CONSTRAINT firms_id_key UNIQUE (id);


--
-- Name: activity_logs idx_activity_logs_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT idx_activity_logs_id PRIMARY KEY (id);


--
-- Name: ai_interactions idx_ai_interactions_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_interactions
    ADD CONSTRAINT idx_ai_interactions_id PRIMARY KEY (id);


--
-- Name: ai_tasks idx_ai_tasks_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tasks
    ADD CONSTRAINT idx_ai_tasks_id PRIMARY KEY (id);


--
-- Name: analytics idx_analytics_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT idx_analytics_id PRIMARY KEY (id);


--
-- Name: audit_log idx_audit_log_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT idx_audit_log_id PRIMARY KEY (id);


--
-- Name: billing idx_billing_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing
    ADD CONSTRAINT idx_billing_id PRIMARY KEY (id);


--
-- Name: client_feedback idx_client_feedback_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_feedback
    ADD CONSTRAINT idx_client_feedback_id PRIMARY KEY (id);


--
-- Name: clients idx_clients_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT idx_clients_id PRIMARY KEY (id);


--
-- Name: connections idx_connections_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT idx_connections_id PRIMARY KEY (id);


--
-- Name: deadlines idx_deadlines_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deadlines
    ADD CONSTRAINT idx_deadlines_id PRIMARY KEY (id);


--
-- Name: document_audit_logs idx_document_audit_logs_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_audit_logs
    ADD CONSTRAINT idx_document_audit_logs_id PRIMARY KEY (id);


--
-- Name: document_categories idx_document_categories_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_categories
    ADD CONSTRAINT idx_document_categories_id PRIMARY KEY (id);


--
-- Name: document_comments idx_document_comments_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT idx_document_comments_id PRIMARY KEY (id);


--
-- Name: document_tags idx_document_tags_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT idx_document_tags_id PRIMARY KEY (id);


--
-- Name: document_workflows idx_document_workflows_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_workflows
    ADD CONSTRAINT idx_document_workflows_id PRIMARY KEY (id);


--
-- Name: documents idx_documents_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT idx_documents_id PRIMARY KEY (id);


--
-- Name: firm_invitations idx_firm_invitations_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_invitations
    ADD CONSTRAINT idx_firm_invitations_id PRIMARY KEY (id);


--
-- Name: firm_locations idx_firm_locations_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_locations
    ADD CONSTRAINT idx_firm_locations_id PRIMARY KEY (id);


--
-- Name: firms idx_firms_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firms
    ADD CONSTRAINT idx_firms_id PRIMARY KEY (id);


--
-- Name: invoices idx_invoices_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT idx_invoices_id PRIMARY KEY (id);


--
-- Name: jurisdictions idx_jurisdictions_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurisdictions
    ADD CONSTRAINT idx_jurisdictions_id PRIMARY KEY (id);


--
-- Name: law_firms idx_law_firms_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firms
    ADD CONSTRAINT idx_law_firms_id PRIMARY KEY (id);


--
-- Name: leads idx_leads_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT idx_leads_id PRIMARY KEY (id);


--
-- Name: matter_billing idx_matter_billing_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_billing
    ADD CONSTRAINT idx_matter_billing_id PRIMARY KEY (id);


--
-- Name: matter_intake_links idx_matter_intake_links_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_intake_links
    ADD CONSTRAINT idx_matter_intake_links_id PRIMARY KEY (id);


--
-- Name: matter_participants idx_matter_participants_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_participants
    ADD CONSTRAINT idx_matter_participants_id PRIMARY KEY (id);


--
-- Name: messages idx_messages_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT idx_messages_id PRIMARY KEY (id);


--
-- Name: notes idx_notes_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT idx_notes_id PRIMARY KEY (id);


--
-- Name: onboarding_audit_logs idx_onboarding_audit_logs_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_audit_logs
    ADD CONSTRAINT idx_onboarding_audit_logs_id PRIMARY KEY (id);


--
-- Name: practice_areas idx_practice_areas_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_areas
    ADD CONSTRAINT idx_practice_areas_id PRIMARY KEY (id);


--
-- Name: professional_ids idx_professional_ids_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_ids
    ADD CONSTRAINT idx_professional_ids_id PRIMARY KEY (id);


--
-- Name: roles idx_roles_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT idx_roles_id PRIMARY KEY (id);


--
-- Name: schedules idx_schedules_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT idx_schedules_id PRIMARY KEY (id);


--
-- Name: tasks idx_tasks_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT idx_tasks_id PRIMARY KEY (id);


--
-- Name: teams idx_teams_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT idx_teams_id PRIMARY KEY (id);


--
-- Name: time_entries idx_time_entries_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT idx_time_entries_id PRIMARY KEY (id);


--
-- Name: user_activities idx_user_activities_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT idx_user_activities_id PRIMARY KEY (id);


--
-- Name: user_metrics idx_user_metrics_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_metrics
    ADD CONSTRAINT idx_user_metrics_id PRIMARY KEY (id);


--
-- Name: users idx_users_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT idx_users_id PRIMARY KEY (id);


--
-- Name: workflow_optimizations idx_workflow_optimizations_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_optimizations
    ADD CONSTRAINT idx_workflow_optimizations_id PRIMARY KEY (id);


--
-- Name: invoices invoices_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_id_key UNIQUE (id);


--
-- Name: jurisdictions jurisdictions_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jurisdictions
    ADD CONSTRAINT jurisdictions_id_key UNIQUE (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: law_firm_associations law_firm_associations_law_firm_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firm_associations
    ADD CONSTRAINT law_firm_associations_law_firm_id_user_id_key UNIQUE (law_firm_id, user_id);


--
-- Name: law_firm_associations law_firm_associations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firm_associations
    ADD CONSTRAINT law_firm_associations_pkey PRIMARY KEY (id);


--
-- Name: law_firm_associations law_firm_associations_profile_id_law_firm_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firm_associations
    ADD CONSTRAINT law_firm_associations_profile_id_law_firm_id_key UNIQUE (profile_id, law_firm_id);


--
-- Name: law_firms law_firms_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firms
    ADD CONSTRAINT law_firms_id_key UNIQUE (id);


--
-- Name: leads leads_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_id_key UNIQUE (id);


--
-- Name: matter_documents matter_documents_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_documents
    ADD CONSTRAINT matter_documents_id_key UNIQUE (id);


--
-- Name: matter_documents matter_documents_matter_id_document_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_documents
    ADD CONSTRAINT matter_documents_matter_id_document_id_key UNIQUE (matter_id, document_id);


--
-- Name: matter_intake_links matter_intake_links_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_intake_links
    ADD CONSTRAINT matter_intake_links_id_key UNIQUE (id);


--
-- Name: matter_intake_links matter_intake_links_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_intake_links
    ADD CONSTRAINT matter_intake_links_token_key UNIQUE (token);


--
-- Name: matter_participants matter_participants_matter_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_participants
    ADD CONSTRAINT matter_participants_matter_id_user_id_key UNIQUE (matter_id, user_id);


--
-- Name: matter_status matter_status_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_status
    ADD CONSTRAINT matter_status_name_key UNIQUE (name);


--
-- Name: matter_status matter_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_status
    ADD CONSTRAINT matter_status_pkey PRIMARY KEY (id);


--
-- Name: matter_sub_types matter_sub_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_sub_types
    ADD CONSTRAINT matter_sub_types_pkey PRIMARY KEY (id);


--
-- Name: matter_team matter_team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_team
    ADD CONSTRAINT matter_team_pkey PRIMARY KEY (id);


--
-- Name: matter_types matter_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_types
    ADD CONSTRAINT matter_types_pkey PRIMARY KEY (id);


--
-- Name: matters matters_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matters
    ADD CONSTRAINT matters_id_unique UNIQUE (id);


--
-- Name: messages messages_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_id_key UNIQUE (id);


--
-- Name: notes notes_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_id_key UNIQUE (id);


--
-- Name: onboarding_audit_logs onboarding_audit_logs_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_audit_logs
    ADD CONSTRAINT onboarding_audit_logs_id_key UNIQUE (id);


--
-- Name: practice_areas practice_areas_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_areas
    ADD CONSTRAINT practice_areas_id_key UNIQUE (id);


--
-- Name: practice_areas practice_areas_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_areas
    ADD CONSTRAINT practice_areas_name_key UNIQUE (name);


--
-- Name: priorities priorities_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.priorities
    ADD CONSTRAINT priorities_name_key UNIQUE (name);


--
-- Name: priorities priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.priorities
    ADD CONSTRAINT priorities_pkey PRIMARY KEY (id);


--
-- Name: professional_ids professional_ids_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_ids
    ADD CONSTRAINT professional_ids_id_key UNIQUE (id);


--
-- Name: profiles profiles_clerk_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_clerk_id_key UNIQUE (clerk_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_id_key UNIQUE (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: schedules schedules_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_id_key UNIQUE (id);


--
-- Name: tasks tasks_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_id_key UNIQUE (id);


--
-- Name: teams teams_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_id_key UNIQUE (id);


--
-- Name: time_entries time_entries_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_id_key UNIQUE (id);


--
-- Name: titles titles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.titles
    ADD CONSTRAINT titles_pkey PRIMARY KEY (id);


--
-- Name: law_firm_associations unique_profile_law_firm; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firm_associations
    ADD CONSTRAINT unique_profile_law_firm UNIQUE (profile_id, law_firm_id);


--
-- Name: document_versions uq_document_versions_doc_ver; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT uq_document_versions_doc_ver UNIQUE (document_id, version_number);


--
-- Name: user_activities user_activities_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_id_key UNIQUE (id);


--
-- Name: user_mappings user_mappings_clerk_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mappings
    ADD CONSTRAINT user_mappings_clerk_user_id_key UNIQUE (clerk_user_id);


--
-- Name: user_mappings user_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_mappings
    ADD CONSTRAINT user_mappings_pkey PRIMARY KEY (id);


--
-- Name: user_metrics user_metrics_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_metrics
    ADD CONSTRAINT user_metrics_id_key UNIQUE (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);


--
-- Name: workflow_optimizations workflow_optimizations_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_optimizations
    ADD CONSTRAINT workflow_optimizations_id_key UNIQUE (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_21 messages_2025_05_21_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_05_21
    ADD CONSTRAINT messages_2025_05_21_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_22 messages_2025_05_22_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_05_22
    ADD CONSTRAINT messages_2025_05_22_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_23 messages_2025_05_23_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_05_23
    ADD CONSTRAINT messages_2025_05_23_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_24 messages_2025_05_24_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_05_24
    ADD CONSTRAINT messages_2025_05_24_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_25 messages_2025_05_25_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_05_25
    ADD CONSTRAINT messages_2025_05_25_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_26 messages_2025_05_26_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_05_26
    ADD CONSTRAINT messages_2025_05_26_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_05_27 messages_2025_05_27_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_05_27
    ADD CONSTRAINT messages_2025_05_27_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: billing_matter_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX billing_matter_id_idx ON public.billing USING btree (matter_id);


--
-- Name: clients_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_email_idx ON public.clients USING btree (email);


--
-- Name: clients_profile_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_profile_id_idx ON public.clients USING btree (profile_id);


--
-- Name: idx_activity_logs_target_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_target_id ON public.activity_logs USING btree (target_id);


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- Name: idx_activity_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_user_id ON public.activity USING btree (user_id);


--
-- Name: idx_ai_interactions_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_interactions_profile_id ON public.ai_interactions USING btree (profile_id);


--
-- Name: idx_ai_tasks_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_tasks_case_id ON public.ai_tasks USING btree (case_id);


--
-- Name: idx_ai_tasks_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_tasks_document_id ON public.ai_tasks USING btree (document_id);


--
-- Name: idx_analytics_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_profile_id ON public.analytics USING btree (profile_id);


--
-- Name: idx_audit_log_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_changed_at ON public.audit_log USING btree (changed_at);


--
-- Name: idx_audit_log_changed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_changed_by ON public.audit_log USING btree (changed_by);


--
-- Name: idx_audit_log_record_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_record_id ON public.audit_log USING btree (record_id);


--
-- Name: idx_audit_log_table_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_table_name ON public.audit_log USING btree (table_name);


--
-- Name: idx_clerk_user_map_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_clerk_user_map_user_id ON public.clerk_user_map USING btree (user_id);


--
-- Name: idx_client_feedback_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_feedback_profile_id ON public.client_feedback USING btree (profile_id);


--
-- Name: idx_client_types_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_client_types_value ON public.client_types USING btree (value);


--
-- Name: idx_clients_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_profile_id ON public.clients USING btree (profile_id);


--
-- Name: idx_connections_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_profile_id ON public.connections USING btree (profile_id);


--
-- Name: idx_currencies_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_currencies_value ON public.currencies USING btree (value);


--
-- Name: idx_deadlines_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deadlines_case_id ON public.deadlines USING btree (case_id);


--
-- Name: idx_document_audit_logs_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_audit_logs_document_id ON public.document_audit_logs USING btree (document_id);


--
-- Name: idx_document_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_audit_logs_user_id ON public.document_audit_logs USING btree (user_id);


--
-- Name: idx_document_comments_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_comments_document_id ON public.document_comments USING btree (document_id);


--
-- Name: idx_document_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_comments_user_id ON public.document_comments USING btree (user_id);


--
-- Name: idx_document_permissions_granted_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_permissions_granted_by ON public.document_permissions USING btree (granted_by);


--
-- Name: idx_document_versions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_versions_created_by ON public.document_versions USING btree (created_by);


--
-- Name: idx_document_workflows_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_workflows_document_id ON public.document_workflows USING btree (document_id);


--
-- Name: idx_documents_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_created_at ON public.documents USING btree (created_at DESC);


--
-- Name: idx_documents_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_profile_id ON public.documents USING btree (profile_id);


--
-- Name: idx_documents_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_uploaded_by ON public.documents USING btree (uploaded_by);


--
-- Name: idx_firm_invitations_firm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_firm_invitations_firm_id ON public.firm_invitations USING btree (firm_id);


--
-- Name: idx_firm_invitations_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_firm_invitations_role ON public.firm_invitations USING btree (role);


--
-- Name: idx_firm_locations_firm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_firm_locations_firm_id ON public.firm_locations USING btree (firm_id);


--
-- Name: idx_firm_practice_areas_firm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_firm_practice_areas_firm_id ON public.firm_practice_areas USING btree (firm_id);


--
-- Name: idx_firm_practice_areas_practice_area_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_firm_practice_areas_practice_area_id ON public.firm_practice_areas USING btree (practice_area_id);


--
-- Name: idx_firm_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_firm_users_role ON public.firm_users USING btree (role);


--
-- Name: idx_invoices_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_profile_id ON public.invoices USING btree (profile_id);


--
-- Name: idx_languages_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_languages_value ON public.languages USING btree (value);


--
-- Name: idx_law_firm_associations_is_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_law_firm_associations_is_primary ON public.law_firm_associations USING btree (is_primary);


--
-- Name: idx_law_firm_associations_law_firm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_law_firm_associations_law_firm_id ON public.law_firm_associations USING btree (law_firm_id);


--
-- Name: idx_law_firm_associations_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_law_firm_associations_profile_id ON public.law_firm_associations USING btree (profile_id);


--
-- Name: idx_law_firm_associations_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_law_firm_associations_role_id ON public.law_firm_associations USING btree (role_id);


--
-- Name: idx_law_firm_associations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_law_firm_associations_status ON public.law_firm_associations USING btree (status);


--
-- Name: idx_law_firm_associations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_law_firm_associations_user_id ON public.law_firm_associations USING btree (user_id);


--
-- Name: idx_leads_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_profile_id ON public.leads USING btree (profile_id);


--
-- Name: idx_leads_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_user_id ON public.leads USING btree (user_id);


--
-- Name: idx_matter_billing_matter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_billing_matter_id ON public.matter_billing USING btree (matter_id);


--
-- Name: idx_matter_intake_links_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_intake_links_created_by ON public.matter_intake_links USING btree (created_by);


--
-- Name: idx_matter_sub_types_matter_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_sub_types_matter_type_id ON public.matter_sub_types USING btree (matter_type_id);


--
-- Name: idx_matter_team_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_team_created_by ON public.matter_team USING btree (created_by);


--
-- Name: idx_matter_team_matter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_team_matter_id ON public.matter_team USING btree (matter_id);


--
-- Name: idx_matter_team_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_team_profile_id ON public.matter_team USING btree (profile_id);


--
-- Name: idx_matter_team_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_team_role_id ON public.matter_team USING btree (role_id);


--
-- Name: idx_matter_team_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_team_status ON public.matter_team USING btree (status);


--
-- Name: idx_matter_team_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_team_updated_by ON public.matter_team USING btree (updated_by);


--
-- Name: idx_matter_types_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matter_types_value ON public.matter_types USING btree (value);


--
-- Name: idx_messages_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_profile_id ON public.messages USING btree (profile_id);


--
-- Name: idx_messages_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_user_id ON public.messages USING btree (user_id);


--
-- Name: idx_notes_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_case_id ON public.notes USING btree (case_id);


--
-- Name: idx_notes_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_document_id ON public.notes USING btree (document_id);


--
-- Name: idx_notes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);


--
-- Name: idx_onboarding_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_onboarding_audit_logs_user_id ON public.onboarding_audit_logs USING btree (user_id);


--
-- Name: idx_professional_ids_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_professional_ids_country ON public.professional_ids USING btree (country);


--
-- Name: idx_professional_ids_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_professional_ids_profile_id ON public.professional_ids USING btree (profile_id);


--
-- Name: idx_professional_ids_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_professional_ids_state ON public.professional_ids USING btree (state);


--
-- Name: idx_professional_ids_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_professional_ids_status ON public.professional_ids USING btree (status);


--
-- Name: idx_professional_ids_verification; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_professional_ids_verification ON public.professional_ids USING btree (verification_status);


--
-- Name: idx_professional_ids_verified_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_professional_ids_verified_by ON public.professional_ids USING btree (verified_by);


--
-- Name: idx_profiles_clerk_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_clerk_id ON public.profiles USING btree (clerk_id);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role_id ON public.profiles USING btree (role_id);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_roles_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_created_by ON public.roles USING btree (created_by);


--
-- Name: idx_roles_is_firm_specific; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_is_firm_specific ON public.roles USING btree (is_firm_specific);


--
-- Name: idx_roles_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_name ON public.roles USING btree (name);


--
-- Name: idx_roles_parent_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_parent_role_id ON public.roles USING btree (parent_role_id);


--
-- Name: idx_roles_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_updated_by ON public.roles USING btree (updated_by);


--
-- Name: idx_schedules_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_profile_id ON public.schedules USING btree (profile_id);


--
-- Name: idx_schedules_reminder_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedules_reminder_time ON public.schedules USING btree (reminder_time);


--
-- Name: idx_tasks_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_profile_id ON public.tasks USING btree (profile_id);


--
-- Name: idx_time_entries_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_entries_case_id ON public.time_entries USING btree (case_id);


--
-- Name: idx_time_entries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_entries_user_id ON public.time_entries USING btree (user_id);


--
-- Name: idx_titles_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_titles_value ON public.titles USING btree (value);


--
-- Name: idx_user_activities_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activities_profile_id ON public.user_activities USING btree (profile_id);


--
-- Name: idx_user_mappings_clerk_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_mappings_clerk_user_id ON public.user_mappings USING btree (clerk_user_id);


--
-- Name: idx_user_mappings_supabase_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_mappings_supabase_user_id ON public.user_mappings USING btree (supabase_user_id);


--
-- Name: idx_user_metrics_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_metrics_profile_id ON public.user_metrics USING btree (profile_id);


--
-- Name: idx_users_bar_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_bar_number ON public.users USING btree (bar_number);


--
-- Name: idx_users_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_team_id ON public.users USING btree (team_id);


--
-- Name: idx_workflow_optimizations_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_optimizations_profile_id ON public.workflow_optimizations USING btree (profile_id);


--
-- Name: unique_billing_attorney; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_billing_attorney ON public.matter_team USING btree (matter_id) WHERE (is_billing_attorney = true);


--
-- Name: unique_matter_lead; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_matter_lead ON public.matter_team USING btree (matter_id) WHERE (is_lead = true);


--
-- Name: unique_responsible_attorney; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_responsible_attorney ON public.matter_team USING btree (matter_id) WHERE (is_responsible_attorney = true);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: messages_2025_05_21_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_21_pkey;


--
-- Name: messages_2025_05_22_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_22_pkey;


--
-- Name: messages_2025_05_23_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_23_pkey;


--
-- Name: messages_2025_05_24_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_24_pkey;


--
-- Name: messages_2025_05_25_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_25_pkey;


--
-- Name: messages_2025_05_26_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_26_pkey;


--
-- Name: messages_2025_05_27_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_05_27_pkey;


--
-- Name: users after_user_delete; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER after_user_delete AFTER DELETE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.call_delete_clerk_user();


--
-- Name: activity audit_activity; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_activity AFTER INSERT OR DELETE OR UPDATE ON public.activity FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: activity_logs audit_activity_logs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_activity_logs AFTER INSERT OR DELETE OR UPDATE ON public.activity_logs FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: ai_interactions audit_ai_interactions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_ai_interactions AFTER INSERT OR DELETE OR UPDATE ON public.ai_interactions FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: ai_tasks audit_ai_tasks; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_ai_tasks AFTER INSERT OR DELETE OR UPDATE ON public.ai_tasks FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: analytics audit_analytics; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_analytics AFTER INSERT OR DELETE OR UPDATE ON public.analytics FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: billing audit_billing; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_billing AFTER INSERT OR DELETE OR UPDATE ON public.billing FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: client_feedback audit_client_feedback; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_client_feedback AFTER INSERT OR DELETE OR UPDATE ON public.client_feedback FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: connections audit_connections; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_connections AFTER INSERT OR DELETE OR UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: deadlines audit_deadlines; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_deadlines AFTER INSERT OR DELETE OR UPDATE ON public.deadlines FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: document_audit_logs audit_document_audit_logs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_document_audit_logs AFTER INSERT OR DELETE OR UPDATE ON public.document_audit_logs FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: document_categories audit_document_categories; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_document_categories AFTER INSERT OR DELETE OR UPDATE ON public.document_categories FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: document_comments audit_document_comments; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_document_comments AFTER INSERT OR DELETE OR UPDATE ON public.document_comments FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: document_permissions audit_document_permissions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_document_permissions AFTER INSERT OR DELETE OR UPDATE ON public.document_permissions FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: document_tag_relationships audit_document_tag_relationships; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_document_tag_relationships AFTER INSERT OR DELETE OR UPDATE ON public.document_tag_relationships FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: document_tags audit_document_tags; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_document_tags AFTER INSERT OR DELETE OR UPDATE ON public.document_tags FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: document_versions audit_document_versions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_document_versions AFTER INSERT OR DELETE OR UPDATE ON public.document_versions FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: document_workflows audit_document_workflows; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_document_workflows AFTER INSERT OR DELETE OR UPDATE ON public.document_workflows FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: documents audit_documents; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_documents AFTER INSERT OR DELETE OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: firm_invitations audit_firm_invitations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_firm_invitations AFTER INSERT OR DELETE OR UPDATE ON public.firm_invitations FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: firm_locations audit_firm_locations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_firm_locations AFTER INSERT OR DELETE OR UPDATE ON public.firm_locations FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: firm_practice_areas audit_firm_practice_areas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_firm_practice_areas AFTER INSERT OR DELETE OR UPDATE ON public.firm_practice_areas FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: firm_users audit_firm_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_firm_users AFTER INSERT OR DELETE OR UPDATE ON public.firm_users FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: firms audit_firms; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_firms AFTER INSERT OR DELETE OR UPDATE ON public.firms FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: invoices audit_invoices; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_invoices AFTER INSERT OR DELETE OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: jurisdictions audit_jurisdictions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_jurisdictions AFTER INSERT OR DELETE OR UPDATE ON public.jurisdictions FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: law_firm_associations audit_law_firm_associations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_law_firm_associations AFTER INSERT OR DELETE OR UPDATE ON public.law_firm_associations FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: law_firms audit_law_firms; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_law_firms AFTER INSERT OR DELETE OR UPDATE ON public.law_firms FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: leads audit_leads; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_leads AFTER INSERT OR DELETE OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: matter_intake_links audit_matter_intake_links; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_matter_intake_links AFTER INSERT OR DELETE OR UPDATE ON public.matter_intake_links FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: matter_team audit_matter_team; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_matter_team AFTER INSERT OR DELETE OR UPDATE ON public.matter_team FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: messages audit_messages; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_messages AFTER INSERT OR DELETE OR UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: notes audit_notes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_notes AFTER INSERT OR DELETE OR UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: onboarding_audit_logs audit_onboarding_audit_logs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_onboarding_audit_logs AFTER INSERT OR DELETE OR UPDATE ON public.onboarding_audit_logs FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: practice_areas audit_practice_areas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_practice_areas AFTER INSERT OR DELETE OR UPDATE ON public.practice_areas FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: professional_ids audit_professional_ids; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_professional_ids AFTER INSERT OR DELETE OR UPDATE ON public.professional_ids FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: profiles audit_profiles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_profiles AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: roles audit_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_roles AFTER INSERT OR DELETE OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: schedules audit_schedules; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_schedules AFTER INSERT OR DELETE OR UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: tasks audit_tasks; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_tasks AFTER INSERT OR DELETE OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: teams audit_teams; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_teams AFTER INSERT OR DELETE OR UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: time_entries audit_time_entries; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_time_entries AFTER INSERT OR DELETE OR UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: user_activities audit_user_activities; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_user_activities AFTER INSERT OR DELETE OR UPDATE ON public.user_activities FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: user_metrics audit_user_metrics; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_user_metrics AFTER INSERT OR DELETE OR UPDATE ON public.user_metrics FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: users audit_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_users AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: workflow_optimizations audit_workflow_optimizations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_workflow_optimizations AFTER INSERT OR DELETE OR UPDATE ON public.workflow_optimizations FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes();


--
-- Name: clients ensure_phone_not_null_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ensure_phone_not_null_trigger BEFORE INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.ensure_phone_not_null();


--
-- Name: matter_team set_matter_team_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_matter_team_updated_at BEFORE UPDATE ON public.matter_team FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs update_activity_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_activity_logs_updated_at BEFORE UPDATE ON public.activity_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity update_activity_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_activity_updated_at BEFORE UPDATE ON public.activity FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_interactions update_ai_interactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_interactions_updated_at BEFORE UPDATE ON public.ai_interactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_tasks update_ai_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_tasks_updated_at BEFORE UPDATE ON public.ai_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: analytics update_analytics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_log update_audit_log_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_audit_log_updated_at BEFORE UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: billing update_billing_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON public.billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_feedback update_client_feedback_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_client_feedback_updated_at BEFORE UPDATE ON public.client_feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: connections update_connections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deadlines update_deadlines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON public.deadlines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_audit_logs update_document_audit_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_audit_logs_updated_at BEFORE UPDATE ON public.document_audit_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_categories update_document_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_categories_updated_at BEFORE UPDATE ON public.document_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_comments update_document_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_comments_updated_at BEFORE UPDATE ON public.document_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_permissions update_document_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_permissions_updated_at BEFORE UPDATE ON public.document_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_tag_relationships update_document_tag_relationships_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_tag_relationships_updated_at BEFORE UPDATE ON public.document_tag_relationships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_tags update_document_tags_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_tags_updated_at BEFORE UPDATE ON public.document_tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_versions update_document_versions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_versions_updated_at BEFORE UPDATE ON public.document_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: document_workflows update_document_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_document_workflows_updated_at BEFORE UPDATE ON public.document_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: firm_invitations update_firm_invitations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_firm_invitations_updated_at BEFORE UPDATE ON public.firm_invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: firm_locations update_firm_locations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_firm_locations_updated_at BEFORE UPDATE ON public.firm_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: firm_practice_areas update_firm_practice_areas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_firm_practice_areas_updated_at BEFORE UPDATE ON public.firm_practice_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: firm_users update_firm_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_firm_users_updated_at BEFORE UPDATE ON public.firm_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: firms update_firms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_firms_updated_at BEFORE UPDATE ON public.firms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: jurisdictions update_jurisdictions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_jurisdictions_updated_at BEFORE UPDATE ON public.jurisdictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: law_firm_associations update_law_firm_associations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_law_firm_associations_updated_at BEFORE UPDATE ON public.law_firm_associations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: law_firms update_law_firms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_law_firms_updated_at BEFORE UPDATE ON public.law_firms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: matter_intake_links update_matter_intake_links_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_matter_intake_links_updated_at BEFORE UPDATE ON public.matter_intake_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: messages update_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notes update_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: onboarding_audit_logs update_onboarding_audit_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_onboarding_audit_logs_updated_at BEFORE UPDATE ON public.onboarding_audit_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: practice_areas update_practice_areas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_practice_areas_updated_at BEFORE UPDATE ON public.practice_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: professional_ids update_professional_ids_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_professional_ids_updated_at BEFORE UPDATE ON public.professional_ids FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: schedules update_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: teams update_teams_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: time_entries update_time_entries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_activities update_user_activities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_activities_updated_at BEFORE UPDATE ON public.user_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_mappings update_user_mappings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_mappings_updated_at BEFORE UPDATE ON public.user_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_metrics update_user_metrics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_metrics_updated_at BEFORE UPDATE ON public.user_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workflow_optimizations update_workflow_optimizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workflow_optimizations_updated_at BEFORE UPDATE ON public.workflow_optimizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: clerk_user_map clerk_user_map_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clerk_user_map
    ADD CONSTRAINT clerk_user_map_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: clients clients_client_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_client_type_id_fkey FOREIGN KEY (client_type_id) REFERENCES public.client_types(id);


--
-- Name: clients clients_preferred_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_preferred_language_id_fkey FOREIGN KEY (preferred_language_id) REFERENCES public.languages(id);


--
-- Name: clients clients_title_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_title_id_fkey FOREIGN KEY (title_id) REFERENCES public.titles(id);


--
-- Name: document_permissions document_permissions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_tag_relationships document_tag_relationships_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_tag_relationships
    ADD CONSTRAINT document_tag_relationships_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.document_tags(id) ON DELETE CASCADE;


--
-- Name: firm_invitations firm_invitations_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_invitations
    ADD CONSTRAINT firm_invitations_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON DELETE CASCADE;


--
-- Name: firm_invitations firm_invitations_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_invitations
    ADD CONSTRAINT firm_invitations_role_fkey FOREIGN KEY (role) REFERENCES public.roles(name);


--
-- Name: firm_locations firm_locations_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_locations
    ADD CONSTRAINT firm_locations_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON DELETE CASCADE;


--
-- Name: firm_practice_areas firm_practice_areas_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_practice_areas
    ADD CONSTRAINT firm_practice_areas_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON DELETE CASCADE;


--
-- Name: firm_practice_areas firm_practice_areas_practice_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_practice_areas
    ADD CONSTRAINT firm_practice_areas_practice_area_id_fkey FOREIGN KEY (practice_area_id) REFERENCES public.practice_areas(id) ON DELETE CASCADE;


--
-- Name: firm_users firm_users_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_users
    ADD CONSTRAINT firm_users_firm_id_fkey FOREIGN KEY (firm_id) REFERENCES public.firms(id) ON DELETE CASCADE;


--
-- Name: activity_logs fk_activity_logs_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT fk_activity_logs_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: activity fk_activity_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT fk_activity_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ai_tasks fk_ai_tasks_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_tasks
    ADD CONSTRAINT fk_ai_tasks_document FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;


--
-- Name: clients fk_clients_matter; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT fk_clients_matter FOREIGN KEY (matter_id) REFERENCES public.matters(id) ON DELETE SET NULL;


--
-- Name: clients fk_clients_matter_status; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT fk_clients_matter_status FOREIGN KEY (matter_status_id) REFERENCES public.matter_status(id) ON DELETE SET NULL;


--
-- Name: document_audit_logs fk_document_audit_logs_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_audit_logs
    ADD CONSTRAINT fk_document_audit_logs_document FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_audit_logs fk_document_audit_logs_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_audit_logs
    ADD CONSTRAINT fk_document_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: document_comments fk_document_comments_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT fk_document_comments_document FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_comments fk_document_comments_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comments
    ADD CONSTRAINT fk_document_comments_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: document_permissions fk_document_permissions_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT fk_document_permissions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: document_versions fk_document_versions_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT fk_document_versions_created_by FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: document_versions fk_document_versions_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT fk_document_versions_document FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_workflows fk_document_workflows_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_workflows
    ADD CONSTRAINT fk_document_workflows_document FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: firm_users fk_firm_users_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.firm_users
    ADD CONSTRAINT fk_firm_users_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: law_firm_associations fk_law_firm_associations_role_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firm_associations
    ADD CONSTRAINT fk_law_firm_associations_role_id FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: leads fk_leads_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT fk_leads_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: matter_billing fk_matter_billing_currency; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_billing
    ADD CONSTRAINT fk_matter_billing_currency FOREIGN KEY (currency) REFERENCES public.currencies(id);


--
-- Name: matter_billing fk_matter_billing_matter_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_billing
    ADD CONSTRAINT fk_matter_billing_matter_id FOREIGN KEY (matter_id) REFERENCES public.matters(id) ON DELETE CASCADE;


--
-- Name: matter_billing fk_matter_billing_priority; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_billing
    ADD CONSTRAINT fk_matter_billing_priority FOREIGN KEY (priority) REFERENCES public.priorities(id);


--
-- Name: matter_billing fk_matter_billing_status; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_billing
    ADD CONSTRAINT fk_matter_billing_status FOREIGN KEY (status) REFERENCES public.matter_status(id);


--
-- Name: matter_documents fk_matter_documents_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_documents
    ADD CONSTRAINT fk_matter_documents_created_by FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: matter_documents fk_matter_documents_matter_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_documents
    ADD CONSTRAINT fk_matter_documents_matter_id FOREIGN KEY (matter_id) REFERENCES public.matters(id) ON DELETE CASCADE;


--
-- Name: matter_documents fk_matter_documents_updated_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_documents
    ADD CONSTRAINT fk_matter_documents_updated_by FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: matter_intake_links fk_matter_intake_links_matter_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_intake_links
    ADD CONSTRAINT fk_matter_intake_links_matter_id FOREIGN KEY (matter_id) REFERENCES public.matters(id) ON DELETE CASCADE;


--
-- Name: matter_participants fk_matter_participants_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_participants
    ADD CONSTRAINT fk_matter_participants_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: matter_status fk_matter_status_matter_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_status
    ADD CONSTRAINT fk_matter_status_matter_id FOREIGN KEY (matter_id) REFERENCES public.matters(id) ON DELETE CASCADE;


--
-- Name: matter_team fk_matter_team_matter_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_team
    ADD CONSTRAINT fk_matter_team_matter_id FOREIGN KEY (matter_id) REFERENCES public.matters(id) ON DELETE CASCADE;


--
-- Name: matters fk_matters_sub_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matters
    ADD CONSTRAINT fk_matters_sub_type FOREIGN KEY (sub_type_id) REFERENCES public.matter_sub_types(id);


--
-- Name: matters fk_matters_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matters
    ADD CONSTRAINT fk_matters_type FOREIGN KEY (type_id) REFERENCES public.matter_types(id);


--
-- Name: messages fk_messages_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notes fk_notes_document; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT fk_notes_document FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;


--
-- Name: notes fk_notes_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT fk_notes_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: onboarding_audit_logs fk_onboarding_audit_logs_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_audit_logs
    ADD CONSTRAINT fk_onboarding_audit_logs_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: professional_ids fk_professional_ids_verified_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professional_ids
    ADD CONSTRAINT fk_professional_ids_verified_by FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: roles fk_roles_parent_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT fk_roles_parent_role FOREIGN KEY (parent_role_id) REFERENCES public.roles(id);


--
-- Name: time_entries fk_time_entries_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT fk_time_entries_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users fk_users_team_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_team_id FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: law_firm_associations law_firm_associations_law_firm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firm_associations
    ADD CONSTRAINT law_firm_associations_law_firm_id_fkey FOREIGN KEY (law_firm_id) REFERENCES public.law_firms(id) ON DELETE CASCADE;


--
-- Name: law_firm_associations law_firm_associations_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firm_associations
    ADD CONSTRAINT law_firm_associations_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: law_firm_associations law_firm_associations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.law_firm_associations
    ADD CONSTRAINT law_firm_associations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: leads leads_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: matter_documents matter_documents_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_documents
    ADD CONSTRAINT matter_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: matter_intake_links matter_intake_links_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_intake_links
    ADD CONSTRAINT matter_intake_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: matter_sub_types matter_sub_types_matter_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_sub_types
    ADD CONSTRAINT matter_sub_types_matter_type_id_fkey FOREIGN KEY (matter_type_id) REFERENCES public.matter_types(id) ON DELETE CASCADE;


--
-- Name: matter_team matter_team_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_team
    ADD CONSTRAINT matter_team_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: matter_team matter_team_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_team
    ADD CONSTRAINT matter_team_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: matter_team matter_team_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matter_team
    ADD CONSTRAINT matter_team_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: messages messages_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: roles roles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: roles roles_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: schedules schedules_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: roles Allow read access to all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to all roles" ON public.roles FOR SELECT USING (true);


--
-- Name: billing_methods Allow read access to billing_methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to billing_methods" ON public.billing_methods FOR SELECT USING (true);


--
-- Name: client_types Allow read access to client_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to client_types" ON public.client_types FOR SELECT USING (true);


--
-- Name: currencies Allow read access to currencies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to currencies" ON public.currencies FOR SELECT USING (true);


--
-- Name: languages Allow read access to languages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to languages" ON public.languages FOR SELECT USING (true);


--
-- Name: matter_sub_types Allow read access to matter_sub_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to matter_sub_types" ON public.matter_sub_types FOR SELECT USING (true);


--
-- Name: matter_types Allow read access to matter_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to matter_types" ON public.matter_types FOR SELECT USING (true);


--
-- Name: titles Allow read access to titles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read access to titles" ON public.titles FOR SELECT USING (true);


--
-- Name: activity Allow select for users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for users" ON public.activity FOR SELECT USING (true);


--
-- Name: messages Allow select for users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for users" ON public.messages FOR SELECT USING (true);


--
-- Name: roles Allow service role to modify roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role to modify roles" ON public.roles USING ((auth.role() = 'service_role'::text));


--
-- Name: audit_log Authenticated users can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view audit logs" ON public.audit_log FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: roles Everyone can view roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view roles" ON public.roles FOR SELECT USING (true);


--
-- Name: onboarding_audit_logs Service role can do all onboarding audit log actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can do all onboarding audit log actions" ON public.onboarding_audit_logs USING ((auth.role() = 'service_role'::text));


--
-- Name: profiles Service role can do all profile actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can do all profile actions" ON public.profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: activity Users can access their own activity records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own activity records" ON public.activity USING (((user_id)::text = (auth.uid())::text));


--
-- Name: messages Users can access their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can access their own messages" ON public.messages USING (((user_id)::text = (auth.uid())::text));


--
-- Name: profiles Users can create their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK ((clerk_id = (auth.uid())::text));


--
-- Name: ai_interactions Users can delete their own ai_interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own ai_interactions" ON public.ai_interactions FOR DELETE USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: analytics Users can delete their own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own analytics" ON public.analytics FOR DELETE USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: client_feedback Users can delete their own client_feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own client_feedback" ON public.client_feedback FOR DELETE USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: leads Users can delete their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own leads" ON public.leads FOR DELETE USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = (auth.jwt() ->> 'sub'::text)))));


--
-- Name: professional_ids Users can delete their own professional IDs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own professional IDs" ON public.professional_ids FOR DELETE TO authenticated USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: profiles Users can delete their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE TO authenticated USING ((clerk_id = (auth.uid())::text));


--
-- Name: schedules Users can delete their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own schedules" ON public.schedules FOR DELETE USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = (auth.jwt() ->> 'sub'::text)))));


--
-- Name: leads Users can insert leads with their profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert leads with their profile" ON public.leads FOR INSERT WITH CHECK ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = (auth.jwt() ->> 'sub'::text)))));


--
-- Name: schedules Users can insert schedules with their profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert schedules with their profile" ON public.schedules FOR INSERT WITH CHECK ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = (auth.jwt() ->> 'sub'::text)))));


--
-- Name: ai_interactions Users can insert their own ai_interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own ai_interactions" ON public.ai_interactions FOR INSERT WITH CHECK (((profile_id)::text = (auth.uid())::text));


--
-- Name: analytics Users can insert their own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own analytics" ON public.analytics FOR INSERT WITH CHECK (((profile_id)::text = (auth.uid())::text));


--
-- Name: client_feedback Users can insert their own client_feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own client_feedback" ON public.client_feedback FOR INSERT WITH CHECK (((profile_id)::text = (auth.uid())::text));


--
-- Name: clients Users can insert their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE ((profiles.clerk_id)::uuid = auth.uid()))));


--
-- Name: user_mappings Users can insert their own mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own mappings" ON public.user_mappings FOR INSERT WITH CHECK ((clerk_user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: messages Users can insert their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own messages" ON public.messages FOR INSERT WITH CHECK (((user_id)::text = (auth.uid())::text));


--
-- Name: notes Users can insert their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own notes" ON public.notes FOR INSERT WITH CHECK (((user_id)::text = (auth.uid())::text));


--
-- Name: onboarding_audit_logs Users can insert their own onboarding events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own onboarding events" ON public.onboarding_audit_logs FOR INSERT WITH CHECK (((user_id)::text = (auth.uid())::text));


--
-- Name: professional_ids Users can insert their own professional IDs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own professional IDs" ON public.professional_ids FOR INSERT TO authenticated WITH CHECK (((profile_id)::text = (auth.uid())::text));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((clerk_id = (auth.uid())::text));


--
-- Name: ai_interactions Users can update their own ai_interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own ai_interactions" ON public.ai_interactions FOR UPDATE USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: analytics Users can update their own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own analytics" ON public.analytics FOR UPDATE USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: client_feedback Users can update their own client_feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own client_feedback" ON public.client_feedback FOR UPDATE USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: clients Users can update their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE ((profiles.clerk_id)::uuid = auth.uid()))));


--
-- Name: leads Users can update their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own leads" ON public.leads FOR UPDATE USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = (auth.jwt() ->> 'sub'::text)))));


--
-- Name: user_mappings Users can update their own mapping; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own mapping" ON public.user_mappings FOR UPDATE USING ((clerk_user_id = (auth.jwt() ->> 'sub'::text)));


--
-- Name: user_mappings Users can update their own mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own mappings" ON public.user_mappings FOR UPDATE USING ((clerk_user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: notes Users can update their own notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (((user_id)::text = (auth.uid())::text));


--
-- Name: professional_ids Users can update their own professional IDs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own professional IDs" ON public.professional_ids FOR UPDATE TO authenticated USING (((profile_id)::text = (auth.uid())::text)) WITH CHECK (((profile_id)::text = (auth.uid())::text));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((clerk_id = (auth.uid())::text)) WITH CHECK ((clerk_id = (auth.uid())::text));


--
-- Name: schedules Users can update their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own schedules" ON public.schedules FOR UPDATE USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = (auth.jwt() ->> 'sub'::text)))));


--
-- Name: law_firm_associations Users can view associations for their firms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view associations for their firms" ON public.law_firm_associations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.law_firm_associations lfa
  WHERE ((lfa.law_firm_id = law_firm_associations.law_firm_id) AND (lfa.user_id = auth.uid()) AND ((lfa.status)::text = 'active'::text)))));


--
-- Name: leads Users can view leads related to their profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view leads related to their profile" ON public.leads FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = (auth.jwt() ->> 'sub'::text)))));


--
-- Name: schedules Users can view schedules related to their profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view schedules related to their profile" ON public.schedules FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.clerk_id = (auth.jwt() ->> 'sub'::text)))));


--
-- Name: ai_interactions Users can view their own ai_interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own ai_interactions" ON public.ai_interactions FOR SELECT USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: analytics Users can view their own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own analytics" ON public.analytics FOR SELECT USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: client_feedback Users can view their own client_feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own client_feedback" ON public.client_feedback FOR SELECT USING (((profile_id)::text = (auth.uid())::text));


--
-- Name: clients Users can view their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING ((profile_id IN ( SELECT profiles.id
   FROM public.profiles
  WHERE ((profiles.clerk_id)::uuid = auth.uid()))));


--
-- Name: user_mappings Users can view their own mapping; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own mapping" ON public.user_mappings FOR SELECT USING ((clerk_user_id = (auth.jwt() ->> 'sub'::text)));


--
-- Name: user_mappings Users can view their own mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own mappings" ON public.user_mappings FOR SELECT USING ((clerk_user_id = (( SELECT auth.uid() AS uid))::text));


--
-- Name: messages Users can view their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (((user_id)::text = (auth.uid())::text));


--
-- Name: professional_ids Users can view their own professional IDs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own professional IDs" ON public.professional_ids FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = profile_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((clerk_id = (auth.uid())::text));


--
-- Name: activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_interactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: billing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_methods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_methods ENABLE ROW LEVEL SECURITY;

--
-- Name: client_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: client_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.client_types ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

--
-- Name: currencies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

--
-- Name: deadlines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;

--
-- Name: document_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: document_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: document_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: document_workflows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_workflows ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: languages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

--
-- Name: law_firm_associations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.law_firm_associations ENABLE ROW LEVEL SECURITY;

--
-- Name: law_firms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;

--
-- Name: matter_intake_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matter_intake_links ENABLE ROW LEVEL SECURITY;

--
-- Name: matter_sub_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matter_sub_types ENABLE ROW LEVEL SECURITY;

--
-- Name: matter_team; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matter_team ENABLE ROW LEVEL SECURITY;

--
-- Name: matter_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matter_types ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: time_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: titles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: user_mappings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_mappings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_optimizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_optimizations ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Anyone can read avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Anyone can read avatars" ON storage.objects FOR SELECT USING ((bucket_id = 'avatars'::text));


--
-- Name: objects Anyone can view avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING ((bucket_id = 'avatars'::text));


--
-- Name: objects Authenticated users can delete their avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can delete their avatars" ON storage.objects FOR DELETE USING (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: objects Authenticated users can read avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can read avatars" ON storage.objects FOR SELECT USING (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: objects Authenticated users can update their avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can update their avatars" ON storage.objects FOR UPDATE USING (((bucket_id = 'avatars'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: objects Profile pictures are publicly accessible; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Profile pictures are publicly accessible" ON storage.objects FOR SELECT USING ((bucket_id = 'profile-pictures'::text));


--
-- Name: objects Public can read certificates; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Public can read certificates" ON storage.objects FOR SELECT TO anon USING ((bucket_id = 'certificates'::text));


--
-- Name: objects Public can view avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT USING ((bucket_id = 'avatars'::text));


--
-- Name: objects Users can delete their own avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can delete their own profile picture; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete their own profile picture" ON storage.objects FOR DELETE USING (((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users can read their own certificates; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can read their own certificates" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'certificates'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users can update their own avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can update their own profile picture; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update their own profile picture" ON storage.objects FOR UPDATE USING (((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users can upload their own avatars; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: objects Users can upload their own certificates; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload their own certificates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'certificates'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users can upload their own profile picture; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can upload their own profile picture" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime users; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.users;


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

