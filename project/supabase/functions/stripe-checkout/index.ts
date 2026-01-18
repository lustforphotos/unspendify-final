import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-11-20.acacia",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { planId } = await req.json();

    if (!planId) {
      throw new Error("Plan ID is required");
    }

    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!orgMember) {
      throw new Error("No organization found for user");
    }

    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .maybeSingle();

    if (!plan) {
      throw new Error("Invalid plan");
    }

    if (plan.price_usd === 0) {
      throw new Error("Cannot create checkout for free plan");
    }

    const { data: existingSub } = await supabase
      .from("billing_subscriptions")
      .select("*")
      .eq("organization_id", orgMember.organization_id)
      .maybeSingle();

    let customer_id = existingSub?.stripe_customer_id;

    if (!customer_id) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          organization_id: orgMember.organization_id,
        },
      });
      customer_id = customer.id;
    }

    const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      customer: customer_id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: `Track up to ${plan.tool_limit} tools`,
            },
            recurring: {
              interval: "month",
            },
            unit_amount: plan.price_usd,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/settings?billing=success`,
      cancel_url: `${appUrl}/settings?billing=cancelled`,
      metadata: {
        organization_id: orgMember.organization_id,
        plan_id: planId,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});