import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NotificationData {
  id: string;
  type: string;
  user_id: string;
  tool_id?: string;
  tool?: {
    vendor_name: string;
    current_amount?: number;
    billing_cycle?: string;
  };
  renewals?: {
    renewal_date: string;
    amount: number;
  }[];
  user?: {
    email: string;
  };
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Unspendify <noreply@unspendify.com>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

function generateRenewalEmail(
  notification: NotificationData,
  appUrl: string
): { subject: string; html: string } {
  const tool = notification.tool;
  const renewal = notification.renewals?.[0];
  
  if (!tool || !renewal) {
    return {
      subject: 'Subscription Renewal Reminder',
      html: '<p>You have an upcoming subscription renewal.</p>',
    };
  }

  const renewalDate = new Date(renewal.renewal_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const amount = renewal.amount.toFixed(2);

  return {
    subject: `${tool.vendor_name} renews on ${renewalDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .tool-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
          .date { font-size: 18px; color: #6b7280; }
          .cta { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Upcoming Renewal</h1>
          </div>
          <div class="content">
            <div class="tool-name">${tool.vendor_name}</div>
            <div class="amount">$${amount}</div>
            <div class="date">Renews on ${renewalDate}</div>
            <p>Your subscription will automatically renew soon. Review your subscription in the dashboard.</p>
            <a href="${appUrl}/dashboard" class="cta">View Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

function generateTrialEmail(
  notification: NotificationData,
  appUrl: string
): { subject: string; html: string } {
  const tool = notification.tool;
  
  if (!tool) {
    return {
      subject: 'Trial Ending Soon',
      html: '<p>Your trial is ending soon.</p>',
    };
  }

  return {
    subject: `${tool.vendor_name} trial ending soon`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .tool-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .warning { color: #ef4444; font-size: 18px; margin: 20px 0; }
          .cta { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Trial Ending Soon</h1>
          </div>
          <div class="content">
            <div class="tool-name">${tool.vendor_name}</div>
            <div class="warning">Your trial period is ending soon and will convert to a paid subscription.</div>
            <p>Take action now if you want to cancel or modify your subscription.</p>
            <a href="${appUrl}/dashboard" class="cta">Manage Subscription</a>
          </div>
        </div>
      </body>
      </html>
    `,
  };
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

    const appUrl = Deno.env.get('APP_URL') || 'https://unspendify.io';
    const now = new Date().toISOString();

    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        user_id,
        tool_id,
        tool:tools(
          vendor_name,
          current_amount,
          billing_cycle
        ),
        renewals!tool_id(
          renewal_date,
          amount
        ),
        user:users!user_id(
          email
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50);

    if (fetchError) {
      console.error('Failed to fetch notifications:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notifications' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No notifications to send', sent: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const notification of notifications as NotificationData[]) {
      const userEmail = notification.user?.email;
      if (!userEmail) {
        console.error('No email for user:', notification.user_id);
        failed++;
        continue;
      }

      let emailData: { subject: string; html: string };

      if (notification.type === 'renewal_alert') {
        emailData = generateRenewalEmail(notification, appUrl);
      } else if (notification.type === 'trial_alert') {
        emailData = generateTrialEmail(notification, appUrl);
      } else {
        console.log('Unknown notification type:', notification.type);
        failed++;
        continue;
      }

      const success = await sendEmail(userEmail, emailData.subject, emailData.html);

      if (success) {
        await supabase
          .from('notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', notification.id);
        sent++;
      } else {
        await supabase
          .from('notifications')
          .update({ status: 'failed' })
          .eq('id', notification.id);
        failed++;
      }
    }

    console.log(`Sent ${sent} notifications, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Notification sending complete',
        sent,
        failed,
        total: notifications.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Notification sending error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});