import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = params.id;
  if (!requestId) {
    return NextResponse.json(
      { error: 'Missing request id' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized — no session' },
      { status: 401 }
    );
  }

  const { data: request } = await supabase
    .from('consent_requests')
    .select('id, business_id, status, target_email, requested_fields')
    .eq('id', requestId)
    .maybeSingle();

  if (!request) {
    return NextResponse.json(
      { error: 'Request not found' },
      { status: 404 }
    );
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', request.business_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json(
      { error: 'Forbidden — you do not own this request' },
      { status: 403 }
    );
  }

  if (request.status !== 'approved') {
    return NextResponse.json(
      { error: `Request is not approved (status: ${request.status})` },
      { status: 409 }
    );
  }

  const { data: pkg, error: rpcError } = await supabase.rpc('get_identity_package', {
    p_request_id: requestId,
  });

  if (rpcError) {
    return NextResponse.json(
      { error: rpcError.message },
      { status: 500 }
    );
  }

  const auditDetail = {
    fields_returned: Object.keys(pkg || {}),
    target_email: request.target_email,
    business_name: business.name,
  };

  const admin = createAdminClient();
  if (admin) {
    await admin.from('audit_logs').insert({
      business_id: business.id,
      request_id: requestId,
      event: 'package_retrieved',
      detail: auditDetail,
    });
  } else {
    await supabase.from('audit_logs').insert({
      business_id: business.id,
      request_id: requestId,
      event: 'package_retrieved',
      detail: auditDetail,
    });
  }

  return NextResponse.json({ package: pkg });
}
