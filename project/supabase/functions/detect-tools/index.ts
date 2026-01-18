import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    const { data: events, error: fetchError } = await supabase
      .from('parsed_events')
      .select(`
        id,
        vendor_name,
        amount,
        billing_cycle,
        event_type,
        detected_renewal_date,
        confidence_score,
        raw_email:raw_emails!inner(
          inbound_mailbox:inbound_mailboxes!inner(
            organization_id
          )
        )
      `)
      .gte('confidence_score', 50)
      .not('id', 'in', supabase.from('tools').select('last_event_id').not('last_event_id', 'is', null))
      .order('created_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      console.error('Failed to fetch events:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No events to process', processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let toolsCreated = 0;
    let toolsUpdated = 0;
    let renewalsCreated = 0;

    for (const event of events) {
      const orgId = event.raw_email?.inbound_mailbox?.organization_id;
      if (!orgId) {
        console.error('No organization ID for event:', event.id);
        continue;
      }

      const { data: existingTool, error: toolError } = await supabase
        .from('tools')
        .select('id, status')
        .eq('organization_id', orgId)
        .eq('vendor_name', event.vendor_name)
        .maybeSingle();

      if (toolError) {
        console.error('Error checking for existing tool:', toolError);
        continue;
      }

      if (existingTool) {
        const updates: any = {
          last_event_id: event.id,
          updated_at: new Date().toISOString(),
        };

        if (event.amount && event.amount > 0) {
          updates.current_amount = event.amount;
        }

        if (event.billing_cycle !== 'unknown') {
          updates.billing_cycle = event.billing_cycle;
        }

        if (event.event_type === 'cancellation') {
          updates.status = 'cancelled';
        } else if (event.event_type === 'trial_start') {
          updates.status = 'trial';
        } else if (existingTool.status !== 'cancelled') {
          updates.status = 'active';
        }

        const { error: updateError } = await supabase
          .from('tools')
          .update(updates)
          .eq('id', existingTool.id);

        if (updateError) {
          console.error('Failed to update tool:', updateError);
        } else {
          toolsUpdated++;
        }

        if (event.detected_renewal_date && event.amount && event.amount > 0) {
          const { error: renewalError } = await supabase
            .from('renewals')
            .insert({
              tool_id: existingTool.id,
              renewal_date: event.detected_renewal_date,
              amount: event.amount,
              source_event_id: event.id,
            });

          if (!renewalError) {
            renewalsCreated++;
          }
        }
      } else {
        const toolStatus = 
          event.event_type === 'trial_start' ? 'trial' :
          event.event_type === 'cancellation' ? 'cancelled' :
          'active';

        const { data: newTool, error: createError } = await supabase
          .from('tools')
          .insert({
            organization_id: orgId,
            vendor_name: event.vendor_name,
            current_amount: event.amount,
            billing_cycle: event.billing_cycle,
            status: toolStatus,
            last_event_id: event.id,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Failed to create tool:', createError);
        } else {
          toolsCreated++;

          if (event.detected_renewal_date && event.amount && event.amount > 0) {
            const { error: renewalError } = await supabase
              .from('renewals')
              .insert({
                tool_id: newTool.id,
                renewal_date: event.detected_renewal_date,
                amount: event.amount,
                source_event_id: event.id,
              });

            if (!renewalError) {
              renewalsCreated++;
            }
          }
        }
      }
    }

    console.log(`Created ${toolsCreated} tools, updated ${toolsUpdated} tools, created ${renewalsCreated} renewals`);

    return new Response(
      JSON.stringify({
        message: 'Tool detection complete',
        toolsCreated,
        toolsUpdated,
        renewalsCreated,
        eventsProcessed: events.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Tool detection error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});