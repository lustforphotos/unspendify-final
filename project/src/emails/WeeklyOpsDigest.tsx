interface Subscription {
  toolName: string;
  amount: string;
  renewalDate: string;
  daysUntilRenewal: number;
}

interface WeeklyOpsDigestProps {
  weekStart: string;
  weekEnd: string;
  newSubscriptions: Array<{ toolName: string; amount: string; billingCycle: string }>;
  upcomingRenewals: Subscription[];
  trialEnding: Subscription[];
  totalMonthlySpend: string;
  totalAnnualSpend: string;
  dashboardUrl: string;
}

export default function WeeklyOpsDigest({
  weekStart,
  weekEnd,
  newSubscriptions,
  upcomingRenewals,
  trialEnding,
  totalMonthlySpend,
  totalAnnualSpend,
  dashboardUrl,
}: WeeklyOpsDigestProps) {
  const hasActivity = newSubscriptions.length > 0 || upcomingRenewals.length > 0 || trialEnding.length > 0;

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>
          Unspendify
        </h1>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          Weekly digest: {weekStart} – {weekEnd}
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', margin: '0', lineHeight: '1.6' }}>
          {hasActivity ? 'Here is what happened with your subscriptions this week.' : 'No new activity this week.'}
        </p>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Monthly spend</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{totalMonthlySpend}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Annual spend</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{totalAnnualSpend}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {newSubscriptions.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>
            New subscriptions ({newSubscriptions.length})
          </h3>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            {newSubscriptions.map((sub, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  borderBottom: index < newSubscriptions.length - 1 ? '1px solid #e2e8f0' : 'none',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '4px' }}>
                  {sub.toolName}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {sub.amount} / {sub.billingCycle}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingRenewals.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>
            Upcoming renewals ({upcomingRenewals.length})
          </h3>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            {upcomingRenewals.map((sub, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  borderBottom: index < upcomingRenewals.length - 1 ? '1px solid #e2e8f0' : 'none',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '4px' }}>
                  {sub.toolName}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {sub.amount} • Renews in {sub.daysUntilRenewal} days ({sub.renewalDate})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trialEnding.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>
            Trials ending soon ({trialEnding.length})
          </h3>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            {trialEnding.map((sub, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  borderBottom: index < trialEnding.length - 1 ? '1px solid #e2e8f0' : 'none',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '4px' }}>
                  {sub.toolName}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Trial ends in {sub.daysUntilRenewal} days • Then {sub.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <a
          href={dashboardUrl}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff',
            backgroundColor: '#0f172a',
            textDecoration: 'none',
            borderRadius: '8px',
          }}
        >
          View dashboard
        </a>
      </div>

      <div style={{ paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: '1.5' }}>
          You receive this digest every Monday at 9am.
        </p>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0', lineHeight: '1.5' }}>
          You can adjust notification preferences in your account settings.
        </p>
      </div>
    </div>
  );
}

export function generateWeeklyOpsDigestHTML(props: WeeklyOpsDigestProps): string {
  const hasActivity = props.newSubscriptions.length > 0 || props.upcomingRenewals.length > 0 || props.trialEnding.length > 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly digest: ${props.weekStart} – ${props.weekEnd}</title>
</head>
<body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif;">
  <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="margin-bottom: 32px;">
      <h1 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">
        Unspendify
      </h1>
    </div>

    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0; line-height: 1.4;">
        Weekly digest: ${props.weekStart} – ${props.weekEnd}
      </h2>
      <p style="font-size: 15px; color: #64748b; margin: 0; line-height: 1.6;">
        ${hasActivity ? 'Here is what happened with your subscriptions this week.' : 'No new activity this week.'}
      </p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Monthly spend</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.totalMonthlySpend}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Annual spend</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.totalAnnualSpend}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${props.newSubscriptions.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0;">
        New subscriptions (${props.newSubscriptions.length})
      </h3>
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        ${props.newSubscriptions.map((sub, index) => `
        <div style="padding: 16px; ${index < props.newSubscriptions.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
          <div style="font-size: 14px; font-weight: 500; color: #0f172a; margin-bottom: 4px;">
            ${sub.toolName}
          </div>
          <div style="font-size: 13px; color: #64748b;">
            ${sub.amount} / ${sub.billingCycle}
          </div>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${props.upcomingRenewals.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0;">
        Upcoming renewals (${props.upcomingRenewals.length})
      </h3>
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        ${props.upcomingRenewals.map((sub, index) => `
        <div style="padding: 16px; ${index < props.upcomingRenewals.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
          <div style="font-size: 14px; font-weight: 500; color: #0f172a; margin-bottom: 4px;">
            ${sub.toolName}
          </div>
          <div style="font-size: 13px; color: #64748b;">
            ${sub.amount} • Renews in ${sub.daysUntilRenewal} days (${sub.renewalDate})
          </div>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${props.trialEnding.length > 0 ? `
    <div style="margin-bottom: 32px;">
      <h3 style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0;">
        Trials ending soon (${props.trialEnding.length})
      </h3>
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        ${props.trialEnding.map((sub, index) => `
        <div style="padding: 16px; ${index < props.trialEnding.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
          <div style="font-size: 14px; font-weight: 500; color: #0f172a; margin-bottom: 4px;">
            ${sub.toolName}
          </div>
          <div style="font-size: 13px; color: #64748b;">
            Trial ends in ${sub.daysUntilRenewal} days • Then ${sub.amount}
          </div>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div style="margin-bottom: 32px;">
      <a
        href="${props.dashboardUrl}"
        style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 500; color: #ffffff; background-color: #0f172a; text-decoration: none; border-radius: 8px;"
      >
        View dashboard
      </a>
    </div>

    <div style="padding-top: 32px; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 13px; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.5;">
        You receive this digest every Monday at 9am.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;">
        You can adjust notification preferences in your account settings.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
