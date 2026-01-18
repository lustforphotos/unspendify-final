interface NewSubscriptionDetectedProps {
  toolName: string;
  amount: string;
  billingCycle: string;
  nextRenewal: string;
  dashboardUrl: string;
}

export default function NewSubscriptionDetected({
  toolName,
  amount,
  billingCycle,
  nextRenewal,
  dashboardUrl,
}: NewSubscriptionDetectedProps) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>
          Unspendify
        </h1>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          New subscription detected: {toolName}
        </h2>
        <p style={{ fontSize: '15px', color: '#64748b', margin: '0', lineHeight: '1.6' }}>
          We found a new subscription in your invoice emails.
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
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Cost</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{amount}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Billing</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{billingCycle}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b' }}>Next renewal</td>
              <td style={{ padding: '8px 0', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{nextRenewal}</td>
            </tr>
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
          View in dashboard
        </a>
      </div>

      <div style={{ paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: '1.5' }}>
          You can assign an owner or add notes in your dashboard.
        </p>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0', lineHeight: '1.5' }}>
          If this isn't your subscription, you can archive it.
        </p>
      </div>
    </div>
  );
}

export function generateNewSubscriptionDetectedHTML(props: NewSubscriptionDetectedProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New subscription detected: ${props.toolName}</title>
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
        New subscription detected: ${props.toolName}
      </h2>
      <p style="font-size: 15px; color: #64748b; margin: 0; line-height: 1.6;">
        We found a new subscription in your invoice emails.
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
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Cost</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Billing</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.billingCycle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #64748b;">Next renewal</td>
            <td style="padding: 8px 0; font-size: 14px; color: #0f172a; text-align: right; font-weight: 500;">${props.nextRenewal}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-bottom: 32px;">
      <a
        href="${props.dashboardUrl}"
        style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 500; color: #ffffff; background-color: #0f172a; text-decoration: none; border-radius: 8px;"
      >
        View in dashboard
      </a>
    </div>

    <div style="padding-top: 32px; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 13px; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.5;">
        You can assign an owner or add notes in your dashboard.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;">
        If this isn't your subscription, you can archive it.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
