// app/kanban/loading.tsx
const COLS = ["Applied", "Interview", "Offer", "Rejected"];

export default function KanbanLoading() {
  return (
    <main className="min-h-dvh text-white">
      <div className="fixed inset-0 -z-10 bg-app" aria-hidden="true" />
      <div className="fixed inset-0 -z-10 bg-overlay" aria-hidden="true" />

      <div className="mx-auto w-[min(1200px,92vw)] py-10">
        <section className="relative grid gap-4">
          <div className="hero-glow" aria-hidden="true" />

          <div className="flex items-center justify-between gap-3">
            <div className="grid gap-2">
              <div className="skeleton h-9 w-36" />
              <div className="skeleton h-4 w-[min(520px,70vw)]" />
            </div>

            <div className="skeleton h-10 w-44 rounded-full" />
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {COLS.map((t) => (
            <div key={t} className="glass-card">
              <div className="glass-card__glow" aria-hidden="true" />

              <div className="flex items-center justify-between">
                <div className="skeleton h-6 w-28" />
                <div className="skeleton h-6 w-10 rounded-full" />
              </div>

              <div className="mt-4 grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="feature mirror-card">
                    <div className="flex items-center justify-between gap-2">
                      <div className="skeleton h-5 w-[60%]" />
                      <div className="skeleton h-6 w-16 rounded-full" />
                    </div>
                    <div className="mt-3 grid gap-2">
                      <div className="skeleton h-4 w-[50%]" />
                      <div className="skeleton h-4 w-[35%]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
