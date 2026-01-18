import { supabase } from './supabase';

export interface Plan {
  id: string;
  name: string;
  price_usd: number;
  tool_limit: number;
  inbox_limit: number;
  scan_months: number;
}

export interface BillingSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
}

export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price_usd', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCurrentSubscription(organizationId: string): Promise<BillingSubscription | null> {
  const { data, error } = await supabase
    .from('billing_subscriptions')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createCheckoutSession(planId: string): Promise<string> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  const { url } = await response.json();
  return url;
}

export async function createPortalSession(): Promise<string> {
  const session = await supabase.auth.getSession();
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create portal session');
  }

  const { url } = await response.json();
  return url;
}

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(0)}`;
}

export function getPlanName(planId: string): string {
  const names: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    growth: 'Growth',
  };
  return names[planId] || planId;
}
