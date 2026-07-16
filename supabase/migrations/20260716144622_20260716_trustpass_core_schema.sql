/*
# TrustPass Core Schema — Identity, Consent, Audit

## Purpose
TrustPass lets a Nigerian user verify their identity ONCE and reuse that verified
identity package across multiple participating businesses, gated by explicit
per-request consent. This migration creates the full data model for the V0 MVP.

## Tables created
1. `businesses` — a participating business. Created by a signed-in user who opts
   into the "business" role. Holds an `api_key` used to retrieve an approved
   identity package via the server route.
2. `identities` — the user's verified identity. One row per user.
   `verification_level` (0 = unverified, 1 = basic, 2 = document-verified).
   Populated on signup with the user's email; Level 2 is granted after a mock
   document upload.
3. `consent_requests` — a business-initiated request for a user's identity.
   Contains requested fields, stated purpose, callback_url, and status
   (pending | approved | rejected | expired). Targeted by user email.
4. `consent_decisions` — append-only record of each approve/reject action.
5. `audit_logs` — append-only ledger of data ingress events.

## Security (RLS)
- All tables have RLS ENABLED.
- `identities`, `consent_decisions` are owner-scoped to the authenticated user.
- `businesses` is owner-scoped to the business's `user_id`.
- `audit_logs` is owner-scoped to the business's `user_id` via a join.
- `consent_requests` SELECT allows both the target user and the business owner.
  INSERT/UPDATE/DELETE are restricted to the business owner.
- Owner columns default to `auth.uid()` so client inserts that omit the owner
  still satisfy RLS WITH CHECK.

## Important notes
1. `consent_requests.status` transitions are driven by the `resolve_consent`
   RPC called by the consumer. The RPC updates the request status and inserts a
   `consent_decisions` row atomically.
2. `identities.verification_level` is 0 on signup. A mock document "upload"
   sets it to 2 via the `mark_identity_verified_l2` RPC.
3. `businesses.api_key` is a random token auto-generated on insert.
4. The identity package returned to a business is filtered to the fields they
   requested via the `get_identity_package` RPC.
*/

-- ============================================================
-- businesses
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  api_key text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_business" ON businesses;
CREATE POLICY "select_own_business" ON businesses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_business" ON businesses;
CREATE POLICY "insert_own_business" ON businesses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_business" ON businesses;
CREATE POLICY "update_own_business" ON businesses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_business" ON businesses;
CREATE POLICY "delete_own_business" ON businesses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- identities
-- ============================================================
CREATE TABLE IF NOT EXISTS identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  verification_level smallint NOT NULL DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 2),
  full_name text,
  date_of_birth date,
  phone text,
  email text,
  address text,
  government_id_type text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_identity" ON identities;
CREATE POLICY "select_own_identity" ON identities FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_identity" ON identities;
CREATE POLICY "insert_own_identity" ON identities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_identity" ON identities;
CREATE POLICY "update_own_identity" ON identities FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_identity" ON identities;
CREATE POLICY "delete_own_identity" ON identities FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- consent_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS consent_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  target_email text NOT NULL,
  requested_fields text[] NOT NULL,
  purpose text NOT NULL,
  callback_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  consent_id uuid,
  package_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_consent_requests_target_email ON consent_requests(target_email);
CREATE INDEX IF NOT EXISTS idx_consent_requests_business_id ON consent_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_consent_requests_status ON consent_requests(status);

ALTER TABLE consent_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_consent_requests" ON consent_requests;
CREATE POLICY "select_consent_requests" ON consent_requests FOR SELECT
  TO authenticated
  USING (
    target_email = (
      SELECT email FROM identities WHERE identities.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = consent_requests.business_id AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_consent_requests" ON consent_requests;
CREATE POLICY "insert_consent_requests" ON consent_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = consent_requests.business_id AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_consent_requests" ON consent_requests;
CREATE POLICY "update_consent_requests" ON consent_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = consent_requests.business_id AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = consent_requests.business_id AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_consent_requests" ON consent_requests;
CREATE POLICY "delete_consent_requests" ON consent_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = consent_requests.business_id AND b.user_id = auth.uid()
    )
  );

-- ============================================================
-- consent_decisions (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS consent_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES consent_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('approved','rejected')),
  consent_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  decided_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_consent_decisions_request_unique
  ON consent_decisions(request_id);

ALTER TABLE consent_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_decisions" ON consent_decisions;
CREATE POLICY "select_own_decisions" ON consent_decisions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_decisions" ON consent_decisions;
CREATE POLICY "insert_own_decisions" ON consent_decisions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- audit_logs (append-only, business-scoped)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  request_id uuid REFERENCES consent_requests(id) ON DELETE SET NULL,
  event text NOT NULL,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs(business_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_audit_logs" ON audit_logs;
CREATE POLICY "select_own_audit_logs" ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = audit_logs.business_id AND b.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_audit_logs" ON audit_logs;
CREATE POLICY "insert_own_audit_logs" ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = audit_logs.business_id AND b.user_id = auth.uid()
    )
  );

-- ============================================================
-- RPC: resolve_consent(p_request_id, p_decision)
-- ============================================================
CREATE OR REPLACE FUNCTION resolve_consent(p_request_id uuid, p_decision text)
RETURNS consent_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request consent_requests%ROWTYPE;
  v_identity_user_id uuid;
  v_consent_id uuid;
  v_expires_at timestamptz;
BEGIN
  IF p_decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision USING ERRCODE = '23514';
  END IF;

  SELECT * INTO v_request FROM consent_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consent request not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT i.user_id INTO v_identity_user_id
  FROM identities i
  WHERE i.email = v_request.target_email
  LIMIT 1;

  IF v_identity_user_id IS NULL OR v_identity_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to resolve this request' USING ERRCODE = '42501';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request already resolved' USING ERRCODE = '55006';
  END IF;

  v_consent_id := gen_random_uuid();
  v_expires_at := now() + interval '24 hours';

  UPDATE consent_requests
    SET status = p_decision,
        consent_id = v_consent_id,
        package_expires_at = CASE WHEN p_decision = 'approved' THEN v_expires_at ELSE NULL END,
        resolved_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_request;

  INSERT INTO consent_decisions (request_id, user_id, decision, consent_id)
    VALUES (p_request_id, auth.uid(), p_decision, v_consent_id);

  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION resolve_consent(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_consent(uuid, text) TO authenticated;

-- ============================================================
-- RPC: mark_identity_verified_l2(...)
-- ============================================================
CREATE OR REPLACE FUNCTION mark_identity_verified_l2(
  p_full_name text,
  p_dob date,
  p_phone text,
  p_address text,
  p_gov_id_type text
)
RETURNS identities
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row identities%ROWTYPE;
BEGIN
  INSERT INTO identities (user_id, verification_level, full_name, date_of_birth, phone, email, address, government_id_type, verified_at, updated_at)
    VALUES (auth.uid(), 2, p_full_name, p_dob, p_phone,
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      p_address, p_gov_id_type, now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET verification_level = 2,
          full_name = COALESCE(identities.full_name, EXCLUDED.full_name),
          date_of_birth = COALESCE(identities.date_of_birth, EXCLUDED.date_of_birth),
          phone = COALESCE(identities.phone, EXCLUDED.phone),
          address = COALESCE(identities.address, EXCLUDED.address),
          government_id_type = COALESCE(identities.government_id_type, EXCLUDED.government_id_type),
          verified_at = now(),
          updated_at = now()
    RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION mark_identity_verified_l2(text, date, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_identity_verified_l2(text, date, text, text, text) TO authenticated;

-- ============================================================
-- RPC: get_identity_package(p_request_id)
-- ============================================================
CREATE OR REPLACE FUNCTION get_identity_package(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request consent_requests%ROWTYPE;
  v_identity identities%ROWTYPE;
  v_pkg jsonb;
BEGIN
  SELECT * INTO v_request FROM consent_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_request.status <> 'approved' THEN
    RAISE EXCEPTION 'Request not approved' USING ERRCODE = '42501';
  END IF;

  IF v_request.package_expires_at IS NOT NULL AND now() > v_request.package_expires_at THEN
    RAISE EXCEPTION 'Package expired' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_identity
  FROM identities
  WHERE email = v_request.target_email
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identity not found' USING ERRCODE = 'P0002';
  END IF;

  v_pkg := jsonb_build_object(
    'user_id', v_identity.user_id,
    'verification_level', v_identity.verification_level,
    'verified_at', v_identity.verified_at,
    'full_name', v_identity.full_name,
    'date_of_birth', v_identity.date_of_birth,
    'phone', v_identity.phone,
    'email', v_identity.email,
    'address', v_identity.address,
    'government_id_type', v_identity.government_id_type,
    'consent_id', v_request.consent_id,
    'expires_at', v_request.package_expires_at
  );

  SELECT jsonb_object_agg(key, value) INTO v_pkg
  FROM jsonb_each(v_pkg)
  WHERE key IN ('user_id','verification_level','verified_at','consent_id','expires_at')
     OR key = ANY (v_request.requested_fields);

  RETURN v_pkg;
END;
$$;

REVOKE ALL ON FUNCTION get_identity_package(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_identity_package(uuid) TO authenticated, anon, service_role;

-- ============================================================
-- Trigger: ensure identity row exists on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO identities (user_id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
