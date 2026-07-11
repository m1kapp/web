export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-black mb-6">Terms of Service</h1>
      <p className="text-xs text-zinc-400 mb-8">Last updated: April 2026</p>

      <div className="prose prose-sm prose-zinc dark:prose-invert space-y-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">1. Service Overview</h2>
          <p>m1k is a gamified visitor counter service that helps developers track and grow their side projects. By using m1k, you agree to these terms.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">2. Accounts</h2>
          <p>You may create an account using Google OAuth via Clerk. You are responsible for maintaining the security of your account. You must be at least 13 years old to use this service.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">3. Acceptable Use</h2>
          <p>You may not use m1k to track websites that contain illegal, harmful, or misleading content. We reserve the right to remove any registered site or terminate accounts that violate this policy.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">4. Intellectual Property</h2>
          <p>The m1k service, including its badge designs, UI, and code, is owned by the m1k team. You retain ownership of your websites and content.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">5. Limitation of Liability</h2>
          <p>m1k is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to inaccurate visitor counts or service downtime.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">6. Changes</h2>
          <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">7. Contact</h2>
          <p>For questions about these terms, please reach out via our GitHub repository.</p>
        </section>
      </div>
    </div>
  );
}
