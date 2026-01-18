import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ParsedEvent {
  vendor_name: string;
  amount?: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'unknown';
  event_type: 'trial_start' | 'renewal' | 'invoice' | 'cancellation' | 'price_change';
  detected_renewal_date?: string;
  confidence_score: number;
}

function parseEmail(subject: string, body: string, fromAddress: string): ParsedEvent | null {
  const lowerSubject = subject.toLowerCase();
  const lowerBody = body.toLowerCase();
  const combined = `${lowerSubject} ${lowerBody}`;

  const vendorName = extractVendorName(fromAddress);
  const amount = extractAmount(combined);
  const currency = extractCurrency(combined);
  const billingCycle = extractBillingCycle(combined);
  const eventType = detectEventType(combined);
  const renewalDate = extractRenewalDate(combined);

  const confidence = calculateConfidence({
    hasVendor: !!vendorName,
    hasAmount: !!amount,
    hasCycle: billingCycle !== 'unknown',
    hasDate: !!renewalDate,
  });

  if (confidence < 30) {
    return null;
  }

  return {
    vendor_name: vendorName || 'Unknown Vendor',
    amount,
    currency,
    billing_cycle: billingCycle,
    event_type: eventType,
    detected_renewal_date: renewalDate,
    confidence_score: confidence,
  };
}

function extractVendorName(fromAddress: string): string {
  const match = fromAddress.match(/@([\w-]+)\./i);
  if (match && match[1]) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  }
  return 'Unknown';
}

function extractAmount(text: string): number | undefined {
  const patterns = [
    /\$([0-9]+(?:[.,][0-9]{2})?)/,
    /([0-9]+(?:[.,][0-9]{2})?)\s*(?:usd|dollars?)/i,
    /total[:\s]+\$?([0-9]+(?:[.,][0-9]{2})?)/i,
    /amount[:\s]+\$?([0-9]+(?:[.,][0-9]{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amount = parseFloat(match[1].replace(',', ''));
      if (amount > 0 && amount < 100000) {
        return amount;
      }
    }
  }
  return undefined;
}

function extractCurrency(text: string): string {
  if (text.includes('$') || /usd/i.test(text)) return 'USD';
  if (/eur|€/i.test(text)) return 'EUR';
  if (/gbp|£/i.test(text)) return 'GBP';
  return 'USD';
}

function extractBillingCycle(text: string): 'monthly' | 'yearly' | 'unknown' {
  if (/\b(month|monthly)\b/i.test(text)) return 'monthly';
  if (/\b(year|yearly|annual|annually)\b/i.test(text)) return 'yearly';
  return 'unknown';
}

function detectEventType(text: string): 'trial_start' | 'renewal' | 'invoice' | 'cancellation' | 'price_change' {
  if (/trial|free trial|trial period/i.test(text)) return 'trial_start';
  if (/cancel|cancelled|canceled|subscription ended/i.test(text)) return 'cancellation';
  if (/price change|price update|new pricing/i.test(text)) return 'price_change';
  if (/renew|renewal|will be charged|upcoming charge/i.test(text)) return 'renewal';
  return 'invoice';
}

function extractRenewalDate(text: string): string | undefined {
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(?:renews?|renewal|next charge)\s+(?:on|date)?\s*[:\s]*([\w\s,]+\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = match[1] || match[0];
        const date = new Date(dateStr);
        if (date > new Date() && date < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        continue;
      }
    }
  }
  return undefined;
}

function calculateConfidence(factors: {
  hasVendor: boolean;
  hasAmount: boolean;
  hasCycle: boolean;
  hasDate: boolean;
}): number {
  let score = 20;
  if (factors.hasVendor) score += 20;
  if (factors.hasAmount) score += 30;
  if (factors.hasCycle) score += 15;
  if (factors.hasDate) score += 15;
  return Math.min(score, 100);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: rawEmails, error: fetchError } = await supabase
      .from('raw_emails')
      .select('id, from_address, subject, raw_body')
      .not('id', 'in', supabase.from('parsed_events').select('raw_email_id'))
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Failed to fetch emails:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch emails' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!rawEmails || rawEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No emails to process', processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const email of rawEmails) {
      const parsed = parseEmail(email.subject, email.raw_body, email.from_address);

      if (!parsed) {
        console.log(`Could not parse email ${email.id}: Low confidence`);
        failed++;
        continue;
      }

      const { error: insertError } = await supabase
        .from('parsed_events')
        .insert({
          raw_email_id: email.id,
          vendor_name: parsed.vendor_name,
          amount: parsed.amount,
          currency: parsed.currency,
          billing_cycle: parsed.billing_cycle,
          event_type: parsed.event_type,
          detected_renewal_date: parsed.detected_renewal_date,
          confidence_score: parsed.confidence_score,
        });

      if (insertError) {
        console.error(`Failed to insert parsed event for ${email.id}:`, insertError);
        failed++;
      } else {
        processed++;
      }
    }

    console.log(`Processed ${processed} emails, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Email processing complete',
        processed,
        failed,
        total: rawEmails.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Email processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});