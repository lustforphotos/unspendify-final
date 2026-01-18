# Tool Classification System

## Overview

Unspendify uses an inference-based classification system to differentiate between marketing tools and other tools. This system is **probabilistic, not taxonomic** — the goal is decision relevance, not perfect categorization.

## Core Principles

✅ **Never ask users to classify tools upfront**
- Classification happens automatically during detection
- No forms, no mandatory input, no upfront tagging

✅ **Probabilistic and mutable**
- Scores can change over time based on new signals
- Multiple layers of intelligence inform classification
- User corrections improve future accuracy

✅ **Decision-focused, not taxonomy-focused**
- A tool is "marketing-relevant" when marketing needs to make a decision about it
- Classification determines alert routing, not strict categories

✅ **Invisible unless relevant**
- Classification operates in the background
- Users only see it when filtering or correcting
- No friction added to core workflows

## Data Model

### detected_tools table (additions)

```sql
marketing_relevance_score  integer  -- 0-100 score
tool_category             text     -- 'marketing', 'marketing_adjacent', 'other'
classification_confidence integer  -- 0-100 confidence level
classification_source     text     -- 'vendor', 'email_context', 'ownership', 'user_correction'
last_classified_at        timestamptz
```

### vendor_intelligence table

Stores baseline intelligence about known vendors:

```sql
vendor_name              text
normalized_vendor        text
default_relevance_score  integer  -- 0-100
category_hint            text
common_keywords          text[]
```

### tool_classification_corrections table

Tracks user corrections to learn and improve:

```sql
tool_id              uuid
user_id              uuid
correction_type      text  -- 'not_marketing', 'is_marketing', 'belongs_to', 'ignore'
previous_category    text
new_category         text
relevance_adjustment integer
```

## Classification Layers

### Layer 1: Vendor Intelligence (Baseline)

**When**: Tool is first detected
**Confidence**: 80% (if vendor is known), 30% (if unknown)

Maintains a curated map of ~40 common vendors with default scores:

**High Marketing Relevance (95-100)**
- HubSpot, Mailchimp, Google Ads, Marketo, etc.
- Tools explicitly built for marketing

**Medium-High (70-94)**
- Salesforce, LinkedIn Ads, Ahrefs, SEMrush
- CRM and growth tools

**Medium (40-69)**
- Notion, Figma, Slack, Zoom, Google Workspace
- Productivity tools that marketing might use

**Low (0-39)**
- AWS, GitHub, Stripe, Datadog
- Infrastructure and engineering tools

Unknown vendors default to 50 (marketing_adjacent).

### Layer 2: Email Context Signals

**When**: Invoice email is processed
**Confidence**: Up to +40%

Analyzes email subject and body for keywords:

**Marketing signals** (+5-30 points):
- campaign, ads, advertising, crm, leads
- subscribers, newsletter, seo, analytics
- growth, engagement, conversion

**Infrastructure signals** (-10-30 points):
- cloud, server, hosting, database
- deployment, monitoring, compute

**Engineering signals** (-10-25 points):
- repository, code, commits, issues
- sprint, devops, version control

Keywords add incremental adjustments. Not perfect, but directionally useful.

### Layer 3: Ownership Inference

**When**: Owner is assigned or inferred
**Confidence**: +15 to -25 points

If a tool has an owner with a role:

- **Marketing/Growth role**: +15 points
- **Engineering/Dev role**: -20 points
- **Infrastructure/Ops role**: -25 points
- **Unknown/Founder**: No adjustment

A tool owned by marketing is treated as marketing-relevant, even if the vendor suggests otherwise.

### Layer 4: Behavioral Signals (Over Time)

**When**: User interacts with alerts
**Confidence**: Builds over time

Adjusts relevance based on system behavior:

- Marketing team acts on alerts → increase relevance
- Alerts ignored or reassigned → decrease relevance
- Decisions made only by founders → mark ambiguous

This layer is **silent and automatic**. It learns from usage patterns.

## Category Assignment

Based on final `marketing_relevance_score`:

- **70-100** → `marketing`
- **40-69** → `marketing_adjacent`
- **0-39** → `other`

These thresholds are configurable in the classification logic.

## Alert Filtering Rules

### For Marketers

Receives alerts for:
- Tools categorized as `marketing`
- Tools categorized as `marketing_adjacent`
- Tools with no confirmed owner (always relevant)

Does **NOT** receive alerts for:
- Infrastructure tools (`other` category)
- Engineering tools
- Finance-only tools

### For Founders

Can see **all** alerts regardless of category (optional toggle).

### For Other Roles

Receives alerts only for tools they own or tools marked unowned.

## User Correction (Lightweight)

Users can make one-click corrections without forms:

**Actions available:**
1. "This is a Marketing Tool" → Sets relevance to 90+, category to `marketing`
2. "Not a Marketing Tool" → Sets relevance to 0-20, category to `other`
3. No mandatory explanations, no complex UI

**What happens:**
- Tool classification updates immediately
- Correction recorded in `tool_classification_corrections`
- Future detections from the same vendor learn from this
- Classification source changes to `user_correction` (90% confidence)

**Where shown:**
- Tools page: compact badge with dropdown
- Tool detail pages: expanded correction options
- No standalone classification management UI

## Implementation Files

### Database
- `/supabase/migrations/*_add_tool_classification_system.sql` - Schema & seed data

### Backend Logic
- `/src/lib/classification.ts` - Classification utilities and scoring logic

### UI Components
- `/src/components/ToolClassificationActions.tsx` - Lightweight correction UI
- `/src/pages/Tools.tsx` - Shows classification, allows filtering and correction

## Usage Examples

### Get vendor intelligence
```typescript
import { getVendorIntelligence } from '../lib/classification';

const intel = await getVendorIntelligence('HubSpot');
// Returns: { default_relevance_score: 95, category_hint: 'marketing', ... }
```

### Analyze email context
```typescript
import { analyzeEmailContext } from '../lib/classification';

const { marketingScore, confidence } = analyzeEmailContext(
  subject,
  body
);
// Returns adjustment based on keywords found
```

### Determine category from score
```typescript
import { determineCategory } from '../lib/classification';

const category = determineCategory(85);
// Returns: 'marketing'
```

### Record user correction
```typescript
import { recordCorrection } from '../lib/classification';

await recordCorrection(
  toolId,
  userId,
  'not_marketing',
  'marketing',
  'other',
  -40  // relevance adjustment
);
```

### Check if marketing should be alerted
```typescript
import { shouldAlertMarketing } from '../lib/classification';

const shouldAlert = shouldAlertMarketing(
  'marketing',
  'confirmed',
  'marketer'
);
// Returns: true
```

## Automatic Triggers

### On Tool Detection

When a new tool is detected (INSERT into `detected_tools`):

1. `auto_classify_tool()` trigger fires
2. Looks up vendor in `vendor_intelligence`
3. Assigns baseline relevance score
4. Sets initial category based on score
5. Confidence: 80% if known, 30% if unknown
6. Source: 'vendor'

### On Email Processing

When processing invoice emails:

1. Extract keywords from subject/body
2. Calculate marketing vs. other signal strength
3. Adjust relevance score by +/- 30 points max
4. Update `classification_source` to include 'email_context'
5. Confidence increases based on signal clarity

### On Ownership Assignment

When an owner is assigned:

1. Check owner's role (if available)
2. Adjust relevance based on role signals
3. Update classification
4. Source includes 'ownership'

## Best Practices

### For Classification
- **Don't aim for perfection** - Probabilistic is fine
- **Let users correct easily** - One click, no forms
- **Learn from corrections** - Feed back into vendor intelligence
- **Keep it invisible** - Only show when relevant

### For Alerts
- **Default to showing** - Better to over-include than miss important alerts
- **Let users filter** - Provide category filters in UI
- **Respect corrections** - When user says "not marketing," stop alerting them

### For UI
- **Subtle badges** - Don't make classification prominent
- **Quick actions** - Dropdowns, not modals
- **No mandatory steps** - Classification never blocks workflows

## Future Enhancements

Potential improvements (not yet implemented):

1. **Team-level learning** - Share corrections across organization
2. **Historical accuracy tracking** - Monitor how often classifications are corrected
3. **Confidence decay** - Reduce confidence for tools with zero interactions
4. **Context from integrations** - Use calendar, Slack data to infer relevance
5. **Natural language processing** - More sophisticated email analysis

## Philosophy Check

This classification system aligns with Unspendify's core principles:

✅ **Passive memory** - Operates in background, no user input required
✅ **Interruption-based** - Only surfaces when decision needed
✅ **Probabilistic** - Embraces uncertainty, improves over time
✅ **User-correctable** - Lightweight feedback loop
✅ **Decision-focused** - Optimizes for alert relevance, not taxonomy

It does **NOT**:
❌ Block tool detection
❌ Require upfront classification
❌ Create rigid taxonomies
❌ Add friction to workflows
❌ Demand perfect accuracy

The system is designed to fade into the background while quietly improving alert relevance over time.
