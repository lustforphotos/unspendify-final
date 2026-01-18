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

  // Check OAuth configuration
  const oauthConfig = checkOAuthConfig();
  checks.oauth_gmail = oauthConfig.gmail ? 'ok' : 'not_configured';
  checks.oauth_outlook = oauthConfig.outlook ? 'ok' : 'not_configured';

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return new Response(
    JSON.stringify({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      oauth: oauthConfig,
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

function checkOAuthConfig() {
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const microsoftClientId = Deno.env.get('MICROSOFT_CLIENT_ID');
  const microsoftClientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

  return {
    gmail: !!(googleClientId && googleClientSecret),
    outlook: !!(microsoftClientId && microsoftClientSecret),
    details: {
      google_client_id: googleClientId ? 'set' : 'missing',
      google_client_secret: googleClientSecret ? 'set' : 'missing',
      microsoft_client_id: microsoftClientId ? 'set' : 'missing',
      microsoft_client_secret: microsoftClientSecret ? 'set' : 'missing',
    },
  };
}
