export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-black mb-6">Privacy Policy</h1>
      <p className="text-xs text-zinc-400 mb-8">Last updated: April 2026</p>

      <div className="prose prose-sm prose-zinc dark:prose-invert space-y-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">1. Information We Collect</h2>
          <p><strong>Account data:</strong> When you sign in with Google, we receive your name, email, and profile image via Clerk.</p>
          <p><strong>Visitor data:</strong> When a badge is loaded, we collect the visitor's IP address (hashed daily and never stored in plain text), country, city, device type, browser, OS, and referrer URL.</p>
          <p><strong>Payment data:</strong> Payments are processed by Paddle. We do not store your credit card or payment details.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">2. How We Use Your Data</h2>
          <p>We use collected data to: display visitor statistics on your dashboard, prevent duplicate counting (via IP hashing), generate analytics (country, device, referrer breakdown), and process boost purchases.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">3. IP Address Handling</h2>
          <p>IP addresses are never stored in plain text. They are combined with a daily salt and site ID, then hashed with SHA-256 to create a one-way hash used solely for deduplication. The hash is not reversible to the original IP.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">4. Data Sharing</h2>
          <p>We do not sell or share your personal data with third parties. Aggregated, non-identifying visitor statistics (country, device) are visible on public dashboards.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">5. Data Storage</h2>
          <p>Data is stored on Neon (PostgreSQL) servers. Authentication is managed by Clerk. Both services maintain their own security and privacy standards.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">6. Your Rights</h2>
          <p>You can delete your registered sites and all associated data at any time from your dashboard. To delete your account entirely, please contact us.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">7. Cookies</h2>
          <p>m1k uses essential cookies for authentication (via Clerk). We do not use tracking or advertising cookies. The badge SVG does not set any cookies.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">8. Changes</h2>
          <p>We may update this policy as needed. Changes will be reflected on this page with an updated date.</p>
        </section>
      </div>
    </div>
  );
}
