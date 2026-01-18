import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
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

    const signature = req.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      throw new Error("Missing signature or webhook secret");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organization_id = session.metadata?.organization_id;
        const plan_id = session.metadata?.plan_id;

        if (!organization_id || !plan_id) {
          throw new Error("Missing metadata in checkout session");
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await supabase
          .from("billing_subscriptions")
          .upsert({
            organization_id,
            plan_id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: "active",
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, {
            onConflict: "organization_id",
          });

        console.log("Subscription created for org:", organization_id);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const organization_id = (customer as Stripe.Customer).metadata?.organization_id;

        if (!organization_id) {
          console.error("No organization_id in customer metadata");
          break;
        }

        await supabase
          .from("billing_subscriptions")
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log("Subscription updated:", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from("billing_subscriptions")
          .update({
            plan_id: "free",
            status: "canceled",
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log("Subscription cancelled:", subscription.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription_id = invoice.subscription as string;

        if (subscription_id) {
          await supabase
            .from("billing_subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subscription_id);

          console.log("Payment failed for subscription:", subscription_id);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});