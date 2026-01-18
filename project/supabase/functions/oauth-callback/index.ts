import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return new Response(
        `<html><body><h1>OAuth Error</h1><p>${error}</p><script>setTimeout(() => window.close(), 3000)</script></body></html>`,
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !stateParam) {
      return new Response(
        '<html><body><h1>Error</h1><p>Missing authorization code or state</p></body></html>',
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const state = JSON.parse(atob(stateParam));
    const { provider, organizationId, userId } = state;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let tokenResponse: any;
    let emailAddress: string;

    if (provider === 'gmail') {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
      const callbackUrl = `${supabaseUrl}/functions/v1/oauth-callback`;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      tokenResponse = await tokenRes.json();

      if (!tokenResponse.access_token) {
        throw new Error('Failed to get access token');
      }

      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const profile = await profileRes.json();
      emailAddress = profile.email;
    } else if (provider === 'outlook') {
      const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')!;
      const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;
      const callbackUrl = `${supabaseUrl}/functions/v1/oauth-callback`;

      const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      tokenResponse = await tokenRes.json();

      if (!tokenResponse.access_token) {
        throw new Error('Failed to get access token');
      }

      const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const profile = await profileRes.json();
      emailAddress = profile.mail || profile.userPrincipalName;
    } else {
      throw new Error('Invalid provider');
    }

    const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));

    const { error: insertError } = await supabase
      .from('email_connections')
      .upsert({
        user_id: userId,
        organization_id: organizationId,
        provider,
        email_address: emailAddress,
        access_token_encrypted: tokenResponse.access_token,
        refresh_token_encrypted: tokenResponse.refresh_token || '',
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
      }, {
        onConflict: 'organization_id,email_address',
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        `<html><body><h1>Error</h1><p>Failed to save connection: ${insertError.message}</p></body></html>`,
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const { data: connection } = await supabase
      .from('email_connections')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email_address', emailAddress)
      .single();

    if (connection) {
      await supabase.functions.invoke('scan-emails', {
        body: { connectionId: connection.id, scanType: 'backfill' },
      });
    }

    return new Response(
      `<html><body><h1>Success!</h1><p>Connected ${emailAddress}</p><p>Starting historical scan...</p><script>setTimeout(() => window.close(), 2000)</script></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(
      `<html><body><h1>Error</h1><p>${error.message}</p><script>setTimeout(() => window.close(), 3000)</script></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
});