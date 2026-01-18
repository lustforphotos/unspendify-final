# Security & Permissions

Unspendify uses organization-based multi-tenancy with role-based access control.

## Organization Isolation

Every user belongs to one or more organizations. Users can only access data from their organizations.

- All database queries are scoped by `organization_id`
- No cross-organization data visibility
- Row Level Security (RLS) enforces isolation at the database level

## Roles

### Admin

Full control over the organization:

- Manage organization settings
- Invite and remove team members
- Change member roles (admin/member)
- Assign tool owners
- View all subscriptions and alerts
- Receive all alert types by default

### Member

Read-only with limited actions:

- View all subscriptions in organization
- View renewal alerts
- Update subscription notes and tags
- Cannot assign tool owners
- Cannot manage team members
- Can configure personal notification preferences

## Tool Ownership

Tool owners are team members assigned to specific subscriptions.

### Assignment Rules

- **Only admins can assign owners**
- Members can view who owns what
- One owner per tool
- Owner assignment is optional

### Owner Benefits

- Receive targeted alerts for assigned tools
- Identified in email notifications
- Shows accountability in dashboard

## Alert Distribution

Alerts are distributed based on role, ownership, and preferences.

### Default Behavior

**Admins:**
- Receive all alert types (new subscription, renewal, trial ending)
- Included in weekly digest
- Cannot opt out of critical alerts

**Tool Owners:**
- Always receive alerts for their assigned tools
- Overrides notification preferences
- Ensures accountability

**Members:**
- Receive weekly digest by default
- Can opt-in to specific alert types
- Can limit alerts to only owned tools

### Alert Types

1. **New Subscription Detected**
   - Sent to: Admins
   - When: New tool found in email

2. **Upcoming Renewal**
   - Sent to: Admins + Tool owner (if assigned)
   - When: 30, 14, and 7 days before renewal

3. **Trial Ending**
   - Sent to: Admins + Tool owner (if assigned)
   - When: Trial converts to paid soon

4. **Weekly Ops Digest**
   - Sent to: All active users (configurable)
   - When: Every Monday 9am
   - Summary of all activity

### Notification Preferences

Members can configure their alert preferences:

```typescript
{
  receive_new_subscription_alerts: false,  // Opt-in to new sub alerts
  receive_renewal_alerts: false,           // Opt-in to renewal alerts
  receive_trial_ending_alerts: false,      // Opt-in to trial alerts
  receive_weekly_digest: true,             // Weekly summary (default on)
  only_owned_tools: false                  // Only get alerts for owned tools
}
```

**Note:** Tool owners always receive alerts for their tools, regardless of preferences.

## Permission Matrix

| Action | Admin | Member | Owner |
|--------|-------|--------|-------|
| View subscriptions | Yes | Yes | Yes |
| Add notes to tools | Yes | Yes | Yes |
| Assign tool owner | Yes | No | No |
| Remove tool owner | Yes | No | No |
| Invite team member | Yes | No | No |
| Remove team member | Yes | No | No |
| Change member role | Yes | No | No |
| Receive all alerts | Yes | Opt-in | For owned tools |
| Configure preferences | Yes | Yes | Yes |

## Database Security

### Row Level Security (RLS)

All tables have RLS enabled. Policies enforce:

- Users can only access data from their organizations
- Admins have additional permissions within their organizations
- Tool ownership assignment restricted to admins
- Notification preferences are user-specific

### Helper Functions

```sql
is_admin(org_id uuid) -> boolean
```

Checks if current user is admin in specified organization.

## Implementation Notes

- Use `auth.uid()` to identify current user
- Always join through `organization_members` to verify access
- Check `role = 'admin'` for admin-only operations
- Tool ownership queries join through `tools` table for org verification
