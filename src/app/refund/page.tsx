export default function RefundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-black mb-6">Refund Policy</h1>
      <p className="text-xs text-zinc-400 mb-8">Last updated: April 2026</p>

      <div className="prose prose-sm prose-zinc dark:prose-invert space-y-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Boost Credits</h2>
          <p>Boost credits are virtual digital goods. Once purchased, they are added to your account balance immediately.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Unused Boosts</h2>
          <p>If you have purchased boost credits but have <strong>not yet applied them</strong> to any site, you may request a full refund within 14 days of purchase.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Applied Boosts</h2>
          <p>Once boost credits have been applied to a site (yours or someone else's), they cannot be reversed or refunded, as the visitor count has already been updated.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">How to Request a Refund</h2>
          <p>To request a refund for unused boosts, please contact us via our GitHub repository with your account email and purchase details. Refunds will be processed through Paddle within 5-10 business days.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Exceptions</h2>
          <p>If there was a technical error that resulted in incorrect charges or duplicate purchases, we will issue a full refund regardless of whether the boosts were applied.</p>
        </section>
      </div>
    </div>
  );
}
