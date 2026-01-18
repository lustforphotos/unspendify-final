interface TrialEndingProps {
  toolName: string;
  trialEndDate: string;
  daysUntilEnd: number;
  paidAmount: string;
  billingCycle: string;
  owner?: string;
  dashboardUrl: string;
}

export default function TrialEnding({
  toolName,
  trialEndDate,
  daysUntilEnd,
  paidAmount,
  billingCycle,
  owner,
  dashboardUrl,
}: TrialEndingProps) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>
          Unspendify
        </h1>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          {toolName} trial ends in {daysUntilEnd} days
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', margin: '0', lineHeight: '1.6' }}>
          The free trial ends on {trialEndDate}. After that, it converts to a paid subscription.
        </p>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Tool</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{toolName}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Trial ends</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{trialEndDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Paid cost</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{paidAmount}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Billing</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{billingCycle}</td>
            </tr>
            {owner && (
              <tr>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Owner</td>
                <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{owner}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
          Review subscription
        </a>
      </div>

      <div style={{ paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: '1.5' }}>
          {owner ? `Contact ${owner} if you need to cancel before the trial ends.` : 'Consider assigning an owner to track who is responsible for this tool.'}
        </p>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0', lineHeight: '1.5' }}>
          If you do not cancel, you will be charged {paidAmount} on {trialEndDate}.
        </p>
      </div>
    </div>
  );
}

export function generateTrialEndingHTML(props: TrialEndingProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.toolName} trial ends in ${props.daysUntilEnd} days</title>
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
        ${props.toolName} trial ends in ${props.daysUntilEnd} days
      </h2>
      <p style="font-size: 15px; color: #64748b; margin: 0; line-height: 1.6;">
        The free trial ends on ${props.trialEndDate}. After that, it converts to a paid subscription.
      </p>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Tool</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.toolName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Trial ends</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.trialEndDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Paid cost</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.paidAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Billing</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.billingCycle}</td>
          </tr>
          ${props.owner ? `
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Owner</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.owner}</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>

    <div style="margin-bottom: 32px;">
      <a
        href="${props.dashboardUrl}"
        style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 500; color: #ffffff; background-color: #0f172a; text-decoration: none; border-radius: 8px;"
      >
        Review subscription
      </a>
    </div>

    <div style="padding-top: 32px; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 13px; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.5;">
        ${props.owner ? `Contact ${props.owner} if you need to cancel before the trial ends.` : 'Consider assigning an owner to track who is responsible for this tool.'}
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;">
        If you do not cancel, you will be charged ${props.paidAmount} on ${props.trialEndDate}.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
