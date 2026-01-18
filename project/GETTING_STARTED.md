# Getting Started with Unspendify

## How Unspendify Works

Unspendify automatically tracks your SaaS subscriptions by connecting directly to your Gmail or Outlook inbox and scanning for invoices and receipts. Using read-only OAuth access, Unspendify passively watches your company spend without requiring forwarding, manual entry, or ongoing setup.

---

## Step 1: Connect Your Inbox

1. Log in to your Unspendify account
2. Click **Connect Inbox** from the dashboard
3. Choose your email provider:
   - **Gmail** - Connect your Google Workspace or personal Gmail account
   - **Outlook** - Connect your Microsoft 365 or Outlook.com account
4. Authorize read-only access to your inbox
5. Unspendify will automatically scan your email history (last 12 months) for subscription emails

**What Unspendify can do:**
- Read email metadata (sender, subject, date)
- Read email content to detect invoices
- Search for subscription-related emails

**What Unspendify cannot do:**
- Send emails from your account
- Delete or modify emails
- Access anything outside your inbox

---

## Step 2: What Happens Next

Within a few minutes of connecting your inbox:

1. **Unspendify scans your email history** and automatically detects:
   - Active subscriptions
   - Recent invoices and charges
   - Renewal dates
   - Billing amounts

2. **Your dashboard populates** with all detected tools:
   - Tool name and vendor
   - Monthly/annual cost
   - Next renewal date
   - Last activity

3. **Ongoing monitoring** - Unspendify continues to watch your inbox daily:
   - Detects new subscriptions automatically
   - Updates renewal dates
   - Tracks billing changes
   - Identifies forgotten trials

---

## Step 3: Review Your Subscriptions

Once your initial scan completes:

1. Go to **Dashboard** to see all detected tools
2. Review the list of active subscriptions
3. Assign owners to tools
4. Mark tools you want to track closely
5. Check **Interruptions** for tools requiring action (e.g., trials ending, renewals without owners)

---

## Step 4: Configure Notifications (Optional)

Set up alerts so you never miss important subscription events:

1. Go to **Settings** → **Notifications**
2. Choose which alerts you want:
   - New subscription detected
   - Trial ending soon
   - Upcoming renewal (30d, 14d, 7d, 3d, 1d before)
   - Silent renewal (no recent activity)
3. Decide if you want:
   - All tools or only tools you own
   - Weekly digest emails

---

## Understanding Your Dashboard

### Tools
- **Active** - Currently billing
- **Trial** - Free trial period
- **Cancelled** - No longer active

### Interruptions
Decision-moment alerts that need your attention:
- **Trial Ending** - Free trial converting to paid soon
- **Silent Renewal** - Tool renewing but hasn't been used
- **No Owner** - Tool without an assigned team member
- **Forgotten Tool** - No activity detected in months

### Renewals
Upcoming subscription renewals with:
- Date
- Amount
- Tool name
- Owner (if assigned)

---

## Multiple Inboxes

You can connect multiple email accounts to ensure comprehensive coverage:

1. Connect your main billing inbox (billing@, finance@, ops@)
2. Connect founder or admin inboxes
3. Each inbox is scanned independently
4. All tools appear in one unified dashboard

---

## Best Practices

### Which Inboxes to Connect

**✓ Connect these:**
- billing@company.com
- finance@company.com
- ops@company.com
- Founder/admin personal inboxes where invoices land

**✗ Don't need to connect:**
- Individual employee inboxes (unless they manage subscriptions)
- Marketing or sales team inboxes

### Privacy & Security

- Unspendify uses **read-only OAuth** - it cannot send, delete, or modify anything
- Email content is **never stored** - only subscription metadata is extracted
- Access can be **revoked anytime** from your Google or Microsoft account settings
- All data is encrypted in transit and at rest

---

## Common Vendors Automatically Detected

- Stripe (processes payments for many SaaS tools)
- GitHub
- Notion
- Slack
- Adobe Creative Cloud
- Microsoft 365
- Google Workspace
- AWS
- Heroku
- Vercel
- And hundreds more...

---

## Frequently Asked Questions

**Q: How long does the initial scan take?**
A: Usually 2-5 minutes depending on inbox size. You'll see tools appear in real-time.

**Q: Does Unspendify scan my entire inbox?**
A: No, Unspendify only searches for emails matching invoice keywords (invoice, receipt, subscription, payment, renewal).

**Q: Can I delete tools I no longer use?**
A: Yes, you can archive or delete tools from your dashboard. They won't reappear unless a new invoice is detected.

**Q: Will Unspendify see my personal emails?**
A: Unspendify only reads emails matching subscription-related keywords. It ignores all other emails.

**Q: What happens if I disconnect my inbox?**
A: Your existing tools remain tracked. You just won't get updates for new subscriptions or renewal changes. You can reconnect anytime.

**Q: Can multiple team members connect their inboxes?**
A: Yes, you can invite team members to your organization. Each member can connect their own inbox, and all tools are visible to the entire team.

**Q: Is my financial data secure?**
A: Yes. We only store vendor names, amounts, and dates. We never store full invoice details, credit card numbers, or personal financial information. All data is encrypted at rest.

---

## Troubleshooting

If you run into issues:
1. Check that you've granted read-only access during OAuth
2. Wait a few minutes for the initial scan to complete
3. Check **Inbox Connections** in Settings to see connection status
4. Try disconnecting and reconnecting your inbox
5. Contact support if issues persist

---

## Quick Start Checklist

- [ ] Connect your Gmail or Outlook inbox
- [ ] Wait for initial scan to complete (2-5 minutes)
- [ ] Review detected tools on Dashboard
- [ ] Assign owners to key subscriptions
- [ ] Configure notification preferences in Settings
- [ ] Check Interruptions for any action items
- [ ] Invite team members if working with others

That's it! Unspendify will now quietly track your subscriptions and alert you before renewals.
