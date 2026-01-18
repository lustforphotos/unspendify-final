# Unspendify

B2B SaaS subscription management platform that automatically detects, tracks, and alerts on company subscriptions by connecting directly to Gmail and Outlook inboxes.

## Features

- **OAuth inbox connections** - Gmail and Outlook read-only access
- **Automated subscription detection** - No forwarding or manual entry required
- **Multi-organization support** - Role-based access control
- **Renewal reminders** - Alerts before subscriptions renew
- **Trial ending alerts** - Never miss trial-to-paid conversions
- **Tool ownership assignment** - Assign subscriptions to team members
- **Interruption detection** - Silent renewals, forgotten tools, missing owners
- **Comprehensive notification preferences** - Customizable alerts per user

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth)
- **Email:** Resend (for notification emails)
- **Inbox Integration:** Gmail API, Microsoft Graph API
- **Monitoring:** Built-in health checks

## Architecture

### Email Processing Pipeline

```
OAuth Inbox Scan → Gmail/Outlook API → raw_emails table
                                              ↓
                                       process-emails worker
                                              ↓
                                       parsed_events table
                                              ↓
                                       detect-tools worker
                                              ↓
                                    tools + renewals tables
                                              ↓
                                  schedule-notifications worker
                                              ↓
                                      notifications table
                                              ↓
                                  send-notifications worker
                                              ↓
                                    Email to users (Resend)
```

### Edge Functions

1. **oauth-initiate** - Initiate Gmail/Outlook OAuth flow
2. **oauth-callback** - Handle OAuth callback and store tokens
3. **scan-emails** - Scan connected inboxes for subscription emails (daily cron)
4. **process-emails** - Parse raw emails into structured events
5. **detect-tools** - Create/update tools from parsed events
6. **schedule-notifications** - Create notification records for upcoming events
7. **send-notifications** - Send pending notifications via Resend
8. **health-check** - System health monitoring endpoint

## Project Structure

```
unspendify/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── emails/          # Email templates
│   └── utils/           # Utilities and router
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── docs/
│   ├── SECURITY.md      # Security and permissions model
│   └── DEPLOYMENT.md    # Detailed deployment guide
├── DEPLOYMENT_CHECKLIST.md  # Pre-deployment checklist
└── .env.example         # Environment variables template

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Resend account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

## Deployment

See detailed deployment instructions in:

- **DEPLOYMENT.md** - Complete deployment guide
- **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist

### Quick Deployment Steps

1. Set up Supabase project
2. Run database migrations
3. Configure Google OAuth (Gmail) and/or Microsoft OAuth (Outlook)
4. Deploy edge functions
5. Configure cron schedules
6. Build and deploy frontend
7. Test OAuth flow and email scanning

## Database Schema

### Core Tables

- **organizations** - Tenant workspaces
- **users** - User profiles (extends Supabase auth)
- **organization_members** - Membership with roles (admin/member)
- **email_connections** - OAuth-connected Gmail/Outlook inboxes
- **raw_emails** - Emails scanned from connected inboxes
- **parsed_events** - Extracted subscription events
- **tools** - Detected subscriptions
- **detected_tools** - Auto-detected tools with metadata
- **tool_ownership** - Tool-to-owner assignments
- **renewals** - Upcoming renewal dates
- **interruptions** - Decision-moment alerts
- **notifications** - Alert queue
- **notification_preferences** - User alert settings

## Security

- Row Level Security (RLS) enabled on all tables
- Organization-based data isolation
- Role-based access control (admin/member)
- Service role key for server-side operations only
- All API keys stored as secrets

See **docs/SECURITY.md** for detailed security model.

## Permissions

### Admin Role

- Manage organization settings
- Invite/remove team members
- Change member roles
- Assign tool owners
- Receive all alerts

### Member Role

- View all subscriptions
- Update subscription notes
- Configure notification preferences
- Opt-in to specific alerts

### Tool Owners

- Receive alerts for assigned tools
- Identified in notifications

## Monitoring

### Health Check

```bash
curl https://[project].supabase.co/functions/v1/health-check
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "checks": {
    "database": "ok",
    "email_service": "ok"
  }
}
```

### Key Metrics

- Emails received per day
- Parsing success rate
- Tools detected per week
- Notifications sent per day
- Delivery success rate

## Environment Variables

### Frontend (.env)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (Supabase Secrets)

```bash
RESEND_API_KEY=re_your_api_key
APP_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

## Cron Schedules

- **scan-emails:** Daily at 2am UTC (scans connected inboxes)
- **process-emails:** Every 5 minutes
- **detect-tools:** Every 10 minutes
- **schedule-notifications:** Daily at 8am UTC
- **send-notifications:** Every 15 minutes

## Troubleshooting

### OAuth Connection Issues

1. Verify OAuth credentials are set in Supabase Secrets
2. Check authorized redirect URIs in Google/Microsoft console
3. Test oauth-initiate function
4. Review oauth-callback logs

### Emails Not Being Scanned

1. Check email_connections table for active connections
2. Verify scan-emails cron is running
3. Review scan-emails function logs
4. Check OAuth token expiration

### Notifications Not Sending

1. Verify RESEND_API_KEY
2. Check notifications table
3. Review send-notifications logs
4. Test Resend API directly

### RLS Policy Errors

1. Verify user's organization membership
2. Check auth.uid()
3. Review policy logic
4. Test with different roles

## Support

- Supabase: https://supabase.com/docs
- Resend: https://resend.com/docs
- Issues: [Your issue tracker]

## License

[Your license]
