export default function HomePage() {
  return (
    <main className="min-h-dvh text-white">
      {/* Background + overlay */}
      <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

      <div className="mx-auto w-[min(1100px,92vw)] py-10">
        {/* HERO */}
        <section className="relative grid place-items-center text-center py-16">
          <div className="hero-glow" aria-hidden="true" />

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
            AI-Powered Job Application Tracker
          </h1>

          <p className="mt-4 max-w-2xl text-white/75 leading-relaxed">
            Next.js • TypeScript • Tailwind • PostgreSQL • Prisma
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/dashboard"
              className="btn-glass"
            >
              Go to Dashboard
            </a>

            <a
              href="/"
              className="btn-glass btn-ghost"
            >
              Back to Portfolio
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2 text-xs text-white/60">
            <span className="pill">Kanban Board</span>
            <span className="pill">Quick Add</span>
            <span className="pill">AI Review Panel</span>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {/* Left */}
          <div className="glass-card lg:col-span-2">
            <div className="glass-card__glow" aria-hidden="true" />
            <h2 className="text-lg font-extrabold tracking-tight">What it does</h2>
            <p className="mt-3 text-white/75 leading-relaxed">
              Track job applications in a Kanban workflow (Applied → Interview → Offer),
              store them in a database, and request AI feedback on your resume / job fit.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="feature">
                <div className="featureTitle">Kanban Workflow</div>
                <div className="featureText">
                  Drag cards across stages with clean status logic.
                </div>
              </div>

              <div className="feature">
                <div className="featureTitle">AI Review</div>
                <div className="featureText">
                  Generate tailored notes and improvements from job descriptions.
                </div>
              </div>

              <div className="feature">
                <div className="featureTitle">Prisma + Postgres</div>
                <div className="featureText">
                  Simple schema, fast queries, easy migrations.
                </div>
              </div>

              <div className="feature">
                <div className="featureTitle">Recruiter-ready UI</div>
                <div className="featureText">
                  Glass styling, subtle motion, consistent spacing.
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="glass-card">
            <div className="glass-card__glow alt" aria-hidden="true" />
            <h2 className="text-lg font-extrabold tracking-tight">Quick actions</h2>

            <div className="mt-4 grid gap-3">
              <a className="btn-glass w-full text-center" href="/dashboard">
                Open Kanban
              </a>
              <a className="btn-glass btn-ghost w-full text-center" href="/applications/new">
                Add Application
              </a>
              <a className="btn-glass btn-ghost w-full text-center" href="/ai-review">
                AI Review
              </a>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Tip: Keep your “glass” look consistent by using the same utility classes
              for buttons + cards across every route.
            </div>
          </div>
        </section>

        <footer className="mt-10 text-center text-xs text-white/45">
          © {new Date().getFullYear()} Michael Williams — Built with the same glass theme as the portfolio
        </footer>
      </div>
    </main>
  );
}
