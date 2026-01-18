import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation />

      <main className="pt-24">
        <section className="py-16 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-[var(--text-muted)] mb-12">Last Updated: December 23, 2024</p>

            <div className="prose prose-slate max-w-none">
              <section className="mb-12">
                <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-4">Overview</h2>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-4">
                  This privacy policy explains how Unspendify collects, uses, and protects your data. We'll be direct: we take privacy seriously because we'd want the same if we were customers.
                </p>
                <p className="text-base text-slate-600 leading-relaxed">
                  The short version:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base text-slate-600 mt-4">
                  <li>We collect the emails you forward to us and your account information</li>
                  <li>We extract subscription data from those emails, then delete the emails</li>
                  <li>We don't sell your data or use it for advertising</li>
                  <li>You can export or delete your data anytime</li>
                </ul>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">What We Collect</h2>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Account information</h3>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>Your name and email address</li>
                    <li>Your organization name</li>
                    <li>Your password (hashed and salted—we never see your actual password)</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Email data</h3>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>Emails you forward to your Unspendify address</li>
                    <li>From these, we extract: sender, subject, tool name, cost, billing cycle, renewal date</li>
                    <li>After extraction, we delete the original email within 24 hours</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Usage data</h3>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>Pages you visit in Unspendify</li>
                    <li>Features you use</li>
                    <li>Browser and device information</li>
                    <li>IP address</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment information</h3>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>If you upgrade to a paid plan, Stripe processes your payment</li>
                    <li>We never see your full credit card number</li>
                    <li>We store your Stripe customer ID to manage your subscription</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">How We Use Your Data</h2>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">To provide the service</h3>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>Extract subscription information from your emails</li>
                    <li>Display your subscriptions in the dashboard</li>
                    <li>Send renewal alerts</li>
                    <li>Let your team collaborate</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">We do NOT</h3>
                  <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                    <li>Sell your data to third parties</li>
                    <li>Use your data for advertising</li>
                    <li>Train AI models on your invoices for external purposes</li>
                    <li>Share your subscription list with vendors</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">How We Protect Your Data</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Encryption</h3>
                    <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                      <li>All data in transit uses TLS 1.3</li>
                      <li>All data at rest uses AES-256 encryption</li>
                      <li>Database backups are encrypted</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Email handling</h3>
                    <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                      <li>Emails are processed immediately upon receipt</li>
                      <li>Extracted data is stored</li>
                      <li>Original emails are deleted within 24 hours</li>
                      <li>We never forward your emails to third parties</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Retention</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Active accounts</h3>
                    <p className="text-base text-slate-600 leading-relaxed">
                      We keep your subscription data for as long as your account is active.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Canceled accounts</h3>
                    <ul className="list-disc pl-6 space-y-2 text-base text-slate-600">
                      <li>If you cancel, we retain your data for 30 days in case you change your mind</li>
                      <li>After 30 days, we permanently delete all your data</li>
                      <li>You can request immediate deletion by emailing us</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Emails</h3>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Original emails are deleted within 24 hours of processing, regardless of account status.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-12 pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your Rights</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Access</h3>
                    <p className="text-base text-slate-600 leading-relaxed">
                      You can view all your data in your dashboard. For raw data access, email us.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Export</h3>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Download your subscription data anytime in CSV, Excel, or PDF format.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Deletion</h3>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Cancel your account to delete all data within 30 days, or email us for immediate deletion.
                    </p>
                  </div>
                </div>
              </section>

              <section className="pt-8 border-t border-slate-200">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact Us</h2>
                <p className="text-base text-slate-600 leading-relaxed mb-4">
                  Questions or concerns about privacy?
                </p>
                <p className="text-base text-slate-600 leading-relaxed">
                  Email: <a href="mailto:privacy@unspendify.com" className="text-slate-900 hover:underline">privacy@unspendify.com</a>
                </p>
                <p className="text-base text-slate-600 leading-relaxed">
                  We'll respond within 2 business days.
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
