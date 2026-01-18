import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ScanRequest {
  connectionId?: string;
  scanType?: 'backfill' | 'daily' | 'scheduled';
}

interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  recipients: string[];
}

interface DetectedTool {
  vendorName: string;
  normalizedVendor: string;
  amount?: number;
  date?: string;
  billingFrequency?: string;
  confidence: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { connectionId, scanType = 'daily' }: ScanRequest = await req.json();

    let connections;
    if (connectionId) {
      const { data } = await supabase
        .from('email_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('is_active', true)
        .single();
      connections = data ? [data] : [];
    } else {
      const { data } = await supabase
        .from('email_connections')
        .select('*')
        .eq('is_active', true);
      connections = data || [];
    }

    if (!connections.length) {
      return new Response(
        JSON.stringify({ message: 'No active connections to scan' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const connection of connections) {
      const scanLog = await supabase
        .from('email_scan_logs')
        .insert({
          connection_id: connection.id,
          scan_type: scanType,
          status: 'running',
        })
        .select()
        .single();

      try {
        const emails = await fetchEmails(connection, scanType, supabase);
        const detectedTools = await parseEmailsForTools(emails, connection);
        
        const { toolsCreated, toolsUpdated } = await upsertTools(
          supabase,
          detectedTools,
          connection
        );

        await generateInterruptions(supabase, connection.organization_id);

        await supabase
          .from('email_connections')
          .update({
            last_scan_at: new Date().toISOString(),
            ...(scanType === 'backfill' && { last_backfill_at: new Date().toISOString() }),
          })
          .eq('id', connection.id);

        await supabase
          .from('email_scan_logs')
          .update({
            emails_scanned: emails.length,
            tools_detected: toolsCreated,
            tools_updated: toolsUpdated,
            completed_at: new Date().toISOString(),
            status: 'success',
          })
          .eq('id', scanLog.data.id);

        results.push({
          connectionId: connection.id,
          emailsScanned: emails.length,
          toolsDetected: toolsCreated,
          toolsUpdated,
        });
      } catch (error) {
        console.error(`Scan failed for connection ${connection.id}:`, error);
        
        await supabase
          .from('email_scan_logs')
          .update({
            completed_at: new Date().toISOString(),
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', scanLog.data.id);

        results.push({
          connectionId: connection.id,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scan emails error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchEmails(
  connection: any,
  scanType: string,
  supabase: any
): Promise<EmailMessage[]> {
  const monthsBack = scanType === 'backfill' ? (connection.backfill_months || 12) : 0;
  const since = new Date();
  since.setMonth(since.getMonth() - (monthsBack || 0));

  if (scanType === 'daily' && connection.last_scan_at) {
    since.setTime(new Date(connection.last_scan_at).getTime());
  }

  // Check if token is expired and refresh if needed
  const refreshedConnection = await refreshTokenIfNeeded(connection, supabase);

  if (refreshedConnection.provider === 'gmail') {
    return await fetchGmailMessages(refreshedConnection, since);
  } else if (refreshedConnection.provider === 'outlook') {
    return await fetchOutlookMessages(refreshedConnection, since);
  }

  return [];
}

async function refreshTokenIfNeeded(connection: any, supabase: any): Promise<any> {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // If token expires in less than 5 minutes, refresh it
  if (expiresAt <= fiveMinutesFromNow) {
    console.log(`Token expiring soon for connection ${connection.id}, refreshing...`);

    try {
      let tokenResponse: any;

      if (connection.provider === 'gmail') {
        const clientId = Deno.env.get('google_client_id')!;
        const clientSecret = Deno.env.get('google_client_secret')!;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: connection.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!tokenRes.ok) {
          const errorBody = await tokenRes.text();
          throw new Error(`Failed to refresh Gmail token: ${tokenRes.status} - ${errorBody}`);
        }

        tokenResponse = await tokenRes.json();
      } else if (connection.provider === 'outlook') {
        const clientId = Deno.env.get('microsoft_client_id')!;
        const clientSecret = Deno.env.get('microsoft_client_secret')!;

        const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: connection.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!tokenRes.ok) {
          const errorBody = await tokenRes.text();
          throw new Error(`Failed to refresh Outlook token: ${tokenRes.status} - ${errorBody}`);
        }

        tokenResponse = await tokenRes.json();
      }

      if (tokenResponse && tokenResponse.access_token) {
        const newExpiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));

        // Update the connection in the database
        await supabase
          .from('email_connections')
          .update({
            access_token: tokenResponse.access_token,
            token_expires_at: newExpiresAt.toISOString(),
            // Some providers return a new refresh token, update it if present
            ...(tokenResponse.refresh_token && { refresh_token: tokenResponse.refresh_token }),
          })
          .eq('id', connection.id);

        console.log(`Token refreshed successfully for connection ${connection.id}`);

        // Return updated connection
        return {
          ...connection,
          access_token: tokenResponse.access_token,
          token_expires_at: newExpiresAt.toISOString(),
          ...(tokenResponse.refresh_token && { refresh_token: tokenResponse.refresh_token }),
        };
      }
    } catch (error) {
      console.error(`Failed to refresh token for connection ${connection.id}:`, error);
      throw new Error(`Token refresh failed: ${error.message}. Please reconnect your inbox.`);
    }
  }

  return connection;
}

async function fetchGmailMessages(
  connection: any,
  since: Date
): Promise<EmailMessage[]> {
  const query = [
    'invoice OR receipt OR subscription OR payment OR renewal OR trial',
    `after:${Math.floor(since.getTime() / 1000)}`,
  ].join(' ');

  const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=500`;

  console.log('Fetching Gmail messages with query:', query);

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${connection.access_token}` },
  });

  if (!searchRes.ok) {
    const errorBody = await searchRes.text();
    console.error('Gmail API error:', searchRes.status, searchRes.statusText, errorBody);
    throw new Error(`Gmail API error: ${searchRes.status} ${searchRes.statusText} - ${errorBody}`);
  }

  const searchData = await searchRes.json();
  const messages: EmailMessage[] = [];

  if (!searchData.messages) {
    return messages;
  }

  for (const msg of searchData.messages.slice(0, 100)) {
    const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
    const msgRes = await fetch(msgUrl, {
      headers: { Authorization: `Bearer ${connection.access_token}` },
    });

    if (msgRes.ok) {
      const msgData = await msgRes.json();
      const headers = msgData.payload.headers;
      
      const getHeader = (name: string) => {
        const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return header?.value || '';
      };

      let body = '';
      if (msgData.payload.body?.data) {
        body = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (msgData.payload.parts) {
        const textPart = msgData.payload.parts.find((p: any) => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }

      messages.push({
        id: msg.id,
        sender: getHeader('from'),
        subject: getHeader('subject'),
        body: body.substring(0, 5000),
        date: new Date(parseInt(msgData.internalDate)).toISOString(),
        recipients: [getHeader('to'), getHeader('cc')].filter(Boolean),
      });
    }
  }

  return messages;
}

async function fetchOutlookMessages(
  connection: any,
  since: Date
): Promise<EmailMessage[]> {
  const filter = `receivedDateTime ge ${since.toISOString()}`;
  const search = 'invoice OR receipt OR subscription OR payment OR renewal OR trial';
  const url = `https://graph.microsoft.com/v1.0/me/messages?$filter=${encodeURIComponent(filter)}&$search="${encodeURIComponent(search)}"&$top=100&$select=id,from,subject,bodyPreview,receivedDateTime,toRecipients,ccRecipients`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${connection.access_token}` },
  });

  if (!res.ok) {
    throw new Error(`Outlook API error: ${res.statusText}`);
  }

  const data = await res.json();
  const messages: EmailMessage[] = [];

  if (data.value) {
    for (const msg of data.value) {
      messages.push({
        id: msg.id,
        sender: msg.from?.emailAddress?.address || '',
        subject: msg.subject || '',
        body: msg.bodyPreview || '',
        date: msg.receivedDateTime,
        recipients: [
          ...(msg.toRecipients || []).map((r: any) => r.emailAddress?.address),
          ...(msg.ccRecipients || []).map((r: any) => r.emailAddress?.address),
        ].filter(Boolean),
      });
    }
  }

  return messages;
}

async function parseEmailsForTools(
  emails: EmailMessage[],
  connection: any
): Promise<DetectedTool[]> {
  const tools: DetectedTool[] = [];
  const vendorPatterns = [
    { pattern: /stripe/i, name: 'Stripe', isParent: true },
    { pattern: /hubspot/i, name: 'HubSpot' },
    { pattern: /salesforce/i, name: 'Salesforce' },
    { pattern: /slack/i, name: 'Slack' },
    { pattern: /zoom/i, name: 'Zoom' },
    { pattern: /google workspace|g suite/i, name: 'Google Workspace', isParent: true },
    { pattern: /microsoft 365|office 365/i, name: 'Microsoft 365', isParent: true },
    { pattern: /adobe/i, name: 'Adobe', isParent: true },
    { pattern: /aws|amazon web services/i, name: 'AWS', isParent: true },
    { pattern: /mailchimp/i, name: 'Mailchimp' },
    { pattern: /typeform/i, name: 'Typeform' },
    { pattern: /notion/i, name: 'Notion' },
    { pattern: /figma/i, name: 'Figma' },
    { pattern: /canva/i, name: 'Canva' },
    { pattern: /asana/i, name: 'Asana' },
    { pattern: /trello/i, name: 'Trello' },
    { pattern: /dropbox/i, name: 'Dropbox' },
    { pattern: /airtable/i, name: 'Airtable' },
    { pattern: /zapier/i, name: 'Zapier' },
    { pattern: /loom/i, name: 'Loom' },
  ];

  const subscriptionKeywords = /\b(subscription|invoice|receipt|payment|renewal|trial|billing|charge|plan|upgrade|downgrade)\b/i;
  const amountPattern = /\$([0-9,]+\.?[0-9]*)/;
  const frequencyPattern = /\b(monthly|annual|yearly|quarterly|weekly)\b/i;

  for (const email of emails) {
    const fullText = `${email.subject} ${email.body}`.toLowerCase();
    
    if (!subscriptionKeywords.test(fullText)) {
      continue;
    }

    for (const vendor of vendorPatterns) {
      if (vendor.pattern.test(fullText)) {
        const amountMatch = fullText.match(amountPattern);
        const frequencyMatch = fullText.match(frequencyPattern);
        
        let confidence = 60;
        if (amountMatch) confidence += 20;
        if (frequencyMatch) confidence += 10;
        if (email.subject.toLowerCase().includes('invoice')) confidence += 10;

        tools.push({
          vendorName: vendor.name,
          normalizedVendor: vendor.name.toLowerCase().replace(/\s+/g, '_'),
          amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined,
          date: email.date,
          billingFrequency: frequencyMatch ? frequencyMatch[1].toLowerCase() : 'unknown',
          confidence,
        });
      }
    }
  }

  return tools;
}

async function upsertTools(
  supabase: any,
  detectedTools: DetectedTool[],
  connection: any
): Promise<{ toolsCreated: number; toolsUpdated: number }> {
  let toolsCreated = 0;
  let toolsUpdated = 0;

  console.log(`Upserting ${detectedTools.length} tools for organization ${connection.organization_id}`);

  for (const tool of detectedTools) {
    console.log('Processing tool:', tool.vendorName, tool.normalizedVendor);

    const { data: existing, error: selectError } = await supabase
      .from('detected_tools')
      .select('*')
      .eq('organization_id', connection.organization_id)
      .eq('normalized_vendor', tool.normalizedVendor)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing tool:', selectError);
      continue;
    }

    if (existing) {
      console.log('Updating existing tool:', existing.id);
      const { error: updateError } = await supabase
        .from('detected_tools')
        .update({
          last_charge_amount: tool.amount,
          last_charge_date: tool.date?.split('T')[0],
          billing_frequency: tool.billingFrequency,
          renewal_count: existing.renewal_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating tool:', updateError);
      } else {
        toolsUpdated++;
      }
    } else {
      const estimatedRenewal = tool.date ? calculateRenewalDate(tool.date, tool.billingFrequency || 'monthly') : null;

      console.log('Creating new tool:', tool.vendorName);
      const { data: inserted, error: insertError } = await supabase
        .from('detected_tools')
        .insert({
          organization_id: connection.organization_id,
          vendor_name: tool.vendorName,
          normalized_vendor: tool.normalizedVendor,
          last_charge_amount: tool.amount,
          last_charge_date: tool.date?.split('T')[0],
          billing_frequency: tool.billingFrequency,
          estimated_renewal_date: estimatedRenewal,
          first_seen_date: tool.date?.split('T')[0] || new Date().toISOString().split('T')[0],
          source_email_connection_id: connection.id,
          confidence_score: tool.confidence,
          inferred_owner_id: connection.user_id,
          status: 'active',
        })
        .select();

      if (insertError) {
        console.error('Error inserting tool:', insertError);
      } else {
        console.log('Successfully created tool:', inserted);
        toolsCreated++;
      }
    }
  }

  console.log(`Upsert complete: ${toolsCreated} created, ${toolsUpdated} updated`);
  return { toolsCreated, toolsUpdated };
}

function calculateRenewalDate(lastDate: string, frequency: string): string {
  const date = new Date(lastDate);
  switch (frequency) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'annual':
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split('T')[0];
}

async function generateInterruptions(
  supabase: any,
  organizationId: string
): Promise<void> {
  const { data: tools } = await supabase
    .from('detected_tools')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active');

  if (!tools) return;

  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  for (const tool of tools) {
    const { data: existingInterruption } = await supabase
      .from('interruptions')
      .select('id')
      .eq('tool_id', tool.id)
      .is('resolved_at', null)
      .maybeSingle();

    if (existingInterruption) continue;

    if (tool.renewal_count >= 6 && !tool.last_interaction_date) {
      await supabase.from('interruptions').insert({
        organization_id: organizationId,
        tool_id: tool.id,
        interruption_type: 'silent_renewal',
        priority: 'high',
        message: `${tool.vendor_name} has renewed ${tool.renewal_count} times without any interaction`,
        possible_actions: ['keep', 'cancel', 'assign_owner'],
      });
    }

    if (tool.estimated_renewal_date) {
      const renewalDate = new Date(tool.estimated_renewal_date);
      if (renewalDate <= sevenDaysFromNow && renewalDate >= now) {
        await supabase.from('interruptions').insert({
          organization_id: organizationId,
          tool_id: tool.id,
          interruption_type: 'trial_ending',
          priority: 'urgent',
          message: `${tool.vendor_name} renews in ${Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`,
          possible_actions: ['keep', 'cancel'],
        });
      }
    }

    if (tool.owner_confirmation_status === 'unconfirmed' && tool.renewal_count >= 3) {
      await supabase.from('interruptions').insert({
        organization_id: organizationId,
        tool_id: tool.id,
        interruption_type: 'no_owner',
        priority: 'medium',
        message: `${tool.vendor_name} has no confirmed owner`,
        possible_actions: ['assign_owner'],
      });
    }
  }
}
