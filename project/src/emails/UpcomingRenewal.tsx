interface UpcomingRenewalProps {
  toolName: string;
  amount: string;
  renewalDate: string;
  daysUntilRenewal: number;
  owner?: string;
  dashboardUrl: string;
}

export default function UpcomingRenewal({
  toolName,
  amount,
  renewalDate,
  daysUntilRenewal,
  owner,
  dashboardUrl,
}: UpcomingRenewalProps) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>
          Unspendify
        </h1>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          {toolName} renews in {daysUntilRenewal} days
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', margin: '0', lineHeight: '1.6' }}>
          This subscription will automatically renew on {renewalDate}.
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
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Amount</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{amount}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Renewal date</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{renewalDate}</td>
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
          {owner ? `Reach out to ${owner} if you need to cancel or modify this subscription.` : 'Consider assigning an owner to this subscription.'}
        </p>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0', lineHeight: '1.5' }}>
          You'll receive another reminder 7 days before renewal.
        </p>
      </div>
    </div>
  );
}

export function generateUpcomingRenewalHTML(props: UpcomingRenewalProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.toolName} renews in ${props.daysUntilRenewal} days</title>
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
        ${props.toolName} renews in ${props.daysUntilRenewal} days
      </h2>
      <p style="font-size: 15px; color: #64748b; margin: 0; line-height: 1.6;">
        This subscription will automatically renew on ${props.renewalDate}.
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
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Amount</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Renewal date</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.renewalDate}</td>
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
        ${props.owner ? `Reach out to ${props.owner} if you need to cancel or modify this subscription.` : 'Consider assigning an owner to this subscription.'}
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;">
        You'll receive another reminder 7 days before renewal.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
