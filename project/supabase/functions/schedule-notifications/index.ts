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

    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: upcomingRenewals, error: renewalsError } = await supabase
      .from('renewals')
      .select(`
        id,
        renewal_date,
        amount,
        tool:tools!inner(
          id,
          vendor_name,
          organization_id,
          status,
          tool_ownership(
            owner_user_id
          )
        )
      `)
      .gte('renewal_date', now.toISOString().split('T')[0])
      .lte('renewal_date', thirtyDaysOut.toISOString().split('T')[0])
      .eq('tool.status', 'active');

    if (renewalsError) {
      console.error('Failed to fetch renewals:', renewalsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch renewals' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let notificationsCreated = 0;

    for (const renewal of upcomingRenewals || []) {
      const renewalDate = new Date(renewal.renewal_date);
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      const alertDays = [30, 14, 7, 3, 1];
      const shouldAlert = alertDays.includes(daysUntilRenewal);

      if (!shouldAlert) {
        continue;
      }

      const tool = renewal.tool;
      const orgId = tool.organization_id;
      const toolId = tool.id;
      const ownerId = tool.tool_ownership?.[0]?.owner_user_id;

      const { data: admins, error: adminsError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('role', 'admin');

      if (adminsError) {
        console.error('Failed to fetch admins:', adminsError);
        continue;
      }

      const recipientIds = new Set<string>();

      for (const admin of admins || []) {
        recipientIds.add(admin.user_id);
      }

      if (ownerId) {
        recipientIds.add(ownerId);
      }

      const { data: memberPrefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('receive_renewal_alerts', true);

      if (!prefsError && memberPrefs) {
        for (const pref of memberPrefs) {
          recipientIds.add(pref.user_id);
        }
      }

      const scheduledFor = new Date(renewalDate.getTime() - daysUntilRenewal * 24 * 60 * 60 * 1000);

      for (const userId of recipientIds) {
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('organization_id', orgId)
          .eq('tool_id', toolId)
          .eq('user_id', userId)
          .eq('type', 'renewal_alert')
          .gte('scheduled_for', now.toISOString())
          .maybeSingle();

        if (!existing) {
          const { error: insertError } = await supabase
            .from('notifications')
            .insert({
              organization_id: orgId,
              tool_id: toolId,
              user_id: userId,
              type: 'renewal_alert',
              scheduled_for: scheduledFor.toISOString(),
              status: 'pending',
            });

          if (!insertError) {
            notificationsCreated++;
          }
        }
      }
    }

    const { data: trialTools, error: trialsError } = await supabase
      .from('tools')
      .select(`
        id,
        vendor_name,
        organization_id,
        first_detected_at,
        tool_ownership(
          owner_user_id
        )
      `)
      .eq('status', 'trial');

    if (!trialsError && trialTools) {
      for (const tool of trialTools) {
        const trialStart = new Date(tool.first_detected_at);
        const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
        const daysUntilEnd = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        if (daysUntilEnd === 3 || daysUntilEnd === 1) {
          const { data: admins } = await supabase
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', tool.organization_id)
            .eq('role', 'admin');

          const recipientIds = new Set<string>();
          for (const admin of admins || []) {
            recipientIds.add(admin.user_id);
          }

          if (tool.tool_ownership?.[0]?.owner_user_id) {
            recipientIds.add(tool.tool_ownership[0].owner_user_id);
          }

          for (const userId of recipientIds) {
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('tool_id', tool.id)
              .eq('user_id', userId)
              .eq('type', 'trial_alert')
              .gte('scheduled_for', now.toISOString())
              .maybeSingle();

            if (!existing) {
              const { error: insertError } = await supabase
                .from('notifications')
                .insert({
                  organization_id: tool.organization_id,
                  tool_id: tool.id,
                  user_id: userId,
                  type: 'trial_alert',
                  scheduled_for: now.toISOString(),
                  status: 'pending',
                });

              if (!insertError) {
                notificationsCreated++;
              }
            }
          }
        }
      }
    }

    console.log(`Created ${notificationsCreated} notifications`);

    return new Response(
      JSON.stringify({
        message: 'Notification scheduling complete',
        notificationsCreated,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Notification scheduling error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});