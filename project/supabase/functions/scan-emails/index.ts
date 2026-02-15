import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DAILY_LIMITS = {
  MAX_EMAILS: 300,
  MAX_CLASSIFICATIONS: 300,
  MAX_EXTRACTIONS: 30,
};

interface ScanRequest {
  connectionId?: string;
  scanType?: 'backfill' | 'daily' | 'manual';
}

interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  recipients: string[];
}

interface ClassificationResult {
  is_tool_related: boolean;
  confidence: number;
  reason: string;
}

interface ExtractionResult {
  vendor_name: string | null;
  amount: number | null;
  currency: string | null;
  billing_cycle: 'monthly' | 'yearly' | 'trial' | null;
  renewal_date: string | null;
  is_trial: boolean;
  is_cancellation: boolean;
  confidence: number;
  reason: string;
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
        .maybeSingle();
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
      const limitsCheck = await checkDailyLimits(supabase, connection.user_id);

      if (!limitsCheck.can_proceed) {
        console.log(`User ${connection.user_id} hit daily limit: ${limitsCheck.limit_hit}`);
        results.push({
          connectionId: connection.id,
          skipped: true,
          reason: `Daily limit reached: ${limitsCheck.limit_hit}`,
        });
        continue;
      }

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

        const emailsToScan = emails.slice(0, limitsCheck.emails_remaining);

        const { toolsCreated, toolsUpdated } = await processEmailsWithAI(
          supabase,
          emailsToScan,
          connection,
          limitsCheck
        );

        await generateInterruptions(supabase, connection.organization_id);

        const latestEmailDate = emails.length > 0
          ? new Date(Math.max(...emails.map(e => new Date(e.date).getTime()))).toISOString()
          : null;

        await supabase
          .from('email_connections')
          .update({
            last_scan_at: new Date().toISOString(),
            ...(latestEmailDate && { last_scanned_email_date: latestEmailDate }),
            ...(scanType === 'backfill' && { last_backfill_at: new Date().toISOString() }),
          })
          .eq('id', connection.id);

        await supabase
          .from('email_scan_logs')
          .update({
            emails_scanned: emailsToScan.length,
            tools_detected: toolsCreated,
            tools_updated: toolsUpdated,
            completed_at: new Date().toISOString(),
            status: 'success',
          })
          .eq('id', scanLog.data.id);

        results.push({
          connectionId: connection.id,
          emailsScanned: emailsToScan.length,
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

async function checkDailyLimits(supabase: any, userId: string): Promise<any> {
  const { data, error } = await supabase.rpc('check_scan_limits', {
    p_user_id: userId,
    p_emails_needed: 1,
    p_classifications_needed: 1,
    p_extractions_needed: 0,
  });

  if (error) {
    console.error('Error checking limits:', error);
    return { can_proceed: true, emails_remaining: DAILY_LIMITS.MAX_EMAILS };
  }

  return data;
}

async function fetchEmails(
  connection: any,
  scanType: string,
  supabase: any
): Promise<EmailMessage[]> {
  let since = new Date();

  if (scanType === 'backfill') {
    const monthsBack = connection.backfill_months || 12;
    since.setMonth(since.getMonth() - monthsBack);
  } else if (scanType === 'daily' && connection.last_scanned_email_date) {
    since = new Date(connection.last_scanned_email_date);
  } else if (scanType === 'daily') {
    since.setDate(since.getDate() - 1);
  }

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

        await supabase
          .from('email_connections')
          .update({
            access_token: tokenResponse.access_token,
            token_expires_at: newExpiresAt.toISOString(),
            ...(tokenResponse.refresh_token && { refresh_token: tokenResponse.refresh_token }),
          })
          .eq('id', connection.id);

        console.log(`Token refreshed successfully for connection ${connection.id}`);

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
    'invoice OR receipt OR subscription OR payment OR renewal OR trial OR bill OR charge',
    `after:${Math.floor(since.getTime() / 1000)}`,
  ].join(' ');

  const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=300`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${connection.access_token}` },
  });

  if (!searchRes.ok) {
    const errorBody = await searchRes.text();
    console.error('Gmail API error:', searchRes.status, searchRes.statusText, errorBody);
    throw new Error(`Gmail API error: ${searchRes.status} ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  const messages: EmailMessage[] = [];

  if (!searchData.messages) {
    return messages;
  }

  for (const msg of searchData.messages.slice(0, 300)) {
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
        body: body.substring(0, 3000),
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
  const search = 'invoice OR receipt OR subscription OR payment OR renewal OR trial OR bill OR charge';
  const url = `https://graph.microsoft.com/v1.0/me/messages?$filter=${encodeURIComponent(filter)}&$search="${encodeURIComponent(search)}"&$top=300&$select=id,from,subject,bodyPreview,receivedDateTime,toRecipients,ccRecipients`;

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
        body: (msg.bodyPreview || '').substring(0, 3000),
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

async function processEmailsWithAI(
  supabase: any,
  emails: EmailMessage[],
  connection: any,
  limitsCheck: any
): Promise<{ toolsCreated: number; toolsUpdated: number }> {
  let toolsCreated = 0;
  let toolsUpdated = 0;
  let classificationsUsed = 0;
  let extractionsUsed = 0;

  for (const email of emails) {
    if (classificationsUsed >= limitsCheck.classifications_remaining) {
      console.log('Classification limit reached, stopping scan');
      break;
    }

    try {
      const classification = await classifyEmail(email);
      classificationsUsed++;

      await new Promise(resolve => setTimeout(resolve, 100));

      await supabase.from('ai_extraction_logs').insert({
        user_id: connection.user_id,
        email_id: email.id,
        email_subject: email.subject,
        classification_confidence: classification.confidence,
        extraction_attempted: false,
      });

      if (!classification.is_tool_related || classification.confidence < 40) {
        continue;
      }

      if (extractionsUsed >= limitsCheck.extractions_remaining) {
        console.log('Extraction limit reached, stopping extraction');
        continue;
      }

      const extraction = await extractToolData(email);
      extractionsUsed++;

      await new Promise(resolve => setTimeout(resolve, 100));

      const validated = validateExtraction(extraction, email);

      await supabase.from('ai_extraction_logs').insert({
        user_id: connection.user_id,
        email_id: email.id,
        email_subject: email.subject,
        classification_confidence: classification.confidence,
        extraction_attempted: true,
        extraction_success: !!validated,
        validation_passed: !!validated,
        failure_reason: validated ? null : 'Validation failed',
      });

      if (!validated) {
        continue;
      }

      const { created, updated } = await upsertTool(supabase, validated, connection, email);
      if (created) toolsCreated++;
      if (updated) toolsUpdated++;

    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error);

      await supabase.from('ai_extraction_logs').insert({
        user_id: connection.user_id,
        email_id: email.id,
        email_subject: email.subject,
        extraction_attempted: false,
        extraction_success: false,
        validation_passed: false,
        failure_reason: error.message,
      });
    }
  }

  await supabase.rpc('increment_scan_counters', {
    p_user_id: connection.user_id,
    p_emails: emails.length,
    p_classifications: classificationsUsed,
    p_extractions: extractionsUsed,
  });

  return { toolsCreated, toolsUpdated };
}

async function classifyEmail(email: EmailMessage): Promise<ClassificationResult> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Analyze if this email is about a SaaS tool, software subscription, or recurring service charge.

Email Subject: ${email.subject}
From: ${email.sender}
Body Preview: ${email.body.substring(0, 1000)}

EXCLUDE:
- Food delivery (DoorDash, Uber Eats, etc.)
- Travel bookings (flights, hotels)
- One-time purchases
- Refund emails without future charges
- Marketing newsletters
- E-commerce receipts

Respond with JSON only:
{
  "is_tool_related": boolean,
  "confidence": number (0-100),
  "reason": "brief explanation"
}`;

  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a precise classifier. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 150,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '{}';

        try {
          return JSON.parse(content);
        } catch {
          return { is_tool_related: false, confidence: 0, reason: 'Parse error' };
        }
      }

      if (response.status === 429) {
        lastError = new Error('OpenAI API rate limit exceeded');
        continue;
      }

      throw new Error(`OpenAI API error: ${response.statusText}`);
    } catch (error) {
      lastError = error;
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

async function extractToolData(email: EmailMessage): Promise<ExtractionResult> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  const prompt = `Extract subscription/tool information from this email.

Email Subject: ${email.subject}
From: ${email.sender}
Body: ${email.body}

Extract the following. Use null for unknown values. NEVER guess or invent:

{
  "vendor_name": string or null (company name),
  "amount": number or null (price only, no currency symbols),
  "currency": string or null (USD, EUR, etc.),
  "billing_cycle": "monthly" | "yearly" | "trial" | null,
  "renewal_date": string or null (YYYY-MM-DD format),
  "is_trial": boolean (true only if explicitly mentioned),
  "is_cancellation": boolean (true only if subscription ended),
  "confidence": number (0-100),
  "reason": "brief explanation of what was detected"
}

Be conservative. If unsure, use null.`;

  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a precise data extractor. Respond only with valid JSON. Never invent information.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0,
          max_tokens: 300,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content || '{}';

        try {
          return JSON.parse(content);
        } catch {
          return {
            vendor_name: null,
            amount: null,
            currency: null,
            billing_cycle: null,
            renewal_date: null,
            is_trial: false,
            is_cancellation: false,
            confidence: 0,
            reason: 'Parse error',
          };
        }
      }

      if (response.status === 429) {
        lastError = new Error('OpenAI API rate limit exceeded');
        continue;
      }

      throw new Error(`OpenAI API error: ${response.statusText}`);
    } catch (error) {
      lastError = error;
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

function validateExtraction(extraction: ExtractionResult, email: EmailMessage): ExtractionResult | null {
  if (!extraction.vendor_name) {
    return null;
  }

  if (extraction.confidence < 40) {
    return null;
  }

  if (!extraction.is_trial && !extraction.amount && !extraction.renewal_date) {
    return null;
  }

  if (extraction.amount && (extraction.amount < 0 || extraction.amount > 100000)) {
    return null;
  }

  if (extraction.renewal_date) {
    const renewalDate = new Date(extraction.renewal_date);
    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (isNaN(renewalDate.getTime()) || renewalDate < now || renewalDate > oneYearFromNow) {
      extraction.renewal_date = null;
    }
  }

  if (extraction.currency && !/^[A-Z]{3}$/.test(extraction.currency)) {
    extraction.currency = 'USD';
  }

  return extraction;
}

async function upsertTool(
  supabase: any,
  extraction: ExtractionResult,
  connection: any,
  email: EmailMessage
): Promise<{ created: boolean; updated: boolean }> {
  const normalizedVendor = extraction.vendor_name!.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const { data: existing } = await supabase
    .from('detected_tools')
    .select('*')
    .eq('organization_id', connection.organization_id)
    .eq('normalized_vendor', normalizedVendor)
    .maybeSingle();

  if (existing) {
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (extraction.amount) {
      updates.last_charge_amount = extraction.amount;
      updates.last_charge_date = email.date.split('T')[0];
    }

    if (extraction.billing_cycle) {
      updates.billing_frequency = extraction.billing_cycle;
    }

    if (extraction.renewal_date) {
      updates.estimated_renewal_date = extraction.renewal_date;
    }

    if (extraction.is_cancellation) {
      updates.status = 'cancelled';
    } else if (extraction.is_trial) {
      updates.status = 'trial';
    } else if (existing.status !== 'cancelled') {
      updates.status = 'active';
      updates.renewal_count = existing.renewal_count + 1;
    }

    await supabase
      .from('detected_tools')
      .update(updates)
      .eq('id', existing.id);

    return { created: false, updated: true };
  } else {
    await supabase
      .from('detected_tools')
      .insert({
        organization_id: connection.organization_id,
        vendor_name: extraction.vendor_name,
        normalized_vendor: normalizedVendor,
        last_charge_amount: extraction.amount,
        last_charge_date: extraction.amount ? email.date.split('T')[0] : null,
        billing_frequency: extraction.billing_cycle || 'unknown',
        estimated_renewal_date: extraction.renewal_date,
        first_seen_date: email.date.split('T')[0],
        source_email_connection_id: connection.id,
        source_email_id: email.id,
        source_email_subject: email.subject,
        source_email_sender: email.sender,
        confidence_score: extraction.confidence,
        ai_confidence: extraction.confidence,
        detection_reason: extraction.reason,
        inferred_owner_id: connection.user_id,
        status: extraction.is_trial ? 'trial' : extraction.is_cancellation ? 'cancelled' : 'active',
      });

    return { created: true, updated: false };
  }
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
