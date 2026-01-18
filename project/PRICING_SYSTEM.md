# Unspendify Pricing System

## Overview

A complete tool-based pricing system has been implemented with Stripe integration. The system follows Unspendify's core philosophy: pricing by tools tracked, not users.

## Plans

### Free - See the problem
- **Price**: $0
- **Tool limit**: 5 tools
- **Inbox limit**: 1 inbox
- **Historical scan**: 3 months
- **Purpose**: Discovery + "oh shit" moment

### Starter - Stop the obvious leaks
- **Price**: $19/month
- **Tool limit**: 15 tools
- **Inbox limit**: 2 inboxes
- **Historical scan**: 12 months
- **Target**: 5-10 person startups

### Growth - Never get surprised again
- **Price**: $49/month
- **Tool limit**: 50 tools
- **Inbox limit**: Unlimited
- **Historical scan**: 24 months
- **Purpose**: Comprehensive tracking

## What Was Implemented

### 1. Database Schema
- `plans` table with 3 plans (free, starter, growth)
- `billing_subscriptions` table to track organization subscriptions
- Automatic free plan assignment for new organizations
- RLS policies for security

### 2. Stripe Integration
Three edge functions deployed:

**`stripe-checkout`**
- Creates Stripe Checkout sessions for upgrades
- Handles plan selection and pricing
- Returns checkout URL to redirect users

**`stripe-webhooks`**
- Processes Stripe webhook events
- Handles: checkout completion, subscription updates, cancellations, payment failures
- Updates billing_subscriptions table automatically

**`stripe-portal`**
- Creates Stripe Customer Portal sessions
- Allows users to manage payment methods, cancel subscriptions, etc.

### 3. Frontend Components

**Billing Page** (`/app/billing`)
- Displays current plan and pricing
- Shows all available plans with features
- Upgrade buttons that redirect to Stripe Checkout
- "Manage Billing" button for existing customers

**Updated Pricing Page** (`/pricing`)
- Fetches real plan data from database
- Dynamic pricing display
- Smart CTAs (signup for new users, billing for logged-in users)

**Upgrade Prompt Component**
- Reusable modal for plan limit scenarios
- Can be triggered when users hit tool limits
- Direct upgrade flow

**Billing Utilities** (`src/lib/billing.ts`)
- Helper functions for API calls
- Type definitions
- Price formatting

### 4. Enhanced Auth Context
- Added `organizationId` to auth context
- Automatically fetched for logged-in users
- Used throughout billing flow

## Required Configuration

### Stripe Setup

1. **Create a Stripe Account**
   - Sign up at https://stripe.com

2. **Get API Keys**
   - Go to Developers → API Keys
   - Copy your Secret Key
   - Copy your Publishable Key (for future frontend use)

3. **Configure Webhook**
   - Go to Developers → Webhooks
   - Add endpoint: `https://[your-project].supabase.co/functions/v1/stripe-webhooks`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the Webhook Secret

4. **Set Environment Variables**
   You'll need to configure these Stripe secrets:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Your webhook signing secret
   - `APP_URL` - Your frontend URL (e.g., `https://yourdomain.com`)

5. **Enable Customer Portal**
   - Go to Settings → Billing → Customer Portal
   - Enable the customer portal
   - Configure allowed actions (cancel subscription, update payment method, etc.)

## How It Works

### For Users

1. **Start on Free Plan**
   - All new organizations automatically get the Free plan (5 tools)
   - No credit card required

2. **Hit Limits**
   - When detecting more than 5 tools, upgrades can be prompted
   - Tool limits apply to visibility and alerts, NOT detection
   - Detection continues regardless of plan

3. **Upgrade Flow**
   - User clicks "Upgrade" on Billing page
   - Redirected to Stripe Checkout
   - Completes payment
   - Webhook updates subscription in database
   - User redirected back with success message

4. **Manage Subscription**
   - Click "Manage Billing" button
   - Redirected to Stripe Customer Portal
   - Can update payment method, cancel subscription, etc.
   - Changes synced via webhooks

### Tool Limit Enforcement

**Important**: Limits are SOFT, not HARD
- Unspendify ALWAYS detects and scans all tools
- Limits only apply to:
  - Visibility in dashboard
  - Alert generation
  - Action capabilities

Tools beyond the limit are marked but not hidden from detection. This ensures memory remains complete.

## Usage Examples

### Show Upgrade Prompt
```typescript
import UpgradePrompt from '../components/UpgradePrompt';

// In your component
const [showUpgrade, setShowUpgrade] = useState(false);

// Trigger when limit reached
if (toolCount > planLimit) {
  setShowUpgrade(true);
}

// Render
{showUpgrade && (
  <UpgradePrompt
    reason="We've detected more tools than your plan tracks."
    toolCount={toolCount}
    planLimit={planLimit}
    onClose={() => setShowUpgrade(false)}
  />
)}
```

### Get Current Subscription
```typescript
import { getCurrentSubscription } from '../lib/billing';

const subscription = await getCurrentSubscription(organizationId);
console.log(subscription.plan_id); // 'free', 'starter', or 'growth'
```

### Create Checkout Session
```typescript
import { createCheckoutSession } from '../lib/billing';

const url = await createCheckoutSession('starter');
window.location.href = url;
```

## Routes

- `/app/billing` - Billing management page (protected)
- `/pricing` - Public pricing page
- `/app/settings` - Settings (can link to billing from here)

## Key Files

- `/src/pages/Billing.tsx` - Main billing page
- `/src/components/UpgradePrompt.tsx` - Upgrade modal
- `/src/lib/billing.ts` - Billing utilities
- `/supabase/functions/stripe-checkout/` - Checkout function
- `/supabase/functions/stripe-webhooks/` - Webhook handler
- `/supabase/functions/stripe-portal/` - Portal function

## Testing

### Test Mode
- Use Stripe test mode keys during development
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

### Webhook Testing
- Use Stripe CLI for local webhook testing:
  ```bash
  stripe listen --forward-to localhost:54321/functions/v1/stripe-webhooks
  ```

## Next Steps

1. Configure Stripe secrets in Supabase
2. Test the upgrade flow in development
3. Test webhook handling
4. Add upgrade prompts to relevant pages (Tools, Dashboard, etc.)
5. Consider adding:
   - Usage tracking/analytics
   - Email notifications for billing events
   - Plan usage warnings before hitting limits
   - Annual billing options

## Philosophy Alignment

This pricing system maintains Unspendify's core principles:

✅ **Passive memory** - Detection never stops, regardless of plan
✅ **Tool-based pricing** - Scales with complexity, not team size
✅ **Interruption-based** - Upgrades prompted only when needed
✅ **No hard blocks** - Limits are soft boundaries, not walls
✅ **Simple, calm messaging** - No aggressive sales tactics

The system feels like relief, not negotiation.
