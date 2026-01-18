# Email Templates

Minimal, text-forward email templates for Unspendify notifications.

## Templates

### 1. New Subscription Detected
Sent when a new subscription is found in forwarded emails.

```typescript
import { generateNewSubscriptionDetectedHTML } from './NewSubscriptionDetected';

const html = generateNewSubscriptionDetectedHTML({
  toolName: 'Slack',
  amount: '$12.50',
  billingCycle: 'Monthly',
  nextRenewal: 'March 15, 2024',
  dashboardUrl: 'https://app.unspendify.com/subscriptions/123',
});
```

### 2. Upcoming Renewal
Sent 30, 14, and 7 days before a subscription renews.

```typescript
import { generateUpcomingRenewalHTML } from './UpcomingRenewal';

const html = generateUpcomingRenewalHTML({
  toolName: 'Notion',
  amount: '$96.00',
  renewalDate: 'April 1, 2024',
  daysUntilRenewal: 14,
  owner: 'Sarah Chen',
  dashboardUrl: 'https://app.unspendify.com/subscriptions/456',
});
```

### 3. Trial Ending
Sent when a free trial is about to convert to paid.

```typescript
import { generateTrialEndingHTML } from './TrialEnding';

const html = generateTrialEndingHTML({
  toolName: 'Figma',
  trialEndDate: 'March 20, 2024',
  daysUntilEnd: 5,
  paidAmount: '$45.00',
  billingCycle: 'Monthly',
  owner: 'Design Team',
  dashboardUrl: 'https://app.unspendify.com/subscriptions/789',
});
```

### 4. Weekly Ops Digest
Sent every Monday morning with a summary of subscription activity.

```typescript
import { generateWeeklyOpsDigestHTML } from './WeeklyOpsDigest';

const html = generateWeeklyOpsDigestHTML({
  weekStart: 'Dec 16',
  weekEnd: 'Dec 22',
  newSubscriptions: [
    { toolName: 'Slack', amount: '$12.50', billingCycle: 'Monthly' },
    { toolName: 'GitHub', amount: '$21.00', billingCycle: 'Monthly' },
  ],
  upcomingRenewals: [
    { toolName: 'Notion', amount: '$96.00', renewalDate: 'Jan 5', daysUntilRenewal: 14 },
  ],
  trialEnding: [
    { toolName: 'Figma', amount: '$45.00', renewalDate: 'Dec 28', daysUntilRenewal: 6 },
  ],
  totalMonthlySpend: '$2,847',
  totalAnnualSpend: '$34,164',
  dashboardUrl: 'https://app.unspendify.com/dashboard',
});
```

## Design Principles

- **Minimal formatting**: No images, no complex layouts
- **Text-forward**: Content hierarchy through typography only
- **Clear CTA**: Single, obvious action button
- **Inline styles**: All CSS inlined for email client compatibility
- **Responsive**: Works on mobile and desktop
- **Accessible**: Good contrast, readable font sizes

## Styling

- Slate color palette (matching website)
- System font stack
- 14-15px body text
- 20px headlines
- 8px spacing grid
- Subtle borders and backgrounds
