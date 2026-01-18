import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main className="pt-24">
        <section className="py-16 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-4">
              Terms of Service
            </h1>
            <p className="text-sm text-[var(--text-muted)] mb-12">Last Updated: December 23, 2024</p>

            <div className="prose prose-slate max-w-none">
              <section className="mb-12">
                <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-4">The basics</h2>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-4">
                  These terms govern your use of Unspendify. By using Unspendify, you agree to these terms.
                </p>
                <p className="text-base text-slate-600 leading-relaxed">
                  We've tried to write this in plain English. If you have questions, email us at{' '}
                  <a href="mailto:hello@unspendify.com" className="text-slate-900 hover:underline">hello@unspendify.com</a>.
                </p>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Acceptable Use</h2>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">You can</h3>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>Use Unspendify to track your organization's subscriptions</li>
                    <li>Invite team members from your organization</li>
                    <li>Forward invoices and receipts you're authorized to access</li>
                    <li>Export your data</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">You can't</h3>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>Forward emails you don't have permission to access</li>
                    <li>Share your account credentials with others</li>
                    <li>Use Unspendify for illegal purposes</li>
                    <li>Attempt to reverse engineer or hack the service</li>
                    <li>Resell or redistribute Unspendify</li>
                  </ul>
                </div>

                <p className="text-base text-slate-600 leading-relaxed">
                  We may suspend or terminate accounts that violate these terms. We'll usually warn you first unless it's a serious violation.
                </p>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your Data</h2>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">You own your data</h3>
                  <p className="text-base text-slate-600 leading-relaxed">
                    All subscription data and content you provide belongs to you. We don't claim any ownership.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">License to us</h3>
                  <p className="text-base text-slate-600 leading-relaxed mb-2">
                    By using Unspendify, you grant us permission to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>Process your emails to extract subscription data</li>
                    <li>Store and display your subscription information</li>
                    <li>Allow your team members to access data according to permissions you set</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Your responsibility</h3>
                  <p className="text-base text-slate-600 leading-relaxed mb-2">
                    You're responsible for:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>The accuracy of data you provide</li>
                    <li>Having authorization to forward the emails you send us</li>
                    <li>Maintaining your account security</li>
                    <li>Your team members' actions</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Payment Terms</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Free plan</h3>
                    <p className="text-base text-slate-600 leading-relaxed">
                      No payment required. We may limit features or usage.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Pro plan</h3>
                    <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                      <li>$49/month, billed monthly</li>
                      <li>Automatically renews unless you cancel</li>
                      <li>You can cancel anytime from your account settings</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Refunds</h3>
                    <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                      <li>First 30 days: Full refund, no questions asked</li>
                      <li>After 30 days: Prorated refund at our discretion</li>
                      <li>To request a refund, email billing@unspendify.com</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed payments</h3>
                    <p className="text-base text-slate-600 leading-relaxed">
                      If your payment fails, we'll email you. If we can't collect payment within 7 days, we'll downgrade you to the free plan and archive subscriptions over the limit.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Cancellation and Termination</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">You can cancel anytime</h3>
                    <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                      <li>Go to Account Settings → Cancel Account</li>
                      <li>Export your data before canceling</li>
                      <li>We'll keep your data for 30 days, then permanently delete it</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">We can terminate</h3>
                    <p className="text-base text-slate-600 leading-relaxed mb-2">
                      We may suspend or terminate your account if:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                      <li>You violate these terms</li>
                      <li>You fail to pay (for paid plans)</li>
                      <li>We stop offering the service (with 60 days' notice and prorated refund)</li>
                      <li>Required by law</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">What happens after termination</h3>
                    <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                      <li>You lose access immediately</li>
                      <li>We retain data for 30 days (you can request a final export)</li>
                      <li>After 30 days, we permanently delete your data</li>
                      <li>No refunds except in cases where we terminate without cause</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Warranties and Disclaimers</h2>

                <p className="text-base text-slate-600 leading-relaxed mb-4">
                  We provide the service "as is." We try to make Unspendify reliable and accurate, but we can't guarantee:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base text-slate-600 mb-6">
                  <li>The service will be error-free or uninterrupted</li>
                  <li>We'll catch every subscription from your emails</li>
                  <li>Extracted data will always be 100% accurate</li>
                  <li>The service meets your specific needs</li>
                </ul>
                <p className="text-base text-slate-600 leading-relaxed">
                  You should verify critical information. Unspendify is a tool to help you track subscriptions, not a replacement for your own oversight.
                </p>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Limitation of Liability</h2>

                <p className="text-base text-slate-600 leading-relaxed mb-4">
                  To the extent permitted by law:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                  <li>Our total liability is limited to the amount you paid us in the past 12 months</li>
                  <li>We're not liable for indirect, incidental, or consequential damages</li>
                  <li>We're not liable for lost profits, data, or business opportunities</li>
                </ul>
              </section>

              <section className="pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact</h2>
                <p className="text-base text-slate-600 leading-relaxed mb-4">
                  Questions about these terms?
                </p>
                <p className="text-base text-slate-600 leading-relaxed">
                  Email: <a href="mailto:legal@unspendify.com" className="text-slate-900 hover:underline">legal@unspendify.com</a>
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
