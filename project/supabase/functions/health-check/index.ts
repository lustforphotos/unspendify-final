import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const checks: Record<string, string> = {};
  let overallStatus = 'healthy';

  try {
    const dbCheck = await checkDatabase();
    checks.database = dbCheck ? 'ok' : 'error';
    if (!dbCheck) overallStatus = 'unhealthy';
  } catch (error) {
    checks.database = 'error';
    overallStatus = 'unhealthy';
  }

  try {
    const emailCheck = await checkEmailService();
    checks.email_service = emailCheck ? 'ok' : 'error';
    if (!emailCheck) overallStatus = 'degraded';
  } catch (error) {
    checks.email_service = 'error';
    overallStatus = 'degraded';
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return new Response(
    JSON.stringify({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      version: '1.0.0',
    }),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});

async function checkDatabase(): Promise<boolean> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkEmailService(): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Email service health check failed:', error);
    return false;
  }
}